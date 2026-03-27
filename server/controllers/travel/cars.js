const mongoose = require('mongoose');
const Car = require('../../models/travel/cars');
const CarOwner = require('../../models/travel/carOwner');
const User = require('../../models/user');

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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      seatConfig,
      ownerName,
      ownerEmail,
      ownerMobile,
      ownerAadhar,
      ownerPAN,
      ownerDrivingLicence,
      ownerAddress,
      ownerCity,
      ownerState,
      ownerPinCode,
      ...data
    } = req.body;
    const images = req.files?.map((file) => file.location) || [];

    let parsedSeatConfig = [];
    if (seatConfig !== undefined) {
      try {
        parsedSeatConfig = normalizeSeatConfig(parseSeatConfig(seatConfig) || []);
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Invalid seatConfig format' });
      }
    }

    const pickupDate = toDate(data.pickupD);
    const dropDate = toDate(data.dropD);
    if ((data.pickupD && !pickupDate) || (data.dropD && !dropDate)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid pickupD or dropD date format' });
    }
    if (pickupDate && dropDate && pickupDate >= dropDate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'dropD must be greater than pickupD' });
    }

    let owner;

    if (data.ownerId) {
      if (!mongoose.Types.ObjectId.isValid(data.ownerId)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Invalid ownerId' });
      }
      owner = await CarOwner.findById(data.ownerId).session(session);
      if (!owner) {
        if (!ownerName && !ownerEmail && !ownerMobile) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: 'Owner details required to create owner for ownerId' });
        }
        owner = await CarOwner.create(
          [
            {
              _id: data.ownerId,
              name: ownerName || 'Unknown',
              email: ownerEmail || '',
              mobile: ownerMobile || '',
              dl: ownerDrivingLicence || '',
              address: ownerAddress || '',
              city: ownerCity || '',
              state: ownerState || '',
              pinCode: ownerPinCode || undefined,
            },
          ],
          { session }
        );
        owner = owner[0];
      } else {
        const ownerUpdates = {};
        if (ownerName) ownerUpdates.name = ownerName;
        if (ownerEmail) ownerUpdates.email = ownerEmail;
        if (ownerMobile) ownerUpdates.mobile = ownerMobile;
        if (ownerDrivingLicence) ownerUpdates.dl = ownerDrivingLicence;
        if (ownerAddress) ownerUpdates.address = ownerAddress;
        if (ownerCity) ownerUpdates.city = ownerCity;
        if (ownerState) ownerUpdates.state = ownerState;
        if (ownerPinCode) ownerUpdates.pinCode = ownerPinCode;
        if (Object.keys(ownerUpdates).length) {
          owner = await CarOwner.findByIdAndUpdate(data.ownerId, ownerUpdates, {
            new: true,
            session,
          });
        }
      }
    }

    if (!owner && (ownerEmail || ownerMobile)) {
      const ownerQuery = { $or: [] };
      if (ownerEmail) ownerQuery.$or.push({ email: ownerEmail });
      if (ownerMobile) ownerQuery.$or.push({ mobile: ownerMobile });
      owner = await CarOwner.findOneAndUpdate(
        ownerQuery,
        {
          $set: {
            name: ownerName,
            email: ownerEmail,
            mobile: ownerMobile,
            dl: ownerDrivingLicence || '',
            address: ownerAddress || '',
            city: ownerCity || '',
            state: ownerState || '',
            pinCode: ownerPinCode || undefined,
          },
        },
        { upsert: true, new: true, session }
      );
    }

    if (!owner) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Owner email or mobile is required' });
    }

    const carData = {
      ...data,
      images,
      seatConfig: parsedSeatConfig,
      seater: parsedSeatConfig.length > 0 ? parsedSeatConfig.length : data.seater,
      ownerId: owner._id,
    };

    const newCar = await Car.create([carData], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: 'Successfully Created',
      car: newCar[0],
      owner,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('addCar error:', error);
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
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
    return res.status(500).json({ message: error.message });
  }
};

exports.getAllCars = async (_, res) => {
  try {
    const findData = await Car.find();
    return res.status(200).json(findData);
  } catch (error) {
    console.error('getAllCars error:', error);
    return res.status(500).json({ message: error.message });
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
    return res.status(500).json({ message: error.message });
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
    return res.status(500).json({ message: error.message });
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

exports.getMyCars = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const user = await User.findOne({ userId: loggedInUserId });
    if (!user || !user.email) {
      return res.status(403).json({ message: 'Access denied: User not found or email is missing.' });
    }

    const carOwner = await CarOwner.findOne({ email: user.email });
    if (!carOwner) {
      // If the user is not a car owner, they have no cars. Return an empty array.
      return res.status(200).json([]);
    }

    const cars = await Car.find({ ownerId: carOwner._id });
    return res.status(200).json(cars);
  } catch (error) {
    console.error('getMyCars error:', error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid car id' });
    }

    const existingCar = await Car.findById(id);
    if (!existingCar) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const data = { ...req.body };
    const images = req.files?.map((file) => file.location) || [];

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

    const ownerUpdates = {};
    if (data.ownerName) ownerUpdates.name = data.ownerName;
    if (data.ownerEmail) ownerUpdates.email = data.ownerEmail;
    if (data.ownerMobile) ownerUpdates.mobile = data.ownerMobile;
    if (data.ownerDrivingLicence) ownerUpdates.dl = data.ownerDrivingLicence;
    if (data.ownerAddress) ownerUpdates.address = data.ownerAddress;
    if (data.ownerCity) ownerUpdates.city = data.ownerCity;
    if (data.ownerState) ownerUpdates.state = data.ownerState;
    if (data.ownerPinCode) ownerUpdates.pinCode = data.ownerPinCode;

    if (Object.keys(ownerUpdates).length) {
      await CarOwner.findByIdAndUpdate(existingCar.ownerId, ownerUpdates, {
        new: true,
      });
    }

    const updatedCar = await Car.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({ message: 'Successfully Updated', car: updatedCar });
  } catch (error) {
    console.error('updateCar error:', error);
    return res.status(500).json({ message: error.message });
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
    return res.status(500).json({ message: error.message });
  }
};
