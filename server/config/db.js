const mongoose = require("mongoose");

const MONGO_URI =
  "mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/Hotel"; // Update with your MongoDB URI

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit the process with failure code
  }
};

module.exports = connectDB;
