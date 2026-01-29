const booking = require("../../models/booking/booking");
const dashboardUser = require("../../models/dashboardUser");
const Hotel = require("../../models/hotel/basicDetails");

exports.getHotelDataByYear = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year || isNaN(year)) {
      return res.status(400).json({ message: "Year is required and must be a number" });
    }

    // Start and end date for the whole year
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`);

    const hotels = await Hotel.find(
      {
        createdAt: {
          $gte: start,
          $lt: end,
        },
      },
      { createdAt: 1 }
    );

    const monthlyCounts = {};

    hotels.forEach((hotel) => {
      const createdAt = new Date(hotel.createdAt);
      const month = String(createdAt.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${month}`;

      if (!monthlyCounts[key]) {
        monthlyCounts[key] = 0;
      }
      monthlyCounts[key]++;
    });

    const result = Object.entries(monthlyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching chart data:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.getUserRoleStatsByYear = async (req, res) => {
    try {
      const { year } = req.query;
  
      if (!year || isNaN(year)) {
        return res.status(400).json({ message: "Valid year is required as query param" });
      }
  
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`);
  
      const users = await dashboardUser.find(
        {
          createdAt: { $gte: start, $lt: end },
        },
        { createdAt: 1, role: 1 }
      );
  
      const statsMap = {};
  
      users.forEach(user => {
        const date = new Date(user.createdAt);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const key = `${user.role}_${year}-${month}`;
  
        if (!statsMap[key]) {
          statsMap[key] = { role: user.role, month: `${year}-${month}`, count: 0 };
        }
  
        statsMap[key].count += 1;
      });
  
      const result = Object.values(statsMap).sort((a, b) => a.month.localeCompare(b.month));
  
      res.json(result);
    } catch (error) {
      console.error("Error in getUserRoleStatsByYear:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };


  exports.getBookingStatsByYear = async (req, res) => {
    try {
      const { year } = req.query;
  
      if (!year || isNaN(year)) {
        return res.status(400).json({ message: "Valid year is required" });
      }
  
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${+year + 1}-01-01T00:00:00.000Z`);
  
      const bookings = await booking.find(
        {
          createdAt: { $gte: start, $lt: end },
        },
        { createdAt: 1, bookingStatus: 1 }
      );
  
      const statsMap = {};
  
      bookings.forEach((booking) => {
        const date = new Date(booking.createdAt);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const key = `${year}-${month}_${booking.bookingStatus}`;
  
        if (!statsMap[key]) {
          statsMap[key] = {
            month: `${year}-${month}`,
            status: booking.bookingStatus,
            count: 0,
          };
        }
  
        statsMap[key].count += 1;
      });
  
      const result = Object.values(statsMap).sort((a, b) => a.month.localeCompare(b.month));
  
      res.json(result);
    } catch (error) {
      console.error("Error fetching booking stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };