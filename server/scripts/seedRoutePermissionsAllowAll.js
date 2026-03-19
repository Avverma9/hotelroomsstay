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

  console.log(
    JSON.stringify(
      {
        matched: result.matchedCount ?? result.n ?? 0,
        modified: result.modifiedCount ?? result.nModified ?? 0,
        allowAllCount,
        total,
      },
      null,
      2,
    ),
  );
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
