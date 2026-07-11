const mongoose = require('mongoose');
const OwnerAvailability = require('../../models/travel/ownerAvailability');
const DashboardUser = require('../../models/dashboardUser');
const CarOwner = require('../../models/travel/carOwner');
const Car = require('../../models/travel/cars');
const CarBooking = require('../../models/travel/carBooking');

const BLOCKING_STATUSES = ["Pending", "Confirmed", "Available", "Ride in Progress"];

const resolveDashboardUserFromRequest = async (req) => {
  const candidateValues = [
    req.user?.id,
    req.user?._id,
    req.user?.userId,
    req.user?.dashboardUserId,
    req.user?.email,
    req.params?.ownerId,
    req.query?.ownerId,
    req.body?.ownerId,
  ].filter(Boolean);

  const seen = new Set();
  for (const value of candidateValues) {
    const rawValue = String(value).trim();
    if (!rawValue || seen.has(rawValue)) continue;
    seen.add(rawValue);

    if (mongoose.Types.ObjectId.isValid(rawValue)) {
      const dashUser = await DashboardUser.findById(rawValue).lean();
      if (dashUser) return dashUser;
    }

    const dashUserByQuery = await DashboardUser.findOne({
      $or: [{ _id: rawValue }, { userId: rawValue }, { email: rawValue }],
    }).lean();

    if (dashUserByQuery) return dashUserByQuery;
  }

  return null;
};

const resolveOwnerByDashboardUser = async (dashUser) => {
  if (!dashUser) return null;

  const normalizedEmail = String(dashUser.email || '').trim().toLowerCase();
  const normalizedMobile = String(dashUser.mobile || '').trim();
  const normalizedName = String(dashUser.name || '').trim().toLowerCase();

  const ownerQueryParts = [];
  if (normalizedEmail) ownerQueryParts.push({ email: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (normalizedMobile) ownerQueryParts.push({ mobile: normalizedMobile });
  if (normalizedName) ownerQueryParts.push({ name: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });

  if (dashUser.carOwnerId && mongoose.Types.ObjectId.isValid(dashUser.carOwnerId)) {
    const carOwner = await CarOwner.findById(dashUser.carOwnerId).lean();
    if (carOwner) return carOwner;
  }

  if (ownerQueryParts.length > 0) {
    const carOwner = await CarOwner.findOne({ $or: ownerQueryParts }).lean();
    if (carOwner) return carOwner;
  }

  return null;
};

exports.addAvailability = async (req, res) => {
  try {
    const { startDate, endDate, mode = 'unavailable', carId, note } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ message: 'startDate and endDate are required' });
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ message: 'Invalid date format' });
    if (start > end) return res.status(400).json({ message: 'startDate must be before endDate' });

    const dashUser = await resolveDashboardUserFromRequest(req);
    const owner = await resolveOwnerByDashboardUser(dashUser);
    if (!owner) return res.status(403).json({ message: 'Owner account not found for this user' });

    // Check for conflicting bookings for this owner (by assignedDriverId or by cars owned)
    const cars = await Car.find({ ownerId: owner._id }).select('_id').lean();
    const carIds = cars.map((c) => String(c._id));

    const bookingConflict = await CarBooking.findOne({
      bookingStatus: { $in: BLOCKING_STATUSES },
      $or: [
        { assignedDriverId: String(owner._id) },
        { carId: { $in: carIds } },
      ],
      pickupD: { $lte: end },
      dropD: { $gte: start },
    }).lean();

    // If user is trying to mark this range as AVAILABLE but a booking already exists in that range, block it.
    if (bookingConflict && String(mode) === 'available') {
      return res.status(409).json({ message: 'Cannot mark as available: existing booking overlaps this range' });
    }

    const payload = {
      ownerId: owner._id,
      carId: carId && mongoose.Types.ObjectId.isValid(String(carId)) ? carId : null,
      startDate: start,
      endDate: end,
      mode: String(mode) === 'available' ? 'available' : 'unavailable',
      note: String(note || ''),
      createdBy: req.user?.id || null,
    };

    const created = await OwnerAvailability.create(payload);
    return res.status(201).json({ success: true, availability: created });
  } catch (error) {
    console.error('addAvailability error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const { ownerId, dateFrom, dateTo } = req.query;
    let owner = null;
    if (ownerId) {
      if (!mongoose.Types.ObjectId.isValid(String(ownerId))) return res.status(400).json({ message: 'Invalid ownerId' });
      owner = await CarOwner.findById(String(ownerId)).lean();
      if (!owner) return res.status(404).json({ message: 'Owner not found' });
    } else {
      const dashUser = await resolveDashboardUserFromRequest(req);
      owner = await resolveOwnerByDashboardUser(dashUser);
      if (!owner) return res.status(404).json({ message: 'Owner not found' });
    }

    const q = { ownerId: owner._id };
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        q.startDate = { $lte: to };
        q.endDate = { $gte: from };
      }
    }

    const items = await OwnerAvailability.find(q).sort({ startDate: 1 }).lean();
    return res.status(200).json({ success: true, availability: items });
  } catch (error) {
    console.error('getAvailability error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const doc = await OwnerAvailability.findById(id).lean();
    if (!doc) return res.status(404).json({ message: 'Availability not found' });

    // Only owner or creator may delete
    const dashUser = await resolveDashboardUserFromRequest(req);
    const owner = await resolveOwnerByDashboardUser(dashUser);
    if (!owner) return res.status(403).json({ message: 'Owner account not found' });

    if (String(doc.ownerId) !== String(owner._id) && String(doc.createdBy) !== String(req.user?.id)) {
      return res.status(403).json({ message: 'Not allowed to delete this availability' });
    }

    await OwnerAvailability.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('deleteAvailability error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
