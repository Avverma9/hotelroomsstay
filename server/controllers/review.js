const hotelModel = require("../models/hotel/basicDetails");
const reviewModel = require("../models/review");
const userModel = require("../models/user");
const bookingModel = require("../models/booking/booking");

// Helper function to recalculate hotel ratings
async function recalculateHotelRatings(hotelId) {
  try {
    const reviews = await reviewModel.find({ hotelId });
    
    if (reviews.length === 0) {
      // No reviews, reset to default
      await hotelModel.findOneAndUpdate(
        { hotelId },
        {
          rating: 0,
          reviewCount: 0,
          ratingBreakdown: {
            cleanliness: 0,
            service: 0,
            valueForMoney: 0,
            location: 0,
          },
          ratingDistribution: {
            oneStar: 0,
            twoStar: 0,
            threeStar: 0,
            fourStar: 0,
            fiveStar: 0,
          },
        }
      );
      return { success: true, averageRating: 0, totalReviews: 0 };
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);

    // Calculate rating distribution
    const distribution = {
      oneStar: 0,
      twoStar: 0,
      threeStar: 0,
      fourStar: 0,
      fiveStar: 0,
    };

    reviews.forEach(review => {
      const rating = Math.floor(review.rating);
      switch(rating) {
        case 1: distribution.oneStar++; break;
        case 2: distribution.twoStar++; break;
        case 3: distribution.threeStar++; break;
        case 4: distribution.fourStar++; break;
        case 5: distribution.fiveStar++; break;
      }
    });

    // Calculate detailed ratings breakdown
    let cleanlinessSum = 0, serviceSum = 0, valueSum = 0, locationSum = 0;
    let detailedCount = 0;

    reviews.forEach(review => {
      if (review.cleanliness) {
        cleanlinessSum += review.cleanliness;
        serviceSum += review.service || 0;
        valueSum += review.valueForMoney || 0;
        locationSum += review.location || 0;
        detailedCount++;
      }
    });

    const breakdown = {
      cleanliness: detailedCount > 0 ? (cleanlinessSum / detailedCount).toFixed(1) : 0,
      service: detailedCount > 0 ? (serviceSum / detailedCount).toFixed(1) : 0,
      valueForMoney: detailedCount > 0 ? (valueSum / detailedCount).toFixed(1) : 0,
      location: detailedCount > 0 ? (locationSum / detailedCount).toFixed(1) : 0,
    };

    // Update hotel with calculated ratings
    await hotelModel.findOneAndUpdate(
      { hotelId },
      {
        rating: parseFloat(averageRating),
        reviewCount: reviews.length,
        ratingBreakdown: breakdown,
        ratingDistribution: distribution,
      },
      { new: true }
    );

    return {
      success: true,
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length,
      distribution,
      breakdown,
    };
  } catch (error) {
    console.error("Error recalculating ratings:", error);
    return { success: false, error: error.message };
  }
}

//======================================Create Review (After Booking)============================================
const createReview = async (req, res) => {
  try {
    const { userId, hotelId } = req.params;
    const {
      comment,
      rating,
      bookingId,
      cleanliness,
      service,
      valueForMoney,
      location,
    } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if user and hotel exist
    const [user, hotel] = await Promise.all([
      userModel.findOne({ userId }),
      hotelModel.findOne({ hotelId }),
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    // Check if booking exists (optional but recommended)
    let isVerified = false;
    let booking = null;
    
    if (bookingId) {
      booking = await bookingModel.findOne({
        bookingId,
        userId,
        hotelDetails: { $exists: true },
      });

      if (booking) {
        // Check if already reviewed
        if (booking.hasReview) {
          return res.status(400).json({
            error: "You have already reviewed this booking",
            existingReviewId: booking.reviewId,
          });
        }
        
        // Check if booking is completed
        if (booking.bookingStatus === "Checked-out" || booking.bookingStatus === "Confirmed") {
          isVerified = true;
        }
      }
    }

    // Check if user already reviewed this hotel (prevent multiple reviews)
    const existingReview = await reviewModel.findOne({ userId, hotelId });
    if (existingReview && !bookingId) {
      return res.status(400).json({
        error: "You have already reviewed this hotel",
        reviewId: existingReview._id,
      });
    }

    // Create new review
    const review = new reviewModel({
      hotelId,
      userId,
      bookingId: bookingId || null,
      comment,
      rating,
      cleanliness: cleanliness || rating,
      service: service || rating,
      valueForMoney: valueForMoney || rating,
      location: location || rating,
      isVerifiedBooking: isVerified,
      userName: user.userName,
      userImage: user.images?.[0] || "",
      hotelName: hotel.hotelName,
      hotelImage: hotel.images?.[0] || "",
    });

    const savedReview = await review.save();

    // Update booking if exists
    if (booking) {
      booking.hasReview = true;
      booking.reviewId = savedReview._id.toString();
      booking.reviewGivenAt = new Date();
      await booking.save();
    }

    // Recalculate hotel ratings automatically
    const ratingResult = await recalculateHotelRatings(hotelId);

    return res.status(201).json({
      success: true,
      review: savedReview,
      hotelRatings: ratingResult,
      message: "Review submitted successfully and hotel ratings updated",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
};

//===============================Get Reviews by Hotel ID with Sorting============================================
const getReviewsByHotelId = async (req, res) => {
  try {
    const { hotelId } = req.query;
    const { sortBy = "recent", page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort criteria
    let sortCriteria = { createdAt: -1 }; // Default: most recent first
    if (sortBy === "highest") {
      sortCriteria = { rating: -1, createdAt: -1 };
    } else if (sortBy === "lowest") {
      sortCriteria = { rating: 1, createdAt: -1 };
    }

    const [reviews, total, hotel] = await Promise.all([
      reviewModel.find({ hotelId })
        .sort(sortCriteria)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      reviewModel.countDocuments({ hotelId }),
      hotelModel.findOne({ hotelId }).select('rating reviewCount ratingBreakdown ratingDistribution').lean(),
    ]);

    if (reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      hotelRatingSummary: hotel ? {
        averageRating: hotel.rating || 0,
        totalReviews: hotel.reviewCount || 0,
        breakdown: hotel.ratingBreakdown,
        distribution: hotel.ratingDistribution,
      } : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//=======================================Get Reviews by User ID================================================================
const getReviewsByUserId = async (req, res) => {
  try {
    const { userId } = req.query;
    const reviews = await reviewModel.find({ userId }).sort({ createdAt: -1 }).lean();
    
    if (reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }
    
    res.status(200).json({
      success: true,
      reviews,
      total: reviews.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//=================================Update Review with Recalculation================================================================
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const {
      comment,
      rating,
      cleanliness,
      service,
      valueForMoney,
      location,
    } = req.body;

    const reviewToUpdate = await reviewModel.findById(reviewId);

    if (!reviewToUpdate) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Update fields
    if (comment) reviewToUpdate.comment = comment;
    if (rating) reviewToUpdate.rating = rating;
    if (cleanliness) reviewToUpdate.cleanliness = cleanliness;
    if (service) reviewToUpdate.service = service;
    if (valueForMoney) reviewToUpdate.valueForMoney = valueForMoney;
    if (location) reviewToUpdate.location = location;

    const savedReview = await reviewToUpdate.save();

    // Recalculate ratings if rating changed
    if (rating) {
      await recalculateHotelRatings(reviewToUpdate.hotelId);
    }

    return res.status(200).json({
      success: true,
      review: savedReview,
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//==========================================Delete Review with Recalculation================================================================
const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  try {
    const review = await reviewModel.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const hotelId = review.hotelId;
    
    // Delete review
    await reviewModel.deleteOne({ _id: reviewId });
    
    // Update booking if linked
    if (review.bookingId) {
      await bookingModel.findOneAndUpdate(
        { bookingId: review.bookingId },
        {
          hasReview: false,
          reviewId: null,
          reviewGivenAt: null,
        }
      );
    }
    
    // Recalculate hotel ratings
    await recalculateHotelRatings(hotelId);
    
    return res.status(200).json({
      success: true,
      message: "Review deleted successfully and ratings recalculated",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//===========================Get All Reviews (Admin)==========================================
const findAllReviews = async function (req, res) {
  try {
    const { page = 1, limit = 20, sortBy = "recent" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let sortCriteria = { createdAt: -1 };
    if (sortBy === "highest") sortCriteria = { rating: -1, createdAt: -1 };
    else if (sortBy === "lowest") sortCriteria = { rating: 1, createdAt: -1 };

    const [reviews, total] = await Promise.all([
      reviewModel.find()
        .sort(sortCriteria)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      reviewModel.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//===========================Get User's Pending Reviews (Bookings without review)==========================================
const getPendingReviews = async function (req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Find bookings that are completed but have no review
    const pendingBookings = await bookingModel.find({
      userId,
      hasReview: false,
      bookingStatus: { $in: ["Checked-out", "Confirmed"] },
    }).select('bookingId hotelDetails checkInDate checkOutDate createdAt').lean();

    return res.status(200).json({
      success: true,
      pendingReviews: pendingBookings,
      count: pendingBookings.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//===========================Admin: Add Response to Review==========================================
const addAdminResponse = async function (req, res) {
  try {
    const { reviewId } = req.params;
    const { adminResponse } = req.body;

    if (!adminResponse) {
      return res.status(400).json({ error: "Admin response is required" });
    }

    const review = await reviewModel.findByIdAndUpdate(
      reviewId,
      {
        adminResponse,
        adminResponseDate: new Date(),
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    return res.status(200).json({
      success: true,
      review,
      message: "Admin response added successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createReview,
  getReviewsByHotelId,
  getReviewsByUserId,
  updateReview,
  deleteReview,
  findAllReviews,
  getPendingReviews,
  addAdminResponse,
  recalculateHotelRatings, // Export for manual recalculation if needed
};
