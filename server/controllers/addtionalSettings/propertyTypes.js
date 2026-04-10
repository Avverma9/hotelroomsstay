const PropertyTypes = require("../../models/additionalSettings/propertyTypes");

exports.addPropertyType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const propertyType = new PropertyTypes({ name });
    await propertyType.save();

    return res.status(201).json({
      message: "Property type added successfully",
      propertyType,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getPropertyTypes = async (req, res) => {
  try {
    const propertyTypes = await PropertyTypes.find();

    const capitalizedPropertyTypes = propertyTypes.map((propertyType) => ({
      ...propertyType.toObject(),
      name: propertyType.name.charAt(0).toUpperCase() + propertyType.name.slice(1),
    }));

    return res.status(200).json(capitalizedPropertyTypes);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.deletePropertyTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    await PropertyTypes.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Property type deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
