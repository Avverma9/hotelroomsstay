const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
module.exports = MenuItem;
