const express = require('express');
const router = express.Router();
const { upload } = require('../../aws/upload');
const DashboardUser = require('../../controllers/dashboardUser');

router.post('/create/dashboard/user', upload, DashboardUser.registerUser);
router.put('/update/dashboard/user-status/:id', DashboardUser.updateStatus);
router.post('/login/dashboard/user', DashboardUser.loginUser);
router.post('/login/dashboard/user/send-otp', DashboardUser.sendLoginOtp);
router.post('/login/dashboard/user/verify-otp', DashboardUser.verifyLoginOtp);
router.post('/forgot-password/dashboard/user', DashboardUser.forgotPassword);
router.post('/change-password/dashboard/user', DashboardUser.changePassword);
router.get('/login/dashboard/get/all/user', DashboardUser.getPartners);
router.get('/login/dashboard/get/all/user/:userId', DashboardUser.getPartnersById);

router.delete('/delete/dashboard/delete/partner/:id', DashboardUser.deletePartner);
router.patch('/update/dashboard/updated/partner/:id', upload, DashboardUser.updatePartner);
router.get('/api/users-get-user/by/query', DashboardUser.filterPartner);

// Refresh token
router.post('/auth/refresh/dashboard', DashboardUser.refreshDashboardToken);


module.exports = router;
