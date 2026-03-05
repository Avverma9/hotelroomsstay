const mongoose = require("mongoose");

const generateCouponCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const usageHistorySchema = new mongoose.Schema(
  {
    userId: String,
    hotelId: String,
    roomId: String,
    usedAt: {
      type: Date,
      default: Date.now,
    },
    discountPrice: Number,
    finalPrice: Number,
  },
  { _id: false },
);

const couponSchema = new mongoose.Schema(
  {
    couponCode: {
      type: String,
      unique: true,
      length: 6,
      index: true,
    },
    type: {
      type: String,
      enum: ["hotel", "partner", "user"],
      default: "hotel",
      index: true,
    },
    couponName: {
      type: String,
      required: true,
      trim: true,
    },
    discountPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    validity: {
      type: Date,
      required: true,
      index: true,
    },
    expired: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Backward-compatible + input-friendly usage fields
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxUsage: {
      type: Number,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Backward-compatible target fields
    roomId: {
      type: [String],
      default: [],
    },
    hotelId: {
      type: [String],
      default: [],
    },
    userId: String,
    userIds: {
      type: [String],
      default: [],
    },
    assignedTo: String,
    targetUserId: String,

    usageHistory: {
      type: [usageHistorySchema],
      default: [],
    },
  },
  { timestamps: true },
);

couponSchema.pre("save", function onSave(next) {
  if (!this.couponCode) {
    this.couponCode = generateCouponCode();
  }

  const normalizedQuantity = Number.isFinite(Number(this.quantity))
    ? Number(this.quantity)
    : 1;
  const normalizedMaxUsage = Number.isFinite(Number(this.maxUsage))
    ? Number(this.maxUsage)
    : normalizedQuantity;

  this.quantity = Math.max(1, normalizedQuantity);
  this.maxUsage = Math.max(1, normalizedMaxUsage);

  const validityDate = new Date(this.validity);
  const invalidValidity = Number.isNaN(validityDate.getTime());
  const isPastValidity = !invalidValidity && validityDate < new Date();
  const isUsageExceeded =
    Number(this.usedCount || 0) >= Number(this.maxUsage || this.quantity || 1);

  if (invalidValidity || isPastValidity || isUsageExceeded) {
    this.expired = true;
  }

  next();
});

couponSchema.methods.isUsable = function isUsable() {
  if (this.expired) {
    return false;
  }

  const validityDate = new Date(this.validity);
  if (Number.isNaN(validityDate.getTime()) || validityDate < new Date()) {
    return false;
  }

  const usageLimit = Number(this.maxUsage || this.quantity || 1);
  return Number(this.usedCount || 0) < usageLimit;
};

couponSchema.index({ type: 1, validity: 1, expired: 1 });
couponSchema.index({ type: 1, assignedTo: 1 });
couponSchema.index({ type: 1, targetUserId: 1 });

module.exports = mongoose.model("Coupon", couponSchema);
