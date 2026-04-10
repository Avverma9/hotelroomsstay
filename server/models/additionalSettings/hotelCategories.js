const mongoose = require("mongoose");

const hotelCategoriesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const HotelCategories = mongoose.model("HotelCategories", hotelCategoriesSchema);
module.exports = HotelCategories;
