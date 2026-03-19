const express = require('express');
const { addTravelAmenities, getTravelAmenities,deleteTravelAmenityById } = require('../../controllers/addtionalSettings/travelAmenities');
const { addBed, addBedBulk, getBed, deleteBedById } = require('../../controllers/addtionalSettings/bedList');
const { addRoom, getRooms, addRoomBulk, deleteRoomById } = require('../../controllers/addtionalSettings/roomList');
const { addAmenities, addBulkAmenities, getAmenities, deleteAmenityById } = require('../../controllers/addtionalSettings/hotelAmenities');
const { addRole, getRole, deleteRoleById } = require('../../controllers/addtionalSettings/role');
const { getTourThemes, createTourTheme, deleteTourThemeById } = require('../../controllers/addtionalSettings/tourTheme');
const {
  createSidebarLinksBulk,
  getSidebarLinks,
  createSidebarLink,
  deleteSidebarLinkById,
  changeSidebarLinkStatus,
  updateSidebarLink,
  getSidebarLinksGrouped,
  getSidebarLinksForUser,
  getUserSidebarPermissions,
  updateUserSidebarPermissions,
  getUserRoutePermissions,
  updateUserRoutePermissions,
  checkUserRouteAccess,
} = require('../../controllers/addtionalSettings/sidebarLinks');
const router = express.Router();

//==================================amenities=============================
router.post("/add/travel-amenities", addTravelAmenities)
router.get("/get/travel-amenities", getTravelAmenities)
router.delete("/delete-travel/amenities/:id",deleteTravelAmenityById)
//=====================================Sidebar Links==============================
router.post('/sidebar-links/bulk', createSidebarLinksBulk)
router.post('/sidebar-links', createSidebarLink)
router.get('/sidebar-links', getSidebarLinks)
router.get('/sidebar-links/grouped', getSidebarLinksGrouped)
router.put('/sidebar-links/:id', updateSidebarLink)
router.patch('/sidebar-links/:id/status', changeSidebarLinkStatus)
router.delete('/sidebar-links/:id', deleteSidebarLinkById)
router.get('/sidebar-links/for-user/:userId', getSidebarLinksForUser)
router.get('/sidebar-permissions/:userId', getUserSidebarPermissions)
router.put('/sidebar-permissions/:userId', updateUserSidebarPermissions)
router.get('/route-permissions/:userId', getUserRoutePermissions)
router.put('/route-permissions/:userId', updateUserRoutePermissions)
router.post('/route-permissions/:userId/check', checkUserRouteAccess)
//========================================Bed list=============================
router.post("/add-bed", addBed)
router.get("/get-bed", getBed)
router.delete('/delete-bed/:id',deleteBedById)
router.post("/add-bed-bulk", addBedBulk)
//=====================================Room List ===========================
router.post("/add-room", addRoom)
router.get("/get-room", getRooms)
router.delete('/delete-room/:id',deleteRoomById)
router.post("/add-room-bulk", addRoomBulk)
//==================================Hotel Amenities===============================
router.post("/add-amenities", addAmenities)
router.get("/get-amenities", getAmenities)
router.post("/add-amenities-bulk", addBulkAmenities)
router.delete("/delete-amenity/:id",deleteAmenityById)
//================================ role========================================
router.post('/roles', addRole);
router.get('/roles', getRole);
router.delete('/roles/:id', deleteRoleById);

//==================================Tour themes=========================
router.post('/add-tour-theme',createTourTheme );
router.get('/get-tour-themes', getTourThemes);
router.delete('/delete-tour-theme/:id', deleteTourThemeById);
module.exports = router


// 
