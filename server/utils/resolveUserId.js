const mongoose = require("mongoose");
const userModel = require("../models/user");

const isObjectId = (val) =>
  mongoose.Types.ObjectId.isValid(val) && String(val).length === 24;

/**
 * Resolves any user identifier (numeric userId OR MongoDB _id string) to the
 * canonical numeric userId string stored in the users collection.
 * Returns null if user not found.
 */
const resolveToUserId = async (input) => {
  if (!input) return null;
  const str = String(input).trim();
  const query = isObjectId(str)
    ? { $or: [{ _id: str }, { userId: str }] }
    : { userId: str };
  const user = await userModel.findOne(query).select("userId").lean();
  return user ? String(user.userId) : null;
};

/**
 * Resolves any user identifier (numeric userId OR MongoDB _id string) to the
 * user's MongoDB ObjectId (_id). Returns null if user not found.
 */
const resolveToObjectId = async (input) => {
  if (!input) return null;
  const str = String(input).trim();
  const query = isObjectId(str)
    ? { $or: [{ _id: str }, { userId: str }] }
    : { userId: str };
  const user = await userModel.findOne(query).select("_id").lean();
  return user ? user._id : null;
};

module.exports = { resolveToUserId, resolveToObjectId, isObjectId };
