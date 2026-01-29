const dashboardUser = require("../../models/dashboardUser");

exports.getContacts = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await dashboardUser.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const contactIds = user.contacts?.map((contact) => contact.userId) || [];

        if (contactIds.length === 0) {
            return res.status(200).json({ contacts: [] });
        }

        // Only select name and mobile for each contact
        const contacts = await dashboardUser.find(
            { _id: { $in: contactIds } },

        );

        // Optional: merge contact _id (from user.contacts) if needed
        const contactsWithMeta = user.contacts.map((contact) => {
            const data = contacts.find((c) => c._id.toString() === contact.userId.toString());
            return {
                _id: contact._id,
                userId: contact.userId,
                name: data?.name || "Unknown",
                mobile: data?.mobile || "N/A",
                isOnline: data?.isOnline,
                role: data?.role
            };
        });

        return res.status(200).json({ contacts: contactsWithMeta });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

exports.addContact = async (req, res) => {
    try {
        const { id } = req.params; // current user
        const { userId } = req.body; // userId to add as contact

        const user = await dashboardUser.findById(id);
        if (!user) return res.status(404).json({ message: "User not found." });

        const contactUser = await dashboardUser.findById(userId);
        if (!contactUser) return res.status(404).json({ message: "Contact user not found." });

        const alreadyExists = user.contacts.some(c => c.userId === userId);
        if (alreadyExists) return res.status(400).json({ message: "Contact already exists." });

        user.contacts.push({ userId });
        await user.save();

        return res.status(201).json({ message: "Contact added.", contact: { userId } });

    } catch (error) {
        console.error("Error adding contact:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const { id, contactUserId } = req.params;

        const user = await dashboardUser.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Filter out the contact with matching userId
        user.contacts = user.contacts.filter(contact => contact.userId !== contactUserId);
        await user.save();

        return res.status(200).json({ message: "Contact deleted successfully." });
    } catch (error) {
        console.error("Error deleting contact:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

