const express = require("express");
const router = express.Router();
const { upload } = require("../r2/upload");
const carouselController = require("../controllers/carousel");

router.post("/create/second/carousel", upload, carouselController.createBanner); // on panel
router.get("/get/second/carousel", carouselController.getBanner); //on panel
router.delete(
  "/delete/second-carousel-data/:id",
  upload,
  carouselController.deleteBanner
); // on panel

module.exports = router;
