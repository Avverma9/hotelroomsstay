const foods = require("../../models/hotel/foods");
const hotel = require("../../models/hotel/basicDetails");
const { v4: uuidv4 } = require("uuid");
const createFood = async function (req, res) {
  try {
    const { hotelId, price, ...foods } = req.body;
    const parcedPrice = Number(price);
    const images = req.files.map((file) => file.location); // Assuming req.files is an array of file objects
    const foodId = uuidv4().substr(0, 8); // Generate a unique foodId
    const created = { foodId, hotelId, ...foods, images, price:parcedPrice }; // Include images in the created object

    // Update the hotel document
    const updatedHotel = await hotel.findOneAndUpdate(
      { hotelId },
      { $push: { foods: created } }, // Push the new food item into the foods array
      { new: true } // Return the updated document
    );

    if (updatedHotel) {
      res
        .status(201)
        .json({ message: "Food item added successfully", created });
    } else {
      res.status(404).json({ message: "Hotel not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteFood = async (req, res) => {
  try {
    const { hotelId, foodId } = req.params;
    console.log(`Deleting food item with ID: ${foodId} from hotel: ${hotelId}`);

    if (!hotelId || !foodId) {
      return res
        .status(400)
        .json({ message: "hotelId and foodId are required" });
    }

    const updatedHotel = await hotel.findOneAndUpdate(
      { hotelId },
      { $pull: { foods: { foodId } } },
      { new: true }
    );

    if (!updatedHotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.status(200).json({ message: "Food item deleted successfully", foods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { createFood, deleteFood };
