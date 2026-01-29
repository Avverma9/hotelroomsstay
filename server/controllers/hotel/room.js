const hotelModel = require('../../models/hotel/basicDetails');

const { v4: uuidv4 } = require('uuid');

exports.createRooms = async (req, res) => {
    try {
        const { hotelId, countRooms, price, soldOut, ...rooms } = req.body;

        // Convert countRooms and price to numbers
        const parsedCountRooms = Number(countRooms);
        const parsedPrice = Number(price);

        // Check if the parsed values are valid numbers
        if (isNaN(parsedCountRooms) || isNaN(parsedPrice)) {
            return res.status(400).json({
                message: 'Invalid input: countRooms and price must be numbers.',
            });
        }

        const images = req.files.map((file) => file.location);

        // Check if the hotel exists
        const existingHotel = await hotelModel.findOne({ hotelId });
        if (!existingHotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        // Generate a roomId
        const roomId = uuidv4().substr(0, 8); // Using uuid to generate a unique alphanumeric ID

        // Create the room
        const createdRoom = {
            roomId,
            hotelId,
            images,
            soldOut: false,
            countRooms: parsedCountRooms, // Store as number
            totalRooms: parsedCountRooms,
            price: parsedPrice, // Store as number
            ...rooms,
        };

        // Update the hotel with the created room
        const updatedHotel = await hotelModel.findOneAndUpdate(
            { hotelId },
            { $push: { rooms: createdRoom } }, // Push the room object into the rooms array
            { new: true }
        );

        res.status(201).json({ message: 'Created', createdRoom, updatedHotel });
    } catch (error) {
        console.error('Error creating rooms:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//get all rooms on dashboard by hotel id
exports.getRoomsByEmailId = async (req, res) => {
    try {
        const { hotelEmail } = req.query;
        const hotels = await hotelModel.find({ hotelEmail: hotelEmail });
        if (hotels.length === 0) {
            console.log('No hotels found for email:', hotelEmail);
            return res.status(404).json({ message: 'Hotel not found' });
        }
        const rooms = hotels.flatMap((hotel) => hotel.rooms);
        res.json(rooms);
    } catch (error) {
        console.error('Error getting rooms:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.updateRoomsByRoomId = async (req, res) => {
    const { roomId, type, bedTypes, price, countRooms, soldOut,totalRooms} = req.body;
    const images = req.files ? req.files.map((file) => file.location) : [];
    const parsedCountRooms = Number(countRooms);
    const parsedTotalRooms = Number(totalRooms);

    const parsedPrice = Number(price);

    try {
        // Create the update query
        let updateQuery = {
            $set: {
                'rooms.$.type': type,
                'rooms.$.soldOut': soldOut,
                'rooms.$.bedTypes': bedTypes,
                'rooms.$.price': parsedPrice,
                'rooms.$.countRooms': parsedCountRooms,
                'rooms.$.totalRooms': parsedTotalRooms, // Update totalRooms based on countRooms
            },
        };

        // If images are provided, include them in the update query
        if (images.length > 0) {
            updateQuery.$set['rooms.$.images'] = images;
        }

        // Find the hotel document based on roomId and update the room
        const updatedHotel = await hotelModel.findOneAndUpdate({ 'rooms.roomId': roomId }, updateQuery, { new: true });

        if (!updatedHotel) {
            return res.status(404).json({ message: 'No data found for the provided roomId' });
        }

        res.json({
            message: 'Rooms updated successfully',
            data: updatedHotel.rooms,
        });
    } catch (error) {
        console.error('Error while updating rooms:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteRoomByRoomId = async (req, res) => {
    const { roomId } = req.body; // Get roomId from the request parameters

    try {
        // Find the hotel document that contains the room and remove the room
        const updatedHotel = await hotelModel.findOneAndUpdate(
            { 'rooms.roomId': roomId }, // Match the hotel document containing the roomId
            { $pull: { rooms: { roomId: roomId } } }, // Remove the room with the specified roomId
            { new: true } // Return the updated document
        );

        if (!updatedHotel) {
            return res.status(404).json({ message: 'No data found for the provided roomId' });
        }

        res.json({
            message: 'Room deleted successfully',
            data: updatedHotel.rooms,
        });
    } catch (error) {
        console.error('Error while deleting room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.decreaseRoomCountByOne = async (req, res) => {
    const { roomId } = req.body;

    try {
        const updatedHotel = await hotelModel.findOneAndUpdate(
            { 'rooms.roomId': roomId }, // Query to find the hotel with the specified roomId
            {
                $inc: { 'rooms.$.countRooms': -1 }, // Decrement countRooms by 1
            },
            { new: true } // Return the updated document
        );

        if (!updatedHotel) {
            return res.status(404).json({ message: 'Hotel or roomId not found' });
        }

        // Respond with success
        res.json({
            message: 'Room count decreased successfully',
            hotel: updatedHotel,
        });
    } catch (error) {
        console.error('Error while updating rooms:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
