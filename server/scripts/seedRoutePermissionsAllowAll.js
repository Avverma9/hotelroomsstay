const mongoose = require("mongoose");
const connectDB = require("../config/db");
const DashboardUser = require("../models/dashboardUser");

const run = async () => {
  await connectDB();

  const result = await DashboardUser.updateMany(
    {},
    {
      $set: {
        routePermissions: {
          mode: "allow_all",
          allowedRoutes: [],
          blockedRoutes: [],
        },
      },
    },
  );

  const allowAllCount = await DashboardUser.countDocuments({
    "routePermissions.mode": "allow_all",
  });
  const total = await DashboardUser.countDocuments({});

  undefined;
};

run()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error(closeError);
    }
    process.exit(1);
  });
