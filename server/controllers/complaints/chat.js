const Chat = require("../../models/complaints/chat.js");

exports.doChat = async function (req, res) {
    const {complaintId}=req.params
  const {  sender, receiver, content } = req.body;
  try {
    // Basic validation
    if (!complaintId || !sender || !receiver || !content) {
      return res.status(400).json({ message: "Missing required fields for chat." });
    }

    const startChat = await Chat.create({
      complaintId,
      sender,
      receiver,
      content,
    });
    res.status(201).json(startChat); // Use 201 for resource creation
  } catch (err) {
    console.error("Error in doChat:", err);
    res.status(500).json({ message: "Server error while creating chat message.", error: err.message });
  }
};
