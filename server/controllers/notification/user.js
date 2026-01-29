const Notification = require("../../models/notification/user");

exports.pushUserNotification = async (req, res) => {
  const { name, message, userIds, path } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: "User IDs are required" });
  }

  try {
    const seenBy = {};
    userIds.forEach((userId) => {
      seenBy[userId] = false;
    });

    const newNotification = new Notification({
      name,
      message,
      userIds,
      path,
      seenBy,
    });

    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotificationByUser = async function (req, res) {
  const { userId } = req.params;

  // Check for userId validity
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    // Find notifications where userId is included in userIds array
    const notifications = await Notification.find({
      userIds: userId, // Directly match userId in userIds array
    }).lean(); // Use lean() to get plain JavaScript objects

    // Add the 'seen' field based on whether the userId is in the seenBy field
    notifications.forEach((notification) => {
      // Determine if the notification is seen by checking the 'seenBy' object
      notification.seen = notification.seenBy.hasOwnProperty(userId)
        ? notification.seenBy[userId]
        : false;
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error); // Log the error
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserNotificationSeen = async function (req, res) {
  const { notificationId } = req.params;
  const { userId } = req.body;

  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userIds.includes(userId)) {
      notification.seenBy.set(userId, true); // Mark as seen
      await notification.save();
      res.status(200).json(notification);
    } else {
      res
        .status(403)
        .json({ message: "User not associated with this notification" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUserNotification = async (req, res) => {
  const { notificationId } = req.params;
  const findNoti = await Notification.findByIdAndDelete(notificationId);
  return res.status(200).json({ message: "deleted" });
};
