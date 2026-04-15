const Dashboard = require("../models/dashboardUser");
const Hotel = require("../models/hotel/basicDetails");
const jwt = require("jsonwebtoken"); // Import the JWT library
const { sendCustomEmail, generateOtp, sendOtpEmail } = require("../nodemailer/nodemailer");
const {
  getEffectiveSidebarLinksForUser,
} = require("./addtionalSettings/sidebarPermissionService");
const {
  normalizeRouteList,
  normalizeRouteMode,
} = require("./addtionalSettings/routePermissionService");
require("dotenv").config(); // Load environment variables

const generateDashboardTokens = (id, role) => {
  const accessToken = jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: "15d" },
  );
  const refreshToken = jwt.sign(
    { id, role },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "2d" },
  );
  return { accessToken, refreshToken };
};

const buildDashboardLoginResponse = async (loggedUser) => {
  const { accessToken: rsToken, refreshToken } = generateDashboardTokens(
    loggedUser._id,
    loggedUser.role,
  );

  // Persist refresh token
  loggedUser.refreshToken = refreshToken;
  await loggedUser.save();

  let sidebarLinks = {};
  try {
    sidebarLinks = await getEffectiveSidebarLinksForUser({
      user: loggedUser,
      grouped: true,
    });
  } catch (sidebarError) {
    console.error("Failed to fetch sidebar links:", sidebarError.message);
  }

  const userSession = {
    token: rsToken,
    tokenType: "Bearer",
    expiresIn: "15m",
    user: {
      id: loggedUser._id,
      role: loggedUser.role,
      status: loggedUser.status,
      name: loggedUser.name,
      email: loggedUser.email,
      image: loggedUser.images,
    },
    sidebarLinks,
    routePermissions: {
      mode: normalizeRouteMode(loggedUser.routePermissions?.mode),
      allowedRoutes: normalizeRouteList(loggedUser.routePermissions?.allowedRoutes),
      blockedRoutes: normalizeRouteList(loggedUser.routePermissions?.blockedRoutes),
    },
  };

  return {
    message: "Logged in as",
    loggedUserRole: loggedUser.role,
    loggedUserStatus: loggedUser.status,
    loggedUserImage: loggedUser.images,
    loggedUserId: loggedUser._id,
    loggedUserName: loggedUser.name,
    loggedUserEmail: loggedUser.email,
    rsToken,
    refreshToken,
    sidebarLinks,
    routePermissions: userSession.routePermissions,
    sessionData: userSession,
  };
};

// Register ===========================
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      role,
      city,
      state,
      pinCode,
      address,
    } = req.body;
    const emailExist = await Dashboard.findOne({ email: email });
    const mobileExist = await Dashboard.findOne({ mobile: mobile });
    if (emailExist) {
      return res.status(400).json({ message: "Email already existed" });
    }
    if (mobileExist) {
      return res.status(400).json({ message: "Mobile already existed" });
    }
    const images = req.files.map((file) => file.location);
    const created = await Dashboard.create({
      images,
      name,
      email,
      role,
      address,
      mobile,
      city,
      state,
      pinCode,
      password,
    });
    const subject = `Congratulations! You are now a ${role} partner of HotelRoomsstay`;
    const message = `Hello,
Welcome to HotelRoomsstay! We are excited to have you as a ${role} partner.
You can now log in to your dashboard using the following credentials:
Email: ${email}
Password: ${password}
Please log in and change your password at your earliest convenience. You can access the partner portal by clicking the button below.`;
    const link = process.env.ADMIN_PANEL;
    await sendCustomEmail({ email, subject, message, link });
    res.status(201).json({ message: "Registration Done", created });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const findAcc = await Dashboard.findOne({ email: email });
    if (findAcc) {
      const otp = generateOtp();
      findAcc.resetOtp = otp;
      findAcc.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
      await findAcc.save();
      await sendOtpEmail(email, otp);
    }
    return res.status(200).json({ message: "If the email is registered, an OTP has been sent." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
};

const changePassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required." });
    }

    const user = await Dashboard.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    // Check if OTP is correct and not expired
    if (
      user.resetOtp !== otp ||
      !user.otpExpiry ||
      new Date() > new Date(user.otpExpiry)
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Save the new password and clear OTP
    user.password = newPassword;
    user.resetOtp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    return res.status(200).json({ message: "Password changed successfully." });

  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

const loginUser = async function (req, res) {
  const { email, password } = req.body;
  const emailRegex = new RegExp("^" + email + "$", "i");

  try {
    let loggedUser = await Dashboard.findOne({
      email: emailRegex,
      password: password,
    });

    if (!loggedUser) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user status is active
    if (loggedUser.status !== true) {
      return res.status(400).json({ message: "User account is not active" });
    }

    const loginResponse = await buildDashboardLoginResponse(loggedUser);
    res.status(200).json(loginResponse);
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = new RegExp("^" + email + "$", "i");
    const user = await Dashboard.findOne({ email: emailRegex });

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    if (user.status !== true) {
      return res.status(400).json({ message: "User account is not active" });
    }

    const otp = generateOtp();
    user.resetOtp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, otp, { skipRegisteredCheck: true });

    return res.status(200).json({
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("Send Login OTP Error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
};

const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const emailRegex = new RegExp("^" + email + "$", "i");
    const user = await Dashboard.findOne({ email: emailRegex });

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    if (user.status !== true) {
      return res.status(400).json({ message: "User account is not active" });
    }

    if (
      user.resetOtp !== otp ||
      !user.otpExpiry ||
      new Date() > new Date(user.otpExpiry)
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.resetOtp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const loginResponse = await buildDashboardLoginResponse(user);
    return res.status(200).json(loginResponse);
  } catch (error) {
    console.error("Verify Login OTP Error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
};
//update status
const updateStatus = async (req, res) => {
  const { id } = req.params; // Extracting id from parameters
  const { status } = req.body; // Extracting status from request body

  try {
    // Attempt to find and update the document with the new status
    const updateData = await Dashboard.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }, // This option will return the document after update was applied
    );

    // If no document is found, send a 404 error
    if (!updateData) {
      return res
        .status(404)
        .send({ message: "Dashboard not found with provided ID." });
    }

    // Send back the updated document
    res.status(200).send(updateData);
  } catch (error) {
    // If an error occurs during the update, send a 500 internal server error
    res.status(500).send({
      message: "Error updating the dashboard status",
      error: error.message,
    });
  }
};

//get all users
const getPartners = async function (req, res) {
  try {
    const aggregationPipeline = [
      {
        $lookup: {
          from: "hotels",
          let: {
            partnerEmailLower: {
              $toLower: {
                $trim: { input: { $ifNull: ["$email", ""] } },
              },
            },
          },
          pipeline: [
            {
              $addFields: {
                hotelEmailLower: {
                  $toLower: {
                    $trim: { input: { $ifNull: ["$hotelEmail", ""] } },
                  },
                },
              },
            },
            {
              $match: {
                $expr: {
                  $eq: ["$hotelEmailLower", "$$partnerEmailLower"],
                },
              },
            },
          ],
          as: "hotelInfo",
        },
      },
      {
        $addFields: {
          hotelCount: { $size: "$hotelInfo" },
          hotelInfo: {
            $map: {
              input: "$hotelInfo",
              as: "hotel",
              in: {
                name: "$$hotel.name",
                role: "$$hotel.role",
                email: "$$hotel.hotelEmail",
                hotelName: "$$hotel.hotelName",
                menuItems: "$$hotel.menuItems",
                fullAddress: {
                  $let: {
                    vars: {
                      parts: {
                        $filter: {
                          input: [
                            "$$hotel.address",
                            "$$hotel.city",
                            "$$hotel.state",
                            { $toString: "$$hotel.pinCode" },
                          ],
                          as: "part",
                          cond: {
                            $and: [
                              { $ne: ["$$part", null] },
                              { $ne: ["$$part", ""] },
                            ],
                          },
                        },
                      },
                    },
                    in: {
                      $reduce: {
                        input: "$$parts",
                        initialValue: "",
                        in: {
                          $cond: {
                            if: { $eq: ["$$value", ""] },
                            then: "$$this",
                            else: { $concat: ["$$value", ", ", "$$this"] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      //   {
      //     $project: {
      //       password: 0,
      //     },
      //   },
    ];

    const partners = await Dashboard.aggregate(aggregationPipeline);

    res.status(200).json(partners);
  } catch (error) {
    console.error("Error fetching partners:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
//delete
const getPartnersById = async (req, res) => {
  try {
    const { userId } = req.params;

    const objectId = require('mongoose').Types.ObjectId;

    const aggregationPipeline = [
      { $match: { _id: new objectId(userId) } },
      {
        $lookup: {
          from: 'hotels',
          let: {
            partnerEmailLower: {
              $toLower: { $trim: { input: { $ifNull: ['$email', ''] } } },
            },
          },
          pipeline: [
            {
              $addFields: {
                hotelEmailLower: {
                  $toLower: { $trim: { input: { $ifNull: ['$hotelEmail', ''] } } },
                },
              },
            },
            {
              $match: {
                $expr: { $eq: ['$hotelEmailLower', '$$partnerEmailLower'] },
              },
            },
          ],
          as: 'hotelInfo',
        },
      },
      {
        $addFields: {
          hotelCount: { $size: '$hotelInfo' },
          hotelInfo: {
            $map: {
              input: '$hotelInfo',
              as: 'hotel',
              in: {
                name: '$$hotel.name',
                role: '$$hotel.role',
                email: '$$hotel.hotelEmail',
                hotelName: '$$hotel.hotelName',
                menuItems: '$$hotel.menuItems',
                fullAddress: {
                  $let: {
                    vars: {
                      parts: {
                        $filter: {
                          input: [
                            '$$hotel.address',
                            '$$hotel.city',
                            '$$hotel.state',
                            { $toString: '$$hotel.pinCode' },
                          ],
                          as: 'part',
                          cond: { $and: [{ $ne: ['$$part', null] }, { $ne: ['$$part', ''] }] },
                        },
                      },
                    },
                    in: {
                      $reduce: {
                        input: '$$parts',
                        initialValue: '',
                        in: {
                          $cond: {
                            if: { $eq: ['$$value', ''] },
                            then: '$$this',
                            else: { $concat: ['$$value', ', ', '$$this'] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          resetOtp: 0,
          otpExpiry: 0,
        },
      },
    ];

    const result = await Dashboard.aggregate(aggregationPipeline);
    if (!result || !result.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error fetching partner by ID:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
const deletePartner = async function (req, res) {
  const { id } = req.params;
  const deleted = await Dashboard.findByIdAndDelete(id);
  res.status(200).json({ message: "this user is successfully deleted" });
};
//update

const updatePartner = async function (req, res) {
  const { id } = req.params;
  const {
    name,
    email,
    mobile,
    password,
    status,
    role,
    address,
    city,
    state,
    pinCode,
  } = req.body;

  let images = [];

  try {
    // Check if there are uploaded files
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.location);
    } else {
      // If no files uploaded, retain existing images from the database
      const user = await Dashboard.findById(id);
      if (user) {
        images = user.images;
      }
    }

    const updateFields = {
      name,
      email,
      mobile,
      password,
      status,
      role,
      address,
      city,
      state,
      pinCode,
      images,
    };

    // Validate email uniqueness
    if (updateFields.email) {
      const alreadyRegistered = await Dashboard.findOne({
        email: updateFields.email,
        _id: { $ne: id }, // Exclude current partner
      });
      if (alreadyRegistered) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    // Validate mobile uniqueness
    if (updateFields.mobile) {
      const mobileExist = await Dashboard.findOne({
        mobile: updateFields.mobile,
        _id: { $ne: id }, // Exclude current partner
      });
      if (mobileExist) {
        return res
          .status(400)
          .json({ message: "Mobile number already exists" });
      }
    }

    // Perform update operation
    const partnerUpdated = await Dashboard.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!partnerUpdated) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res
      .status(200)
      .json({ message: "User successfully updated", partner: partnerUpdated });
  } catch (error) {
    console.error("Error updating partner:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const filterPartner = async (req, res) => {
  try {
    const { 
      search, 
      role, 
      status, 
      city, 
      state, 
      mobile, 
      email, 
      isOnline 
    } = req.query;

    const matchStage = {};

    if (search) {
      const regex = { $regex: search, $options: "i" };
      matchStage.$or = [
        { name: regex },
        { email: regex },
        { city: regex },
        { state: regex },
        { address: regex }
      ];
      
      if (!isNaN(search)) {
        matchStage.$or.push({ mobile: parseInt(search) });
        matchStage.$or.push({ pinCode: parseInt(search) });
      }
    }

    if (role) matchStage.role = role; 
    if (city) matchStage.city = { $regex: city, $options: "i" };
    if (state) matchStage.state = { $regex: state, $options: "i" };
    if (email) matchStage.email = { $regex: email, $options: "i" };
    if (mobile) matchStage.mobile = parseInt(mobile);
    
    if (status !== undefined) {
      matchStage.status = status === "true";
    }
    
    if (isOnline !== undefined) {
      matchStage.isOnline = isOnline === "true";
    }

    const aggregationPipeline = [];

    if (Object.keys(matchStage).length > 0) {
      aggregationPipeline.push({ $match: matchStage });
    }

    aggregationPipeline.push(
      {
        $lookup: {
          from: "hotels",
          let: {
            partnerEmailLower: {
              $toLower: {
                $trim: { input: { $ifNull: ["$email", ""] } },
              },
            },
          },
          pipeline: [
            {
              $addFields: {
                hotelEmailLower: {
                  $toLower: {
                    $trim: { input: { $ifNull: ["$hotelEmail", ""] } },
                  },
                },
              },
            },
            {
              $match: {
                $expr: {
                  $eq: ["$hotelEmailLower", "$$partnerEmailLower"],
                },
              },
            },
          ],
          as: "hotelInfo",
        },
      },
      {
        $addFields: {
          hotelCount: { $size: "$hotelInfo" },
          hotelInfo: {
            $map: {
              input: "$hotelInfo",
              as: "hotel",
              in: {
                name: "$$hotel.name",
                role: "$$hotel.role",
                email: "$$hotel.hotelEmail",
                hotelName: "$$hotel.hotelName",
                menuItems: "$$hotel.menuItems",
                fullAddress: {
                  $let: {
                    vars: {
                      parts: {
                        $filter: {
                          input: [
                            "$$hotel.address",
                            "$$hotel.city",
                            "$$hotel.state",
                            { $toString: "$$hotel.pinCode" },
                          ],
                          as: "part",
                          cond: {
                            $and: [
                              { $ne: ["$$part", null] },
                              { $ne: ["$$part", ""] },
                            ],
                          },
                        },
                      },
                    },
                    in: {
                      $reduce: {
                        input: "$$parts",
                        initialValue: "",
                        in: {
                          $cond: {
                            if: { $eq: ["$$value", ""] },
                            then: "$$this",
                            else: { $concat: ["$$value", ", ", "$$this"] },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          password: 0,
          resetOtp: 0,
          otpExpiry: 0
        },
      },
      {
        $sort: { createdAt: -1 }
      }
    );

    const partners = await Dashboard.aggregate(aggregationPipeline);
    
    return res.status(200).json({
      success: true,
      count: partners.length,
      data: partners
    });
    
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

const refreshDashboardToken = async (req, res) => {
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

    const user = await Dashboard.findOne({ _id: decoded.id, refreshToken });
    if (!user) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateDashboardTokens(user._id, user.role);
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({ rsToken: accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error("refreshDashboardToken error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendLoginOtp,
  verifyLoginOtp,
  buildDashboardLoginResponse,
  getPartners,
  deletePartner,
  updatePartner,
  updateStatus,
  getPartnersById,
  filterPartner,
  forgotPassword,
  changePassword,
  refreshDashboardToken,
};
