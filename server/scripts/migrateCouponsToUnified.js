const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Coupon = require("../models/coupons/coupon");

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return [String(value)];
};

const migrateLegacyCollection = async ({ collectionName, type }) => {
  const legacyRows = await mongoose.connection.collection(collectionName).find({}).toArray();
  let created = 0;
  let skipped = 0;

  for (const row of legacyRows) {
    const couponCode = String(row.couponCode || "").trim();
    if (!couponCode) {
      skipped += 1;
      continue;
    }

    const existing = await Coupon.findOne({ couponCode, type }).lean();
    if (existing) {
      skipped += 1;
      continue;
    }

    const quantity = Number(row.quantity || 1);
    const usedCount =
      Number(row.usedCount || 0) > 0
        ? Number(row.usedCount)
        : row.expired === true
          ? Math.max(1, quantity)
          : 0;

    await Coupon.create({
      couponCode,
      type,
      couponName: row.couponName || "Legacy Coupon",
      discountPrice: Number(row.discountPrice || 0),
      validity: row.validity ? new Date(row.validity) : new Date(),
      expired: Boolean(row.expired),
      quantity: Math.max(1, quantity),
      maxUsage: Math.max(1, Number(row.maxUsage || quantity || 1)),
      usedCount,
      roomId: normalizeArray(row.roomId),
      hotelId: normalizeArray(row.hotelId),
      userId: row.userId ? String(row.userId) : undefined,
      userIds: normalizeArray(row.userIds),
      assignedTo: row.assignedTo || undefined,
      targetUserId: row.targetUserId || row.userId || undefined,
      usageHistory: Array.isArray(row.usageHistory) ? row.usageHistory : [],
      createdAt: row.createdAt || undefined,
      updatedAt: row.updatedAt || undefined,
    });

    created += 1;
  }

  return { collectionName, type, total: legacyRows.length, created, skipped };
};

const run = async () => {
  try {
    await connectDB();

    const [userResult, partnerResult] = await Promise.all([
      migrateLegacyCollection({ collectionName: "usercoupons", type: "user" }),
      migrateLegacyCollection({ collectionName: "partnercoupons", type: "partner" }),
    ]);

    console.log("Legacy coupon migration done:");
    console.table([userResult, partnerResult]);
  } catch (error) {
    console.error("Failed to migrate legacy coupons:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
