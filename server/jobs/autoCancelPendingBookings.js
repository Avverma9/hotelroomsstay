const cron = require("node-cron");
const bookingModel = require("../models/booking/booking");
const hotelModel = require("../models/hotel/basicDetails");
const { sendBookingCancellationMail } = require("../nodemailer/nodemailer");
const { createUserNotificationSafe } = require("../controllers/notification/helpers");

const releaseBookedRooms = async (booking) => {
  const roomDetails = Array.isArray(booking?.roomDetails) ? booking.roomDetails : [];
  for (const bookedRoom of roomDetails) {
    const roomId = bookedRoom?.roomId;
    if (!roomId) continue;
    await hotelModel.updateOne(
      { hotelId: booking?.hotelDetails?.hotelId, "rooms.roomId": roomId },
      { $inc: { "rooms.$.countRooms": 1 } }
    );
  }
};

/**
 * Auto-cancel Pending hotel bookings that were not confirmed within 2 hours.
 * Runs every 10 minutes.
 */
const startAutoCancelJob = () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const now = new Date();

      // Find all Pending bookings whose autoCancelAt time has passed
      const expiredBookings = await bookingModel.find({
        bookingStatus: "Pending",
        autoCancelAt: { $lte: now },
      }).lean();

      if (!expiredBookings.length) return;

      console.log(`[AutoCancel] Found ${expiredBookings.length} expired pending booking(s). Processing...`);

      for (const booking of expiredBookings) {
        try {
          const updated = await bookingModel.findByIdAndUpdate(
            booking._id,
            {
              $set: {
                bookingStatus: "Cancelled",
                cancellationReason: "Auto-cancelled: booking was not confirmed within 2 hours",
                cancelledAt: now,
              },
              $push: {
                statusHistory: {
                  previousStatus: "Pending",
                  newStatus: "Cancelled",
                  changedAt: now,
                  changedBy: { id: "system", name: "System", role: "auto", type: "system" },
                  note: "Auto-cancelled after 2 hours without confirmation",
                },
              },
            },
            { new: true }
          );

          if (!updated) continue;

          // Release booked rooms back to inventory
          await releaseBookedRooms(updated);

          // Send cancellation email
          try {
            await sendBookingCancellationMail({
              email: updated?.user?.email,
              subject: "Booking Auto-Cancelled",
              bookingData: updated,
              link: process.env.FRONTEND_URL,
            });
          } catch (mailErr) {
            console.error(`[AutoCancel] Mail error for booking ${updated.bookingId}:`, mailErr.message);
          }

          // Send in-app notification
          try {
            await createUserNotificationSafe({
              name: "Booking Auto-Cancelled",
              message: `Your booking ${updated.bookingId} for ${updated.hotelDetails?.hotelName || "the hotel"} was automatically cancelled because it was not confirmed within 2 hours.`,
              path: "/app/bookings/hotel",
              eventType: "hotel_booking_auto_cancelled",
              metadata: {
                bookingId: updated.bookingId,
                hotelId: updated.hotelDetails?.hotelId,
              },
              userIds: [String(updated?.user?.userId || "")],
            });
          } catch (notifErr) {
            console.error(`[AutoCancel] Notification error for booking ${updated.bookingId}:`, notifErr.message);
          }

          console.log(`[AutoCancel] Cancelled booking ${updated.bookingId}`);
        } catch (bookingErr) {
          console.error(`[AutoCancel] Error processing booking ${booking.bookingId}:`, bookingErr.message);
        }
      }
    } catch (err) {
      console.error("[AutoCancel] Job error:", err.message);
    }
  });

  console.log("[AutoCancel] Auto-cancel pending bookings job scheduled (every 10 minutes)");
};

module.exports = { startAutoCancelJob };
