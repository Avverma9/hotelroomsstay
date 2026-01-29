const express = require('express');
const { checkAvailability, findAllAvailableHotels } = require('../../controllers/hotel/availability');
const router = express.Router()

router.get("/check/hotels/room-availability",checkAvailability); // on panel
router.get("/check/all-hotels/room-availability",findAllAvailableHotels); // on panel


module.exports=router
