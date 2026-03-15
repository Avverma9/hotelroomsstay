const bookingModel = require("../../models/booking/booking");
const hotelModel = require("../../models/hotel/basicDetails");
const userModel = require("../../models/user");
const dashboardUserModel = require("../../models/dashboardUser");
const {
  sendBookingConfirmationMail,
  sendThankYouForVisitMail,
  sendBookingCancellationMail,
  generateOtp,
  sendOtpEmail,
  sendCancellationOtpEmail,
} = require("../../nodemailer/nodemailer");
const { getGSTData } = require("../GST/gst");
const {
  createUserNotificationSafe,
} = require("../notification/helpers");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const releaseBookedRooms = async (booking) => {
  const roomDetails = Array.isArray(booking?.roomDetails) ? booking.roomDetails : [];

  for (const bookedRoom of roomDetails) {
    const roomId = bookedRoom?.roomId;
    if (!roomId) {
      continue;
    }

    await hotelModel.updateOne(
      { hotelId: booking?.hotelDetails?.hotelId, "rooms.roomId": roomId },
      { $inc: { "rooms.$.countRooms": 1 } }
    );
  }
};

const buildStatusHistoryEntry = ({
  previousStatus,
  newStatus,
  changedBy,
  note = "",
}) => ({
  previousStatus,
  newStatus,
  changedAt: new Date(),
  changedBy: {
    id: String(changedBy?.id || ""),
    name: String(changedBy?.name || "Unknown"),
    role: String(changedBy?.role || ""),
    type: String(changedBy?.type || "user"),
  },
  note,
});

const resolveBookingActor = async (req) => {
  if (!req?.user) {
    return {
      id: "",
      name: "Unknown",
      role: "",
      type: "user",
    };
  }

  const actorRole = String(req.user.role || "").trim();
  if (actorRole) {
    const dashboardUser = await dashboardUserModel.findById(req.user.id)
      .select("name role")
      .lean();

    return {
      id: String(req.user.id || ""),
      name: dashboardUser?.name || "Dashboard User",
      role: dashboardUser?.role || actorRole,
      type: "dashboard_user",
    };
  }

  const appUser = await userModel.findOne({ userId: req.user.id })
    .select("userName")
    .lean();

  return {
    id: String(req.user.id || ""),
    name: appUser?.userName || "App User",
    role: "User",
    type: "app_user",
  };
};

const sendCancellationOtp = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await bookingModel.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const targetEmail = String(booking?.user?.email || "").trim();
    if (!targetEmail) {
      return res.status(400).json({ message: "Customer email not available" });
    }

    const otp = generateOtp();
    booking.cancellationOtp = otp;
    booking.cancellationOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await booking.save();

    await sendOtpEmail(targetEmail, otp, { skipRegisteredCheck: true });
    await sendCancellationOtpEmail({ email: targetEmail, otp, booking });

    return res.status(200).json({ message: "Cancellation OTP sent to customer email" });
  } catch (error) {
    console.error("Error sending cancellation OTP:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyCancellationOtpAndCancel = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp, cancellationReason = "" } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const booking = await bookingModel.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.cancellationOtp || !booking.cancellationOtpExpiry) {
      return res.status(400).json({ message: "No OTP issued for this booking" });
    }

    if (new Date() > new Date(booking.cancellationOtpExpiry)) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (String(otp).trim() !== String(booking.cancellationOtp).trim()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const previousStatus = booking.bookingStatus;
    const nextStatus = "Cancelled";

    const changedBy = await resolveBookingActor(req);
    const statusHistoryEntry = buildStatusHistoryEntry({
      previousStatus,
      newStatus: nextStatus,
      changedBy,
      note: String(cancellationReason || "Cancelled via OTP verification").trim(),
    });

    booking.bookingStatus = nextStatus;
    booking.cancellationReason = cancellationReason || "Cancelled via OTP verification";
    booking.cancelledAt = new Date();
    booking.cancellationOtp = undefined;
    booking.cancellationOtpExpiry = undefined;
    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push(statusHistoryEntry);

    await booking.save();
    await releaseBookedRooms(booking);

    await sendBookingCancellationMail({
      email: booking?.user?.email,
      subject: "Booking Cancelled !",
      bookingData: booking,
      link: process.env.FRONTEND_URL,
    });

    return res.status(200).json({ message: "Booking cancelled after OTP verification", data: booking });
  } catch (error) {
    console.error("Error verifying cancellation OTP:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getFormattedISTTime = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};
//==========================================creating booking========================================================================================================
const createBooking = async (req, res) => {
  try {
    const { userId, hotelId } = req.params;
    let {
      checkInDate,
      checkOutDate,
      guests,
      guestDetails,
      numRooms,
      foodDetails,
      roomDetails,
      pm,
      isPartialBooking,
      partialAmount,
      bookingStatus,
      createdBy,
      couponCode,
      discountPrice,
      bookingSource,
      hotelName,
      hotelEmail,
      hotelCity,
      hotelOwnerName,
      destination,
    } = req.body;

    const user = await userModel.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const bookingId = [...Array(10)]
      .map(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
      })
      .join('');

    const nights = Math.max(
      1,
      Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24))
    );

    // Calculate base room price
    let perRoomPrice = roomDetails?.[0]?.price || 0;
    const roomBaseTotal = perRoomPrice * numRooms * nights;
    
    // Apply discount first
    const discountAmount = discountPrice || 0;
    const discountedRoomTotal = Math.max(0, roomBaseTotal - discountAmount);
    
    // Calculate GST on discounted amount
    const gstData = await getGSTData({
      type: "Hotel",
      gstThreshold: [discountedRoomTotal / numRooms / nights], // Pass discounted per room price
    });

    const gstRate = gstData?.gstPrice || 0;
    const gstAmount = (discountedRoomTotal * gstRate) / 100;

    // Calculate food price
    const foodPrice = (foodDetails || []).reduce((sum, food) => {
      return sum + (food.price || 0) * (food.quantity || 1);
    }, 0);

    // Calculate final price
    const finalPrice = discountedRoomTotal + gstAmount + foodPrice;

    const existingSameHotelBooking = await bookingModel.exists({
      "user.userId": user.userId,
      "hotelDetails.hotelId": hotelId,
      bookingStatus: { $nin: ["Cancelled", "Failed"] },
    });

    const normalizedBookingStatus = String(bookingStatus || "").trim();
    const isPanelOrOfflineBooking =
      String(bookingSource || "").trim().toLowerCase() === "panel"
      || String(pm || "").trim().toLowerCase() === "offline";
    const shouldForcePending = Boolean(existingSameHotelBooking) || nights > 3;
    const resolvedBookingStatus = shouldForcePending
      ? "Pending"
      : normalizedBookingStatus || (isPanelOrOfflineBooking ? "Confirmed" : "Pending");

    const booking = new bookingModel({
      bookingId,
      user: {
        userId: user.userId,
        profile: user.images,
        name: user.userName,
        email: user.email,
        mobile: user.mobile,
      },
      createdBy: createdBy
        ? {
          user: createdBy.user,
          email: createdBy.email,
        }
        : undefined,
      hotelDetails: {
        hotelCity,
        hotelId,
        hotelName,
        hotelEmail,
        hotelOwnerName,
        destination,
      },
      foodDetails,
      numRooms,
      gstPrice: gstRate,
      gstAmount,
      foodPrice,
      baseRoomPrice: roomBaseTotal,
      discountedRoomPrice: discountedRoomTotal, // Add this field for clarity
      checkInDate,
      checkOutDate,
      guests,
      guestDetails,
      price: finalPrice,
      couponCode,
      discountPrice: discountAmount,
      pm,
      isPartialBooking,
      partialAmount,
      bookingStatus: resolvedBookingStatus,
      bookingSource,
      destination,
      roomDetails,
    });

    const savedBooking = await booking.save();

    if (savedBooking.bookingStatus === "Confirmed" || savedBooking.bookingStatus === "Pending") {
      const emailSubject = savedBooking.bookingStatus === "Confirmed"
        ? "Booking Confirmation"
        : "Booking Pending";
      await sendBookingConfirmationMail({
        email: savedBooking?.user?.email,
        subject: emailSubject,
        bookingData: savedBooking,
        link: process.env.FRONTEND_URL,
      });
    }

    // Update room availability
    for (const bookedRoom of roomDetails) {
      const { roomId } = bookedRoom;
    
      const hotel = await hotelModel.findOne({
        hotelId: hotelId,
        "rooms.roomId": roomId,
      });
    
      const roomIndex = hotel?.rooms?.findIndex((r) => r.roomId === roomId);
    
      if (
        hotel &&
        roomIndex !== -1 &&
        hotel.rooms[roomIndex].countRooms > 0
      ) {
        await hotelModel.updateOne(
          { hotelId: hotelId, "rooms.roomId": roomId },
          { $inc: { "rooms.$.countRooms": -1 } }
        );
      }
    }

    await createUserNotificationSafe({
      name: savedBooking.bookingStatus === "Pending"
        ? "Hotel Booking Pending Payment"
        : "Hotel Booking Successful",
      message: savedBooking.bookingStatus === "Pending"
        ? `Your hotel booking ${savedBooking.bookingId} is created and waiting for payment confirmation.`
        : `Your hotel booking ${savedBooking.bookingId} is created successfully for ${savedBooking.hotelDetails?.hotelName || "your selected hotel"}.`,
      path: "/app/bookings/hotel",
      eventType: savedBooking.bookingStatus === "Pending"
        ? "hotel_booking_pending"
        : "hotel_booking_success",
      metadata: {
        bookingId: savedBooking.bookingId,
        hotelId: savedBooking.hotelDetails?.hotelId,
        bookingStatus: savedBooking.bookingStatus,
      },
      userIds: [String(savedBooking?.user?.userId || userId)],
    });

    res.status(201).json({ success: true, data: savedBooking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


const getBookingCounts = async function (req, res) {
  const getCount = await bookingModel.countDocuments({});
  res.json(getCount);
};

const getTotalSell = async function (req, res) {
  try {
    const result = await bookingModel.aggregate([
      {
        $group: {
          _id: null,
          totalSell: { $sum: "$price" },
        },
      },
    ]);

    const totalSell = result.length > 0 ? result[0].totalSell : 0;

    res.status(200).json({ totalSell });
  } catch (error) {
    console.error("Error getting total sell:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//========================================================================
const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await bookingModel.findOne({ bookingId }).lean();

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json({
      message: "Booking fetched successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Error fetching booking by id:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateBooking = async (req, res) => {
  const { bookingId } = req.params;
  const data = req.body;

  try {
    const existingBooking = await bookingModel.findOne({ bookingId });
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const requesterRole = String(req.user?.role || "").trim();
    const canManageCancelledBooking = ["Admin", "Developer"].includes(requesterRole);

    if (existingBooking.bookingStatus === "Cancelled" && !canManageCancelledBooking) {
      return res.status(403).json({
        message: "Only Admin or Developer can update a cancelled booking",
      });
    }

    const previousStatus = existingBooking.bookingStatus;
    const nextStatus = String(data.bookingStatus || previousStatus).trim() || previousStatus;
    const resolvedCheckInTime = String(data.checkInTime || "").trim();
    const resolvedCheckOutTime = String(data.checkOutTime || "").trim();
    const statusMetadataUpdate = {};

    if (nextStatus === "Cancelled" && previousStatus !== "Cancelled") {
      statusMetadataUpdate.cancelledAt = new Date();
    }
    if (nextStatus === "Checked-in" && previousStatus !== "Checked-in") {
      const checkedInAt = new Date();
      statusMetadataUpdate.checkedInAt = checkedInAt;
      statusMetadataUpdate.checkInTime = resolvedCheckInTime || getFormattedISTTime(checkedInAt);
    }
    if (nextStatus === "Checked-out" && previousStatus !== "Checked-out") {
      const checkedOutAt = new Date();
      statusMetadataUpdate.checkedOutAt = checkedOutAt;
      statusMetadataUpdate.checkOutTime = resolvedCheckOutTime || getFormattedISTTime(checkedOutAt);
    }
    if (nextStatus === "No-Show" && previousStatus !== "No-Show") {
      statusMetadataUpdate.noShowMarkedAt = new Date();
    }
    if (nextStatus === "Failed" && previousStatus !== "Failed" && !data.failureReason) {
      statusMetadataUpdate.failureReason = "Payment failed or timed out";
    }
    if (resolvedCheckInTime) {
      statusMetadataUpdate.checkInTime = resolvedCheckInTime;
    }
    if (resolvedCheckOutTime) {
      statusMetadataUpdate.checkOutTime = resolvedCheckOutTime;
    }

    let statusHistoryUpdate = null;
    if (nextStatus !== previousStatus) {
      const changedBy = await resolveBookingActor(req);
      statusHistoryUpdate = buildStatusHistoryEntry({
        previousStatus,
        newStatus: nextStatus,
        changedBy,
        note: String(data.cancellationReason || data.failureReason || "").trim(),
      });
    }

    const updatedData = await bookingModel.findOneAndUpdate(
      { bookingId },
      {
        $set: { ...data, ...statusMetadataUpdate },
        ...(statusHistoryUpdate
          ? { $push: { statusHistory: statusHistoryUpdate } }
          : {}),
      },
      { new: true }
    );

    if (
      ["Cancelled", "Failed"].includes(updatedData.bookingStatus)
      && !["Cancelled", "Failed"].includes(previousStatus)
    ) {
      await releaseBookedRooms(updatedData);
    }

    if (updatedData.bookingStatus === "Checked-out") {
      await sendThankYouForVisitMail({
        email: updatedData?.user?.email,
        subject: "Thank you for visiting",
        bookingData: updatedData,
        link: process.env.FRONTEND_URL,
      });
    }

    if (updatedData.bookingStatus === "Cancelled") {
      await sendBookingCancellationMail({
        email: updatedData?.user?.email,
        subject: "Booking Cancelled !",
        bookingData: updatedData,
        link: process.env.FRONTEND_URL,
      });
    }
    if (updatedData.bookingStatus === "Confirmed") {
      await sendBookingConfirmationMail({
        email: updatedData?.user?.email,
        subject: "Booking Confirmed !",
        bookingData: updatedData,
        link: process.env.FRONTEND_URL,
      });

      await createUserNotificationSafe({
        name: "Hotel Booking Confirmed",
        message: `Your hotel booking ${updatedData.bookingId} is confirmed.`,
        path: "/app/bookings/hotel",
        eventType: "hotel_booking_confirmed",
        metadata: {
          bookingId: updatedData.bookingId,
          hotelId: updatedData.hotelDetails?.hotelId,
          bookingStatus: updatedData.bookingStatus,
        },
        userIds: [String(updatedData?.user?.userId)],
      });
    }
    res.json(updatedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


//==========================================================getallBookingByID main site bookings list=======================
const getAllFilterBookings = async (req, res) => {
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  try {
    const { bookingStatus, selectedStatus, userId, page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        html: `
          <div class="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-100 rounded-xl">
            <div class="p-3 bg-red-100 rounded-full mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-red-900 font-bold text-lg">Authentication Required</h3>
            <p class="text-red-600 text-sm mt-1">Please log in to view your bookings.</p>
          </div>
        `
      });
    }

    const filter = { "user.userId": userId };

    const statusParam = bookingStatus || selectedStatus;

    if (statusParam && String(statusParam).trim().toLowerCase() !== "all") {
      const status = String(statusParam).trim();
      filter.bookingStatus = { $regex: `^${escapeRegExp(status)}$`, $options: "i" };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const totalBookings = await bookingModel.countDocuments(filter);
    const totalPages = Math.ceil(totalBookings / limitNum);

    const bookings = await bookingModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    let htmlContent = '';

    if (!bookings || bookings.length === 0) {
      htmlContent = `
        <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div class="bg-gray-50 p-6 rounded-full mb-4 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="text-gray-900 font-bold text-xl mb-1">No bookings found</h3>
          <p class="text-gray-500 text-sm max-w-xs mx-auto">It looks like you haven't made any bookings matching these criteria yet.</p>
        </div>
      `;
    } else {
      const bookingsListHtml = bookings.map(booking => {
        let statusStyles = '';
        let statusIcon = '';
        
        switch(booking.bookingStatus) {
          case 'Confirmed':
            statusStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            statusIcon = '<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
            break;
          case 'Cancelled':
            statusStyles = 'bg-rose-50 text-rose-700 border-rose-200';
            statusIcon = '<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';
            break;
          default:
            statusStyles = 'bg-amber-50 text-amber-700 border-amber-200';
            statusIcon = '<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>';
        }

        const firstRoomType = booking.roomDetails?.[0]?.type || 'Standard Suite';
        const formattedPrice = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(booking.price);
        
        const showReview = !booking.hasReview && (booking.bookingStatus === 'Confirmed' || booking.bookingStatus === 'Checked-out' || booking.bookingStatus === 'Checked-in');

        // Food Details HTML Generator
        let foodDetailsHtml = '';
        if (booking.foodDetails && booking.foodDetails.length > 0) {
          const foodItems = booking.foodDetails.map(food => `
            <div class="flex justify-between items-center text-sm py-1 border-b border-dashed border-slate-100 last:border-0">
              <div class="flex items-center gap-2">
                 <div class="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                 <span class="text-slate-700 font-medium">${food.name}</span>
                 <span class="text-xs text-slate-400 font-medium px-1.5 py-0.5 bg-slate-100 rounded">x${food.quantity}</span>
              </div>
              <span class="text-slate-700 font-bold">₹${food.price * food.quantity}</span>
            </div>
          `).join('');

          foodDetailsHtml = `
            <div class="mt-4 pt-4 border-t border-dashed border-slate-200">
               <div class="flex items-center gap-2 mb-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                   <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                 </svg>
                 <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Food & Beverages</span>
               </div>
               <div class="bg-orange-50/50 rounded-lg p-3 border border-orange-100/50">
                 ${foodItems}
               </div>
            </div>
          `;
        }

        return `
          <div class="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 hover:shadow-lg transition-all duration-300 font-sans">
            
            <div class="absolute top-0 left-0 w-1.5 h-full ${booking.bookingStatus === 'Confirmed' ? 'bg-emerald-500' : booking.bookingStatus === 'Cancelled' ? 'bg-rose-500' : 'bg-amber-500'}"></div>

            <div class="p-5 pl-7">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-bold text-slate-900 tracking-tight leading-none mb-2">
                    ${booking.hotelDetails?.hotelName || 'Luxury Hotel Stay'}
                  </h3>
                  <div class="flex items-center text-slate-500 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                    </svg>
                    ${booking.hotelDetails?.destination || booking.destination || 'Destination'}
                  </div>
                </div>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${statusStyles}">
                  ${statusIcon}
                  ${booking.bookingStatus}
                </span>
              </div>

              <div class="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5 relative">
                <div class="text-left z-10">
                  <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Check-in</p>
                  <p class="text-base font-bold text-slate-800">${booking.checkInDate}</p>
                </div>
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 flex items-center justify-center">
                   <div class="w-full h-px bg-slate-300"></div>
                   <div class="absolute bg-slate-50 px-2 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                   </div>
                </div>
                <div class="text-right z-10">
                  <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Check-out</p>
                  <p class="text-base font-bold text-slate-800">${booking.checkOutDate}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="flex items-center gap-3">
                   <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                   </div>
                   <div>
                      <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Guests</p>
                      <p class="text-sm font-semibold text-slate-700">${booking.guests} Adults</p>
                   </div>
                </div>
                <div class="flex items-center gap-3">
                   <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                   </div>
                   <div>
                      <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Room Type</p>
                      <p class="text-sm font-semibold text-slate-700 truncate">${firstRoomType}</p>
                   </div>
                </div>
              </div>

              ${foodDetailsHtml}

              <div class="relative flex items-center gap-2 my-5">
                <div class="h-px bg-slate-200 flex-1"></div>
                <div class="w-2 h-2 rounded-full bg-slate-200"></div>
                <div class="h-px bg-slate-200 flex-1"></div>
              </div>

              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                   <p class="text-xs font-medium text-slate-500 mb-0.5">Total Amount</p>
                   <p class="text-2xl font-black text-slate-900 tracking-tight">${formattedPrice}</p>
                </div>

                <div class="flex flex-wrap gap-2 w-full sm:w-auto">
                   ${showReview ? `
                    <button 
                      onclick="window.handleReview && window.handleReview('${booking.hotelDetails?.hotelId}')"
                      class="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors focus:ring-2 focus:ring-slate-100 focus:outline-none flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Review
                    </button>
                  ` : ''}

                  <button 
                    onclick="window.handleShowDetails && window.handleShowDetails('${booking.bookingId}')"
                    class="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors focus:ring-2 focus:ring-slate-100 focus:outline-none"
                  >
                    Ticket
                  </button>
                  <button 
                    onclick="window.handlePrintTicket && window.handlePrintTicket('${booking.bookingId}')"
                    class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-bold shadow-md hover:bg-slate-800 hover:shadow-lg transform active:scale-95 transition-all focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                </div>
              </div>

            </div>
          </div>
        `;
      }).join('');

      const prevDisabled = pageNum <= 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-50 hover:border-slate-300 cursor-pointer';
      const nextDisabled = pageNum >= totalPages ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-50 hover:border-slate-300 cursor-pointer';

      const paginationHtml = `
        <div class="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-slate-200 gap-4" id="pagination-controls">
           <span class="text-sm text-slate-500 font-medium order-2 sm:order-1">
             Showing page <span class="font-bold text-slate-900">${pageNum}</span> of <span class="font-bold text-slate-900">${totalPages}</span>
           </span>
           
           <div class="flex gap-2 order-1 sm:order-2">
             <button 
               onclick="window.handlePageChange && window.handlePageChange(${pageNum - 1})" 
               class="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 shadow-sm transition-all active:scale-95 ${prevDisabled}"
               ${pageNum <= 1 ? 'disabled' : ''}
             >
               Previous
             </button>
             
             <button 
               onclick="window.handlePageChange && window.handlePageChange(${pageNum + 1})"
               class="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 shadow-sm transition-all active:scale-95 ${nextDisabled}"
               ${pageNum >= totalPages ? 'disabled' : ''}
             >
               Next
             </button>
           </div>
        </div>
      `;

      htmlContent = `
        <div class="w-full max-w-2xl mx-auto p-1 font-sans">
          ${bookingsListHtml}
          ${totalBookings > 0 ? paginationHtml : ''}
        </div>
      `;
    }

    res.status(200).json({
      success: true,
      data: bookings,
      html: htmlContent,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBookings,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      html: `
        <div class="p-6 text-center border border-red-100 bg-red-50 rounded-xl">
          <p class="text-red-600 font-bold text-lg mb-1">System Error</p>
          <p class="text-slate-600 text-sm">We couldn't load your bookings. Please try refreshing.</p>
        </div>
      `
    });
  }
};

const getAllFilterBookingsByQuery = async (req, res) => {
  try {
    const {
      bookingStatus,
      bookingSource,
      userId,
      bookingId,
      hotelId,
      hotelEmail,
      date,
      hotelCity,
      couponCode,
      createdBy,
      userMobile,
    } = req.query;
    const filter = {};

    if (userId) {
      filter["user.userId"] = userId;
    }
    if (bookingStatus) {
      filter.bookingStatus = bookingStatus;
    }
    if (bookingSource) {
      filter.bookingSource = {
        $regex: `^${escapeRegex(String(bookingSource).trim())}$`,
        $options: "i",
      };
    }
    if (couponCode) {
      filter.couponCode = couponCode
    }
    if (createdBy) {
      const createdByEmail = String(createdBy).trim();
      filter["createdBy.email"] = new RegExp(`^${escapeRegex(createdByEmail)}$`, "i");
    }

    if (hotelEmail) {
      const normalizedHotelEmail = String(hotelEmail).trim();
      filter["hotelDetails.hotelEmail"] = new RegExp(escapeRegex(normalizedHotelEmail), "i");

    }
    if (bookingId) {
      filter.bookingId = bookingId;
    }
    if (hotelId) {
      filter["hotelDetails.hotelId"] = String(hotelId).trim();
    }
    if (hotelCity) {
      filter["hotelDetails.hotelCity"] = { $regex: new RegExp(hotelCity.trim(), "i") };
    }
    if (userMobile) {
      const mobileRegex = new RegExp(`^${escapeRegex(String(userMobile).trim())}$`, "i");
      filter["user.mobile"] = mobileRegex;
    }

    if (date) {
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

      filter.$or = [
        { checkInDate: date },
        { checkOutDate: date },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      ];
    }

    const bookings = await bookingModel.find(filter).sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return res.status(400).json({ message: "No bookings found" });
    }

    res.json(bookings);
  } catch (error) {
    console.error("Error in getAllFilterBookings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPartnerHotelBookings = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { hotelId, bookingStatus, bookingSource, date } = req.query;

    const partner = await dashboardUserModel.findById(partnerId).lean();
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    const normalizedPartnerEmail = String(partner.email || "").trim();
    const linkedHotels = await hotelModel.find(
      {
        hotelEmail: {
          $regex: `^${escapeRegex(normalizedPartnerEmail)}$`,
          $options: "i",
        },
      },
      {
        _id: 1,
        hotelId: 1,
        hotelName: 1,
        hotelEmail: 1,
        city: 1,
        state: 1,
        destination: 1,
      },
    ).lean();

    if (linkedHotels.length === 0) {
      return res.status(200).json({
        message: "No hotels linked to this partner",
        partner: {
          id: partner._id,
          name: partner.name,
          email: partner.email,
          role: partner.role,
        },
        summary: {
          totalHotels: 0,
          totalBookings: 0,
          sourceCounts: {},
          statusCounts: {},
        },
        hotels: [],
        bookings: [],
      });
    }

    const hotelEmails = [...new Set(linkedHotels.map((hotel) => hotel.hotelEmail).filter(Boolean))];
    const hotelIds = linkedHotels.map((hotel) => String(hotel.hotelId));
    const hotelEmailRegexes = hotelEmails.map((email) =>
      new RegExp(`^${escapeRegex(String(email).trim())}$`, "i")
    );
    const filter = {
      "hotelDetails.hotelEmail": { $in: hotelEmailRegexes },
      "hotelDetails.hotelId": { $in: hotelIds },
    };

    if (hotelId) {
      filter["hotelDetails.hotelId"] = String(hotelId);
    }

    if (bookingStatus) {
      filter.bookingStatus = bookingStatus;
    }

    if (bookingSource) {
      filter.bookingSource = bookingSource;
    }

    if (date) {
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

      filter.$or = [
        { checkInDate: date },
        { checkOutDate: date },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      ];
    }

    const bookings = await bookingModel.find(filter).sort({ createdAt: -1 }).lean();

    const sourceCounts = {};
    const statusCounts = {};

    const normalizedBookings = bookings.map((booking) => {
      const normalizedSource = booking.bookingSource
        || (booking.createdBy?.email ? "panel" : "unknown");

      sourceCounts[normalizedSource] = (sourceCounts[normalizedSource] || 0) + 1;
      statusCounts[booking.bookingStatus] = (statusCounts[booking.bookingStatus] || 0) + 1;

      return {
        ...booking,
        normalizedSource,
      };
    });

    return res.status(200).json({
      message: "Partner hotel bookings fetched successfully",
      partner: {
        id: partner._id,
        name: partner.name,
        email: partner.email,
        role: partner.role,
      },
      summary: {
        totalHotels: linkedHotels.length,
        totalBookings: normalizedBookings.length,
        sourceCounts,
        statusCounts,
      },
      hotels: linkedHotels,
      bookings: normalizedBookings,
    });
  } catch (error) {
    console.error("Error fetching partner hotel bookings:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createBooking,
  getBookingById,
  sendCancellationOtp,
  verifyCancellationOtpAndCancel,
  updateBooking,
  getAllFilterBookings,
  getBookingCounts,
  getTotalSell,
  getAllFilterBookingsByQuery,
  getPartnerHotelBookings,
};
