const express = require('express');
const router = express.Router();
const { upload } = require('../aws/upload');
const userController = require('../controllers/user');

router.post('/Signup', upload, userController.createSignup);
router.get('/get/:userId', userController.getUserById);
router.get('/get/user/by/query', userController.findUser);
router.post('/signIn', userController.signIn);
router.post('/signIn/google', userController.GoogleSignIn);
router.put('/update', upload, userController.update);
router.get('/get/all-users-data/all-data', userController.getAllUsers);
router.get('/get-total/user-details', userController.totalUser); // user count
router.post('/get-user-data/in-bulk', userController.getAllUserBulkById)
router.get("/get-all-users-booking-details/full-details",userController.getAllUserDetails)
router.post("/send-otp", userController.loginWithOtp);
router.post("/verify-otp", userController.verifyOTP);

// Admin: filter users with bookings, coupons, complaints
router.get("/admin/users/filter", userController.filterUsers);

// Refresh token
router.post("/auth/refresh", userController.refreshUserToken);

module.exports = router;
