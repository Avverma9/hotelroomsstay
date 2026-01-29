const Car = require('../../models/travel/cars');

exports.addCar = async (req, res) => {
    try {
        const { seatConfig, ...data } = req.body;
        const images = req.files?.map((file) => file.location) || [];
        const parsedSeatConfig = seatConfig?.map(config => JSON.parse(config));

        const carData = {
            ...data,
            images,
            seatConfig: parsedSeatConfig || [],
        };

        // Create the car in the database
        const newCar = await Car.create(carData);

        // Return the created car data as a response
        return res.status(201).json({
            message: 'Successfully Created',
            car: newCar,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Something went wrong',
            error: error.message,
        });
    }
};

exports.getSeatsData = async (req, res) => {    
    try {
        const { id } = req.params;
        const findCar = await Car.findById(id);
        if (!findCar) return res.status(404).json('Car not found'); 

        // Sort the seatConfig array by seatNumber
        const sortedSeatConfig = findCar.seatConfig.sort((a, b) => a.seatNumber - b.seatNumber);

        // Return carId along with the sorted seatConfig as an array
        return res.status(200).json({
            carId: id,
            seats: sortedSeatConfig
        });
    } catch (error) {
        console.error(error); // Log the error for debugging purposes
        return res.status(500).json('We are working hard to fix this');
    }
};


exports.getAllCars = async (_, res) => {
    try {
        const findData = await Car.find();
        return res.status(200).json(findData);
    } catch (error) {
        return res.status(500).json('We are working hard to fix this');
    }
};

exports.getCarById = async (req, res) => {
    try {
        const { id } = req.params;
        const findCar = await Car.findById(id);
        if (!findCar) return res.status(404).json('Car not found');
        return res.status(200).json(findCar);
    } catch (error) {
        return res.status(500).json('We are working hard to fix this');
    }
};

exports.getCarByOwnerId = async (req, res) => {
    try {
        const { ownerId } = req.params;
        const findCar = await Car.find({ownerId:ownerId});
        if (!findCar) return res.status(404).json('Car not found');
        return res.status(200).json(findCar);
    } catch (error) {
        return res.status(500).json('We are working hard to fix this');
    }
};

exports.filterCar = async (req, res) => {
    try {
        const { make, model, vehicleNumber, fuelType, seater, pickupP, dropP, pickupD, dropD } = req.query;
        const query = {};

        if (make) query.make = make;
        if (model) query.model = model;
        if (vehicleNumber) query.vehicleNumber = vehicleNumber;
        if (fuelType) query.fuelType = fuelType;
        if (seater) query.seater = seater;

        if (pickupP && dropP) {
            query.pickupP = { $regex: new RegExp(pickupP, 'i') };
            query.dropP = { $regex: new RegExp(dropP, 'i') };
        }

        if (pickupD && dropD) {
            query.pickupD = { $gte: new Date(pickupD) };
            query.dropD = { $lte: new Date(dropD) };
        }

        if (Object.keys(query).length === 0) {
            return res.status(400).json({ message: "No filter parameters provided" });
        }

        const cars = await Car.find(query);

        if (!cars.length) {
            return res.status(404).json({ message: "No cars found matching the filters" });
        }

        return res.status(200).json(cars);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred while fetching cars", error: error.message });
    }
};

exports.updateCar = async (req, res) => {
    try {
        const { id } = req.params;
        const { ...data } = req.body;
        const images = req.files?.map((file) => file.location) || [];
        const findCar = await Car.findById(id);
        if (!findCar) return res.status(404).json('Car not found');
        data.images = images.length > 0 ? images : findCar.images;
        // Update seater to match the number of seats in seatConfig
        data.seater = findCar.seatConfig.length;
        const updateData = await Car.findByIdAndUpdate(id, { ...data });
        return res.status(200).json({ message: 'Successfully Updated', updateData });

    } catch (error) {
        return res.status(500).json('We are working hard to fix this');
    }
};

exports.deleteCarById = async (req, res) => {
    try {
        const { id } = req.params;
        const findCar = await Car.findById(id);
        if (!findCar) return res.status(404).json('Car not found');
        await Car.findByIdAndDelete(id);
        return res.status(200).json('Successfully deleted');
    } catch (error) {
        return res.status(500).json('We are working hard to fix this');
    }
};
