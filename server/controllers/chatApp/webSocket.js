
const User = require('../../models/dashboardUser'); // Ensure this is the correct path
const userSocketMap = {};

const webSocketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('registerUser', async (sender) => {
            console.log(`Registering user: ${sender}`);
            // If the user is already in the map, handle it
            if (userSocketMap[socket.id]) {
                console.log(`User ${sender} is already registered.`);
                return;
            }

            userSocketMap[socket.id] = sender; // Store the mapping
            await User.findByIdAndUpdate(sender, { isOnline: true }, { new: true });
            console.log(`User ${sender} is now online`);

            // Emit user status to all clients
            io.emit('userStatusUpdate', { senderId: sender, isOnline: true });
        });

        socket.on('disconnect', async () => {
            console.log('User disconnected:', socket.id);
            const sender = userSocketMap[socket.id]; // Get the sender associated with the socket

            if (sender) {
                const currentTime = new Date();
                console.log(`Updating user ${sender} - setting isOnline to false and lastSeen to ${currentTime}`);

                try {
                    const updatedUser = await User.findByIdAndUpdate(sender, { isOnline: false, lastSeen: currentTime }, { new: true });
                    if (updatedUser) {
                        console.log(`User ${sender} is now offline. Last seen updated: ${updatedUser.lastSeen}`);
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
