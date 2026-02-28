const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
{
  roomId: String,
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
  originalPrice: {
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
  soldOut: {
    type: Boolean,
    default: false,
  },
  countRooms: {
    type: Number,
    default: 1,
  },
  totalRooms: {
    type: Number,
    default: 1,
  },
},
{
  strict: false,
}
);

const RoomModel = mongoose.models.rooms || mongoose.model("rooms", roomSchema);

module.exports = RoomModel;
module.exports.roomSchema = roomSchema;
