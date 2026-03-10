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
  const {
    hotelId,
    hotelsPolicy,
    outsideFoodPolicy,
    cancellationPolicy,
    paymentMode,
    petsAllowed,
    checkInPolicy,
    checkOutPolicy,
    bachelorAllowed,
    smokingAllowed,
    alcoholAllowed,
    unmarriedCouplesAllowed,
    internationalGuestAllowed,
    refundPolicy,
    returnPolicy,
    onDoubleSharing,
    onQuadSharing,
    onBulkBooking,
    onTrippleSharing,
    onMoreThanFour,
    offDoubleSharing,
    offQuadSharing,
    offBulkBooking,
    offTrippleSharing,
    offMoreThanFour,
    onDoubleSharingAp,
    onQuadSharingAp,
    onBulkBookingAp,
    onTrippleSharingAp,
    onMoreThanFourAp,
    onDoubleSharingMAp,
    onQuadSharingMAp,
    onBulkBookingMAp,
    onTrippleSharingMAp,
    onMoreThanFourMAp,
    offDoubleSharingAp,
    offQuadSharingAp,
    offBulkBookingAp,
    offTrippleSharingAp,
    offMoreThanFourAp,
    offDoubleSharingMAp,
    offQuadSharingMAp,
    offBulkBookingMAp,
    offTrippleSharingMAp,
    offMoreThanFourMAp,
  } = req.body;

  if (!hotelId) {
    return res.status(400).json({ message: "hotelId is required" });
  }

  // Create an object to store non-empty fields
  const updateFields = {};

  if (hotelsPolicy !== "")
    updateFields["policies.$.hotelsPolicy"] = hotelsPolicy;
  if (outsideFoodPolicy !== "")
    updateFields["policies.$.outsideFoodPolicy"] = outsideFoodPolicy;
  if (cancellationPolicy !== "")
    updateFields["policies.$.cancellationPolicy"] = cancellationPolicy;
  if (paymentMode !== "") updateFields["policies.$.paymentMode"] = paymentMode;
  if (petsAllowed !== "") updateFields["policies.$.petsAllowed"] = petsAllowed;
  if (checkInPolicy !== "")
    updateFields["policies.$.checkInPolicy"] = checkInPolicy;
  if (checkOutPolicy !== "")
    updateFields["policies.$.checkOutPolicy"] = checkOutPolicy;
  if (bachelorAllowed !== "")
    updateFields["policies.$.bachelorAllowed"] = bachelorAllowed;
  if (smokingAllowed !== "")
    updateFields["policies.$.smokingAllowed"] = smokingAllowed;
  if (alcoholAllowed !== "")
    updateFields["policies.$.alcoholAllowed"] = alcoholAllowed;
  if (unmarriedCouplesAllowed !== "")
    updateFields["policies.$.unmarriedCouplesAllowed"] =
      unmarriedCouplesAllowed;
  if (internationalGuestAllowed !== "")
    updateFields["policies.$.internationalGuestAllowed"] =
      internationalGuestAllowed;
  if (refundPolicy !== "")
    updateFields["policies.$.refundPolicy"] = refundPolicy;
  if (returnPolicy !== "")
    updateFields["policies.$.returnPolicy"] = returnPolicy;
  if (onDoubleSharing !== "")
    updateFields["policies.$.onDoubleSharing"] = onDoubleSharing;
  if (onQuadSharing !== "")
    updateFields["policies.$.onQuadSharing"] = onQuadSharing;
  if (onBulkBooking !== "")
    updateFields["policies.$.onBulkBooking"] = onBulkBooking;
  if (onTrippleSharing !== "")
    updateFields["policies.$.onTrippleSharing"] = onTrippleSharing;
  if (onMoreThanFour !== "")
    updateFields["policies.$.onMoreThanFour"] = onMoreThanFour;
  if (offDoubleSharing !== "")
    updateFields["policies.$.offDoubleSharing"] = offDoubleSharing;
  if (offQuadSharing !== "")
    updateFields["policies.$.offQuadSharing"] = offQuadSharing;
  if (offBulkBooking !== "")
    updateFields["policies.$.offBulkBooking"] = offBulkBooking;
  if (offTrippleSharing !== "")
    updateFields["policies.$.offTrippleSharing"] = offTrippleSharing;
  if (offMoreThanFour !== "")
    updateFields["policies.$.offMoreThanFour"] = offMoreThanFour;
  if (onDoubleSharingAp !== "")
    updateFields["policies.$.onDoubleSharingAp"] = onDoubleSharingAp;
  if (onQuadSharingAp !== "")
    updateFields["policies.$.onQuadSharingAp"] = onQuadSharingAp;
  if (onBulkBookingAp !== "")
    updateFields["policies.$.onBulkBookingAp"] = onBulkBookingAp;
  if (onTrippleSharingAp !== "")
    updateFields["policies.$.onTrippleSharingAp"] = onTrippleSharingAp;
  if (onMoreThanFourAp !== "")
    updateFields["policies.$.onMoreThanFourAp"] = onMoreThanFourAp;
  if (onDoubleSharingMAp !== "")
    updateFields["policies.$.onDoubleSharingMAp"] = onDoubleSharingMAp;
  if (onQuadSharingMAp !== "")
    updateFields["policies.$.onQuadSharingMAp"] = onQuadSharingMAp;
  if (onBulkBookingMAp !== "")
    updateFields["policies.$.onBulkBookingMAp"] = onBulkBookingMAp;
  if (onTrippleSharingMAp !== "")
    updateFields["policies.$.onTrippleSharingMAp"] = onTrippleSharingMAp;
  if (onMoreThanFourMAp !== "")
    updateFields["policies.$.onMoreThanFourMAp"] = onMoreThanFourMAp;
  if (offDoubleSharingAp !== "")
    updateFields["policies.$.offDoubleSharingAp"] = offDoubleSharingAp;
  if (offQuadSharingAp !== "")
    updateFields["policies.$.offQuadSharingAp"] = offQuadSharingAp;
  if (offBulkBookingAp !== "")
    updateFields["policies.$.offBulkBookingAp"] = offBulkBookingAp;
  if (offTrippleSharingAp !== "")
    updateFields["policies.$.offTrippleSharingAp"] = offTrippleSharingAp;
  if (offMoreThanFourAp !== "")
    updateFields["policies.$.offMoreThanFourAp"] = offMoreThanFourAp;
  if (offDoubleSharingMAp !== "")
    updateFields["policies.$.offDoubleSharingMAp"] = offDoubleSharingMAp;
  if (offQuadSharingMAp !== "")
    updateFields["policies.$.offQuadSharingMAp"] = offQuadSharingMAp;
  if (offBulkBookingMAp !== "")
    updateFields["policies.$.offBulkBookingMAp"] = offBulkBookingMAp;
  if (offTrippleSharingMAp !== "")
    updateFields["policies.$.offTrippleSharingMAp"] = offTrippleSharingMAp;
  if (offMoreThanFourMAp !== "")
    updateFields["policies.$.offMoreThanFourMAp"] = offMoreThanFourMAp;

  try {
    const hotel = await hotelModel.findOne({ hotelId });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No policy fields provided for update" });
    }

    const existingPolicy = Array.isArray(hotel.policies)
      ? hotel.policies.find((policy) => String(policy?.hotelId) === String(hotelId))
      : null;

    let updateData;

    if (existingPolicy) {
      updateData = await hotelModel.findOneAndUpdate(
        { hotelId, "policies.hotelId": hotelId },
        {
          $set: updateFields,
        },
        { new: true }
      );
    } else {
      const createdPolicy = { hotelId };

      Object.entries(req.body).forEach(([key, value]) => {
        if (key === "hotelId") return;
        if (value === "") return;
        if (value === undefined || value === null) return;
        createdPolicy[key] = value;
      });

      updateData = await hotelModel.findOneAndUpdate(
        { hotelId },
        {
          $push: { policies: createdPolicy },
        },
        { new: true }
      );
    }

    res
      .status(200)
      .json({ message: "Policies updated successfully", data: updateData });
  } catch (error) {
    console.error("Error updating policies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
