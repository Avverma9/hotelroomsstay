const mongoose = require("mongoose");
const tourTheme = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});
const TourThemes = mongoose.model("TourThemes", tourTheme);
module.exports = TourThemes;