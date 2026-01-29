const express = require("express");
const router = express.Router();
const policy = require('../../controllers/hotel/policies')

router.post("/add-a-new/policy-to-your/hotel", policy.createPolicy);
router.patch("/patch-a-new/policy-to-your/hotel", policy.updatePolicies);

module.exports = router