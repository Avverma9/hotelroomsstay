const cron = require("node-cron");
const Car = require("../models/travel/cars");

const isCarDateExpired = (car, now = new Date()) => {
  const dropDate = car?.dropD ? new Date(car.dropD) : null;
  return Boolean(dropDate && !Number.isNaN(dropDate.getTime()) && dropDate <= now);
};

const markExpiredCarsUnavailable = async () => {
  const now = new Date();
  const result = await Car.updateMany(
    {
      dropD: { $lte: now },
      runningStatus: { $ne: "Unavailable" },
    },
    {
      $set: {
        isAvailable: false,
        runningStatus: "Unavailable",
      },
    }
  );

  if (result.modifiedCount) {
    console.log(`[CarAvailability] Marked ${result.modifiedCount} expired car(s) unavailable`);
  }

  return result;
};

const startCarAvailabilityJob = () => {
  // Run every minute so expiry is reflected without waiting for another request.
  cron.schedule("* * * * *", async () => {
    try {
      await markExpiredCarsUnavailable();
    } catch (error) {
      console.error("[CarAvailability] Expiry job failed:", error.message);
    }
  });

  console.log("[CarAvailability] Expiry job started (runs every minute)");
};

module.exports = {
  isCarDateExpired,
  markExpiredCarsUnavailable,
  startCarAvailabilityJob,
};
