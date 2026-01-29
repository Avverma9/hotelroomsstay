const BedList = require("../../models/additionalSettings/bedList");

exports.addBed = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const bed = new BedList({ name });
    await bed.save();

    return res.status(201).json({
      message: "Bed added successfully",
      bed,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.addBedBulk = async (req, res) => {
  try {
    const bedNames = req.body;

    if (!Array.isArray(bedNames) || bedNames.length === 0) {
      return res.status(400).json({ message: "Please provide an array of bed names" });
    }

    const bedsToInsert = bedNames.map((name) => ({ name }));
    const insertedBeds = await BedList.insertMany(bedsToInsert);

    return res.status(201).json({
      message: "Bulk beds added successfully",
      beds: insertedBeds,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getBed = async (req, res) => {
  try {
    const bed = await BedList.find();

    const capitalizedBed = bed.map((bed) => {
      return {
        ...bed.toObject(),
        name: bed.name.charAt(0).toUpperCase() + bed.name.slice(1),
      };
    });

    return res.status(200).json(capitalizedBed);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
exports.deleteBedById = async (req, res) => {
  try {
    const { id } = req.params;

   await BedList.findByIdAndDelete(id);


    return res.status(200).json({
      message: "Bed deleted successfully",

    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};