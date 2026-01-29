const mongoose = require("mongoose");
const foods = new mongoose.Schema({
  hotelId: {
    type: String,
    required: true,
  },
  name: String,
  foodType: String,
  images: [String],
  about: String,
  price: Number,
});

module.exports = mongoose.model("foods", foods);
