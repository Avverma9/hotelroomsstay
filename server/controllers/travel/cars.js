const mongoose = require('mongoose');
const Car = require('../../models/travel/cars');

const toDate = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const parseSeatConfig = (seatConfig) => {
  if (!seatConfig) {
    return null;
  }

  const parseOne = (config) => {
    if (typeof config === 'string') {
      return JSON.parse(config);
    }
    return config;
  };

  if (Array.isArray(seatConfig)) {
    return seatConfig.map(parseOne);
  }

  if (typeof seatConfig === 'string') {
    const parsed = JSON.parse(seatConfig);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  if (typeof seatConfig === 'object') {
    return [seatConfig];
  }

  return null;
};

const normalizeSeatConfig = (seatConfig = []) => {
  return seatConfig.map((seat) => ({
    seatType: seat?.seatType,
    seatNumber:
      seat?.seatNumber === undefined || seat?.seatNumber === null
        ? undefined
        : Number(seat.seatNumber),
    seatPrice:
      seat?.seatPrice === undefined || seat?.seatPrice === null
        ? undefined
        : Number(seat.seatPrice),
    isBooked: Boolean(seat?.isBooked),
    bookedBy: seat?.bookedBy || '',
  }));
};

exports.addCar = async (req, res) => {
  try {
    const { seatConfig, ...data } = req.body;
    const images = req.files?.map((file) => file.location) || [];

    let parsedSeatConfig = [];
    if (seatConfig !== undefined) {
      try {
        parsedSeatConfig = normalizeSeatConfig(parseSeatConfig(seatConfig) || []);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid seatConfig format' });
      }
    }

    const pickupDate = toDate(data.pickupD);
    const dropDate = toDate(data.dropD);
    if ((data.pickupD && !pickupDate) || (data.dropD && !dropDate)) {
      return res.status(400).json({ message: 'Invalid pickupD or dropD date format' });
    }
    if (pickupDate && dropDate && pickupDate >= dropDate) {
      return res
        .status(400)
        .json({ message: 'dropD must be greater than pickupD' });
    }

    const carData = {
      ...data,
      images,
      seatConfig: parsedSeatConfig,
      seater: parsedSeatConfig.length > 0 ? parsedSeatConfig.length : data.seater,
    };

    const newCar = await Car.create(carData);

    return res.status(201).json({
      message: 'Successfully Created',
      car: newCar,
    });
  } catch (error) {
    console.error('addCar error:', error);
    return res.status(500).json({
      message: 'Something went wrong',
      error: error.message,
    });
  }
};

exports.getSeatsData = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid car id' });
    }

    const findCar = await Car.findById(id).lean();
    if (!findCar) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const sortedSeatConfig = [...(findCar.seatConfig || [])].sort(
      (a, b) => (a?.seatNumber || 0) - (b?.seatNumber || 0),
    );

    return res.status(200).json({
      carId: id,
      seats: sortedSeatConfig,
    });
  } catch (error) {
    console.error('getSeatsData error:', error);
    return res.status(500).json({ message: 'We are working hard to fix this' });
  }
};

exports.getAllCars = async (_, res) => {
  try {
    const findData = await Car.find();
    return res.status(200).json(findData);
  } catch (error) {
    console.error('getAllCars error:', error);
    return res.status(500).json({ message: 'We are working hard to fix this' });
  }
};

exports.getCarById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid car id' });
    }

    const findCar = await Car.findById(id);
    if (!findCar) {
      return res.status(404).json({ message: 'Car not found' });
    }
    return res.status(200).json(findCar);
  } catch (error) {
    console.error('getCarById error:', error);
    return res.status(500).json({ message: 'We are working hard to fix this' });
  }
};

exports.getCarByOwnerId = async (req, res) => {
  try {
    const { ownerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: 'Invalid ownerId' });
    }

    const cars = await Car.find({ ownerId });
    if (!cars.length) {
      return res.status(404).json({ message: 'Car not found' });
    }
    return res.status(200).json(cars);
  } catch (error) {
    console.error('getCarByOwnerId error:', error);
    return res.status(500).json({ message: 'We are working hard to fix this' });
  }
};

exports.filterCar = async (req, res) => {
  try {
    const {
      make,
      model,
      vehicleNumber,
      fuelType,
      seater,
      pickupP,
      dropP,
      pickupD,
      dropD,
    } = req.query;
    const query = {};

    if (make) query.make = make;
    if (model) query.model = model;
    if (vehicleNumber) query.vehicleNumber = vehicleNumber;
    if (fuelType) query.fuelType = fuelType;
    if (seater !== undefined) {
      const numericSeater = Number(seater);
      if (Number.isNaN(numericSeater)) {
        return res.status(400).json({ message: 'seater must be a number' });
      }
      query.seater = numericSeater;
    }

    if (pickupP && dropP) {
      query.pickupP = { $regex: new RegExp(pickupP, 'i') };
      query.dropP = { $regex: new RegExp(dropP, 'i') };
    }

    if (pickupD && dropD) {
      const pickupDate = toDate(pickupD);
      const dropDate = toDate(dropD);

      if (!pickupDate || !dropDate) {
        return res.status(400).json({ message: 'Invalid pickupD or dropD date format' });
      }
      if (pickupDate > dropDate) {
        return res.status(400).json({ message: 'pickupD must be less than or equal to dropD' });
      }

      query.pickupD = { $gte: pickupDate };
      query.dropD = { $lte: dropDate };
    }

    if (Object.keys(query).length === 0) {
      return res.status(400).json({ message: 'No filter parameters provided' });
    }

    const cars = await Car.find(query);
    if (!cars.length) {
      return res.status(404).json({ message: 'No cars found matching the filters' });
    }

    return res.status(200).json(cars);
  } catch (error) {
    console.error('filterCar error:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching cars',
      error: error.message,
    });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid car id' });
    }

    const data = { ...req.body };
    const images = req.files?.map((file) => file.location) || [];
    const existingCar = await Car.findById(id);
    if (!existingCar) {
      return res.status(404).json({ message: 'Car not found' });
    }

    data.images = images.length > 0 ? images : existingCar.images;

    if (data.seatConfig !== undefined) {
      try {
        const parsedSeatConfig = normalizeSeatConfig(parseSeatConfig(data.seatConfig) || []);
        data.seatConfig = parsedSeatConfig;
        data.seater = parsedSeatConfig.length;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid seatConfig format' });
      }
    } else if (data.seater === undefined) {
      data.seater = existingCar.seatConfig?.length || existingCar.seater;
    }

    if (data.pickupD !== undefined) {
      const parsedPickup = toDate(data.pickupD);
      if (!parsedPickup) {
        return res.status(400).json({ message: 'Invalid pickupD date format' });
      }
    }
    if (data.dropD !== undefined) {
      const parsedDrop = toDate(data.dropD);
      if (!parsedDrop) {
        return res.status(400).json({ message: 'Invalid dropD date format' });
      }
    }

    const finalPickupDate = toDate(
      data.pickupD !== undefined ? data.pickupD : existingCar.pickupD,
    );
    const finalDropDate = toDate(
      data.dropD !== undefined ? data.dropD : existingCar.dropD,
    );
    if (finalPickupDate && finalDropDate && finalPickupDate >= finalDropDate) {
      return res.status(400).json({ message: 'dropD must be greater than pickupD' });
    }

    const updatedCar = await Car.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({ message: 'Successfully Updated', car: updatedCar });
  } catch (error) {
    console.error('updateCar error:', error);
    return res.status(500).json({ message: 'We are working hard to fix this' });
  }
};

exports.deleteCarById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid car id' });
    }

    const findCar = await Car.findById(id);
    if (!findCar) {
      return res.status(404).json({ message: 'Car not found' });
    }
    await Car.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    console.error('deleteCarById error:', error);
    return res.status(500).json({ message: 'We are working hard to fix this' });
  }
};
