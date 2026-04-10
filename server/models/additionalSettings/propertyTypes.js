const mongoose = require("mongoose");

const propertyTypesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const PropertyTypes = mongoose.model("PropertyTypes", propertyTypesSchema);
module.exports = PropertyTypes;
