const Notification = require("../../models/notification/user");
const mongoose = require("mongoose");
const {
  createUserNotification,
  normalizeUserIds,
} = require("./helpers");

exports.pushUserNotification = async (req, res) => {
  const { name, message, userIds, userId, path, eventType, metadata } =
    req.body;
  const targetUserIds = normalizeUserIds(
    Array.isArray(userIds) ? userIds : [userId]
  );

  if (targetUserIds.length === 0) {
    return res.status(400).json({ message: "User IDs are required" });
  }

  try {
    const newNotification = await createUserNotification({
      name,
      message,
      path,
      eventType,
      metadata,
      userIds: targetUserIds,
    });

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
    const normalizedUserId = String(userId);
    const userIdCandidates = [normalizedUserId];
    if (mongoose.Types.ObjectId.isValid(normalizedUserId)) {
      userIdCandidates.push(new mongoose.Types.ObjectId(normalizedUserId));
    }

    const notifications = await Notification.find({
      userIds: { $in: userIdCandidates },
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedNotifications = notifications.map((notification) => {
      const seenBy =
        notification.seenBy instanceof Map
          ? Object.fromEntries(notification.seenBy)
          : notification.seenBy || {};

      return {
        ...notification,
        seen: seenBy[normalizedUserId] === true,
      };
    });

    res.json(formattedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserNotificationSeen = async function (req, res) {
  const { notificationId } = req.params;
  const userId = req.body.userId || req.params.userId;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const normalizedUserId = String(userId);
    const userIdCandidates = [normalizedUserId];
    if (mongoose.Types.ObjectId.isValid(normalizedUserId)) {
      userIdCandidates.push(new mongoose.Types.ObjectId(normalizedUserId));
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userIds: { $in: userIdCandidates } },
      {
        $set: {
          [`seenBy.${normalizedUserId}`]: true,
        },
      },
      { new: true }
    );

    if (!notification) {
      res
        .status(404)
        .json({ message: "Notification not found for this user" });
      return;
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUserNotification = async (req, res) => {
  const { notificationId } = req.params;
  const findNoti = await Notification.findByIdAndDelete(notificationId);
  return res.status(200).json({ message: "deleted" });
};
