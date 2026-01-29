const HeaderLocation = require('../models/headerTravel');

exports.createLocation = async (req, res) => {
    try {
        const { location } = req.body;
        if (!location) {
            return res.status(400).json({ error: 'Location is required' });
        }
        const images = req.files.map((file) => file.location);
        const created = await HeaderLocation.create({ location, images });
        res.status(201).json({ message: 'One more location added', created });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getLocation = async (req, res) => {
    try {
        const getData = await HeaderLocation.find();
        res.status(200).json(getData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteById = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate ID
        if (!id) {
            return res.status(400).json({ error: 'Invalid ID provided' });
        }
        const getData = await HeaderLocation.findByIdAndDelete(id);
        if (!getData) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.status(200).json(getData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
