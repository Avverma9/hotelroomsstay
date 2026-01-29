const mongoose = require("mongoose")
const headerTravel = new mongoose.Schema({
images:[String],
location:String
})
module.exports= mongoose.model("headerTravel",headerTravel)