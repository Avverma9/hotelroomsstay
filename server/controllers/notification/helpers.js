const Notification = require("../../models/notification/user");

const normalizeUserIds = (userIds) => {
  if (!Array.isArray(userIds)) {
    return [];
  }

  const cleaned = userIds
    .map((userId) => String(userId || "").trim())
    .filter(Boolean);

  return [...new Set(cleaned)];
};

const createUserNotification = async ({
  name,
  message,
  path = "/app/notifications",
  eventType = "general",
  metadata = {},
  userIds = [],
}) => {
  const normalizedUserIds = normalizeUserIds(userIds);

  if (!name || !message || normalizedUserIds.length === 0) {
    throw new Error("name, message and at least one userId are required");
  }

  const seenBy = {};
  normalizedUserIds.forEach((userId) => {
    seenBy[userId] = false;
  });

  const payload = {
    name,
    message,
    path,
    eventType,
    metadata,
    userIds: normalizedUserIds,
    seenBy,
  };

  return Notification.create(payload);
};

const createUserNotificationSafe = async (payload) => {
  try {
    return await createUserNotification(payload);
  } catch (error) {
    console.error("Failed to create user notification:", error.message);
    return null;
  }
};

module.exports = {
  normalizeUserIds,
  createUserNotification,
  createUserNotificationSafe,
};
