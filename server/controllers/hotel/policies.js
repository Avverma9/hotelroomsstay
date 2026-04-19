const hotelModel = require("../../models/hotel/basicDetails");
const Policy = require("../../models/hotel/policies"); // Corrected the import

exports.createPolicy = async function (req, res) {
  try {
    const { hotelId, ...policies } = req.body;
    console.log("here is id", hotelId);
    if (!hotelId) {
      return res.status(400).json({ message: "HoteID not provided" });
    }

    // Create policies
    const createdPolicies = {
      hotelId,
      ...policies, // Spread other properties from the request body
    };

    // Update the hotel to include the entire policy object in the policies array
    await hotelModel.findOneAndUpdate(
      { hotelId },
      { $push: { policies: createdPolicies } },
      { new: true }
    );

    res.status(201).json({ message: "Policy created", createdPolicies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updatePolicies = async (req, res) => {
  const { hotelId, ...policyFields } = req.body;

  if (!hotelId) {
    return res.status(400).json({ message: "hotelId is required" });
  }

  // Build a clean policy object — keep every field from the request,
  // including empty strings (so the user can clear a field).
  const ALLOWED_KEYS = [
    "hotelsPolicy", "outsideFoodPolicy", "cancellationPolicy", "paymentMode",
    "petsAllowed", "checkInPolicy", "checkOutPolicy", "bachelorAllowed",
    "smokingAllowed", "alcoholAllowed", "unmarriedCouplesAllowed",
    "internationalGuestAllowed", "refundPolicy", "returnPolicy",
    "onDoubleSharing", "onQuadSharing", "onBulkBooking", "onTrippleSharing", "onMoreThanFour",
    "offDoubleSharing", "offQuadSharing", "offBulkBooking", "offTrippleSharing", "offMoreThanFour",
    "onDoubleSharingAp", "onQuadSharingAp", "onBulkBookingAp", "onTrippleSharingAp", "onMoreThanFourAp",
    "onDoubleSharingMAp", "onQuadSharingMAp", "onBulkBookingMAp", "onTrippleSharingMAp", "onMoreThanFourMAp",
    "offDoubleSharingAp", "offQuadSharingAp", "offBulkBookingAp", "offTrippleSharingAp", "offMoreThanFourAp",
    "offDoubleSharingMAp", "offQuadSharingMAp", "offBulkBookingMAp", "offTrippleSharingMAp", "offMoreThanFourMAp",
  ];

  const updatedPolicy = { hotelId };
  ALLOWED_KEYS.forEach((key) => {
    if (key in policyFields) {
      updatedPolicy[key] = policyFields[key] ?? "";
    }
  });

  try {
    const hotel = await hotelModel.findOne({ hotelId });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Always replace the entire policies array with a single up-to-date element.
    // This avoids positional-operator pitfalls and duplicate entries.
    const updateData = await hotelModel.findOneAndUpdate(
      { hotelId },
      { $set: { policies: [updatedPolicy] } },
      { new: true }
    );

    return res.status(200).json({ message: "Policies updated successfully", data: updateData });
  } catch (error) {
    console.error("Error updating policies:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
