import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchComplaints,
  postComplaint,
  deleteComplaint,
  fetchHotelNamesByBookingId,
} from "../../redux/slices/complaintSlice";
import { userId, userName } from "../../utils/Unauthorized";
import { formatDateWithOrdinal } from "../../utils/_dateFunctions";
import {
  IoClose,
  IoAttach,
  IoSend,
  IoTrash,
  IoAlertCircleOutline,
  IoAddCircleOutline,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoConstruct,
  IoImageOutline,
  IoChevronDown,
  IoChevronUp,
  IoPersonCircle,
  IoShieldCheckmark,
} from "react-icons/io5";
import axios from "axios";
import baseURL from "../../utils/baseURL";

export default function ComplaintsPage() {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.complaint);

  const [regarding, setRegarding] = useState("");
  const [hotelId, setHotelId] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [hotelEmail, setHotelEmail] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [issue, setIssue] = useState("");
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogImages, setDialogImages] = useState([]);
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  // Chat states
  const [messageContent, setMessageContent] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchComplaints(userId));
  }, [dispatch]);

  useEffect(() => {
    if (bookingId) {
      setLoadingHotels(true);
      dispatch(fetchHotelNamesByBookingId(bookingId))
        .unwrap()
        .then((res) => {
          setHotels(res);
          if (res.length === 1) {
            setHotelId(res[0].hotelDetails.hotelId);
            setHotelName(res[0].hotelDetails.hotelName);
            setHotelEmail(res[0].hotelDetails.hotelEmail);
          }
        })
        .finally(() => setLoadingHotels(false));
    } else {
      setHotels([]);
      setHotelId("");
      setHotelName("");
      setHotelEmail("");
    }
  }, [bookingId, dispatch]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && openChatDialog) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedComplaint, openChatDialog]);

  // Send chat message
  const sendChat = async (e) => {
    e.preventDefault();

    if (!messageContent.trim() || !selectedComplaint) return;

    setIsSendingMessage(true);

    try {
      const payload = {
        sender: userName || "User",
        receiver: "Admin",
        content: messageContent.trim(),
      };

      const response = await axios.post(
        `${baseURL}/do/chat-support/${selectedComplaint.complaintId}`,
        payload
      );

      if (response.status === 200 || response.status === 201) {
        // Refresh complaints data to get updated chats
        await dispatch(fetchComplaints(userId)).unwrap();

        // Find and update the selected complaint with fresh data
        const updatedData = await dispatch(fetchComplaints(userId)).unwrap();
        const updatedComplaint = updatedData.find(
          (c) => c._id === selectedComplaint._id
        );
        
        if (updatedComplaint) {
          setSelectedComplaint(updatedComplaint);
        }

        // Clear input
        setMessageContent("");

        // Scroll to bottom
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Get all chat messages from the chats array
  const getAllMessages = (complaint) => {
    if (!complaint.chats || complaint.chats.length === 0) return [];

    // Sort by timestamp
    return [...complaint.chats].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
  };

  // FIXED: Check if message is from current user
  const isMessageFromCurrentUser = (msg) => {
    // Check if sender is current user by comparing with userName or userId
    return (
      msg.sender === userName ||
      msg.sender === userId ||
      (msg.sender && msg.sender.trim().toLowerCase() === userName?.trim().toLowerCase()) ||
      // Also check if receiver is "Admin" (means user sent it)
      (msg.receiver === "Admin" && msg.sender !== "Admin")
    );
  };

  // Get unread count (messages from Admin only)
  const getUnreadCount = (complaint) => {
    const messages = getAllMessages(complaint);
    return messages.filter((msg) => !isMessageFromCurrentUser(msg)).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("regarding", regarding);
    formData.append("hotelName", hotelName);
    formData.append("hotelId", hotelId);
    formData.append("hotelEmail", hotelEmail);
    formData.append("bookingId", bookingId);
    formData.append("issue", issue);
    images.forEach((file) => formData.append("images", file));

    try {
      await dispatch(postComplaint(formData)).unwrap();
      dispatch(fetchComplaints(userId));
      setRegarding("");
      setBookingId("");
      setHotelId("");
      setHotelName("");
      setHotelEmail("");
      setIssue("");
      setImages([]);
      setIsFormVisible(false);
    } catch (err) {
      console.error(err);
      alert("Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      try {
        await dispatch(deleteComplaint(id)).unwrap();
        dispatch(fetchComplaints(userId));
      } catch (err) {
        console.error(err);
        alert("Failed to delete complaint. Please try again.");
      }
    }
  };

  const openChat = (complaint) => {
    setSelectedComplaint(complaint);
    setOpenChatDialog(true);
    setMessageContent("");
  };

  const toggleCardExpansion = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Resolved":
        return <IoCheckmarkCircle className="text-green-600" />;
      case "Working":
        return <IoConstruct className="text-blue-600" />;
      default:
        return <IoTimeOutline className="text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200";
      case "Working":
        return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Complaint Management
          </h1>
          <p className="text-gray-600">
            Track and manage your service complaints
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <IoAddCircleOutline className="text-xl group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-medium">
              {isFormVisible ? "Hide Form" : "Raise a Complaint"}
            </span>
          </button>
        </div>

        {/* Form */}
        {isFormVisible && (
          <div className="bg-white shadow-xl rounded-2xl p-8 mb-8 border border-gray-100 animate-slideDown">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <IoAlertCircleOutline className="text-2xl text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Submit a New Complaint
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regarding
                  </label>
                  <select
                    value={regarding}
                    onChange={(e) => setRegarding(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Booking">Booking</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Website">Website</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Booking ID"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hotel
                  </label>
                  <select
                    value={hotelId}
                    onChange={(e) => {
                      const sel = hotels.find(
                        (h) => h.hotelDetails.hotelId === e.target.value
                      );
                      if (sel) {
                        setHotelId(sel.hotelDetails.hotelId);
                        setHotelName(sel.hotelDetails.telName);
                        setHotelEmail(sel.hotelDetails.hotelEmail);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-100"
                    disabled={!bookingId}
                    required
                  >
                    <option value="">
                      {loadingHotels ? "Fetching hotels..." : "Select Hotel"}
                    </option>
                    {hotels.map((h) => (
                      <option
                        key={h.hotelDetails.hotelId}
                        value={h.hotelDetails.hotelId}
                      >
                        {h.hotelDetails.hotelName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe Your Issue
                </label>
                <textarea
                  rows="5"
                  placeholder="Please provide detailed information about your complaint..."
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                <label className="flex items-center justify-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 hover:border-indigo-500 hover:bg-indigo-50/50 transition group">
                  <IoAttach className="text-2xl text-gray-400 group-hover:text-indigo-600" />
                  <span className="text-gray-600 group-hover:text-indigo-600 font-medium">
                    Click to upload images
                  </span>
                  <input
                    type="file"
                    multiple
                    hidden
                    accept="image/*"
                    onChange={(e) => setImages(Array.from(e.target.files))}
                  />
                </label>
                {images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {images.map((file, i) => (
                      <div
                        key={i}
                        className="group px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-lg text-sm flex items-center gap-2 border border-indigo-200"
                      >
                        <IoImageOutline />
                        <span className="max-w-[150px] truncate">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setImages((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="hover:bg-red-100 rounded-full p-1 transition"
                        >
                          <IoClose className="text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormVisible(false)}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Complaint
                      <IoSend />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error Message */}
        {error && error.status !== 404 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <IoAlertCircleOutline className="text-2xl" />
            <span className="font-medium">
              Error loading complaints. Please try again.
            </span>
          </div>
        )}

        {/* Complaints List */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <IoAlertCircleOutline className="text-indigo-600" />
            </div>
            Your Complaints
            {!loading && data.length > 0 && (
              <span className="ml-auto text-sm font-normal text-gray-500">
                {data.length} total
              </span>
            )}
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4" />
              <p className="text-gray-500">Loading complaints...</p>
            </div>
          ) : data.length > 0 ? (
            <div className="grid gap-4">
              {data.map((c) => {
                const messages = getAllMessages(c);
                const unreadCount = getUnreadCount(c);
                const isExpanded = expandedCards[c._id];
                const latestUpdate = c.updatedBy?.[c.updatedBy.length - 1];

                return (
                  <div
                    key={c._id}
                    className="group bg-white shadow-md hover:shadow-xl rounded-2xl p-6 border border-gray-100 transition-all duration-300 hover:scale-[1.01]"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(c.status)}
                          <h4 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition">
                            {c.issue}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                              c.status
                            )}`}
                          >
                            {c.status}
                          </span>
                          {messages.length > 0 && (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <IoChatbubbleEllipsesOutline />
                              {messages.length} message
                              {messages.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                        title="Delete complaint"
                      >
                        <IoTrash className="text-xl" />
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className="space-y-3 mb-4">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">
                            Hotel:
                          </span>
                          <span className="text-gray-600">{c.hotelName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">
                            Regarding:
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                            {c.regarding}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">
                            Booking:
                          </span>
                          <span className="font-mono text-gray-600">
                            {c.bookingId}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <IoTimeOutline />
                        Complaint ID {c.complaintId} • Issued on{" "}
                        {formatDateWithOrdinal(c.createdAt)}
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-slideDown">
                          {latestUpdate && latestUpdate.feedBack && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-xs font-semibold text-blue-700 mb-1">
                                Latest Feedback
                              </p>
                              <p className="text-sm text-gray-700">
                                {latestUpdate.feedBack}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                By {latestUpdate.name} •{" "}
                                {new Date(
                                  latestUpdate.updatedAt
                                ).toLocaleString()}
                              </p>
                            </div>
                          )}

                          {messages.length > 0 && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <p className="text-xs font-semibold text-purple-700 mb-2">
                                Recent Messages
                              </p>
                              <div className="space-y-2">
                                {messages.slice(-2).map((msg, idx) => (
                                  <div
                                    key={msg._id || idx}
                                    className="bg-white rounded-lg p-3 text-sm border border-purple-100"
                                  >
                                    <p className="text-gray-700">
                                      {msg.content}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {isMessageFromCurrentUser(msg) ? "You" : "Support Team"} •{" "}
                                      {new Date(msg.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="flex flex-wrap gap-2">
                      {c.images?.length > 0 && (
                        <button
                          onClick={() => {
                            setDialogImages(c.images);
                            setOpenDialog(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition"
                        >
                          <IoImageOutline />
                          View Attachments ({c.images.length})
                        </button>
                      )}

                      <button
                        onClick={() => openChat(c)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white text-sm font-medium transition relative"
                      >
                        <IoChatbubbleEllipsesOutline />
                        Open Chat
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => toggleCardExpansion(c._id)}
                        className="ml-auto flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 text-sm font-medium transition"
                      >
                        {isExpanded ? (
                          <>
                            Show Less <IoChevronUp />
                          </>
                        ) : (
                          <>
                            Show More <IoChevronDown />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <IoAlertCircleOutline className="text-5xl text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium mb-2">
                No complaints found
              </p>
              <p className="text-gray-400 text-sm">
                You haven't raised any complaints yet
              </p>
            </div>
          )}
        </div>

        {/* Image Dialog */}
        {openDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <IoImageOutline className="text-indigo-600" />
                  Attachments
                </h4>
                <button
                  onClick={() => setOpenDialog(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <IoClose className="text-2xl text-gray-600" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {dialogImages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dialogImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`attachment-${i}`}
                        className="w-full rounded-xl border border-gray-200 hover:shadow-lg transition"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No attachments found
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FIXED: Enhanced Chat Dialog with proper message alignment */}
        {openChatDialog && selectedComplaint && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold flex items-center gap-2">
                      <IoChatbubbleEllipsesOutline />
                      Complaint Chat
                    </h4>
                    <p className="text-sm text-indigo-100 mt-1">
                      ID: {selectedComplaint.complaintId}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setOpenChatDialog(false);
                      setMessageContent("");
                    }}
                    className="p-2 rounded-full hover:bg-white/20 transition"
                  >
                    <IoClose className="text-2xl" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {getAllMessages(selectedComplaint).length > 0 ? (
                  <>
                    {getAllMessages(selectedComplaint).map((msg, idx) => {
                      const isFromCurrentUser = isMessageFromCurrentUser(msg);
                      
                      return (
                        <div
                          key={msg._id || idx}
                          className={`flex ${
                            isFromCurrentUser ? "justify-end" : "justify-start"
                          } animate-slideDown`}
                        >
                          <div className="flex items-end gap-2 max-w-[75%]">
                            {/* Avatar for support team (left side) */}
                            {!isFromCurrentUser && (
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <IoShieldCheckmark className="text-white text-sm" />
                                </div>
                              </div>
                            )}
                            
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                !isFromCurrentUser
                                  ? "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                                  : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-md"
                              }`}
                            >
                              {/* Sender name */}
                              <p className={`text-xs font-medium mb-1 ${
                                !isFromCurrentUser ? "text-indigo-600" : "text-indigo-100"
                              }`}>
                                {isFromCurrentUser ? "You" : "Support Team"}
                              </p>
                              
                              {/* Message content */}
                              <p className="text-sm leading-relaxed">
                                {msg.content}
                              </p>
                              
                              {/* Timestamp */}
                              <p className={`text-xs mt-2 ${
                                !isFromCurrentUser ? "text-gray-500" : "text-indigo-100"
                              }`}>
                                {new Date(msg.timestamp).toLocaleString()}
                              </p>
                            </div>

                            {/* Avatar for current user (right side) */}
                            {isFromCurrentUser && (
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                                  <IoPersonCircle className="text-white text-lg" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="text-center py-12">
                    <IoChatbubbleEllipsesOutline className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Start a conversation with the support team
                    </p>
                  </div>
                )}
              </div>

              {/* Chat Input Footer */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={sendChat} className="flex gap-3">
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    disabled={isSendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={isSendingMessage || !messageContent.trim()}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
                  >
                    {isSendingMessage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">Send</span>
                        <IoSend />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}