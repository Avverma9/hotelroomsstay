const express = require('express');
const router = express.Router();
const { upload } = require('../../aws/upload');
const DashboardUser = require('../../controllers/dashboardUser');

router.post('/create/dashboard/user', upload, DashboardUser.registerUser);
router.put('/update/dashboard/user-status/:id', DashboardUser.updateStatus);
router.post('/login/dashboard/user', DashboardUser.loginUser);
router.get('/login/dashboard/get/all/user', DashboardUser.getPartners);
router.get('/login/dashboard/get/all/user/:userId', DashboardUser.getPartnersById);

router.delete('/delete/dashboard/delete/partner/:id', DashboardUser.deletePartner);
router.patch('/update/dashboard/updated/partner/:id', upload, DashboardUser.updatePartner);
router.post('/api/users/:id/menu-items', DashboardUser.addMenu);
router.patch('/api/users/:id/menu-items', DashboardUser.deleteMenu);
router.patch('/api/users/delete-all-menu-items/:id', DashboardUser.deleteAllMenus);
router.get('/api/users-get-user/by/query', DashboardUser.filterPartner);


module.exports = router;
