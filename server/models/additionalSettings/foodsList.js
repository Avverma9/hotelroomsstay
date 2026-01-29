const mongoose = require("mongoose");
const foodListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
}); 
const FoodList = mongoose.model("FoodList", foodListSchema);
module.exports = FoodList;