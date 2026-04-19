const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
    const raw = req.headers['authorization'] || '';
    const token = /^Bearer\s+/i.test(raw) ? raw.replace(/^Bearer\s+/i, '').trim() : raw.trim();

    if (!token) {
        return res.status(401).json({ message: 'Access denied: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log(err);

            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: 'Access denied: Token has expired' });
            }
            return res.status(403).json({ message: 'Access denied: Invalid token' });
        }
        req.user = user; // Save user info to request
        next();
    });
};

module.exports = auth;
