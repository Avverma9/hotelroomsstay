const express = require('express');
const { upload } = require('../../aws/upload');
const {
  addCar,
  getCarById,
  getAllCars,
  updateCar,
  deleteCarById,
  filterCar,
  getSeatsData,
  getCarByOwnerId,
  getMyCars,
  releaseSeat,
} = require('../../controllers/travel/cars');
const auth = require('../../authentication/auth');
const router = express.Router();

router.post('/add-a-car', upload, addCar);
router.get('/get-a-car/:id', getCarById);
router.get('/get-my-cars', auth, getMyCars);
router.get('/get-a-car/by-owner/:ownerId', getCarByOwnerId);
router.get('/get-all-car', getAllCars);
router.patch('/update-a-car/:id', auth, upload, updateCar);
router.delete('/delete-a-car/:id', auth, deleteCarById);
router.get('/filter-car/by-query',filterCar);
router.get('/get-seat-data/by-id/:id',getSeatsData);
router.patch('/release-seat/:carId', auth, releaseSeat);

module.exports = router;
