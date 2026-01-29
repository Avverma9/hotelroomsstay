const TravelAmenities = require("../../models/additionalSettings/travelAmenities");

exports.addTravelAmenities = async (req, res) => {
  try {
    const { name } = req.body;

    if (!Array.isArray(name) || name.length === 0) {
      return res.status(400).json({ message: "Name must be a non-empty array of strings" });
    }

    const invalidNames = name.filter(n => typeof n !== 'string' || n.trim() === '');
    if (invalidNames.length > 0) {
      return res.status(400).json({ message: "All names must be non-empty strings" });
    }

    const amenities = await TravelAmenities.insertMany(
      name.map(n => ({ name: n }))
    );

    return res.status(201).json({
      message: "Travel amenities added successfully",
      travelAmenities: amenities,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getTravelAmenities = async (req, res) => {
  try {
    const travelAmenities = await TravelAmenities.find();
    return res.status(200).json(travelAmenities);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
exports.deleteTravelAmenityById = async (req, res) => {
  const { id } = req.body
  await TravelAmenities.findByIdAndDelete(id)
  return res.status(200).json({ message: "deleted" });

}