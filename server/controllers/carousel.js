const carousel = require("../models/carousel")

const createBanner= async function(req,res){
    const {description}=req.body
    const images= req.files.map((file)=>file.location)
    const created= await carousel.create({description,images})
    res.status(201).json(created)
}

const getBanner =async(req,res)=>{
    const getData= await carousel.find()
    res.json(getData)
}

const deleteBanner = async(req,res)=>{
    const {id}= req.params
    const deleteData = await carousel.findByIdAndDelete(id)
    res.status(200).json("Successfully deleted")
}

module.exports = { createBanner, getBanner, deleteBanner };