const mongoose = require("mongoose")

const carouselSchema= new mongoose.Schema({
    images:[String],
    description:String
},{timestamps:true})


module.exports= mongoose.model("Carousel",carouselSchema)