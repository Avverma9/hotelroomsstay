const express = require('express');
const router = express.Router();
const { upload } = require('../../aws/upload');
const hotelController = require('../../controllers/hotel/hotel');
const { createHotelBulk } = require('../../controllers/hotel/bulkhotel');
const multer = require('multer');
const { getVehicleSeats } = require('../../controllers/tour/booking');
const uploadNone = multer().none();
// Routes with authentication
router.post('/data/hotels-new/post/upload/data', upload, hotelController.createHotel);
router.post('/hotels/bulk', uploadNone, createHotelBulk);

router.patch('/hotels/update/:hotelId', hotelController.UpdateHotelStatus); // isAccepted, onFront admin panel
router.patch('/hotels/update/info/:hotelId', hotelController.UpdateHotelInfo); // basic details
router.patch('/hotels/:hotelId', hotelController.UpdateHotelInfo); // cleaner alias
router.get('/get/all/hotels', hotelController.getAllHotels); // on panel
router.delete('/delete/hotels/by/:hotelId', hotelController.deleteHotelById); // on panel
router.get('/get/main/get/hotels', hotelController.getHotels);
router.get('/get/offers/main/hotels', hotelController.setOnFront); // on site
router.get('/hotels/front', hotelController.setOnFront); // clearer alias
router.get('/hotels/get-by-id/:hotelId', hotelController.getHotelsById);
router.get('/hotels/:hotelId/rooms/:roomId/offer-status', hotelController.getRoomOfferStatus);
router.get('/hotelsLocalId', hotelController.getHotelsByLocalID);
router.get('/hotels/filters', hotelController.getHotelsByFilters); // Using on main site
router.get('/hotels/destination/get/all', hotelController.getCity); //filter hotel by city
router.get("/get-hotels-all/city",hotelController.getHotelsCity)
router.get('/hotels/query/get/by', hotelController.getByQuery); // on admin panel
router.get('/see-all/hotels-state/get/all/hotels', hotelController.getHotelsState); // get all hotels state name
router.get('/see-all/hotels-city/get/city', hotelController.getHotelsCityByState); // enter state and get city
router.get('/get-hotels/count', hotelController.getCount);
router.get("/get-hotel-list/filter-by-applied-coupons",hotelController.getCouponsAppliedHotels) // on admin panel
router.get("/hotels/with-active-offers", hotelController.getCouponsAppliedHotels); // clearer alias
router.get('/get-pending-hotels/count', hotelController.getCountPendingHotels);
router.patch('/update-hotels-image-by-hotel-id/:hotelId', upload, hotelController.updateHotelImage); // on panel
router.patch('/update-hotels-policy-by-hotel-id/:hotelId', hotelController.updatePolicies); // on panel
router.delete('/hotels/:hotelId/images/imageUrl', hotelController.deleteHotelImages); // on panel
router.put('/change-monthly-price/hotel-room', hotelController.monthlyPrice);

module.exports = router;
