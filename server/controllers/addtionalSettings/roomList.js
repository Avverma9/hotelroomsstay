const RoomList = require("../../models/additionalSettings/roomTypes");

exports.addRoom = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const room = new RoomList({ name });
    await room.save();

    return res.status(201).json({
      message: "Bed added successfully",
      room,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.addRoomBulk = async (req, res) => {
  try {
    const roomNames = req.body;

    if (!Array.isArray(roomNames) || roomNames.length === 0) {
      return res.status(400).json({ message: "Please provide an array of room names" });
    }

    const roomsToInsert = roomNames.map((name) => ({ name }));
    const insertedRooms = await RoomList.insertMany(roomsToInsert);

    return res.status(201).json({
      message: "Bulk Rooms added successfully",
      rooms: insertedRooms,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const room = await RoomList.find();

    const capitalizedRoom = room.map((room) => {
      return {
        ...room.toObject(),
        name: room.name.charAt(0).toUpperCase() + room.name.slice(1),
      };
    });

    return res.status(200).json(capitalizedRoom);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
exports.deleteRoomById = async (req, res) => {
  try {
    const { id } = req.params;
   await RoomList.findByIdAndDelete(id);
    return res.status(200).json({
      message: "Room deleted successfully",

    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};