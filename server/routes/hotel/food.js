const express = require('express');
const { upload } = require('../../aws/upload');
const router = express.Router()
const foods = require('../../controllers/hotel/food')

router.post("/add/food-to/your-hotel", upload, foods.createFood); // on panel
router.delete("/delete-food/:hotelId/:foodId", foods.deleteFood); // on panel

module.exports=router
