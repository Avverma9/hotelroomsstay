const mongoose = require("mongoose");
const roomTypesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});
const RoomTypes = mongoose.model("RoomTypes", roomTypesSchema);
module.exports = RoomTypes;