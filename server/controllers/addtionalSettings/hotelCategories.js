const HotelCategories = require("../../models/additionalSettings/hotelCategories");

exports.addHotelCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const hotelCategory = new HotelCategories({ name });
    await hotelCategory.save();

    return res.status(201).json({
      message: "Hotel category added successfully",
      hotelCategory,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getHotelCategories = async (req, res) => {
  try {
    const hotelCategories = await HotelCategories.find();

    const capitalizedHotelCategories = hotelCategories.map((hotelCategory) => ({
      ...hotelCategory.toObject(),
      name: hotelCategory.name.charAt(0).toUpperCase() + hotelCategory.name.slice(1),
    }));

    return res.status(200).json(capitalizedHotelCategories);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.deleteHotelCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    await HotelCategories.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Hotel category deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
