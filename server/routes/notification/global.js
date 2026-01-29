const express = require("express");
const router = express.Router();

const {
  pushGlobalNotification,
  getNotificationsForUser,
  updateNotificationSeen,
  seenByList,
  findAllNotification,
  deleteGlobalNotification,
} = require("../../controllers/notification/global");

router.post(
  "/push-a-new-notification-to-the-panel/dashboard",
  pushGlobalNotification
);
router.get(
  "/push-a-new-notification-to-the-panel/dashboard/get/:userId",
  getNotificationsForUser
);

router.patch(
  "/fetch-all-new-notification-to-the-panel/and-mark-seen/dashboard/:userId/:notificationId/seen",
  updateNotificationSeen
);
router.post("/seen/by/list/of/user/for/notification/userId", seenByList);
router.get("/find/all/by/list/of/user/for/notification", findAllNotification);
router.delete(
  "/find/all/by/list/of/user/for/notification/and-delete-global/:notificationId",
  deleteGlobalNotification
);

module.exports= router