const mongoose = require("mongoose");
const bedListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});
const BedList = mongoose.model("BedList", bedListSchema);
module.exports = BedList;