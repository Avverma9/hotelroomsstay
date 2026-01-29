const mongoose = require("mongoose");
const rooms = new mongoose.Schema({
  hotelId: String,
  images: [String],
  type: {
    type: String,
  },
  bedTypes: {
    type: String,
  },
  price: {
    type: Number,
  },
  isOffer: {
    type: Boolean,
    default: false,
  },
  offerName: {
    type: String,
    default: "N/A",
  },
  offerPriceLess: {
    default: 0,
    type: Number,
  },
  offerExp: {
    type: Date,
  },
  countRooms: {
    type: Number,
    default: 1,
  },
});
module.exports = mongoose.model("rooms", rooms);
