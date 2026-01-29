const CarBooking = require("../../models/travel/carBooking");
const carOwner = require("../../models/travel/carOwner");
const Car = require("../../models/travel/cars");
const { default: mongoose } = require("mongoose");
const { getGSTData } = require("../GST/gst");
const { sendCustomEmail } = require("../../nodemailer/nodemailer");

exports.bookCar = async (req, res) => {
  try {
    const {
      seats,
      sharingType,
      vehicleType,
      carId,
      bookedBy,
      customerMobile,
      customerEmail,
    } = req.body;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    let totalSeatPrice = 0;
    let bookedSeatIds = [];

    if (sharingType === "Private") {
      if (!car.isAvailable) {
        return res
          .status(400)
          .json({ message: "Car is not available for private booking" });
      }

      totalSeatPrice = car.price;

      car.seatConfig.forEach((seat) => {
        if (!seat.isBooked) {
          seat.isBooked = true;
          seat.bookedBy = bookedBy;
          bookedSeatIds.push(seat._id.toString());
        }
      });

      car.isAvailable = false;
      car.runningStatus = "On A Trip";
    } else {
      if (!seats || !Array.isArray(seats) || seats.length === 0) {
        return res
          .status(400)
          .json({ message: "No seats selected for shared booking" });
      }

      const selectedSeats = [];
      for (const seatId of seats) {
        const seat = car.seatConfig.find(
          (s) => s._id.toString() === seatId.toString()
        );
        if (!seat) {
          return res.status(404).json({ message: `Seat ${seatId} not found` });
        }
        if (seat.isBooked) {
          return res
            .status(400)
            .json({ message: `Seat ${seat.seatNumber || seatId} is already booked` });
        }

        seat.isBooked = true;
        seat.bookedBy = bookedBy;
        bookedSeatIds.push(seat._id.toString());
        selectedSeats.push(seat);
      }

      totalSeatPrice = selectedSeats.reduce(
        (sum, seat) => sum + (seat.seatPrice || car.perPersonCost || 0),
        0
      );
    }

    const gstData = await getGSTData({
      type: "Travel",
      gstThreshold: totalSeatPrice,
    });

    const gstRate = gstData?.gstPrice || 0;
    const gstAmount = (totalSeatPrice * gstRate) / 100;
    const finalPrice = totalSeatPrice + gstAmount;

    await car.save();

    const newBooking = await CarBooking.create({
      carId: car._id,
      seats: bookedSeatIds,
      bookedBy,
      price: finalPrice,
      gstPrice: gstRate,
      gstAmount,
      sharingType,
      vehicleType,
      customerMobile,
      customerEmail,
      pickupP: car.pickupP,
      dropP: car.dropP,
      pickupD: car.pickupD,
      dropD: car.dropD,
      vehicleNumber: car.vehicleNumber,
    });

    await sendCustomEmail({
      email: customerEmail,
      subject: `Your Travel Booking is Confirmed`,
      message: `Your booking (ID: ${newBooking.bookingId}) has been confirmed. Vehicle Number: ${car.vehicleNumber}.`,
      link: process.env.FRONTEND_URL,
    });

    return res.status(201).json({
      success: true,
      message: "Booking successful",
      data: newBooking,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};
exports.changeBookingStatus = async(req,res)=>{
try {
  const {bookingStatus} = req.body;
  const {id} = req.params;
  const booking = await CarBooking.findById(id);
  if(!booking) return res.status(404).json({message:"Booking not found"});
  booking.bookingStatus = bookingStatus;
  await booking.save();
} catch (error) {
  
}
}
exports.getTravelBookings = async (req, res) => {
  try {
    const bookings = await CarBooking.find();

    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const car = await Car.findById(booking.carId).lean();

        let seatDetails = [];

        if (car && Array.isArray(car.seatConfig)) {
          seatDetails = car.seatConfig.filter((seat) =>
            booking.seats.includes(seat._id.toString()),
          );
        }

        // Calculate total price from seat prices
        const totalSeatPrice = seatDetails.reduce(
          (sum, seat) => sum + (seat.seatPrice || 0),
          0,
        );

        return {
          ...booking.toObject(),
          seats: seatDetails, // enriched seat info
          totalSeatPrice: totalSeatPrice, // added field
        };
      }),
    );

    res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error("Error in getTravelBookings:", error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.updateBooking = async function (req, res) {
  try {
    const { id, data } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Booking ID" });
    }

    // Find the booking document first
    const booking = await CarBooking.findOne({ _id: id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update only fields that exist in `data`
    Object.keys(data).forEach((key) => {
      booking[key] = data[key];
    });

    // Save the updated document
    const updatedBooking = await booking.save();

    return res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update Booking Error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getBookingsOfOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const ownerCars = await Car.find({ ownerId: ownerId });
    const carIds = ownerCars.map((car) => car._id);

    const bookings = await CarBooking.find({ carId: { $in: carIds } });

    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const car = await Car.findById(booking.carId).lean();

        if (!car || !Array.isArray(car.seatConfig)) {
          return {
            ...booking.toObject(),
            availableSeatsOnCar: [],
          };
        }

        const bookingObj = booking.toObject();

        // Match booked seat IDs with seat objects (including price)
        const fullSeatDetails = bookingObj.seats
          .map((seatId) =>
            car.seatConfig.find((seat) => String(seat._id) === String(seatId)),
          )
          .filter(Boolean);

        // Optional: Total price of booked seats
        const totalSeatPrice = fullSeatDetails.reduce((sum, seat) => {
          return sum + (seat?.seatPrice || 0);
        }, 0);

        return {
          ...bookingObj,
          availableSeatsOnCar: car.seatConfig,
          seats: fullSeatDetails, // full seat objects with price
          totalSeatPrice, // optional: sum of booked seat prices
        };
      }),
    );

    res.status(200).json(enrichedBookings);
    console.log("enrichedBookings", enrichedBookings);
  } catch (error) {
    console.error("Error fetching booking data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getBookingBookedBy = async (req, res) => {
  try {
    const { customerMobile } = req.body;

    const bookings = await CarBooking.find({ customerMobile });
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found" });
    }

    const carIds = bookings.map((b) => b.carId);
    const cars = await Car.find({ _id: { $in: carIds } });

    const carMap = {};
    cars.forEach((car) => {
      carMap[String(car._id)] = car;
    });

    const enrichedBookings = bookings.map((booking) => {
      const car = carMap[String(booking.carId)];
      let bookedSeats = [];
      let bookingSeatIds = [];

      if (car && Array.isArray(car.seatConfig)) {
        bookingSeatIds = booking.seats.map((s) => String(s).trim());
        const seatConfigFlat = car.seatConfig.flat();
        bookedSeats = seatConfigFlat.filter(
          (seat) =>
            seat &&
            seat._id &&
            bookingSeatIds.includes(String(seat._id).trim())
        );
      }

      return {
        ...booking.toObject(),
        carDetails: car
          ? {
              _id: car._id,
              make: car.make,
              model: car.model,
              vehicleNumber: car.vehicleNumber,
              images: car.images,
              seater: car.seater,
              sharingType: car.sharingType,
              vehicleType: car.vehicleType,
              bookedSeats,
            }
          : null,
      };
    });

    return res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error("Error fetching booking data:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



