const hotelModel = require("../../models/hotel/basicDetails");
const month = require("../../models/booking/monthly");
const cron = require("node-cron");
const { DateTime } = require("luxon"); // Add this line at the top

const bookingsModel = require("../../models/booking/booking");
const monthly = require("../../models/booking/monthly");
const gstModel = require("../../models/GST/gst");
const { sendCustomEmail } = require("../../nodemailer/nodemailer");
const createHotel = async (req, res) => {
  try {
    const {
      hotelName,
      description,
      hotelOwnerName,
      destination,
      onFront,
      startDate,
      endDate,
      state,
      city,
      landmark,
      pinCode,
      hotelCategory,
      numRooms,
      latitude,
      longitude,
      reviews,
      rating,
      starRating,
      propertyType,
      contact,
      isAccepted,
      salesManagerContact,
      localId,
      hotelEmail,
      customerWelcomeNote,
      generalManagerContact,
    } = req.body;

    const images = req.files.map((file) => file.location);

    const hotelData = {
      hotelName,
      description,
      hotelOwnerName,
      destination,
      onFront,
      customerWelcomeNote,
      startDate,
      endDate,
      state,
      latitude,
      longitude,
      city,
      landmark,
      pinCode,
      hotelCategory,
      numRooms,
      reviews,
      rating,
      starRating,
      propertyType,
      contact,
      isAccepted,
      localId,
      hotelEmail,
      generalManagerContact,
      salesManagerContact,
      images,
    };

    const savedHotel = await hotelModel.create(hotelData);

    return res.status(201).json({
      message: `Your request is accepted. Kindly note your hotel id (${savedHotel.hotelId}) for future purposes.`,
      status: true,
      data: savedHotel,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const updatePolicies = async (req, res) => {
  const { hotelId } = req.params;
  const { policies } = req.body;

  if (!policies || !Array.isArray(policies)) {
    return res.status(400).json({ message: 'Policies must be provided as an array' });
  }

  try {
    const updatedHotel = await hotelModel.findOneAndUpdate(
      { hotelId },
      { $set: { policies } },
      { new: true }
    );

    if (!updatedHotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    return res.json({ message: 'Policies updated successfully', policies: updatedHotel.policies });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
//=================================Count of hotel=============================
const getCount = async function (req, res) {
  try {
    const count = await hotelModel.countDocuments({ isAccepted: true });
    res.json(count);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//==========================================================================

const getCountPendingHotels = async function (req, res) {
  try {
    const count = await hotelModel.countDocuments({ isAccepted: false });
    console.log("Count of pending hotels:", count);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error while getting count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//=================================update hotel images=================
const updateHotelImage = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files were uploaded" });
    }

    // Extract image locations
    const images = req.files.map((file) => file.location);

    // Check if the hotel exists
    const updatedHotel = await hotelModel.findById(hotelId);
    if (!updatedHotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Update images
    updatedHotel.images = [...updatedHotel.images, ...images]; // Append new images
    await updatedHotel.save();

    res.status(200).json({
      message: "Hotel images updated successfully",
      data: updatedHotel,
    });
  } catch (error) {
    console.error("Error updating hotel images:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating hotel images" });
  }
};

//======================================Delete hotel images=======================
const deleteHotelImages = async function (req, res) {
  const { hotelId } = req.params;
  let { imageUrl } = req.query;

  if (!imageUrl) {
    return res.status(400).json({ message: "Image URL is required" });
  }

  try {
    // Use $pull to remove the image URL from the images array
    const hotel = await hotelModel.findOneAndUpdate(
      { hotelId: hotelId },
      { $pull: { images: imageUrl } },
      { new: true }
    );

    if (!hotel) {
      return res
        .status(404)
        .json({ message: "Hotel not found" });
    }

    res.status(200).json({
      message: "Image URL deleted successfully",
      hotel
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//==================================UpdateHotel================================
const UpdateHotelStatus = async function (req, res) {
  const { hotelId } = req.params;
  const { isAccepted, onFront } = req.body;

  try {
    const updateDetails = await hotelModel.findOneAndUpdate(
      { hotelId }, // Same as hotelId: hotelId
      {
        $set: {
          isAccepted: isAccepted,
          onFront: onFront,
        },
      },
      { new: true },
    );

    if (!updateDetails) {
      return res.status(404).json({ error: "Hotel not found." });
    }

    // Send notification email
    await sendCustomEmail({
      email: updateDetails.hotelEmail,
      subject: "Hotel Approval Confirmation",
      message: `Your hotel with ID ${updateDetails.hotelId} has been ${
        isAccepted ? "approved" : "rejected"
      }.`,
      link: process.env.FRONTEND_URL,
    });

    res.json({ success: true, data: updateDetails });
  } catch (error) {
    console.error("Error updating hotel:", error);
    res.status(500).json({ error: "Failed to update hotel details." });
  }
};

//================================update hotel info =================================================
const UpdateHotelInfo = async function (req, res) {
  const { hotelId } = req.params;
  const {
    isAccepted,
    onFront,
    hotelName,
    hotelOwnerName,
    hotelEmail,
    localId,
    description,
    customerWelcomeNote,
    generalManagerContact,
    salesManagerContact,
    landmark,
    pinCode,
    hotelCategory,
    propertyType,
    starRating,
    city,
    state,
  } = req.body;

  try {
    const updateDetails = await hotelModel.findOneAndUpdate(
      { hotelId: hotelId }, // Use hotelId for querying
      {
        $set: {
          isAccepted: isAccepted,
          onFront: onFront,
          hotelName: hotelName,
          hotelOwnerName: hotelOwnerName,
          hotelEmail: hotelEmail,
          generalManagerContact: generalManagerContact,
          salesManagerContact: salesManagerContact,
          landmark: landmark,
          pinCode: pinCode,
          hotelCategory: hotelCategory,
          propertyType: propertyType,
          starRating: starRating,
          city: city,
          state: state,
          localId: localId,
          description: description,
          customerWelcomeNote: customerWelcomeNote,
        },
      }, // Update fields
      { new: true }, // To return the updated document
    );

    res.json(updateDetails);
  } catch (error) {
    console.error("Error updating hotel:", error);
    res.status(500).json({ error: "Failed to update hotel details." });
  }
};

//=============================get hotel by amenities===========================//
const getByQuery = async (req, res) => {
  const {
    amenities,
    bedTypes,
    starRating,
    propertyType,
    hotelOwnerName,
    hotelEmail,
    roomTypes,
  } = req.query;

  // Check if there are no query parameters
  if (
    !amenities &&
    !bedTypes &&
    !starRating &&
    !propertyType &&
    !hotelOwnerName &&
    !hotelEmail &&
    !roomTypes
  ) {
    // Fetch all data where isAccepted is true using cursor stream
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    const cursor = hotelModel.find({ isAccepted: true }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    return res.end();
  }

  const queryParameters = [
    { key: "amenities", value: amenities },
    { key: "roomDetails.bedTypes", value: bedTypes },
    { key: "starRating", value: starRating },
    { key: "propertyType", value: propertyType },
    { key: "hotelOwnerName", value: hotelOwnerName },
    { key: "hotelEmail", value: hotelEmail },
    { key: "roomDetails.type", value: roomTypes },
  ];

  let fetchedData = [];

  for (const param of queryParameters) {
    if (param.value) {
      const query = {};

      if (param.key.includes("roomDetails")) {
        const elemMatchQuery = {};
        if (param.key.endsWith("countRooms")) {
          // Check countRooms greater than 0
          elemMatchQuery[param.key.split(".")[1]] = { $gt: 0 };
        } else {
          elemMatchQuery[param.key.split(".")[1]] = Array.isArray(param.value)
            ? { $in: param.value.map((val) => new RegExp(val, "i")) }
            : new RegExp(param.value, "i");
        }

        query["roomDetails"] = { $elemMatch: elemMatchQuery };
      } else {
        query[param.key] = Array.isArray(param.value)
          ? { $in: param.value.map((val) => new RegExp(val, "i")) }
          : new RegExp(param.value, "i");
      }

      // Add check for isAccepted
      query["isAccepted"] = true;

      // Use cursor for streaming
      res.setHeader('Content-Type', 'application/json');
      res.write('[');
      let first = true;
      const cursor = hotelModel.find(query).cursor();
      for await (const hotel of cursor) {
        if (!first) res.write(',');
        res.write(JSON.stringify(hotel));
        first = false;
        fetchedData.push(hotel);
      }
      res.write(']');
      return res.end();
    }
  }

  res.json(fetchedData);
};

//================================================================================================

const getAllHotels = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, countRooms } = req.query;
    const requestedRooms = parseInt(countRooms) || 1;

    // Fetch all required data in parallel
    const [monthlyData, gstData, allBookings] = await Promise.all([
      monthly.find().lean(),
      gstModel.findOne({ type: "Hotel" }).lean(),
      // Only fetch bookings if dates are provided
      (checkInDate && checkOutDate) ? bookingsModel.find({
        bookingStatus: { $nin: ["Cancelled", "Failed"] },
        $or: [
          {
            checkInDate: { $lte: checkOutDate },
            checkOutDate: { $gte: checkInDate }
          }
        ]
      }).select('hotelId numRooms roomDetails checkInDate checkOutDate').lean() : Promise.resolve([])
    ]);

    // GST calculation helper
    const calculateGST = (price) => {
      if (!gstData) return { gstPercent: 0, gstAmount: 0 };
      
      let gstPercent = 0;
      if (price <= gstData.gstMinThreshold) {
        gstPercent = 0;
      } else if (price <= gstData.gstMaxThreshold) {
        gstPercent = 12;
      } else {
        gstPercent = gstData.gstPrice || 18;
      }
      
      const gstAmount = Math.round((price * gstPercent) / 100);
      return { gstPercent, gstAmount };
    };

    // Create a map of hotelId -> booked rooms
    const bookedRoomsMap = {};
    if (checkInDate && checkOutDate) {
      allBookings.forEach(booking => {
        const hotelId = booking.hotelId;
        if (!bookedRoomsMap[hotelId]) {
          bookedRoomsMap[hotelId] = { totalBooked: 0, roomWise: {} };
        }
        bookedRoomsMap[hotelId].totalBooked += booking.numRooms || 0;
        
        if (booking.roomDetails && Array.isArray(booking.roomDetails)) {
          booking.roomDetails.forEach(rd => {
            if (rd.roomId) {
              if (!bookedRoomsMap[hotelId].roomWise[rd.roomId]) {
                bookedRoomsMap[hotelId].roomWise[rd.roomId] = 0;
              }
              bookedRoomsMap[hotelId].roomWise[rd.roomId] += 1;
            }
          });
        }
      });
    }

    // Process hotels with streaming
    res.setHeader('Content-Type', 'application/json');
    res.write('{"success":true,"data":[');
    let first = true;
    
    const cursor = hotelModel.find().sort({ isAccepted: 1 }).cursor();
    
    for await (const hotel of cursor) {
      const hotelId = hotel.hotelId;
      const bookedInfo = bookedRoomsMap[hotelId] || { totalBooked: 0, roomWise: {} };
      
      let totalRooms = 0;
      let availableRooms = 0;
      let lowestPrice = Infinity;
      let lowestPriceWithGST = Infinity;
      
      // Process each room
      const processedRooms = (hotel.rooms || []).map(room => {
        const roomId = room.roomId || room._id?.toString();
        const roomCount = room.countRooms || 0;
        const bookedCount = bookedInfo.roomWise[roomId] || 0;
        const available = Math.max(0, roomCount - bookedCount);
        
        totalRooms += roomCount;
        availableRooms += available;
        
        // Get the price - check for monthly special pricing first
        let finalPrice = room.price || 0;
        let isSpecialPrice = false;
        let monthlyPriceDetails = null;
        
        if (checkInDate && checkOutDate && monthlyData.length > 0) {
          const matchingMonthlyEntry = monthlyData.find((data) => {
            // Check if monthly price period overlaps with booking dates
            return (
              data.hotelId === hotelId &&
              data.roomId === roomId &&
              data.startDate <= checkOutDate &&
              data.endDate >= checkInDate
            );
          });
          
          if (matchingMonthlyEntry) {
            finalPrice = matchingMonthlyEntry.monthPrice;
            isSpecialPrice = true;
            monthlyPriceDetails = {
              monthPrice: matchingMonthlyEntry.monthPrice,
              startDate: matchingMonthlyEntry.startDate,
              endDate: matchingMonthlyEntry.endDate,
              validForBooking: true
            };
          }
        }
        
        // Apply offer discount if any
        let offerPrice = finalPrice;
        let offerApplied = false;
        if (room.isOffer && room.offerPriceLess > 0) {
          const offerExpDate = room.offerExp ? new Date(room.offerExp) : null;
          if (!offerExpDate || offerExpDate >= new Date()) {
            offerPrice = finalPrice - room.offerPriceLess;
            offerApplied = true;
          }
        }
        
        // Calculate GST
        const { gstPercent, gstAmount } = calculateGST(offerPrice);
        const priceWithGST = offerPrice + gstAmount;
        
        // Track lowest price
        if (available > 0 && offerPrice < lowestPrice) {
          lowestPrice = offerPrice;
          lowestPriceWithGST = priceWithGST;
        }
        
        return {
          ...room,
          originalPrice: room.price,
          finalPrice: offerPrice,
          isSpecialPrice,
          offerApplied,
          monthlyPriceDetails,
          gstPercent,
          gstAmount,
          priceWithGST,
          totalCount: roomCount,
          bookedCount,
          availableCount: available,
          isAvailable: available > 0
        };
      });
      
      // Determine hotel availability status
      const isFullyBooked = availableRooms < requestedRooms;
      const availabilityStatus = isFullyBooked ? "Fully Booked" : "Available";
      
      const processedHotel = {
        ...hotel.toObject(),
        rooms: processedRooms,
        availability: checkInDate && checkOutDate ? {
          status: availabilityStatus,
          totalRooms,
          availableRooms,
          bookedRooms: totalRooms - availableRooms,
          requestedRooms,
          canBook: !isFullyBooked
        } : null,
        pricing: {
          startingFrom: lowestPrice === Infinity ? 0 : lowestPrice,
          startingFromWithGST: lowestPriceWithGST === Infinity ? 0 : lowestPriceWithGST,
          gstApplicable: gstData ? true : false,
          gstNote: gstData ? `GST @${gstData.gstPrice}% applicable on rooms above ₹${gstData.gstMaxThreshold}` : null
        }
      };
      
      if (!first) res.write(',');
      res.write(JSON.stringify(processedHotel));
      first = false;
    }
    
    res.write('],"gstInfo":');
    res.write(JSON.stringify(gstData ? {
      minThreshold: gstData.gstMinThreshold,
      maxThreshold: gstData.gstMaxThreshold,
      defaultRate: gstData.gstPrice
    } : null));
    res.write('}');
    res.end();
  } catch (error) {
    console.error("Error in getAllHotels:", error);
    res.status(500).json({ success: false, error: "Internal Server Error", message: error.message });
  }
};

//===========================get hotels====================================================//
const getHotels = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    const cursor = hotelModel.find({ onFront: false }).sort({ createdAt: -1 }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//======================================get offers==========================================//
const setOnFront = async (req, res) => {
  try {
    const { checkInDate, checkOutDate } = req.query;
    const monthlyData = await monthly.find().lean();

    // Get the current date in YYYY-MM-DD format (IST) or use provided checkInDate
    const currentDate = new Date();
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // UTC+5:30
    const currentDateIST = new Date(currentDate.getTime() + IST_OFFSET);
    const formattedCurrentDate = checkInDate || currentDateIST.toISOString().split("T")[0];
    const formattedCheckOutDate = checkOutDate || formattedCurrentDate;

    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    
    const cursor = hotelModel.find({ onFront: true }).sort({ createdAt: -1 }).cursor();
    
    for await (const hotel of cursor) {
      // Process rooms with monthly pricing
      hotel.rooms = hotel.rooms.map((room) => {
        const matchingMonthlyEntry = monthlyData.find((data) => {
          // Check if monthly price period overlaps with booking dates
          return (
            data.hotelId === hotel.hotelId.toString() &&
            data.roomId === room.roomId &&
            data.startDate <= formattedCheckOutDate &&
            data.endDate >= formattedCurrentDate
          );
        });

        if (matchingMonthlyEntry) {
          return {
            ...room,
            originalPrice: room.price,
            price: matchingMonthlyEntry.monthPrice,
            monthlyPriceDetails: {
              monthPrice: matchingMonthlyEntry.monthPrice,
              startDate: matchingMonthlyEntry.startDate,
              endDate: matchingMonthlyEntry.endDate,
              validForBooking: true
            }
          };
        }
        
        return room;
      });

      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

//============================get by city============================================//
const getCity = async function (req, res) {
  const { city } = req.query;
  const searchQuery = {};

  if (city) {
    searchQuery.city = { $regex: new RegExp(city, "i") };
  }

  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    const cursor = hotelModel.find(searchQuery).sort({ createdAt: -1 }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//=================================================================================

const getHotelsById = async (req, res) => {
  try {
    const hotelId = req.params.hotelId;
    const { checkInDate, checkOutDate, countRooms } = req.query;
    const requestedRooms = parseInt(countRooms) || 1;

    // Fetch hotel data
    const hotel = await hotelModel.findOne({ hotelId }).lean();
    
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    // Fetch all required data in parallel
    const [monthlyData, gstData, allBookings] = await Promise.all([
      monthly.find().lean(),
      gstModel.findOne({ type: "Hotel" }).lean(),
      // Only fetch bookings if dates are provided
      (checkInDate && checkOutDate) ? bookingsModel.find({
        hotelId: hotelId,
        bookingStatus: { $nin: ["Cancelled", "Failed"] },
        $or: [
          {
            checkInDate: { $lte: checkOutDate },
            checkOutDate: { $gte: checkInDate }
          }
        ]
      }).select('hotelId numRooms roomDetails checkInDate checkOutDate').lean() : Promise.resolve([])
    ]);

    // GST calculation helper
    const calculateGST = (price) => {
      if (!gstData) return { gstPercent: 0, gstAmount: 0 };
      
      let gstPercent = 0;
      if (price <= gstData.gstMinThreshold) {
        gstPercent = 0; // No GST for very low prices
      } else if (price <= gstData.gstMaxThreshold) {
        gstPercent = 12; // 12% GST for mid-range
      } else {
        gstPercent = gstData.gstPrice || 18; // 18% GST for high prices
      }
      
      const gstAmount = Math.round((price * gstPercent) / 100);
      return { gstPercent, gstAmount };
    };

    // Create a map of booked rooms
    const bookedRoomsMap = {};
    if (checkInDate && checkOutDate) {
      allBookings.forEach(booking => {
        if (booking.roomDetails && Array.isArray(booking.roomDetails)) {
          booking.roomDetails.forEach(rd => {
            if (rd.roomId) {
              if (!bookedRoomsMap[rd.roomId]) {
                bookedRoomsMap[rd.roomId] = 0;
              }
              bookedRoomsMap[rd.roomId] += 1;
            }
          });
        }
      });
    }

    // Process rooms with pricing, offers, GST, and availability
    let totalRooms = 0;
    let availableRooms = 0;
    let lowestPrice = Infinity;
    let lowestPriceWithGST = Infinity;

    const processedRooms = (hotel.rooms || []).map(room => {
      const roomId = room.roomId || room._id?.toString();
      const roomCount = room.countRooms || 0;
      const bookedCount = bookedRoomsMap[roomId] || 0;
      const available = Math.max(0, roomCount - bookedCount);
      
      totalRooms += roomCount;
      availableRooms += available;
      
      // Get the price - check for monthly special pricing first
      let finalPrice = room.price || 0;
      let isSpecialPrice = false;
      let monthlyPriceDetails = null;
      
      if (checkInDate && checkOutDate && monthlyData.length > 0) {
        const matchingMonthlyEntry = monthlyData.find((data) => {
          // Check if monthly price period overlaps with booking dates
          return (
            data.hotelId === hotelId &&
            data.roomId === roomId &&
            data.startDate <= checkOutDate &&
            data.endDate >= checkInDate
          );
        });
        
        if (matchingMonthlyEntry) {
          finalPrice = matchingMonthlyEntry.monthPrice;
          isSpecialPrice = true;
          monthlyPriceDetails = {
            monthPrice: matchingMonthlyEntry.monthPrice,
            startDate: matchingMonthlyEntry.startDate,
            endDate: matchingMonthlyEntry.endDate,
            validForBooking: true
          };
        }
      }
      
      // Apply offer discount if any
      let offerPrice = finalPrice;
      let offerApplied = false;
      if (room.isOffer && room.offerPriceLess > 0) {
        const offerExpDate = room.offerExp ? new Date(room.offerExp) : null;
        if (!offerExpDate || offerExpDate >= new Date()) {
          offerPrice = finalPrice - room.offerPriceLess;
          offerApplied = true;
        }
      }
      
      // Calculate GST
      const { gstPercent, gstAmount } = calculateGST(offerPrice);
      const priceWithGST = offerPrice + gstAmount;
      
      // Track lowest price
      if (available > 0 && offerPrice < lowestPrice) {
        lowestPrice = offerPrice;
        lowestPriceWithGST = priceWithGST;
      }
      
      return {
        ...room,
        originalPrice: room.price,
        finalPrice: offerPrice,
        isSpecialPrice,
        offerApplied,
        monthlyPriceDetails,
        gstPercent,
        gstAmount,
        priceWithGST,
        totalCount: roomCount,
        bookedCount,
        availableCount: available,
        isAvailable: available > 0
      };
    });

    // Determine hotel availability status
    const isFullyBooked = availableRooms < requestedRooms;
    const availabilityStatus = isFullyBooked ? "Fully Booked" : "Available";

    // Build frontend-ready response structure as requested
    const formatCurrency = (val) => {
      try {
        return Number(val).toLocaleString('en-IN');
      } catch (e) {
        return String(val);
      }
    };

    const mappedRooms = processedRooms.map(r => {
      const id = r.roomId || r._id || r.roomId || r.id || (r._id && String(r._id));
      const name = r.name || r.roomName || r.type || (r.type && String(r.type)) || 'Room';
      const bedType = r.bedTypes || r.bedType || '';
      const images = r.images || [];
      const total = r.totalCount != null ? r.totalCount : (r.countRooms != null ? r.countRooms : 0);
      const available = r.availableCount != null ? r.availableCount : (r.countRooms != null ? Math.max(0, (r.countRooms || 0) - (r.bookedCount || 0)) : 0);
      const basePrice = r.originalPrice != null ? r.originalPrice : (r.price || 0);
      const taxPercent = r.gstPercent != null ? r.gstPercent : (gstData ? gstData.gstPrice : 0);
      const taxAmount = r.gstAmount != null ? r.gstAmount : Math.round((basePrice * taxPercent) / 100);
      const finalPrice = r.priceWithGST != null ? r.priceWithGST : (basePrice + taxAmount);

      return {
        id: id,
        name: name,
        type: r.type || r.roomType || '',
        bedType: bedType,
        images: images,
        inventory: {
          total: total,
          available: available,
          isSoldOut: available <= 0
        },
        pricing: {
          basePrice: Number(basePrice) || 0,
          taxPercent: Number(taxPercent) || 0,
          taxAmount: Number(taxAmount) || 0,
          finalPrice: Number(finalPrice) || 0,
          currency: '₹',
          displayPrice: `₹ ${formatCurrency(Number(finalPrice) || 0)}`
        },
        features: {
          isOffer: !!r.isOffer || !!r.offerApplied,
          offerText: r.offerText || r.offerExp || ''
        }
      };
    });

    // Map amenities to array of strings
    let mappedAmenities = [];
    if (Array.isArray(hotel.amenities)) {
      mappedAmenities = hotel.amenities.map(a => {
        if (!a) return null;
        if (typeof a === 'string') return a;
        if (a.name) return a.name;
        if (a.amenities) return a.amenities;
        return Object.values(a).join(' ');
      }).filter(Boolean);
    }

    // Map policies
    const policiesObj = {
      checkIn: '12:00 PM',
      checkOut: '11:00 AM',
      rules: [],
      restrictions: {
        petsAllowed: false,
        smokingAllowed: false,
        alcoholAllowed: false
      },
      cancellationText: ''
    };

    if (hotel.policies) {
      // If policies is an object with keys, try to map directly
      if (!Array.isArray(hotel.policies) && typeof hotel.policies === 'object') {
        policiesObj.checkIn = hotel.policies.checkIn || policiesObj.checkIn;
        policiesObj.checkOut = hotel.policies.checkOut || policiesObj.checkOut;
        policiesObj.rules = hotel.policies.rules || policiesObj.rules;
        policiesObj.restrictions = hotel.policies.restrictions || policiesObj.restrictions;
        policiesObj.cancellationText = hotel.policies.cancellationText || hotel.policies.cancellationText || policiesObj.cancellationText;
      } else if (Array.isArray(hotel.policies)) {
        // If policies is an array of objects, try to extract known keys
        hotel.policies.forEach(p => {
          if (!p || typeof p !== 'object') return;
          if (p.checkIn) policiesObj.checkIn = p.checkIn;
          if (p.checkOut) policiesObj.checkOut = p.checkOut;
          if (Array.isArray(p.rules)) policiesObj.rules = p.rules;
          if (p.restrictions) policiesObj.restrictions = p.restrictions;
          if (p.cancellationText) policiesObj.cancellationText = p.cancellationText;
        });
      }
    }

    const responsePayload = {
      _id: hotel._id,
      basicInfo: {
        name: hotel.hotelName || hotel.basicInfo?.name || '',
        owner: hotel.hotelOwnerName || hotel.basicInfo?.owner || '',
        description: hotel.description || hotel.basicInfo?.description || '',
        category: hotel.hotelCategory || hotel.basicInfo?.category || '',
        starRating: hotel.starRating != null ? Number(hotel.starRating) : (hotel.rating || 0),
        images: hotel.images || [],
        location: {
          address: hotel.landmark || hotel.location?.address || '',
          city: hotel.city || hotel.location?.city || '',
          state: hotel.state || hotel.location?.state || '',
          pinCode: hotel.pinCode || hotel.location?.pinCode || '',
          coordinates: {
            lat: hotel.latitude || (hotel.location && hotel.location.coordinates && hotel.location.coordinates.lat) || null,
            lng: hotel.longitude || (hotel.location && hotel.location.coordinates && hotel.location.coordinates.lng) || null
          },
          googleMapLink: hotel.googleMapLink || ''
        },
        contacts: {
          phone: hotel.contact || hotel.basicInfo?.contacts?.phone || '',
          email: hotel.hotelEmail || hotel.basicInfo?.contacts?.email || '',
          generalManager: hotel.generalManagerContact || '',
          salesManager: hotel.salesManagerContact || ''
        }
      },
      pricingOverview: {
        lowestBasePrice: lowestPrice === Infinity ? 0 : Math.round(lowestPrice),
        lowestPriceWithTax: lowestPriceWithGST === Infinity ? 0 : Math.round(lowestPriceWithGST),
        currencySymbol: '₹',
        displayString: `Starts from ₹ ${formatCurrency(lowestPrice === Infinity ? 0 : Math.round(lowestPrice))}`,
        taxNote: gstData ? `GST ${gstData.gstPrice}% applicable (Included in final price)` : ''
      },
      rooms: mappedRooms,
      policies: policiesObj,
      amenities: mappedAmenities,
      gstConfig: gstData ? {
        enabled: true,
        rate: gstData.gstPrice,
        minLimit: gstData.gstMinThreshold,
        maxLimit: gstData.gstMaxThreshold
      } : { enabled: false, rate: 0, minLimit: 0, maxLimit: 0 }
    };

    res.json({ success: true, data: responsePayload });
  } catch (error) {
    console.error("Error in getHotelsById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//==================================================================================
const deleteHotelById = async function (req, res) {
  const { hotelId } = req.params;
  const deletedData = await hotelModel.findOneAndDelete({ hotelId: hotelId });
  res.status(200).json({ message: "deleted" });
};
//===========================================================
const getHotelsByLocalID = async (req, res) => {
  const { localId } = req.params;

  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    const cursor = hotelModel.find({ "location.localId": localId }).sort({ createdAt: -1 }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
};

//============================================hotels by filter city,state,landmark=================================================
const getHotelsByFilters = async (req, res) => {
  try {
    const {
      search,
      starRating,
      propertyType,
      localId,
      latitude,
      longitude,
      countRooms,
      hotelCategory,
      type,
      bedTypes,
      amenities,
      unmarriedCouplesAllowed,
      minPrice,
      maxPrice,
      checkInDate,
      checkOutDate,
      page = 1,
      limit = 10,
      guests,
    } = req.query;

    // Normalize and trim incoming string parameters to avoid mismatches caused by
    // leading/trailing spaces (e.g., "Patna " should match "Patna").
    const trimString = (v) => (v === undefined || v === null ? v : String(v).trim());
    const searchTrim = trimString(search);
    const propertyTypeTrim = trimString(propertyType);
    const hotelCategoryTrim = trimString(hotelCategory);
    const typeTrim = trimString(type);
    const bedTypesTrim = trimString(bedTypes);
    const amenitiesTrim = trimString(amenities);
    const unmarriedCouplesAllowedTrim = trimString(unmarriedCouplesAllowed);
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const requestedRooms = parseInt(countRooms) || 1;

    let filters = { isAccepted: true };

    // If no query filters are provided at all, return an empty array
    const hasAnyFilter = [
      searchTrim, starRating, propertyTypeTrim, localId, latitude, longitude,
      countRooms, hotelCategoryTrim, typeTrim, bedTypesTrim, amenitiesTrim,
      unmarriedCouplesAllowedTrim, minPrice, maxPrice, checkInDate, checkOutDate,
    ].some((v) => v !== undefined && v !== null && String(v).trim() !== "");

    if (!hasAnyFilter) {
      return res.status(200).json({ success: true, data: [], total: 0, page: pageNum, limit: limitNum });
    }

    // Build search filters
    if (searchTrim) {
      const searchPattern = new RegExp(searchTrim, "i");
      filters.$or = [
        { city: { $regex: searchPattern } },
        { state: { $regex: searchPattern } },
        { landmark: { $regex: searchPattern } },
        { hotelName: { $regex: searchPattern } },
      ];
    }
    if (starRating) filters.starRating = starRating;
    if (propertyTypeTrim) filters.propertyType = { $regex: new RegExp(propertyTypeTrim, "i") };
    if (localId) filters.localId = localId;
    if (hotelCategoryTrim) filters.hotelCategory = { $regex: new RegExp(hotelCategoryTrim, "i") };
    if (latitude) filters.latitude = latitude;
    if (longitude) filters.longitude = longitude;
    if (typeTrim) filters["rooms.type"] = { $regex: new RegExp(typeTrim, "i") };
    if (bedTypesTrim) filters["rooms.bedTypes"] = { $regex: new RegExp(bedTypesTrim, "i") };
    if (amenitiesTrim) {
      const amenArr = amenitiesTrim.split(",").map(a => a.trim()).filter(a => a !== "");
      if (amenArr.length > 0) filters["amenities.amenities"] = { $in: amenArr };
    }
    if (unmarriedCouplesAllowedTrim) filters["policies.unmarriedCouplesAllowed"] = unmarriedCouplesAllowedTrim;

    // Fetch all required data in parallel for performance
    const [monthlyData, gstData, allBookings, allHotels] = await Promise.all([
      monthly.find().lean(),
      gstModel.findOne({ type: "Hotel" }).lean(),
      // Only fetch bookings if dates are provided
      (checkInDate && checkOutDate) ? bookingsModel.find({
        bookingStatus: { $nin: ["Cancelled", "Failed"] },
        $or: [
          {
            checkInDate: { $lte: checkOutDate },
            checkOutDate: { $gte: checkInDate }
          }
        ]
      }).select('hotelId numRooms roomDetails checkInDate checkOutDate').lean() : Promise.resolve([]),
      hotelModel.find(filters).lean()
    ]);

    // GST calculation helper
    const calculateGST = (price) => {
      if (!gstData) return { gstPercent: 0, gstAmount: 0 };
      
      let gstPercent = 0;
      if (price <= gstData.gstMinThreshold) {
        gstPercent = 0; // No GST for very low prices
      } else if (price <= gstData.gstMaxThreshold) {
        gstPercent = 12; // 12% GST for mid-range
      } else {
        gstPercent = gstData.gstPrice || 18; // 18% GST for high prices
      }
      
      const gstAmount = Math.round((price * gstPercent) / 100);
      return { gstPercent, gstAmount };
    };

    // Create a map of hotelId -> booked rooms count per room type
    const bookedRoomsMap = {};
    if (checkInDate && checkOutDate) {
      allBookings.forEach(booking => {
        const hotelId = booking.hotelId;
        if (!bookedRoomsMap[hotelId]) {
          bookedRoomsMap[hotelId] = { totalBooked: 0, roomWise: {} };
        }
        bookedRoomsMap[hotelId].totalBooked += booking.numRooms || 0;
        
        // Track room-wise bookings
        if (booking.roomDetails && Array.isArray(booking.roomDetails)) {
          booking.roomDetails.forEach(rd => {
            if (rd.roomId) {
              if (!bookedRoomsMap[hotelId].roomWise[rd.roomId]) {
                bookedRoomsMap[hotelId].roomWise[rd.roomId] = 0;
              }
              bookedRoomsMap[hotelId].roomWise[rd.roomId] += 1;
            }
          });
        }
      });
    }

    // Process hotels with availability, pricing, and GST
    const processedHotels = [];
    
    for (const hotel of allHotels) {
      const hotelId = hotel.hotelId;
      const bookedInfo = bookedRoomsMap[hotelId] || { totalBooked: 0, roomWise: {} };
      
      // Calculate total rooms and available rooms
      let totalRooms = 0;
      let availableRooms = 0;
      let lowestPrice = Infinity;
      let lowestPriceWithGST = Infinity;
      
      // Process each room
      const processedRooms = (hotel.rooms || []).map(room => {
        const roomId = room.roomId || room._id?.toString();
        const roomCount = room.countRooms || 0;
        const bookedCount = bookedInfo.roomWise[roomId] || 0;
        const available = Math.max(0, roomCount - bookedCount);
        
        totalRooms += roomCount;
        availableRooms += available;
        
        // Get the price - check for monthly special pricing first
        let finalPrice = room.price || 0;
        let isSpecialPrice = false;
        let monthlyPriceDetails = null;
        
        if (checkInDate && checkOutDate && monthlyData.length > 0) {
          const matchingMonthlyEntry = monthlyData.find((data) => {
            // Check if monthly price period overlaps with booking dates
            return (
              data.hotelId === hotelId &&
              data.roomId === roomId &&
              data.startDate <= checkOutDate &&
              data.endDate >= checkInDate
            );
          });
          
          if (matchingMonthlyEntry) {
            finalPrice = matchingMonthlyEntry.monthPrice;
            isSpecialPrice = true;
            monthlyPriceDetails = {
              monthPrice: matchingMonthlyEntry.monthPrice,
              startDate: matchingMonthlyEntry.startDate,
              endDate: matchingMonthlyEntry.endDate,
              validForBooking: true
            };
          }
        }
        
        // Apply offer discount if any
        let offerPrice = finalPrice;
        if (room.isOffer && room.offerPriceLess > 0) {
          const offerExpDate = room.offerExp ? new Date(room.offerExp) : null;
          if (!offerExpDate || offerExpDate >= new Date()) {
            offerPrice = finalPrice - room.offerPriceLess;
          }
        }
        
        // Calculate GST
        const { gstPercent, gstAmount } = calculateGST(offerPrice);
        const priceWithGST = offerPrice + gstAmount;
        
        // Track lowest price
        if (available > 0 && offerPrice < lowestPrice) {
          lowestPrice = offerPrice;
          lowestPriceWithGST = priceWithGST;
        }
        
        return {
          ...room,
          originalPrice: room.price,
          finalPrice: offerPrice,
          isSpecialPrice,
          monthlyPriceDetails,
          gstPercent,
          gstAmount,
          priceWithGST,
          totalCount: roomCount,
          bookedCount,
          availableCount: available,
          isAvailable: available > 0
        };
      });
      
      // Determine hotel availability status
      const isFullyBooked = availableRooms < requestedRooms;
      const availabilityStatus = isFullyBooked ? "Fully Booked" : "Available";
      
      // Apply price filters after calculating final prices
      if (minPrice || maxPrice) {
        const minP = parseFloat(minPrice) || 0;
        const maxP = parseFloat(maxPrice) || Infinity;
        
        // Check if any room falls within price range
        const hasRoomInRange = processedRooms.some(room => 
          room.finalPrice >= minP && room.finalPrice <= maxP && room.availableCount > 0
        );
        
        if (!hasRoomInRange) continue; // Skip this hotel
      }
      
      // Apply countRooms filter
      if (countRooms && availableRooms < requestedRooms) {
        // Still include hotel but mark as fully booked
      }
      
      processedHotels.push({
        ...hotel,
        rooms: processedRooms,
        availability: {
          status: availabilityStatus,
          totalRooms,
          availableRooms,
          bookedRooms: totalRooms - availableRooms,
          requestedRooms,
          canBook: !isFullyBooked
        },
        pricing: {
          startingFrom: lowestPrice === Infinity ? 0 : lowestPrice,
          startingFromWithGST: lowestPriceWithGST === Infinity ? 0 : lowestPriceWithGST,
          gstApplicable: gstData ? true : false,
          gstNote: gstData ? `GST @${gstData.gstPrice}% applicable on rooms above ₹${gstData.gstMaxThreshold}` : null
        }
      });
    }
    
    // Sort: Available hotels first, then by price
    processedHotels.sort((a, b) => {
      // Available hotels come first
      if (a.availability.canBook && !b.availability.canBook) return -1;
      if (!a.availability.canBook && b.availability.canBook) return 1;
      // Then sort by starting price
      return a.pricing.startingFrom - b.pricing.startingFrom;
    });
    
    // Apply pagination
    const total = processedHotels.length;
    const paginatedHotels = processedHotels.slice(skip, skip + limitNum);
    
    return res.status(200).json({
      success: true,
      data: paginatedHotels,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      filters: {
        checkInDate: checkInDate || null,
        checkOutDate: checkOutDate || null,
        requestedRooms,
        guests: guests || null
      },
      gstInfo: gstData ? {
        minThreshold: gstData.gstMinThreshold,
        maxThreshold: gstData.gstMaxThreshold,
        defaultRate: gstData.gstPrice
      } : null
    });

  } catch (error) {
    console.error("Error in getHotelsByFilters:", error);
    res.status(500).json({ success: false, error: "Internal Server Error", message: error.message });
  }
};

const getHotelsState = async function (req, res) {
  try {
    const uniqueStatesSet = new Set();
    const cursor = hotelModel.find().select('state').cursor();
    
    for await (const hotel of cursor) {
      if (hotel.state) {
        uniqueStatesSet.add(hotel.state);
      }
    }

    res.json(Array.from(uniqueStatesSet));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getHotelsCityByState = async function (req, res) {
  try {
    const { state } = req.query;

    if (!state) {
      return res.status(400).json({ error: "State parameter is missing" });
    }

    const uniqueCitiesSet = new Set();
    const cursor = hotelModel.find({ state }).select('city').cursor();
    
    for await (const hotel of cursor) {
      if (hotel.city) {
        uniqueCitiesSet.add(hotel.city);
      }
    }

    res.json(Array.from(uniqueCitiesSet));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getHotelsCity = async (req, res) => {
  try {
    const uniqueCities = new Set();
    const cursor = hotelModel.find({ isAccepted: true }).select('city').cursor();
    
    for await (const hotel of cursor) {
      if (hotel.city) {
        uniqueCities.add(hotel.city);
      }
    }
    
    res.status(200).json(Array.from(uniqueCities));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//=================================Update price monthly============================================
const monthlyPrice = async function (req, res) {
  try {
    const rooms = await month.find();
    const currentDate = new Date();
    const hotels = await hotelModel.find();

    for (const room of rooms) {
      for (const hotel of hotels) {
        for (const roomDetails of hotel.roomDetails) {
          if (String(room.roomId) === String(roomDetails._id)) {
            const roomDate = room.monthDate;

            if (roomDate <= currentDate) {
              roomDetails.price += room.monthPrice;
              await hotel.save();
            } else {
              return res.status(400).json({ error: "Date not matched." });
            }
          }
        }
      }
    }

    res.status(200).json({ message: "Monthly prices updated successfully." });
  } catch (error) {
    console.error("Error in monthlyPrice:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

cron.schedule("0 0 1 * *", async () => {
  await monthlyPrice();
});
// The first 0 represents the minute (00).
// The second 0 represents the hour (00).
// The 1 in the third position represents the day of the month (1st).
// The * in the fourth and fifth positions represents any month and any day of the week.

//============================Auto-cancel pending bookings after 2 hours=======================
const autoCancelPendingBookings = async () => {
  try {
    const currentDate = new Date();
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // UTC+5:30
    const currentDateIST = new Date(currentDate.getTime() + IST_OFFSET);
    
    // Calculate 12 hours ago
    const twelveHoursAgo = new Date(currentDateIST.getTime() - 12 * 60 * 60 * 1000);
    
    // First, just count to avoid unnecessary work
    const pendingCount = await bookingsModel.countDocuments({
      bookingStatus: "Pending",
      createdAt: { $lte: twelveHoursAgo }
    });
    
    if (pendingCount === 0) {
      return { success: true, cancelledCount: 0 };
    }
    
    console.log(`Found ${pendingCount} pending bookings to cancel`);
    
    // Update all pending bookings to cancelled (bulk operation is faster)
    const result = await bookingsModel.updateMany(
      {
        bookingStatus: "Pending",
        createdAt: { $lte: twoHoursAgo }
      },
      {
        $set: {
          bookingStatus: "Cancelled",
          cancellationReason: "Auto-cancelled: Booking not confirmed within 2 hours",
          cancelledAt: currentDateIST
        }
      }
    );
    
    console.log(`Auto-cancelled ${result.modifiedCount} pending bookings`);
    
    // Send emails asynchronously without blocking (optional - can be disabled for better performance)
    // Uncomment below if you want to send emails
    /*
    const pendingBookings = await bookingsModel.find({
      bookingStatus: "Cancelled",
      cancellationReason: "Auto-cancelled: Booking not confirmed within 2 hours",
      cancelledAt: currentDateIST
    }).limit(pendingCount);
    
    // Send emails in background without waiting
    setImmediate(async () => {
      for (const booking of pendingBookings) {
        if (booking.user && booking.user.email) {
          try {
            await sendCustomEmail({
              email: booking.user.email,
              subject: "Booking Cancelled - Payment Not Completed",
              message: `Dear ${booking.user.name || 'Customer'},\n\nYour booking (ID: ${booking.bookingId}) has been automatically cancelled as payment was not completed within 2 hours.\n\nBooking Details:\n- Hotel: ${booking.hotelDetails?.hotelName || 'N/A'}\n- Check-in: ${booking.checkInDate}\n- Check-out: ${booking.checkOutDate}\n\nPlease make a new booking if you still wish to proceed.`,
              link: process.env.FRONTEND_URL,
            });
          } catch (emailError) {
            console.error(`Failed to send cancellation email for booking ${booking.bookingId}:`, emailError);
          }
        }
      }
    });
    */
    
    return { success: true, cancelledCount: result.modifiedCount };
  } catch (error) {
    console.error("Error in autoCancelPendingBookings:", error);
    return { success: false, error: error.message };
  }
};

// Run every 30 minutes to check for pending bookings (reduced frequency)
cron.schedule("*/30 * * * *", async () => {
  // Run in background without blocking
  setImmediate(async () => {
    try {
      await autoCancelPendingBookings();
    } catch (error) {
      console.error("Auto-cancel cron error:", error);
    }
  });
});
// */30 means every 30 minutes (reduced from 15 minutes)
// setImmediate ensures it runs in background without blocking other APIs

//=========================================list of applied coupons hotel==========================
const getCouponsAppliedHotels = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    
    const cursor = hotelModel.find({ "rooms.isOffer": true }).cursor();
    
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    
    res.write(']');
    res.end();
  } catch (error) {
    console.error("Error fetching hotels with offers:", error);
    res.status(500).json({ message: "Error fetching hotels", error });
  }
};

//================================================================================================
module.exports = {
  createHotel,
  getAllHotels,
  getHotelsById,
  getHotelsByLocalID,
  getHotelsByFilters,
  getCity,
  getByQuery,
  UpdateHotelStatus,
  getHotels,
  setOnFront,
  deleteHotelById,
  UpdateHotelInfo,
  getHotelsState,
  getHotelsCity,
  getHotelsCityByState,
  monthlyPrice,
  getCount,
  updatePolicies,
  getCouponsAppliedHotels,
  getCountPendingHotels,
  updateHotelImage,
  deleteHotelImages,
  autoCancelPendingBookings,
};
