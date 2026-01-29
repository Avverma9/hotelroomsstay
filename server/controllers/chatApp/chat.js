const messages = require("../../models/chatApp/messages");
const mongoose = require("mongoose");

module.exports = (io) => {
    return {
        sendMessage: async (req, res) => {
            const { senderId, receiverId, content } = req.body;
            const images = req.files ? req.files.map((file) => file.location) : [];

            const newMessage = new messages({
                sender: senderId,
                receiver: receiverId,
                content,
                images,
            });

            try {
                await newMessage.save();
                io.emit('newMessage', newMessage);
                res.status(200).json(newMessage);
            } catch (err) {
                console.error('Error saving message:', err);
                res.status(500).json({ message: 'Server error', error: err.message });
            }
        },

        getMessage: async (req, res) => {
            const { userId1, userId2 } = req.params;
            try {
                const message = await messages.find({
                    $or: [
                        { sender: userId1, receiver: userId2 },
                        { sender: userId2, receiver: userId1 },
                    ],
                }).sort({ timestamp: 1 });
                res.json(message);
            } catch (err) {
                res.status(500).json({ message: 'Server error', error: err });
            }
        },

        deleteConversation: async (req, res) => {
            const { senderId, receiverId } = req.params;
            try {
                const result = await messages.deleteMany({
                    $or: [
                        { sender: senderId, receiver: receiverId },
                        { sender: receiverId, receiver: senderId },
                    ],
                });
                return res.status(200).json({ message: 'Successfully deleted', result });
            } catch (error) {
                console.error('Error deleting conversation:', error);
                return res.status(500).json({ message: 'Server error' });
            }
        },

        unsendMessage: async (req, res) => {
            const { messageId } = req.params;
            try {
                const deleteResult = await messages.deleteOne({ _id: messageId });

                if (deleteResult.deletedCount === 0) {
                    return res.status(404).json({ message: 'Message not found' });
                }

                return res.status(200).json({
                    message: 'Successfully deleted the message',
                    result: { deletedMessage: deleteResult },
                });
            } catch (error) {
                console.error('Error unsending message:', error);
                return res.status(500).json({ message: 'Server error' });
            }
        },

        getChats: async (req, res) => {
            const { senderId } = req.params;
            try {
                const senderObjectId = new mongoose.Types.ObjectId(senderId);

                const messagesList = await messages.aggregate([
                    { $match: { sender: senderObjectId } },
                    { $sort: { timestamp: -1 } },
                    {
                        $group: {
                            _id: "$receiver",
                            lastMessage: { $first: "$$ROOT" },
                        },
                    },
                    { $sort: { "lastMessage.timestamp": -1 } },
                    {
                        $replaceRoot: {
                            newRoot: "$lastMessage",
                        },
                    },
                    {
                        $lookup: {
                            from: "dashboardusers",
                            localField: "receiver",
                            foreignField: "_id",
                            as: "receiverInfo",
                        },
                    },
                    { $unwind: "$receiverInfo" },
                    {
                        $project: {
                            _id: 0,
                            name: "$receiverInfo.name",
                            role: "$receiverInfo.role",
                            content: 1,
                            receiverId: "$receiver",
                            timestamp: 1,
                        },
                    },
                ]);

                res.json(messagesList);
            } catch (err) {
                res.status(500).json({ message: 'Server error', error: err.message });
            }
        },
    };
};
