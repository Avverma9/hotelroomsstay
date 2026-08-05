const express = require('express')
const router = express.Router()
const HeaderLocation = require('../controllers/headerTravel');
const { upload } = require('../aws/upload');
const enforceUploadLimits = require('../middleware/enforceUploadLimits');

router.post("/add-a/travel/location", upload, enforceUploadLimits({ maxFiles: 6, maxTotalSizeBytes: 30 * 1024 * 1024 }), HeaderLocation.createLocation); // on panel
router.get("/get-all/travel/location", HeaderLocation.getLocation); // on panel
router.delete("/delete-by-id/travel/location/:id", HeaderLocation.deleteById); // on panel

module.exports = router