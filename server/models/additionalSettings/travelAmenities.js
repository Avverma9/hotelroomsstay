const mongoose = require("mongoose");
const travelAmenitiesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});
const TravelAmenities = mongoose.model(
  "TravelAmenities",
  travelAmenitiesSchema,
);
module.exports = TravelAmenities;
