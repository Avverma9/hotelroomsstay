const mongoose = require("mongoose");
const booking = require("../models/booking/booking");
const userModel = require("../models/user");
const { resolveToUserId } = require("../utils/resolveUserId");
const Coupon = require("../models/coupons/coupon");
const Complaint = require("../models/complaints/complaint");
const CarBooking = require("../models/travel/carBooking");
const TourBooking = require("../models/tour/booking");
const Review = require('../models/review');
const DashUser = require('../models/dashboardUser');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
require("dotenv").config();
const otpAuth = require("../authentication/otpLogin");
const { generateOtp, sendOtpEmail } = require("../nodemailer/nodemailer");
const {
  createUserNotificationSafe,
} = require("./notification/helpers");

const generateUserTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "15d" },
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "2d" },
  );
  return { accessToken, refreshToken };
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ensureWelcomeCouponForUser = async ({ email, userId }) => {
  if (!email || !userId) {
    return null;
  }

  const existingCoupon = await Coupon.findOne({
    type: "user",
    assignedTo: { $regex: `^${email}$`, $options: "i" },
  });

  if (existingCoupon) {
    return null;
  }

  const validity = new Date();
  validity.setDate(validity.getDate() + 7);

  const coupon = await Coupon.create({
    type: "user",
    couponName: "Welcome50",
    discountPrice: 50,
    validity,
    quantity: 1,
    maxUsage: 1,
    assignedTo: email,
    userId: String(userId),
    targetUserId: String(userId),
  });

  await createUserNotificationSafe({
    name: "Coupon Received",
    message: `Welcome! You received coupon ${coupon.couponCode} worth Rs ${coupon.discountPrice}. Valid till ${formatDate(coupon.validity)}.`,
    path: "/app/coupons",
    eventType: "coupon_assigned",
    metadata: {
      couponCode: coupon.couponCode,
      discountPrice: coupon.discountPrice,
      validity: coupon.validity,
    },
    userIds: [String(userId)],
  });

  return coupon;
};

const ensureWelcomeCouponForUserSafe = async ({ email, userId }) => {
  try {
    return await ensureWelcomeCouponForUser({ email, userId });
  } catch (error) {
    console.error("Failed to create welcome coupon:", error.message);
    return null;
  }
};

const isBcryptHash = (value) => typeof value === "string" && value.startsWith("$2");

const sanitizeUser = (user) => {
  if (!user) return user;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

const hashPassword = async (plain) => {
  // bcrypt with cost 10 is a reasonable baseline for this project.
  return bcrypt.hash(String(plain), 10);
};

const passwordsMatch = async (stored, candidate) => {
  if (!stored) return false;
  const storedStr = String(stored);
  const candStr = String(candidate ?? "");
  if (!candStr) return false;
  if (isBcryptHash(storedStr)) {
    return bcrypt.compare(candStr, storedStr);
  }
  // Legacy plaintext support (will be migrated on successful sign-in).
  return storedStr === candStr;
};

const generateTempPassword = (length = 10) => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
};

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const buildPasswordResetToken = (userId) =>
  jwt.sign(
    { userId: String(userId), purpose: "user_password_reset" },
    process.env.JWT_SECRET,
    { expiresIn: "10m" },
  );

const createSignup = async function (req, res) {
  try {
    const { email, mobile } = req.body;

    if (email) {
      const findWithEmail = await userModel.findOne({
        email: { $regex: `^${email}$`, $options: "i" },
      });
      if (findWithEmail) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    if (mobile) {
      const findWithMobile = await userModel.findOne({ mobile });
      if (findWithMobile) {
        return res.status(400).json({ message: "Mobile number is already in use" });
      }
    }

    const images = req.files ? req.files.map((file) => file.location) : [];

    const userData = { images, ...req.body };
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }

    const savedUser = await userModel.create(userData);
    await ensureWelcomeCouponForUserSafe({
      email: savedUser.email,
      userId: savedUser.userId,
    });

    return res.status(201).json({
      status: true,
      message: "User has been created successfully",
      data: sanitizeUser(savedUser),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "Something went wrong while creating the user",
    });
  }
};

// User auth: forgot password (send OTP via email or mobile)
// POST /auth/user/forgot-password/send-otp
const userForgotPasswordSendOtp = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body || {};

    if (!email && !phoneNumber) {
      return res.status(400).json({ message: "Email or phoneNumber is required" });
    }

    if (email) {
      const normalizedEmail = String(email).trim();
      const emailRegex = new RegExp("^" + normalizedEmail + "$", "i");
      const found = await userModel.findOne({ email: emailRegex });
      if (!found) {
        return res.status(400).json({ message: "No user account found with this email" });
      }

      const otp = String(generateOtp());
      found.resetOtpHash = hashOtp(otp);
      found.resetOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
      await found.save();

      await sendOtpEmail(normalizedEmail, otp, { skipRegisteredCheck: true });
      return res.status(200).json({ message: "OTP sent successfully" });
    }

    // Mobile flow uses Twilio Verify (no need to store OTP).
    const raw = String(phoneNumber || "").trim();
    if (!raw) return res.status(400).json({ message: "phoneNumber is required" });

    const modifiedNumber = raw.replace(/\D/g, "").slice(-10);
    const user = await userModel.findOne({ mobile: { $regex: `${modifiedNumber}$` } });
    if (!user) {
      return res.status(404).json({ message: "Please register yourself" });
    }

    const result = await otpAuth.sendOtp(raw);
    return res.status(200).json(result);
  } catch (error) {
    console.error("userForgotPasswordSendOtp error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// User auth: forgot password (verify OTP, returns resetToken)
// POST /auth/user/forgot-password/verify-otp
const userForgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { email, otp, phoneNumber } = req.body || {};

    if (!otp || (!email && !phoneNumber)) {
      return res.status(400).json({ message: "OTP and (email or phoneNumber) are required" });
    }

    if (email) {
      const normalizedEmail = String(email).trim();
      const emailRegex = new RegExp("^" + normalizedEmail + "$", "i");
      const found = await userModel.findOne({ email: emailRegex });
      if (!found) {
        return res.status(400).json({ message: "No user account found with this email" });
      }

      if (!found.resetOtpHash || !found.resetOtpExpiry) {
        return res.status(400).json({ message: "OTP not requested. Please request a new OTP." });
      }
      if (new Date() > new Date(found.resetOtpExpiry)) {
        found.resetOtpHash = null;
        found.resetOtpExpiry = null;
        await found.save();
        return res.status(400).json({ message: "OTP has expired" });
      }

      if (hashOtp(otp) !== found.resetOtpHash) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Consume OTP; issue short-lived reset token
      found.resetOtpHash = null;
      found.resetOtpExpiry = null;
      await found.save();

      return res.status(200).json({
        message: "OTP verified",
        resetToken: buildPasswordResetToken(found.userId),
      });
    }

    // Mobile verify via Twilio
    const raw = String(phoneNumber || "").trim();
    const result = await otpAuth.verifyOtp(raw, String(otp));
    if (!result || result?.success === false) {
      return res.status(400).json({ message: result?.message || "Invalid or expired OTP." });
    }

    const modifiedNumber = raw.replace(/\D/g, "").slice(-10);
    const user = await userModel.findOne({ mobile: { $regex: `${modifiedNumber}$` } });
    if (!user) {
      return res.status(404).json({ message: "Please register yourself" });
    }

    return res.status(200).json({
      message: "OTP verified",
      resetToken: buildPasswordResetToken(user.userId),
    });
  } catch (error) {
    console.error("userForgotPasswordVerifyOtp error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// User auth: forgot password (reset with confirm)
// POST /auth/user/forgot-password/reset
const userForgotPasswordReset = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body || {};

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "resetToken, newPassword, confirmPassword are required" });
    }
    if (String(newPassword) !== String(confirmPassword)) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    let decoded;
    try {
      decoded = jwt.verify(String(resetToken), process.env.JWT_SECRET);
    } catch (e) {
      return res.status(403).json({ message: "Invalid or expired reset token" });
    }

    if (!decoded?.userId || decoded?.purpose !== "user_password_reset") {
      return res.status(403).json({ message: "Invalid reset token" });
    }

    const canonicalUserId = await resolveToUserId(decoded.userId);
    if (!canonicalUserId) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashed = await hashPassword(newPassword);
    const updated = await userModel.findOneAndUpdate(
      { userId: String(canonicalUserId) },
      { $set: { password: hashed, refreshToken: null, resetOtpHash: null, resetOtpExpiry: null } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    await createUserNotificationSafe({
      name: "Password Reset",
      message: "Your password was reset successfully. If this was not you, contact support immediately.",
      path: "/app/profile/security",
      eventType: "password_reset",
      metadata: { resetAt: new Date() },
      userIds: [String(updated.userId)],
    });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("userForgotPasswordReset error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const GoogleSignIn = async function (req, res) {
  try {
    const { email, uid, userName, images } = req.body;

    const existingUser = await userModel.findOne({
      $or: [{ email: { $regex: `^${email}$`, $options: "i" } }, { uid }],
    });

    if (existingUser) {
      const { accessToken, refreshToken } = generateUserTokens(existingUser.userId);
      existingUser.refreshToken = refreshToken;
      await existingUser.save();
      return res.status(201).json({
        message: "User already exists",
        _id: existingUser._id,
        userId: existingUser.userId,
        mobile: existingUser.mobile,
        name: existingUser.userName,
        email: existingUser.email,
        rsToken: accessToken,
        refreshToken,
      });
    }

    const user = await userModel.create({ email, uid, userName, images });
    await ensureWelcomeCouponForUserSafe({
      email: user.email,
      userId: user.userId,
    });

    const { accessToken, refreshToken } = generateUserTokens(user.userId);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      message: "Sign-in successful",
      _id: user._id,
      userId: user.userId,
      name: user.userName,
      rsToken: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginWithOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const modifiedNumber = phoneNumber.replace(/\D/g, "").slice(-10);

    const user = await userModel.findOne({
      mobile: { $regex: `${modifiedNumber}$` },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Please register yourself" });
    }

    const result = await otpAuth.sendOtp(phoneNumber);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    const result = await otpAuth.verifyOtp(phoneNumber, code);

    if (!result.success) {
      return res
        .status(400)
        .json({ success: false, message: "OTP verification failed" });
    }

    const modifiedNumber = phoneNumber.replace(/\D/g, "").slice(-10);
    const user = await userModel.findOne({
      mobile: { $regex: `${modifiedNumber}$` },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { accessToken, refreshToken } = generateUserTokens(user.userId);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      result,
      _id: user._id,
      userId: user.userId,
      mobile: user.mobile,
      email: user.email,
      rsToken: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const signIn = async function (req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await passwordsMatch(user.password, password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // Migrate legacy plaintext passwords to bcrypt on successful login.
    if (user.password && !isBcryptHash(user.password)) {
      user.password = await hashPassword(password);
    }

    const { accessToken, refreshToken } = generateUserTokens(user.userId);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: "Sign-in successful",
      _id: user._id,
      userId: user.userId,
      mobile: user.mobile,
      name: user.userName,
      email: user.email,
      rsToken: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Sign-in error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUserById = async function (req, res) {
  try {
    const { userId } = req.params;

    const isObjId = mongoose.Types.ObjectId.isValid(userId) && String(userId).length === 24;
    const userQuery = isObjId ? { $or: [{ userId }, { _id: userId }] } : { userId };
    const checkData = await userModel.findOne(userQuery).select("-password -refreshToken");

    if (!checkData) {
      return res.status(404).json({
        status: false,
        message: "userId does not exist",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Users Profile Details",
      data: checkData,
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

const totalUser = async function (req, res) {
  try {
    const count = await userModel.countDocuments({});
    res.status(200).json(count);
  } catch (error) {
    console.error("Error fetching total users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const update = async (req, res) => {
  try {
    const { userId, userName, address, email, mobile, password } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const isObjId = mongoose.Types.ObjectId.isValid(userId) && String(userId).length === 24;
    const userLookupQuery = isObjId ? { $or: [{ userId }, { _id: userId }] } : { userId };
    const existingUser = await userModel.findOne(userLookupQuery);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use the canonical numeric userId for all subsequent queries
    const canonicalUserId = existingUser.userId;

    if (email) {
      const findWithEmail = await userModel.findOne({
        email: { $regex: `^${email}$`, $options: "i" },
        userId: { $ne: canonicalUserId },
      });
      if (findWithEmail) {
        return res
          .status(400)
          .json({ message: "Email is already in use by another user" });
      }
    }

    if (mobile) {
      const findWithMobile = await userModel.findOne({
        mobile,
        userId: { $ne: canonicalUserId },
      });
      if (findWithMobile) {
        return res
          .status(400)
          .json({ message: "Mobile number is already in use by another user" });
      }
    }

    const hasPasswordField = Object.prototype.hasOwnProperty.call(
      req.body,
      "password"
    );
    const passwordProvided = password !== undefined && String(password ?? "").trim() !== "";
    const isPasswordChanged =
      hasPasswordField && passwordProvided && !(await passwordsMatch(existingUser.password, password));

    let images = existingUser.images || [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.location);
    }

    const updateData = { images };
    if (userName !== undefined) updateData.userName = userName;
    if (address !== undefined) updateData.address = address;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (passwordProvided) updateData.password = await hashPassword(password);

    const updatedUser = await userModel.findOneAndUpdate(
      { userId: canonicalUserId },
      { $set: updateData },
      { new: true }
    );

    if (updatedUser) {
      if (isPasswordChanged) {
        await createUserNotificationSafe({
          name: "Password Changed",
          message:
            "Your account password was changed successfully. If this was not you, contact support immediately.",
          path: "/app/profile/security",
          eventType: "password_changed",
          metadata: { changedAt: new Date() },
          userIds: [String(updatedUser.userId)],
        });
      }
      return res.json(sanitizeUser(updatedUser));
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

// Admin-only: generate a new temporary password and return it once.
// This avoids exposing stored passwords and fixes legacy plaintext handling.
const adminResetUserPassword = async (req, res) => {
  try {
    const actorId = req.user?.id;
    if (!actorId) {
      return res.status(401).json({ message: "Access denied: No token provided" });
    }

    const claimedRole = String(req.user?.role || "").toLowerCase();
    const allowedRoles = new Set(["admin", "superadmin"]);

    // Prefer role embedded in the dashboard JWT (generated by dashboard login).
    // Fallback to DB lookup if role claim is missing.
    if (!allowedRoles.has(claimedRole)) {
      const isObjId = mongoose.Types.ObjectId.isValid(actorId) && String(actorId).length === 24;
      const actor = isObjId
        ? await DashUser.findById(actorId).select("role").lean()
        : null;
      const dbRole = String(actor?.role || "").toLowerCase();
      if (!allowedRoles.has(dbRole)) {
        return res.status(403).json({ message: "Access denied: admin only" });
      }
    }

    const { userId, length } = req.body || {};
    const canonicalUserId = await resolveToUserId(userId);
    if (!canonicalUserId) {
      return res.status(404).json({ message: "User not found" });
    }

    const len = Math.max(8, Math.min(Number(length) || 10, 32));
    const tempPassword = generateTempPassword(len);
    const hashed = await hashPassword(tempPassword);

    const updated = await userModel.findOneAndUpdate(
      { userId: String(canonicalUserId) },
      { $set: { password: hashed, refreshToken: null } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    await createUserNotificationSafe({
      name: "Password Reset",
      message: "Your account password was reset by an administrator. Please sign in again.",
      path: "/app/profile/security",
      eventType: "password_reset_admin",
      metadata: { resetAt: new Date() },
      userIds: [String(canonicalUserId)],
    });

    return res.status(200).json({
      success: true,
      userId: String(canonicalUserId),
      tempPassword,
      message: "Temporary password generated. Share it securely with the user.",
    });
  } catch (error) {
    console.error("adminResetUserPassword error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    // Load all users (note: for large datasets this may need pagination)
    const users = await userModel.find().select("-password -refreshToken").lean();

    if (!users || users.length === 0) {
      return res.status(200).json({ message: 'No users found', data: [] });
    }

    const userIds = users.map((u) => String(u.userId));
    const emails = users.map((u) => u.email).filter(Boolean).map((e) => String(e).toLowerCase());
    const mobiles = users.map((u) => u.mobile).filter(Boolean).map((m) => String(m));

    // Fetch bookings, coupons, reviews, complaints and dashboard users in parallel for all users
    const [hotelBks, tourBks, taxiBks, coupons, userDocs, reviews, dashUsers] = await Promise.all([
      // Fetch full hotel booking documents for these users
      booking
        .find({ 'user.userId': { $in: userIds } })
        .sort({ createdAt: -1 })
        .lean(),
      // Full tour booking docs
      TourBooking
        .find({ userId: { $in: userIds } })
        .sort({ createdAt: -1 })
        .lean(),
      // Full taxi/travel booking docs
      CarBooking
        .find({ userId: { $in: userIds } })
        .sort({ createdAt: -1 })
        .lean(),
      // Coupons related to these users
      Coupon
        .find({
          $or: [
            { userId: { $in: userIds } },
            { targetUserId: { $in: userIds } },
            { userIds: { $in: userIds } },
          ],
        })
        .sort({ createdAt: -1 })
        .lean(),
      // Helper doc to map ObjectId -> userId for complaints
      userModel.find({ userId: { $in: userIds } }).select('_id userId').lean(),
      // Reviews written by these users
      Review.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean(),
      // Dashboard users (role info) matched by email or mobile when available
      DashUser.find({
        $or: [
          ...(emails.length ? [{ email: { $in: emails } }] : []),
          ...(mobiles.length ? [{ mobile: { $in: mobiles } }] : []),
        ],
      }).select('email mobile role').lean(),
    ]);

    // Complaints need user _ids (objectId) mapping
    const objectIds = (userDocs || []).map((d) => d._id).filter(Boolean);
    const complaintsList = objectIds.length
      ? await Complaint.find({ userId: { $in: objectIds } })
          .populate('userId', 'userId userName email mobile')
          .select('complaintId regarding hotelName bookingId status issue images createdAt updatedAt userId')
          .sort({ createdAt: -1 })
          .lean()
      : [];

    // Index results by userId for fast lookup
    const hotelBkByUser = {};
    const tourBkByUser = {};
    const taxiBkByUser = {};
    const couponsByUser = {};
    const complaintsByUser = {};

    (hotelBks || []).forEach((b) => {
      const uid = String(b.user?.userId || '');
      (hotelBkByUser[uid] = hotelBkByUser[uid] || []).push(b);
    });
    (tourBks || []).forEach((b) => {
      const uid = String(b.userId || '');
      (tourBkByUser[uid] = tourBkByUser[uid] || []).push(b);
    });
    (taxiBks || []).forEach((b) => {
      const uid = String(b.userId || '');
      (taxiBkByUser[uid] = taxiBkByUser[uid] || []).push(b);
    });
    (coupons || []).forEach((c) => {
      const uid = String(c.targetUserId || c.userId || '');
      (couponsByUser[uid] = couponsByUser[uid] || []).push(c);
    });
    (complaintsList || []).forEach((c) => {
      const uid = String(c.userId?.userId || '');
      (complaintsByUser[uid] = complaintsByUser[uid] || []).push(c);
    });

    // Build fast lookup for dashboard roles by email/mobile
    const dashByEmail = {};
    const dashByMobile = {};
    (dashUsers || []).forEach((d) => {
      if (d.email) dashByEmail[String(d.email).toLowerCase()] = d;
      if (d.mobile) dashByMobile[String(d.mobile)] = d;
    });

    // Index reviews by userId
    const reviewsByUser = {};
    (reviews || []).forEach((r) => {
      const uid = String(r.userId || '');
      (reviewsByUser[uid] = reviewsByUser[uid] || []).push(r);
    });

    // Map users to enriched payload
    const data = users.map((user) => {
      const uid = String(user.userId);
      // determine role: prefer dashboard user role (matched by email/mobile), fall back to user.role
      const emailKey = user.email ? String(user.email).toLowerCase() : null;
      const mobileKey = user.mobile ? String(user.mobile) : null;
      const dashMatch = (emailKey && dashByEmail[emailKey]) || (mobileKey && dashByMobile[mobileKey]) || null;
      const resolvedRole = user.role || (dashMatch && dashMatch.role) || null;

      return {
        userId: user.userId,
        uid: user.uid,
        name: user.userName,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        avatar: user.images,
        role: resolvedRole,
        joinedAt: user.createdAt,
        bookings: {
          hotel: hotelBkByUser[uid] || [],
          tour: tourBkByUser[uid] || [],
          taxi: taxiBkByUser[uid] || [],
        },
        coupons: couponsByUser[uid] || [],
        complaints: complaintsByUser[uid] || [],
        reviews: reviewsByUser[uid] || [],
      };
    });

    return res.status(200).json({ message: 'User data fetched successfully', data });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

const findUser = async (req, res) => {
  try {
    const { mobile, email } = req.query;

    let query = {};
    if (mobile) {
      query.mobile = mobile;
    }
    if (email) {
      query.email = { $regex: `^${email}$`, $options: "i" };
    }

    const findUserData = await userModel.find(query).select("-password -refreshToken").lean();

    if (findUserData.length > 0) {
      return res.status(200).json({ success: true, data: findUserData });
    } else {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllUserBulkById = async (req, res) => {
  try {
    const { userIds } = req.body;

    const users = await userModel
      .find({ userId: { $in: userIds } })
      .select("userName mobile");

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users by IDs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllUserDetails = async (req, res) => {
  try {
    const users = await userModel.find().select("-password -refreshToken").lean();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    const userData = await Promise.all(
      users.map(async (user) => {
        const bookings = await booking.find(
          { "user.userId": user.userId },
          {
            _id: 0,
            bookingId: 1,
            checkInDate: 1,
            checkOutDate: 1,
            bookingStatus: 1,
            price: 1,
            roomDetails: 1,
            hotelDetails: {
              hotelName: 1,
              hotelCity: 1,
              hotelEmail: 1,
            },
          }
        );

        return {
          userId: user.userId,
          name: user.userName,
          email: user.email,
          mobile: user.mobile,
          profile: user?.images,
          address: user?.address,
          bookings,
        };
      })
    );

    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================================================================
   ADMIN: Filter Users with Bookings, Coupons, Complaints
   GET /admin/users/filter

   Query params (all optional, combinable):
     -- User search --
     userId          exact userId
     bookingId       any booking ID across hotel/tour/taxi (exact)
     email           partial, case-insensitive
     mobile          partial

     -- Booking sub-filters (applied only when bookings tab is needed) --
     serviceType     hotel | tour | taxi  (filters which collection to show)
     bookingStatus   Confirmed | Checked-In | Checked-Out | Cancelled | Failed
                     (for tour: confirmed | cancelled | failed | pending)

     -- Coupon sub-filter --
     couponStatus    active | used

     -- Complaint sub-filter --
     complaintStatus Pending | Working | Closed (Resolved)

     -- Pagination --
     page            (default: 1)
     limit           (default: 20, max: 100)
================================================================ */
const filterUsers = async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      email,
      mobile,
      serviceType,
      bookingStatus,
      couponStatus,
      complaintStatus,
      page = 1,
      limit = 20,
    } = req.query;

    const resolvedLimit = Math.min(Number(limit) || 20, 100);
    const resolvedPage  = Math.max(Number(page)  || 1,  1);
    const skip = (resolvedPage - 1) * resolvedLimit;

    /* ── Step 1: Resolve userId from bookingId if provided ─────────── */

    let resolvedUserId = userId ? String(userId).trim() : null;

    if (!resolvedUserId && bookingId) {
      const bid = String(bookingId).trim();

      // Search across all 3 booking collections in parallel
      const [hotelBk, tourBk, travelBk] = await Promise.all([
        booking.findOne({ bookingId: bid }).select("user.userId userId").lean(),
        TourBooking.findOne({ bookingCode: bid }).select("userId").lean(),
        CarBooking.findOne({ bookingId: bid }).select("userId").lean(),
      ]);

      const found = hotelBk || tourBk || travelBk;
      if (!found) {
        return res.status(200).json({
          success: true,
          total: 0,
          page: resolvedPage,
          totalPages: 0,
          data: [],
          message: "No user found for the given bookingId",
        });
      }

      resolvedUserId =
        String(hotelBk?.user?.userId || hotelBk?.userId || found.userId || "").trim();
    }

    /* ── Step 2: Build user query ──────────────────────────────────── */

    const userQuery = {};

    if (resolvedUserId) {
      userQuery.userId = resolvedUserId;
    } else {
      if (email)  userQuery.email  = { $regex: String(email).trim(),  $options: "i" };
      if (mobile) userQuery.mobile = { $regex: String(mobile).trim(), $options: "i" };
    }

    // If no filter given at all, return paginated user list
    const [users, total] = await Promise.all([
      userModel.find(userQuery)
        .select("userId uid userName email mobile address images createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resolvedLimit)
        .lean(),
      userModel.countDocuments(userQuery),
    ]);

    if (!users.length) {
      return res.status(200).json({
        success: true,
        total: 0,
        page: resolvedPage,
        totalPages: 0,
        data: [],
        message: "No users found",
      });
    }

    const userIds = users.map((u) => String(u.userId));

    /* ── Step 3: Fetch bookings per serviceType + bookingStatus ─────── */

    const buildBookingResults = async () => {
      const normalizedService = String(serviceType || "").toLowerCase();
      const results = {};

      const hotelStatusMap = new Set([
        "Confirmed", "Checked-in", "Checked-out",
        "Cancelled", "Failed", "Pending", "No-Show",
      ]);
      const tourStatusMap  = new Set(["pending", "held", "confirmed", "cancelled", "failed"]);
      const travelStatusMap = new Set(["Pending", "Confirmed", "Completed", "Cancelled", "Failed"]);

      // ─ Hotel ─
      if (!normalizedService || normalizedService === "hotel") {
        const hotelFilter = { "user.userId": { $in: userIds } };
        if (bookingStatus && hotelStatusMap.has(bookingStatus)) {
          hotelFilter.bookingStatus = bookingStatus;
        }
        results.hotel = await booking
          .find(hotelFilter)
          .select("bookingId user.userId bookingStatus checkInDate checkOutDate price hotelDetails.hotelName createdAt")
          .sort({ createdAt: -1 })
          .lean();
      }

      // ─ Tour ─
      if (!normalizedService || normalizedService === "tour") {
        // Map frontend-friendly status names to tour schema values
        const tourStatus = bookingStatus
          ? bookingStatus.toLowerCase()
          : null;
        const tourFilter = { userId: { $in: userIds } };
        if (tourStatus && tourStatusMap.has(tourStatus)) {
          tourFilter.status = tourStatus;
        }
        results.tour = await TourBooking
          .find(tourFilter)
          .select("bookingCode userId status totalAmount tourStartDate travelAgencyName createdAt")
          .sort({ createdAt: -1 })
          .lean();
      }

      // ─ Taxi / Travel ─
      if (!normalizedService || normalizedService === "taxi") {
        const travelFilter = { userId: { $in: userIds } };
        if (bookingStatus && travelStatusMap.has(bookingStatus)) {
          travelFilter.bookingStatus = bookingStatus;
        }
        results.taxi = await CarBooking
          .find(travelFilter)
          .select("bookingId userId bookingStatus pickupP dropP price paymentMode isPaid createdAt")
          .sort({ createdAt: -1 })
          .lean();
      }

      return results;
    };

    /* ── Step 4: Fetch coupons ─────────────────────────────────────── */

    const buildCouponResults = async () => {
      const couponFilter = {
        $or: [
          { userId: { $in: userIds } },
          { targetUserId: { $in: userIds } },
          { userIds: { $in: userIds } },
        ],
      };

      const now = new Date();
      if (couponStatus === "active") {
        couponFilter.expired = { $ne: true };
        couponFilter.validity = { $gte: now };
      } else if (couponStatus === "used") {
        couponFilter.$and = [
          ...(couponFilter.$and || []),
          {
            $or: [
              { expired: true },
              { validity: { $lt: now } },
              { $expr: { $gte: ["$usedCount", "$maxUsage"] } },
            ],
          },
        ];
      }

      return Coupon
        .find(couponFilter)
        .select("couponCode couponName discountPrice validity expired usedCount maxUsage type userId targetUserId")
        .sort({ createdAt: -1 })
        .lean();
    };

    /* ── Step 5: Fetch complaints ──────────────────────────────────── */

    const buildComplaintResults = async () => {
      // Complaint.userId is ObjectId ref but userId on user model is a String.
      // Look up user _ids first, then query complaints.
      const userDocs = await userModel
        .find({ userId: { $in: userIds } })
        .select("_id userId")
        .lean();

      const objectIds = userDocs.map((u) => u._id);
      if (!objectIds.length) return [];

      const complaintFilter = { userId: { $in: objectIds } };

      // Normalise complaint status aliases
      const statusAliases = {
        closed:   "Resolved",
        resolved: "Resolved",
        working:  "Working",
        pending:  "Pending",
      };
      const normalizedComplaintStatus =
        complaintStatus
          ? statusAliases[complaintStatus.toLowerCase()] || complaintStatus
          : null;

      if (normalizedComplaintStatus) {
        complaintFilter.status = normalizedComplaintStatus;
      }

      return Complaint
        .find(complaintFilter)
        .populate("userId", "userId userName email mobile")
        .select("complaintId regarding hotelName bookingId status issue images createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean();
    };

    /* ── Step 6: Run all fetches in parallel ───────────────────────── */

    const [bookings, coupons, complaints] = await Promise.all([
      buildBookingResults(),
      buildCouponResults(),
      buildComplaintResults(),
    ]);

    /* ── Step 7: Shape response ────────────────────────────────────── */

    // Index bookings, coupons, complaints by userId for fast lookup
    const hotelBkByUser   = {};
    const tourBkByUser    = {};
    const taxiBkByUser    = {};
    const couponsByUser   = {};
    const complaintsByUser = {};

    (bookings.hotel || []).forEach((b) => {
      const uid = String(b.user?.userId || "");
      (hotelBkByUser[uid] = hotelBkByUser[uid] || []).push(b);
    });
    (bookings.tour || []).forEach((b) => {
      const uid = String(b.userId || "");
      (tourBkByUser[uid] = tourBkByUser[uid] || []).push(b);
    });
    (bookings.taxi || []).forEach((b) => {
      const uid = String(b.userId || "");
      (taxiBkByUser[uid] = taxiBkByUser[uid] || []).push(b);
    });
    coupons.forEach((c) => {
      const uid = String(c.targetUserId || c.userId || "");
      (couponsByUser[uid] = couponsByUser[uid] || []).push(c);
    });
    complaints.forEach((c) => {
      const uid = String(c.userId?.userId || "");
      (complaintsByUser[uid] = complaintsByUser[uid] || []).push(c);
    });

    const data = users.map((user) => {
      const uid = String(user.userId);
      return {
        // Profile
        userId:   user.userId,
        uid:      user.uid,
        name:     user.userName,
        email:    user.email,
        mobile:   user.mobile,
        address:  user.address,
        avatar:   user.images,
        joinedAt: user.createdAt,

        // Bookings (only the types requested)
        bookings: {
          hotel: hotelBkByUser[uid]  || [],
          tour:  tourBkByUser[uid]   || [],
          taxi:  taxiBkByUser[uid]   || [],
        },

        // Coupons
        coupons: couponsByUser[uid] || [],

        // Complaints
        complaints: complaintsByUser[uid] || [],
      };
    });

    return res.status(200).json({
      success: true,
      total,
      page: resolvedPage,
      totalPages: Math.ceil(total / resolvedLimit),
      data,
    });
  } catch (error) {
    console.error("filterUsers error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const refreshUserToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      );
    } catch (err) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    const user = await userModel.findOne({ userId: decoded.id, refreshToken });
    if (!user) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateUserTokens(user.userId);
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({ rsToken: accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error("refreshUserToken error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createSignup,
  getUserById,
  signIn,
  GoogleSignIn,
  update,
  adminResetUserPassword,
  userForgotPasswordSendOtp,
  userForgotPasswordVerifyOtp,
  userForgotPasswordReset,
  getAllUserBulkById,
  getAllUsers,
  totalUser,
  findUser,
  getAllUserDetails,
  loginWithOtp,
  verifyOTP,
  filterUsers,
  refreshUserToken,
};
