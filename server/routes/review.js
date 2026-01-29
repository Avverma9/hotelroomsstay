const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review');
const auth = require('../authentication/auth');

// Create review (after booking)
router.post('/reviews/:userId/:hotelId', reviewController.createReview);

// Get reviews by hotel (with pagination and sorting)
router.get('/getReviews/hotelId', reviewController.getReviewsByHotelId);

// Get reviews by user
router.get('/reviewDatas/userId', reviewController.getReviewsByUserId);

// Update review (with auto-recalculation)
router.put('/update-review/:reviewId', reviewController.updateReview);

// Delete review (with auto-recalculation)
router.delete('/delete/:reviewId', reviewController.deleteReview);

// Get all reviews (Admin panel)
router.get('/find-all-users-hotel-review', reviewController.findAllReviews);

// Get user's pending reviews (bookings without review)
router.get('/pending-reviews', reviewController.getPendingReviews);

// Admin: Add response to review
router.post('/admin-response/:reviewId', reviewController.addAdminResponse);

module.exports = router;
