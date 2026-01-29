const express = require('express');
const router = express.Router();
const { upload } = require('../../aws/upload');
const bookingController = require('../../controllers/booking/booking');
const auth = require('../../authentication/auth');
const Razorpay = require("razorpay");
router.post('/booking/:userId/:hotelId', upload, bookingController.createBooking); // on site

router.put('/updatebooking/:bookingId', auth, bookingController.updateBooking); //on panel

router.get('/get/all/users-filtered/booking/by', bookingController.getAllFilterBookings); // using on main site
router.get('/get/all/filtered/booking/by/query', bookingController.getAllFilterBookingsByQuery); //using on dashboard
router.get('/get-all/bookings-count', bookingController.getBookingCounts);
router.get('/get-all/sell-count', bookingController.getTotalSell);
const razorpay = new Razorpay({
    key_id: "rzp_test_0UMxKeTqqehh1o", // your Razorpay test key
    key_secret: "4jWFyvZdChirSt9fHuujwr5p",     // your Razorpay test secret
});

router.post("/create-order", async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount < 1) {
            return res.status(400).json({ error: "Amount is required" });
        }

        const order = await razorpay.orders.create({
            amount: amount, // in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        return res.status(200).json({ orderId: order.id });
    } catch (err) {
        console.error("Failed to create order:", err);
        res.status(500).json({ error: "Failed to create order" });
    }
});
module.exports = router;
