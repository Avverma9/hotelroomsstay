const mongoose = require("mongoose");

const MONGO_URI =
  "mongodb+srv://hotelroomsstay:Avverma%401@cluster0.og7zmtr.mongodb.net/Hotel"; // Update with your MongoDB URI

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err && err.message ? err.message : err);
    process.exit(1); // Exit the process with failure code
  }
};

module.exports = connectDB;
