
const User = require('../../models/dashboardUser'); // Ensure this is the correct path
const userSocketMap = {};

const webSocketHandler = (io) => {
    io.on('connection', (socket) => {
        undefined;

        socket.on('registerUser', async (sender) => {
            undefined;
            // If the user is already in the map, handle it
            if (userSocketMap[socket.id]) {
                undefined;
                return;
            }

            userSocketMap[socket.id] = sender; // Store the mapping
            await User.findByIdAndUpdate(sender, { isOnline: true }, { new: true });
            undefined;

            // Emit user status to all clients
            io.emit('userStatusUpdate', { senderId: sender, isOnline: true });
        });

        socket.on('disconnect', async () => {
            undefined;
            const sender = userSocketMap[socket.id]; // Get the sender associated with the socket

            if (sender) {
                const currentTime = new Date();
                undefined;

                try {
                    const updatedUser = await User.findByIdAndUpdate(sender, { isOnline: false, lastSeen: currentTime }, { new: true });
                    if (updatedUser) {
                        undefined;
                    } else {
                        console.error(`User with ID ${sender} not found.`);
                    }
                } catch (error) {
                    console.error('Error updating user:', error);
                }

                // Remove the mapping
                delete userSocketMap[socket.id];

                // Emit user status to all clients
                io.emit('userStatusUpdate', { senderId: sender, isOnline: false });
            }
        });
    });
};

module.exports = webSocketHandler;
