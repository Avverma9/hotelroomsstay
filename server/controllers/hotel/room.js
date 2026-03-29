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
            originalPrice: parsedPrice,
            isOffer: false,
            offerName: "N/A",
            offerPriceLess: 0,
            offerExp: null,
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
    const { roomId, type, bedTypes, price, countRooms, soldOut, totalRooms } = req.body;
    const images = req.files ? req.files.map((file) => file.location) : [];

    if (!roomId) {
        return res.status(400).json({ message: 'roomId is required' });
    }

    const parsedPrice = price !== undefined && price !== '' ? Number(price) : undefined;
    const parsedCountRooms = countRooms !== undefined && countRooms !== '' ? Number(countRooms) : undefined;
    const parsedTotalRooms = totalRooms !== undefined && totalRooms !== '' ? Number(totalRooms) : undefined;

    // Reject NaN values early so Mongoose never sees them
    if (parsedPrice !== undefined && isNaN(parsedPrice)) {
        return res.status(400).json({ message: 'Invalid input: price must be a number.' });
    }
    if (parsedCountRooms !== undefined && isNaN(parsedCountRooms)) {
        return res.status(400).json({ message: 'Invalid input: countRooms must be a number.' });
    }
    if (parsedTotalRooms !== undefined && isNaN(parsedTotalRooms)) {
        return res.status(400).json({ message: 'Invalid input: totalRooms must be a number.' });
    }

    try {
        const existingHotel = await hotelModel.findOne({ 'rooms.roomId': roomId });
        if (!existingHotel) {
            return res.status(404).json({ message: 'No data found for the provided roomId' });
        }

        const existingRoom = existingHotel.rooms.find((room) => room.roomId === roomId);
        const preserveOfferPricing = Boolean(existingRoom?.isOffer);

        // Only include fields that were actually provided — avoids NaN/undefined casting errors
        const setFields = {};
        if (type !== undefined)              setFields['rooms.$.type'] = type;
        if (soldOut !== undefined)           setFields['rooms.$.soldOut'] = soldOut;
        if (bedTypes !== undefined)          setFields['rooms.$.bedTypes'] = bedTypes;
        if (parsedPrice !== undefined)       setFields['rooms.$.price'] = parsedPrice;
        if (parsedPrice !== undefined)       setFields['rooms.$.originalPrice'] = parsedPrice;
        if (parsedCountRooms !== undefined)  setFields['rooms.$.countRooms'] = parsedCountRooms;
        // Sync totalRooms with countRooms when only countRooms is provided
        if (parsedTotalRooms !== undefined)   setFields['rooms.$.totalRooms'] = parsedTotalRooms;
        else if (parsedCountRooms !== undefined) setFields['rooms.$.totalRooms'] = parsedCountRooms;
        if (preserveOfferPricing)            setFields['rooms.$.isOffer'] = true;
        if (images.length > 0)              setFields['rooms.$.images'] = images;

        if (Object.keys(setFields).length === 0) {
            return res.status(400).json({ message: 'At least one field to update is required.' });
        }

        const updatedHotel = await hotelModel.findOneAndUpdate(
            { 'rooms.roomId': roomId },
            { $set: setFields },
            { new: true }
        );

        res.json({
            message: 'Rooms updated successfully',
            data: updatedHotel.rooms,
        });
    } catch (error) {
        console.error('Error while updating rooms:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
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

    if (!roomId) {
        return res.status(400).json({ message: 'roomId is required' });
    }

    try {
        // Use arrayFilters to only decrement when countRooms > 0 (prevents negative rooms)
        const updatedHotel = await hotelModel.findOneAndUpdate(
            { 'rooms.roomId': roomId },
            { $inc: { 'rooms.$[r].countRooms': -1 } },
            {
                new: true,
                arrayFilters: [{ 'r.roomId': roomId, 'r.countRooms': { $gt: 0 } }]
            }
        );

        if (!updatedHotel) {
            return res.status(404).json({ message: 'Hotel or roomId not found' });
        }

        const updatedRoom = updatedHotel.rooms.find((r) => r.roomId === roomId);
        if (!updatedRoom) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json({
            message: 'Room count decreased successfully',
            countRooms: updatedRoom.countRooms,
            hotel: updatedHotel,
        });
    } catch (error) {
        console.error('Error while updating rooms:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
