const express = require("express");
const router = express.Router();
const {
  getNotificationByUser,
  updateUserNotificationSeen,
  pushUserNotification,
  deleteUserNotification,
} = require("../../controllers/notification/user");

router.post(
  "/push-a-new-notification-to-the-panel/dashboard/user",
  pushUserNotification
);
router.get(
  "/fetch-all-new-notification-to-the-panel/dashboard/get/:userId",
  getNotificationByUser
);
router.patch(
  "/fetch-all-new-notification-to-the-panel/and-mark-seen/dashboard-user/notification/:notificationId/seen",
  updateUserNotificationSeen
);
router.delete(
  "/find/all/by/list/of/user/for/notification/and-delete/user/:notificationId",
  deleteUserNotification
);

module.exports=router