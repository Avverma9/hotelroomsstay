const hotelModel = require('../models/hotel/basicDetails');
const couponModel = require('../models/booking/coupon');

exports.removeCoupon = async (req, res) => {
  const { hotelIds } = req.body;

  if (!Array.isArray(hotelIds) || hotelIds.some(isNaN)) {
    return res.status(400).json({ message: 'hotelIds must be an array of numeric hotel IDs.' });
  }

  try {
    const hotels = await hotelModel.find({ hotelId: { $in: hotelIds } });

    if (hotels.length === 0) {
      return res.status(404).json({ message: 'No hotels found with the provided IDs.' });
    }

    const bulkRoomUpdates = [];
    for (const hotel of hotels) {
      if (hotel.rooms && hotel.rooms.length > 0) {
        const updates = hotel.rooms
          .filter(room => room.isOffer)
          .map(room => ({
            updateOne: {
              filter: { hotelId: hotel.hotelId, 'rooms.roomId': room.roomId },
              update: {
                $set: {
                  'rooms.$.isOffer': false,
                  'rooms.$.offerPriceLess': 0,
                  'rooms.$.offerExp': '',
                  'rooms.$.offerName': '',
                  'rooms.$.price': room.price + room.offerPriceLess,
                },
              },
            },
          }));
        bulkRoomUpdates.push(...updates);
      }
    }

    if (bulkRoomUpdates.length > 0) {
      await hotelModel.bulkWrite(bulkRoomUpdates);
    }

  

    const modifiedCount = bulkRoomUpdates.length

    if (modifiedCount === 0) {
      return res.status(200).json({ message: 'No active coupons or room offers found for the provided hotels.' });
    }

    res.status(200).json({ message: 'Active coupons and room offers removed successfully for the selected hotels.' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.changeStatus = async (req, res) => {
  const { hotelIds, isAccepted, soldOut, onFront } = req.body;

  if (!Array.isArray(hotelIds) || hotelIds.some(isNaN)) {
    return res.status(400).json({ message: 'hotelIds must be an array of numeric hotel IDs.' });
  }

  const updates = {};
  if (isAccepted !== undefined) {
    updates.isAccepted = isAccepted;
  }
  if (soldOut !== undefined) {
    updates.soldOut = soldOut;
  }
  if (onFront !== undefined) {
    updates.onFront = onFront;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'At least one of isAccepted, soldOut, or onFront must be provided for update.' });
  }

  try {
    const result = await hotelModel.updateMany(
      { hotelId: { $in: hotelIds } },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'No hotels found with the provided IDs.' });
    }

    res.status(200).json({
      message: `${result.modifiedCount} hotel(s) updated successfully.`,
    });
  } catch (error) {
    console.error('Error updating hotel statuses:', error);
    res.status(500).json({ message: 'Failed to update hotel statuses.' });
  }
};

exports.bulkDelete = async (req, res) => {
  const { hotelIds } = req.body;

  if (!Array.isArray(hotelIds) || hotelIds.some(isNaN)) {
    return res.status(400).json({ message: 'hotelIds must be an array of numeric hotel IDs.' });
  }

  try {
    const result = await hotelModel.deleteMany({ hotelId: { $in: hotelIds } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No hotels found with the provided IDs.' });
    }

    res.status(200).json({
      message: `${result.deletedCount} hotel(s) deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting hotels:', error);
    res.status(500).json({ message: 'Failed to delete hotels.' });
  }
}