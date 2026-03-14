const Dashboard = require("../models/dashboardUser");
const Hotel = require("../models/hotel/basicDetails");
const jwt = require("jsonwebtoken"); // Import the JWT library
const { sendCustomEmail, generateOtp, sendOtpEmail } = require("../nodemailer/nodemailer");
const {
  getEffectiveSidebarLinksForUser,
} = require("./addtionalSettings/sidebarPermissionService");
require("dotenv").config(); // Load environment variables

const buildDashboardLoginResponse = async (loggedUser) => {
  const rsToken = jwt.sign(
    { id: loggedUser._id, role: loggedUser.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

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
    expiresIn: "24h",
    user: {
      id: loggedUser._id,
      role: loggedUser.role,
      status: loggedUser.status,
      name: loggedUser.name,
      email: loggedUser.email,
      image: loggedUser.images,
    },
    sidebarLinks,
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
    sidebarLinks,
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
          localField: "email",
          foreignField: "hotelEmail",
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

    const user = await Dashboard.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // const foundHotels = await Hotel.find({ email: user.email });

    // const hotelDetails = foundHotels.map(hotel => ({
    //     hotelId: hotel.hotelId,
    //     name: hotel.hotelName,
    //     address: hotel.address,
    //     city: hotel.city,
    //     state: hotel.state
    // }));

    // const responsePayload = {
    //     user,
    //     hotelCount: foundHotels.length,
    //     hotels: hotelDetails
    // };

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching partner by ID:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
    const { search } = req.query;

    const matchStage = {};

    if (search) {
      const regex = { $regex: search, $options: "i" };
      const isEmail = search.includes("@") && search.includes(".com");
      const isNumber = /^\d+$/.test(search);
      const roles = ["admin", "pms", "tms", "ca", "rider"];
      const isRole = roles.includes(search.toLowerCase());

      if (isEmail) {
        matchStage.email = regex;
      } else if (isNumber) {
        matchStage.mobile = parseInt(search);
      } else if (isRole) {
        matchStage.role = regex;
      } else {
        matchStage.$or = [{ name: regex }, { city: regex }];
      }
    }

    const aggregationPipeline = [];

    if (Object.keys(matchStage).length > 0) {
      aggregationPipeline.push({ $match: matchStage });
    }

    aggregationPipeline.push(
      {
        $lookup: {
          from: "hotels",
          localField: "email",
          foreignField: "hotelEmail",
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
        },
      },
    );

    const partners = await Dashboard.aggregate(aggregationPipeline);
    return res.status(200).json(partners);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
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
  changePassword
};
