const express = require('express');
const jwt = require('jsonwebtoken'); // Import the JWT library
require('dotenv').config(); // Load environment variables
const { generateOtp, sendOtpEmail, sendBookingMail, sendCustomEmail } = require('./nodemailer');
const dashboardUser = require('../models/dashboardUser');
const user = require('../models/user');
const { buildDashboardLoginResponse } = require('../controllers/dashboardUser');
const router = express.Router();

const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const VALID_LOGIN_TYPES = new Set(['user', 'dashboard']);

router.post('/send-otp', async (req, res) => {
    const { email, loginType } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    if (!VALID_LOGIN_TYPES.has(loginType)) {
        return res.status(400).json({ message: 'loginType must be either user or dashboard' });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;
    const emailRegex = new RegExp('^' + email + '$', 'i');
    // Development helper: log the generated OTP (only outside production)
    if (process.env.NODE_ENV !== 'production') {
        console.log(`DEV OTP for ${loginType}:${email.toLowerCase()} = ${otp}`);
    }

    try {
        const account = loginType === 'dashboard'
            ? await dashboardUser.findOne({ email: emailRegex })
            : await user.findOne({ email: emailRegex });

        if (!account) {
            return res.status(400).json({ message: 'No user account found with this email' });
        }

        if (loginType === 'dashboard' && account.status !== true) {
            return res.status(400).json({ message: 'Your account is not active. Please contact support.' });
        }

        await sendOtpEmail(email, otp);
        const otpKey = `${loginType}:${email.toLowerCase()}`;
        otpStore.set(otpKey, { otp, expiresAt, loginType });
        if (process.env.NODE_ENV !== 'production') {
            console.log(`DEV OTP stored for ${otpKey}`, { otp, expiresAt });
        }
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Invalid Email' });
    }
});

router.post('/verify-otp', async (req, res) => {
    const { email, otp, loginType } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }
    if (!VALID_LOGIN_TYPES.has(loginType)) {
        return res.status(400).json({ message: 'loginType must be either user or dashboard' });
    }

    const otpKey = `${loginType}:${email.toLowerCase()}`;
    if (process.env.NODE_ENV !== 'production') {
        console.log(`DEV verify attempt for ${otpKey}. Current OTP keys:`, Array.from(otpStore.keys()));
    }
    const stored = otpStore.get(otpKey);

    if (!stored) {
        return res.status(400).json({ message: 'OTP not found for this email. Please request a new one.' });
    }

    if (Date.now() > stored.expiresAt) {
        otpStore.delete(otpKey);
        return res.status(400).json({ message: 'OTP has expired' });
    }

    if (stored.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpStore.delete(otpKey);
    const emailRegex = new RegExp('^' + email + '$', 'i');
    try {
        if (loginType === 'dashboard') {
            const loggedDashboardUser = await dashboardUser.findOne({ email: emailRegex });
            if (!loggedDashboardUser) {
                return res.status(400).json({ message: 'No user account found with this email' });
            }
            if (loggedDashboardUser.status !== true) {
                return res.status(400).json({ message: 'Your account is not active. Please contact support.' });
            }

            const dashboardResponse = await buildDashboardLoginResponse(loggedDashboardUser);
            return res.status(200).json({
                role: loggedDashboardUser.role,
                ...dashboardResponse,
            });
        }

        const foundUser = await user.findOne({ email: emailRegex });

        if (!foundUser) {
            return res.status(400).json({ message: 'No user account found with this email' });
        }

        const rsToken = jwt.sign(
            { id: foundUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            role: 'user',
            message: 'Logged in successfully',
            userId: foundUser.userId,
            rsToken,
            email: foundUser.email,
            mobile: foundUser.mobile,
        });
    } catch (error) {
        console.error('Error during login after OTP verification:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/send-booking-mail', async (req, res) => {
    const { email, subject, bookingData, link } = req.body;
    try {
        await sendBookingMail(email, subject, bookingData, link);
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/send-message', async (req, res) => {
    const { email, subject, message, link } = req.body;
    try {
        await sendCustomEmail(email, subject, message, link);
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;
