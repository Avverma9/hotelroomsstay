const connectDB = require('../config/db');
const mongoose = require('mongoose');
const hotelModel = require('../models/hotel/basicDetails');
const reviewModel = require('../models/review');

async function recalcForHotel(hotel) {
  const hotelId = hotel.hotelId || hotel._id;
  const reviews = await reviewModel.find({ hotelId }).lean();
  if (!reviews || reviews.length === 0) {
    await hotelModel.updateOne({ hotelId: hotel.hotelId }, {
      $set: {
        rating: 0,
        reviewCount: 0,
        ratingBreakdown: {
          cleanliness: 0,
          service: 0,
          valueForMoney: 0,
          location: 0,
        },
        ratingDistribution: {
          oneStar: 0, twoStar: 0, threeStar: 0, fourStar: 0, fiveStar: 0,
        }
      }
    });
    return { hotelId: hotel.hotelId, updated: true, total: 0 };
  }

  const total = reviews.length;
  const totalRating = reviews.reduce((s, r) => s + (r.rating || 0), 0);
  const avg = parseFloat((totalRating / total).toFixed(1));

  const distribution = { oneStar:0,twoStar:0,threeStar:0,fourStar:0,fiveStar:0 };
  reviews.forEach(r => {
    const score = Math.max(1, Math.min(5, Math.round(r.rating || 0)));
    if (score === 1) distribution.oneStar++;
    if (score === 2) distribution.twoStar++;
    if (score === 3) distribution.threeStar++;
    if (score === 4) distribution.fourStar++;
    if (score === 5) distribution.fiveStar++;
  });

  // detailed breakdown
  let cleanliness=0, service=0, valueForMoney=0, location=0, detailedCount=0;
  reviews.forEach(r => {
    if (r.cleanliness) { cleanliness += r.cleanliness; service += (r.service||0); valueForMoney += (r.valueForMoney||0); location += (r.location||0); detailedCount++; }
  });

  const breakdown = {
    cleanliness: detailedCount ? parseFloat((cleanliness/detailedCount).toFixed(1)) : 0,
    service: detailedCount ? parseFloat((service/detailedCount).toFixed(1)) : 0,
    valueForMoney: detailedCount ? parseFloat((valueForMoney/detailedCount).toFixed(1)) : 0,
    location: detailedCount ? parseFloat((location/detailedCount).toFixed(1)) : 0,
  };

  await hotelModel.updateOne({ hotelId: hotel.hotelId }, {
    $set: {
      rating: avg,
      reviewCount: total,
      ratingBreakdown: breakdown,
      ratingDistribution: distribution,
    }
  });

  return { hotelId: hotel.hotelId, updated: true, total };
}

async function run() {
  try {
    await connectDB();
    const hotels = await hotelModel.find().lean();
    console.log(`Found ${hotels.length} hotels. Recalculating ratings...`);
    const results = [];
    for (const h of hotels) {
      try {
        const r = await recalcForHotel(h);
        results.push(r);
      } catch (err) {
        console.error(`Error for hotel ${h.hotelId}:`, err.message || err);
      }
    }
    console.log('Done. Summary:', results.slice(0,5));
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
}

if (require.main === module) run();

module.exports = { recalcForHotel };
