const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminJWT = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Access denied: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: 'Access denied: Token has expired' });
            }
            return res.status(403).json({ message: 'Access denied: Invalid token' });
        }
        req.user = user; // Save user info to request

        // Example: Check if user has admin role for admin-only route
        // if (req.path.startsWith('/Admin') && user.role !== 'Admin') {
        //     return res.status(403).json({ message: 'Access denied: insufficient permissions' });
        // }

        next();
    });
};

module.exports = adminJWT;
