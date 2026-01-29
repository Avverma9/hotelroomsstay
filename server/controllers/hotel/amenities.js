const hotels = require("../../models/hotel/basicDetails");
const foods = require("../../models/hotel/foods");
const amenities = require("../../models/hotel/amenities");
const policies = require("../../models/hotel/policies");

const { v4: uuidv4 } = require("uuid");
exports.createAmenity = async (req, res) => {
  try {
    const { hotelId, ...amenities } = req.body;

    const createdAmenity = {
      hotelId,
      ...amenities,
    };
    await hotels.findOneAndUpdate(
      { hotelId },
      { $push: { amenities: createdAmenity } },
      { new: true }
    );
    res.status(201).json(createdAmenity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.getHotelByAmenities = async (req, res) => {
  try {
    const hotelData = await hotelModel.findOne();

    if (!hotelData) {
      return res.status(404).json({ message: "No hotel data found" });
    }
    const hotelId = hotelData.hotelId;
    const foodsData = await foods.findOne({ hotelId });
    const amenitiesData = await amenities.findOne({ hotelId });
    const policiesData = await policies.findOne({ hotelId });
    const roomData = await roomModel.findOne({ hotelId });

    // Return the data
    res.json({
      hotel: hotelData,
      foods: foodsData,
      amenities: amenitiesData,
      policies: policiesData,
      room: roomData,
    });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//--------------delete specific amenities----------------------------
exports.deleteAmenity = async (req, res) => {
  try {
    const { hotelId, amenityName } = req.params; 
    const updatedHotel = await hotels.findOneAndUpdate(
      { hotelId },
      { $pull: { "amenities.$[].amenities": amenityName } }, // Remove amenityName from all amenities arrays
      { new: true } // Return the updated document
    );

    if (!updatedHotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    res
      .status(200)
      .json({ message: "Amenity deleted successfully", updatedHotel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};