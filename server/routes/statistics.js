const express = require('express')
const { getHotelDataByYear, getUserRoleStatsByYear, getBookingStatsByYear } = require('../controllers/statistics/statistics')
const router=express.Router()

router.get('/hotel-data',getHotelDataByYear)
router.get('/partners-data',getUserRoleStatsByYear)
router.get('/bookings-data',getBookingStatsByYear)

module.exports = router