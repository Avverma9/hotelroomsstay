const express = require('express');
const { getContacts, addContact, deleteContact } = require('../../controllers/chatApp/contacts');
const { upload } = require('../../aws/upload');
const initChatControllers = require('../../controllers/chatApp/chat'); // import controller factory

const setupChatRoutes = (io) => {
    const {
        sendMessage,
        getMessage,
        deleteConversation,
        unsendMessage,
        getChats
    } = initChatControllers(io); // initialize with io

    const router = express.Router();

    // ---------------- Contacts Routes ----------------
    router.get('/get-chat-contacts/:id', getContacts);
    router.patch('/contacts/:id', addContact);
    router.delete('/contacts/:id/:contactUserId', deleteContact);

    // ---------------- Chat Routes --------------------
    router.post('/send-messages', upload, sendMessage);
    router.get('/get-messages/of-chat/:userId1/:userId2', getMessage);
    router.delete('/delete-conversation/:senderId/:receiverId', deleteConversation);
    router.delete('/unsend-message/:messageId', unsendMessage);
    router.get('/get-chats/:senderId', getChats);

    return router;
};

module.exports = setupChatRoutes;
