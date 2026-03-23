const express = require("express");
const router = express.Router();
const bulk = require('../controllers/bulkOperation')

router.patch("/remove-bulk-coupons-from-hotels/by-hotel/id",bulk.removeCoupon)
router.patch("/hotels/bulk/remove-coupons",bulk.removeCoupon)
router.patch("/remove-bulk-hotel-from-hotels/by-hotel/ids",bulk.changeStatus)
router.patch("/hotels/bulk/update",bulk.changeStatus)
router.delete("/delete-bulk-hotels-from-list-of-hotels/by-ids",bulk.bulkDelete)
router.delete("/hotels/bulk/delete",bulk.bulkDelete)
module.exports=router
