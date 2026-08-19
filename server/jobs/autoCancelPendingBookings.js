const cron = require("node-cron");
const bookingModel = require("../models/booking/booking");
const hotelModel = require("../models/hotel/basicDetails");
const { sendBookingCancellationMail } = require("../nodemailer/nodemailer");
const { createUserNotificationSafe } = require("../controllers/notification/helpers");
const { shouldMarkAsNoShow } = require("../utils/bookingRules");

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
 * Auto-cancel Pending hotel bookings that were not confirmed within payment timeout.
 * Also mark Confirmed bookings as No-Show if customer didn't check-in by check-in date.
 * Runs every 10 minutes.
 */
const startAutoCancelJob = () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const now = new Date();

      // ═══════════════════════════════════════════════════════════
      // TASK 1: Auto-cancel Pending bookings (payment timeout)
      // ═══════════════════════════════════════════════════════════
      const expiredBookings = await bookingModel.find({
        bookingStatus: "Pending",
        autoCancelAt: { $lte: now },
      }).lean();

      if (expiredBookings.length > 0) {
        console.log(`[AutoCancel] Found ${expiredBookings.length} expired Pending booking(s)`);

        for (const booking of expiredBookings) {
          try {
            const updated = await bookingModel.findByIdAndUpdate(
              booking._id,
              {
                $set: {
                  bookingStatus: "Cancelled",
                  cancellationReason: "Auto-cancelled: payment not completed within the required time",
                  cancelledAt: now,
                },
                $push: {
                  statusHistory: {
                    previousStatus: "Pending",
                    newStatus: "Cancelled",
                    changedAt: now,
                    changedBy: { id: "system", name: "System", role: "auto", type: "system" },
                    note: "Auto-cancelled due to payment timeout",
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
                message: `Your booking ${updated.bookingId} for ${updated.hotelDetails?.hotelName || "the hotel"} was automatically cancelled because payment was not completed within the required time.`,
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

            console.log(`[AutoCancel] Successfully cancelled booking ${updated.bookingId}`);
          } catch (bookingErr) {
            console.error(`[AutoCancel] Error processing booking ${booking.bookingId}:`, bookingErr.message);
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // TASK 2: Mark Confirmed bookings as No-Show
      // ═══════════════════════════════════════════════════════════
      const confirmedBookings = await bookingModel.find({
        bookingStatus: "Confirmed",
        checkInDate: { $lt: now }, // Check-in date has passed
      }).lean();

      if (confirmedBookings.length > 0) {
        console.log(`[NoShow] Found ${confirmedBookings.length} Confirmed booking(s) past check-in date`);

        for (const booking of confirmedBookings) {
          try {
            if (shouldMarkAsNoShow(booking)) {
              const updated = await bookingModel.findOneAndUpdate(
                { _id: booking._id, bookingStatus: "Confirmed" },
                {
                  $set: {
                    bookingStatus: "No-Show",
                    noShowMarkedAt: now,
                  },
                  $push: {
                    statusHistory: {
                      previousStatus: "Confirmed",
                      newStatus: "No-Show",
                      changedAt: now,
                      changedBy: { id: "system", name: "System", role: "auto", type: "system" },
                      note: "Customer did not check-in by check-in date",
                    },
                  },
                },
                { new: true }
              );

              if (!updated) continue;

              await releaseBookedRooms(updated);

              // Send notification
              try {
                await createUserNotificationSafe({
                  name: "Booking Marked as No-Show",
                  message: `Your booking ${updated.bookingId} for ${updated.hotelDetails?.hotelName || "the hotel"} has been marked as No-Show because check-in was not completed by the scheduled date.`,
                  path: "/app/bookings/hotel",
                  eventType: "hotel_booking_no_show",
                  metadata: {
                    bookingId: updated.bookingId,
                    hotelId: updated.hotelDetails?.hotelId,
                  },
                  userIds: [String(updated?.user?.userId || "")],
                });
              } catch (notifErr) {
                console.error(`[NoShow] Notification error for booking ${updated.bookingId}:`, notifErr.message);
              }

              console.log(`[NoShow] Successfully marked booking ${updated.bookingId} as No-Show`);
            }
          } catch (bookingErr) {
            console.error(`[NoShow] Error processing booking ${booking.bookingId}:`, bookingErr.message);
          }
        }
      }

    } catch (err) {
      console.error("[AutoCancel/NoShow] Job error:", err.message);
    }
  });

  console.log("✅ Auto-cancel and No-Show job started (runs every 10 minutes)");
};

module.exports = { startAutoCancelJob };
