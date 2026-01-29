const Amenities = require("../../models/additionalSettings/hotelAmenities");

exports.addAmenities = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const amenities = new Amenities({ name });
    await amenities.save();

    return res.status(201).json({
      message: "Amenities added successfully",
      amenities,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.addBulkAmenities = async (req, res) => {
  try {
    const amenitiesNames = req.body;

    if (!Array.isArray(amenitiesNames) || amenitiesNames.length === 0) {
      return res.status(400).json({ message: "Please provide an array of amenities names" });
    }

    const amenitiesToInsert = amenitiesNames.map((name) => ({ name }));
    const insertedAmenities = await Amenities.insertMany(amenitiesToInsert);

    return res.status(201).json({
      message: "Bulk amenities added successfully",
      amenities: insertedAmenities,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getAmenities = async (req, res) => {
  try {
    const amenities = await Amenities.find();

    const capitalizedAmenities = amenities.map((amenities) => {
      return {
        ...amenities.toObject(),
        name: amenities.name.charAt(0).toUpperCase() + amenities.name.slice(1),
      };
    });

    return res.status(200).json(capitalizedAmenities);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.deleteAmenityById = async (req, res) => {
  try {
    const { id } = req.params
    await Amenities.findByIdAndDelete(id)
    return res.status(200).json({ message: "You have delete a amenity" })
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }

}