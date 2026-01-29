const Notification = require("../../models/notification/global");
const UserNotifi = require("../../models/notification/user");
const User = require("../../models/dashboardUser")
exports.pushGlobalNotification = async function (req, res) {
  try {
    const { name, message, path } = req.body;
    if (!name || !message) {
      return res
        .status(400)
        .json({ message: "Name and message are required." });
    }

    const newNotification = new Notification({
      name,
      message,
      path,
    });

    await newNotification.save();
    res.status(201).json({ message: "Notification created successfully." });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getNotificationsForUser = async function (req, res) {
  const { userId } = req.params;

  try {
    // Fetch all notifications
    const notifications = await Notification.find();
 
    // Format notifications to include seen status for the user
    const formattedNotifications = notifications.map((notification) => ({
      ...notification.toObject(),
      seen: notification.seenBy.get(userId) || false,
    }));

    res.status(200).json(formattedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateNotificationSeen = async function (req, res) {
  const { userId, notificationId } = req.params;

  try {
    // Update the notification to mark it as seen by the given userId
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        $set: { [`seenBy.${userId}`]: true }, // Set seen status for the userId
        $addToSet: { userIds: userId }, // Add userId to userIds array if it's not already present
      },
      { new: true, runValidators: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.status(200).json({ message: "Notification updated successfully." });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Server error" });
  }
};


//====================================Seen by ==============================

exports.seenByList = async function (req, res) {
  const { userIds } = req.body; // Assuming userIds are sent in the request body
  if (!Array.isArray(userIds) || userIds.some((id) => typeof id !== "string")) {
    return res.status(400).json({ message: "Invalid userIds format" });
  }

  try {
    const users = await User.find({ _id: { $in: userIds } });
    const userData = users.map((user) => ({
      id: user._id,
      name: user.name,
      mobile: user.mobile,
    }));
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error" });
  }
};


//=======================================get all notification=============================
exports.findAllNotification = async (req,res)=>{
  const user = await UserNotifi.find()
  const global = await Notification.find()
  return res.json({ User: user, Global: global });
}


exports.deleteGlobalNotification = async (req, res) => {
  const { notificationId } = req.params;
  const findNoti = await Notification.findByIdAndDelete(notificationId);
  return res.status(200).json({ message: "deleted" });
};
