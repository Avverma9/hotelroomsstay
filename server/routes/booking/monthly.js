const express = require("express");
const router = express.Router();
const month = require("../../controllers/booking/monthly");

router.post("/monthly-set-room-price/:hotelId/:roomId", month.newMonth);
router.get("/monthly-set-room-price/get/by/:hotelId", month.getPriceByHotelId);
router.patch("/monthly-set-room-price/update/:id", month.updateMonth);
router.delete("/monthly-set-room-price/delete/by-id/:id", month.deleteMonthById);
router.delete("/monthly-set-room-price/delete/price/by/:hotelId", month.deleteMonth);

module.exports = router;
