const booking = require("../models/booking/booking");
const userModel = require("../models/user");
const UserCoupon = require("../models/coupons/userCoupon");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const otpAuth = require("../authentication/otpLogin");

const createSignup = async function (req, res) {
  try {
    const { email, mobile } = req.body;

    if (email) {
      const existingCoupon = await UserCoupon.find({
        assignedTo: { $regex: `^${email}$`, $options: "i" },
      });

      if (existingCoupon.length === 0) {
        const currentDate = new Date();
        const validity = new Date(currentDate.setDate(currentDate.getDate() + 7));

        await UserCoupon.create({
          couponName: "Welcome50",
          discountPrice: 50,
          validity,
          quantity: 1,
          assignedTo: email,
        });
      }
    }

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

    const userData = {
      images,
      ...req.body,
    };

    const savedUser = await userModel.create(userData);

    return res.status(201).json({
      status: true,
      message: "User has been created successfully",
      data: savedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message || "Something went wrong while creating the user",
    });
  }
};

const GoogleSignIn = async function (req, res) {
  try {
    const { email, uid, userName, images } = req.body;

    if (email) {
      const existingCoupon = await UserCoupon.find({
        assignedTo: { $regex: `^${email}$`, $options: "i" },
      });

      if (existingCoupon.length === 0) {
        const currentDate = new Date();
        const validity = new Date(currentDate.setDate(currentDate.getDate() + 7));

        await UserCoupon.create({
          couponName: "Welcome50",
          discountPrice: 50,
          validity,
          quantity: 1,
          assignedTo: email,
        });
      }
    }

    const existingUser = await userModel.findOne({
      $or: [{ email: { $regex: `^${email}$`, $options: "i" } }, { uid }],
    });

    if (existingUser) {
      const token = jwt.sign(
        { id: existingUser.userId },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
      return res.status(201).json({
        message: "User already exists",
        userId: existingUser.userId,
        mobile: existingUser.mobile,
        name: existingUser.userName,
        email: existingUser.email,
        rsToken: token,
      });
    }

    const user = await userModel.create({ email, uid, userName, images });

    const token = jwt.sign({ id: user.userId }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      message: "Sign-in successful",
      userId: user.userId,
      name: user.userName,
      rsToken: token,
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

    const token = jwt.sign({ id: user.userId }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      result,
      userId: user.userId,
      mobile: user.mobile,
      email: user.email,
      rsToken: token,
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

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.userId }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      message: "Sign-in successful",
      userId: user.userId,
      mobile: user.mobile,
      name: user.userName,
      email: user.email,
      rsToken: token,
    });
  } catch (error) {
    console.error("Sign-in error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUserById = async function (req, res) {
  try {
    const { userId } = req.params;

    const checkData = await userModel.findOne({ userId });

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

    if (email) {
      const findWithEmail = await userModel.findOne({
        email: { $regex: `^${email}$`, $options: "i" },
        userId: { $ne: userId },
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
        userId: { $ne: userId },
      });
      if (findWithMobile) {
        return res
          .status(400)
          .json({ message: "Mobile number is already in use by another user" });
      }
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.location);
    } else {
      const user = await userModel.findOne({ userId });
      if (user) {
        images = user.images || [];
      }
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { userId },
      {
        userName,
        address,
        email,
        mobile,
        password,
        images,
      },
      { new: true }
    );

    if (updatedUser) {
      return res.json(updatedUser);
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const userData = await userModel.find();
    return res.status(200).json({
      message: "User data fetched successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
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

    const findUserData = await userModel.find(query);

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
    const users = await userModel.find();

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

module.exports = {
  createSignup,
  getUserById,
  signIn,
  GoogleSignIn,
  update,
  getAllUserBulkById,
  getAllUsers,
  totalUser,
  findUser,
  getAllUserDetails,
  loginWithOtp,
  verifyOTP,
};