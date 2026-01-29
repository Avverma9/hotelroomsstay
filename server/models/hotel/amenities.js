const mongoose = require("mongoose");
const amenities = new mongoose.Schema({
  hotelId: {
    type: String,
    unique: true,
  },
  amenities: [String],
});
module.exports = mongoose.model("amenities", amenities);
