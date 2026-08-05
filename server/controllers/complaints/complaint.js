const mongoose = require('mongoose');
const User = require('../../models/user');
const Complaint = require('../../models/complaints/complaint');
const chat = require('../../models/complaints/chat');
const Hotel = require('../../models/hotel/basicDetails');
const {
  createUserNotificationSafe,
} = require("../notification/helpers");

const createComplaint = async (req, res) => {
    // Extract data from either req.body (JSON) or req.body (multipart)
    const { userId, regarding, hotelName, hotelEmail, bookingId, status, issue, hotelId, complaintType, createdById } = req.body;
    
    // Get images from req.files (multipart upload) - will be empty array if no files
    const images = req.files ? req.files.map((file) => file.location) : [];
    
    try {
        // VALIDATION: Only userId, regarding, and issue are required
        if (!userId || !regarding || !issue) {
            return res.status(400).json({ message: 'Missing required fields: userId, regarding, and issue are mandatory.' });
        }
        
        // Validate complaintType if provided
        const finalComplaintType = complaintType || 'User';
        if (!['User', 'Admin'].includes(finalComplaintType)) {
            return res.status(400).json({ message: 'Invalid complaintType. Must be either "User" or "Admin".' });
        }

        // Resolve userId to User's MongoDB ObjectId
        // The userId from panel could be:
        // 1. Dashboard user _id (MongoDB ObjectId string)
        // 2. Dashboard user id field (string like "66751804def0b0b1d2f0d672")
        // 3. User's userId field (numeric string)
        // 4. User's _id (MongoDB ObjectId)
        
        let resolvedObjectId;
        
        // First, try to find as dashboard user and get linked User
        const DashboardUser = require('../../models/dashboardUser');
        let dashboardUser = null;
        
        // Check if it's a valid ObjectId format
        if (mongoose.Types.ObjectId.isValid(userId) && String(userId).length === 24) {
            dashboardUser = await DashboardUser.findById(userId).select('userId email mobile').lean();
        }
        
        // If dashboard user found, find the corresponding User by userId/email/mobile
        if (dashboardUser) {
            const userDoc = await User.findOne({
                $or: [
                    { userId: dashboardUser.userId },
                    { email: dashboardUser.email },
                    { mobile: dashboardUser.mobile }
                ]
            }).select('_id').lean();
            
            if (!userDoc) {
                return res.status(404).json({ message: 'User account not found for this dashboard user.' });
            }
            resolvedObjectId = userDoc._id;
        } else {
            // If not found as dashboard user, try direct User lookup
            if (mongoose.Types.ObjectId.isValid(userId) && String(userId).length === 24) {
                const userDoc = await User.findOne({ $or: [{ _id: userId }, { userId }] }).select('_id').lean();
                if (!userDoc) return res.status(404).json({ message: 'User not found.' });
                resolvedObjectId = userDoc._id;
            } else {
                const userDoc = await User.findOne({ userId }).select('_id').lean();
                if (!userDoc) return res.status(404).json({ message: 'User not found.' });
                resolvedObjectId = userDoc._id;
            }
        }

        // OPTIONAL: Resolve hotelId only if provided
        let resolvedHotelObjectId = null;
        if (hotelId) {
            if (mongoose.Types.ObjectId.isValid(hotelId) && String(hotelId).length === 24) {
                const hotelDoc = await Hotel.findOne({ _id: hotelId }).select('_id').lean();
                if (hotelDoc) resolvedHotelObjectId = hotelDoc._id;
            } else {
                const hotelDoc = await Hotel.findOne({ hotelId: String(hotelId) }).select('_id').lean();
                if (hotelDoc) resolvedHotelObjectId = hotelDoc._id;
            }
        }

        // Check for existing pending complaints
        const pendingComplaints = await Complaint.countDocuments({
            userId: resolvedObjectId,
            status: 'Pending',
        });

        if (pendingComplaints >= 3) {
            return res.status(400).json({
                message: 'You have too many pending complaints. Please resolve them before creating a new one.',
            });
        }

        // Create new complaint
        const complaintData = {
            userId: resolvedObjectId,
            regarding,
            issue,
            hotelEmail: hotelEmail || '',
            hotelName: hotelName || '',
            bookingId: bookingId || '',
            images,
            status: status || 'Pending',
            complaintType: finalComplaintType,
        };

        // Add hotelId only if resolved
        if (resolvedHotelObjectId) {
            complaintData.hotelId = resolvedHotelObjectId;
        }
        
        // Add createdBy for Admin complaints
        if (finalComplaintType === 'Admin' && createdById) {
            // Validate createdById is a valid ObjectId
            if (mongoose.Types.ObjectId.isValid(createdById) && String(createdById).length === 24) {
                complaintData.createdBy = createdById;
            }
        }

        const newComplaint = new Complaint(complaintData);

        await newComplaint.save();

        await createUserNotificationSafe({
            name: "Complaint Created",
            message: `Your complaint ${newComplaint.complaintId} has been created successfully.`,
            path: "/app/complaints",
            eventType: "complaint_created",
            metadata: {
                complaintId: newComplaint.complaintId,
                status: newComplaint.status,
                regarding: newComplaint.regarding,
            },
            userIds: [String(newComplaint.userId)],
        });

        res.status(201).json(newComplaint);
    } catch (error) {
        console.error('Error creating complaint:', error); // Log error for debugging
        res.status(500).json({ message: 'An error occurred while creating the complaint.', error: error.message });
    }
};

//=============================================================================================
//not===========
const updateComplaint = async (req, res) => {
    const { id } = req.params;
    const { status, feedBack, updatedBy, messages } = req.body;

    try {
      if (!id) {
        return res.status(400).json({ success: false, message: 'Complaint ID is required' });
      }

      if (!updatedBy?.name || !updatedBy?.email) {
        return res.status(400).json({ success: false, message: 'UpdatedBy must include name and email' });
      }

      const existingComplaint = await Complaint.findById(id);
      if (!existingComplaint) {
        return res.status(404).json({ success: false, message: 'Complaint not found' });
      }
      const previousStatus = existingComplaint.status;

      // Create new update object with timestamp
      const newUpdate = {
        name: updatedBy.name,
        email: updatedBy.email,
        messages: messages || [], // Associate messages with this specific update
        feedBack: feedBack || '', // Default to empty string if no feedback provided
        status,
        updatedAt: new Date(), // Track when the update happened
      };

      // Prepare the update operation
      const updateOperation = {
        $set: { status }, // Update the top-level status
        $push: { updatedBy: newUpdate }, // Append to update history
      };

      // If there are new messages, add them to the main messages array
      if (messages && Array.isArray(messages) && messages.length > 0) {
        updateOperation.$push.messages = { $each: messages };
      }

      const updatedComplaint = await Complaint.findByIdAndUpdate(
        id,
        updateOperation,
        { new: true, runValidators: true }
      );
      if (!updatedComplaint) {
        return res.status(404).json({ success: false, message: 'Complaint not found' });
      }

      if (status && previousStatus !== status) {
        await createUserNotificationSafe({
          name: "Complaint Status Updated",
          message: `Your complaint ${updatedComplaint.complaintId} status changed from ${previousStatus} to ${status}.`,
          path: "/app/complaints",
          eventType: "complaint_status_changed",
          metadata: {
            complaintId: updatedComplaint.complaintId,
            previousStatus,
            currentStatus: status,
          },
          userIds: [String(updatedComplaint.userId)],
        });
      }
  
      return res.status(200).json({ success: true, updatedComplaint });
  
    } catch (error) {
      console.error("Error updating complaint:", error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };


//=============================================================================================
const getComplaintsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Resolve userId to User's MongoDB ObjectId
    // The userId from panel could be:
    // 1. Dashboard user _id (MongoDB ObjectId string)
    // 2. Dashboard user id field (string)
    // 3. User's userId field (numeric string)
    // 4. User's _id (MongoDB ObjectId)
    
    let resolvedObjectId;
    
    // First, try to find as dashboard user and get linked User
    const DashboardUser = require('../../models/dashboardUser');
    let dashboardUser = null;
    
    // Check if it's a valid ObjectId format
    if (mongoose.Types.ObjectId.isValid(userId) && String(userId).length === 24) {
      dashboardUser = await DashboardUser.findById(userId).select('userId email mobile').lean();
    }
    
    // If dashboard user found, find the corresponding User by userId/email/mobile
    if (dashboardUser) {
      const userDoc = await User.findOne({
        $or: [
          { userId: dashboardUser.userId },
          { email: dashboardUser.email },
          { mobile: dashboardUser.mobile }
        ]
      }).select('_id').lean();
      
      if (!userDoc) {
        return res.status(404).json({ message: 'No complaints found for this user.' });
      }
      resolvedObjectId = userDoc._id;
    } else {
      // If not found as dashboard user, try direct User lookup
      if (mongoose.Types.ObjectId.isValid(userId) && String(userId).length === 24) {
        const userDoc = await User.findOne({ $or: [{ _id: userId }, { userId }] }).select('_id').lean();
        if (!userDoc) return res.status(404).json({ message: 'No complaints found for this user.' });
        resolvedObjectId = userDoc._id;
      } else {
        const userDoc = await User.findOne({ userId }).select('_id').lean();
        if (!userDoc) return res.status(404).json({ message: 'No complaints found for this user.' });
        resolvedObjectId = userDoc._id;
      }
    }

    const complaints = await Complaint.find({ userId: resolvedObjectId }).lean();

    if (!complaints.length) {
      return res.status(404).json({ message: "No complaints found for this user." });
    }

    const complaintIds = complaints.map((c) => String(c.complaintId));
    const chats = await chat.find({ complaintId: { $in: complaintIds } }).lean();

    const complaintMap = {};
    complaints.forEach((c) => {
      complaintMap[c.complaintId] = { ...c, chats: [] };
    });

    chats.forEach((ch) => {
      if (complaintMap[ch.complaintId]) {
        complaintMap[ch.complaintId].chats.push(ch);
      }
    });

    const combinedData = Object.values(complaintMap);
    return res.status(200).json(combinedData);
  } catch (error) {
    console.error("Error fetching complaints by userId:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};



//=======================delete a complaint=============================================
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const deletedChats = await chat.deleteMany({ complaintId: complaint.complaintId });
    const deletedComplaint = await Complaint.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Complaint and related chats deleted successfully",
      deletedComplaint,
      deletedChatsCount: deletedChats.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting complaint:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

//=======================get complaint by ID=============================================

const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id).lean();
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const chats = await chat.find({ complaintId: complaint.complaintId }).lean();

    return res.status(200).json({ success: true, data: { ...complaint, chats } });
  } catch (error) {
    console.error("Error fetching complaint by ID:", error);
    return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
};

//=======================get all complaint=============================================

const getComplaint = async (req, res) => {
  try {
    const fetchAll = await Complaint.find().lean();
    if (!fetchAll.length) {
      return res.status(404).json({ message: "No complaints found" });
    }
    const complaintIds = fetchAll.map((c) => c.complaintId);
    const getChats = await chat.find({ complaintId: { $in: complaintIds } }).lean();
    const complaintMap = {};
    fetchAll.forEach((complaint) => {
      complaintMap[complaint.complaintId] = { ...complaint, chats: [] };
    });
    getChats.forEach((chatDoc) => {
      if (complaintMap[chatDoc.complaintId]) {
        complaintMap[chatDoc.complaintId].chats.push(chatDoc);
      }
    });
    const combinedData = Object.values(complaintMap);
    return res.status(200).json(combinedData);
  } catch (error) {
    console.error("Error combining complaints and chats:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

//================================filter complaints ============================================
const filteredComplaints = async (req, res) => {
    try {
        // Extract query parameters
        const { status, hotelName, hotelEmail, complaintId, complaintType } = req.query;

        // Build filter object
        let filter = {};
        if (status) {
            filter.status = status;
        }
        if (complaintId) {
            filter.complaintId = complaintId;
        }
        if (hotelName) {
            filter.hotelName = { $regex: hotelName, $options: 'i' }; // Case-insensitive search
        }
        if (hotelEmail) {
            filter.hotelEmail = { $regex: hotelEmail, $options: 'i' }; // Case-insensitive search
        }
        if (complaintType) {
            filter.complaintType = complaintType; // Filter by User or Admin
        }

        // Fetch filtered complaints
        const complaints = await Complaint.find(filter);

        // Send response
        res.status(200).json(complaints);
    } catch (error) {
        console.error('Error fetching filtered complaints:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
//============================================================================
module.exports = {
    createComplaint,
    updateComplaint,
    getComplaintsByUserId,
    getComplaintById,
    deleteComplaint,
    filteredComplaints,
    getComplaint,
};
