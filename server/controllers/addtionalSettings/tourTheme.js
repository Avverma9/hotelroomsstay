const TourThemes = require("../../models/additionalSettings/tourThemes");

exports.createTourTheme = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const tourTheme = new TourThemes({ name });
    await tourTheme.save();

    return res.status(201).json(
      tourTheme,
    );
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getTourThemes = async (req, res) => {
  try {
    const tourThemes = await TourThemes.find();
    return res.status(200).json(tourThemes);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.deleteTourThemeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const deletedTheme = await TourThemes.findByIdAndDelete(id);

    if (!deletedTheme) {
      return res.status(404).json({ message: "Tour theme not found" });
    }

    return res.status(200).json({ message: "Tour theme deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
