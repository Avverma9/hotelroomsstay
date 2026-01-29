const mongoose = require("mongoose");
const hotelAmenitiesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});
const HotelAmenities = mongoose.model("HotelAmenities", hotelAmenitiesSchema);

module.exports = HotelAmenities;
