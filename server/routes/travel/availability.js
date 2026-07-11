const express = require('express');
const auth = require('../../authentication/auth');
const {
  addAvailability,
  getAvailability,
  deleteAvailability,
} = require('../../controllers/travel/availability');

const router = express.Router();

// Create availability (owner-only)
router.post('/owner-availability', auth, addAvailability);

// List availability for an owner (public for read)
router.get('/owner-availability', getAvailability);

// Delete availability
router.delete('/owner-availability/:id', auth, deleteAvailability);

module.exports = router;
