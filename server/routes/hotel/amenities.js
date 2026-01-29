
const express = require("express");
const router = express.Router();
const amenities = require('../../controllers/hotel/amenities')

router.get("/get-hotel-by/amenities", amenities.getHotelByAmenities);
router.post("/create-a-amenities/to-your-hotel", amenities.createAmenity); // on panel
router.delete(
  "/hotels/:hotelId/amenities/:amenityName",
  amenities.deleteAmenity
); // on panel

module.exports=router