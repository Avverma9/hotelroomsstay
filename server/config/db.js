const mongoose = require("mongoose");
require("dotenv").config();

const getMongoUri = () => {
  return process.env.MONGO_URI_DIRECT || process.env.MONGO_URI;
};

const connectDB = async () => {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    console.error("Error connecting to MongoDB: missing MONGO_URI or MONGO_URI_DIRECT in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    console.error("Error connecting to MongoDB:", message);

    if (message.includes("querySrv ECONNREFUSED")) {
      console.error(
        "Hint: your network DNS is blocking SRV lookups for mongodb+srv. Use Atlas standard connection string in MONGO_URI_DIRECT (mongodb://...) or fix local DNS settings."
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;
