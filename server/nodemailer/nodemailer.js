const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();
const { format } = require("date-fns");
const user = require("../models/user"); // Ensure this path is correct

// Transporter Configuration
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

// Verify transporter configuration at startup to catch missing creds early.
transporter.verify()
  .then(() => {
    console.log('Mailer transporter is configured and ready');
  })
  .catch((err) => {
    console.warn('Mailer verification failed. Emails may not be sent. Error:', err && err.message ? err.message : err);
  });

// --- HELPER: Base Email Container (To keep design consistent) ---
const wrapInTemplate = (content) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HotelRoomsStay Notification</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-top: 20px; margin-bottom: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        ${content}
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            &copy; ${new Date().getFullYear()} HotelRoomsStay. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// --- 1. OTP FUNCTION ---
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendOtpEmail = async (email, otp) => {
  // Check if user exists
  const matchEmail = await user.findOne({
    email: { $regex: new RegExp(email, "i") },
  });
  
  if (!matchEmail) {
    throw new Error("Email not registered. Please sign up first.");
  }

  const htmlContent = `
    <div style="padding: 40px 30px; text-align: center;">
      <div style="background-color: #eff6ff; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <span style="font-size: 30px;">🔒</span>
      </div>
      <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">Verify Your Email</h1>
      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
        Hello,<br>To complete your registration, please use the One-Time Password (OTP) below.
      </p>
      
      <div style="background: linear-gradient(to right, #2563eb, #3b82f6); padding: 15px 30px; border-radius: 8px; display: inline-block; color: white; letter-spacing: 8px; font-weight: bold; font-size: 32px; margin-bottom: 30px;">
        ${otp}
      </div>

      <p style="color: #6b7280; font-size: 14px;">This OTP is valid for 10 minutes.<br>Please do not share it with anyone.</p>
    </div>
  `;

  const mailOptions = {
    from: `"HRS (HotelRoomsStay)" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: "Your OTP for Email Verification - HotelRoomsStay",
    text: `Your OTP is: ${otp}`,
    html: wrapInTemplate(htmlContent),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};

// --- 2. BOOKING CONFIRMATION ---

const generateBookingHtml = (data) => {
  // Safe extraction of data (structure fixing)
  const bookingId = data.bookingId || "N/A";
  const hotelName = data.hotelDetails?.hotelName || "Hotel";
  const destination = data.hotelDetails?.destination || "Unknown";
  const userName = data.user?.name || "Guest";
  const price = data.price || 0;
  const guests = data.guests || 1;
  const numRooms = data.numRooms || 1;
  const checkIn = data.checkInDate ? format(new Date(data.checkInDate), "dd MMM yyyy") : "N/A";
  const checkOut = data.checkOutDate ? format(new Date(data.checkOutDate), "dd MMM yyyy") : "N/A";
  
  // Handling Room Types Array safely
  const roomTypes = Array.isArray(data.roomDetails) 
    ? data.roomDetails.map((r) => r.type).join(", ") 
    : (data.roomTypes || "Standard Room");

  return `
    <div style="background-color: #2563eb; padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px;">Booking Confirmed!</h1>
      <p style="color: #dbeafe; margin-top: 5px; font-size: 16px;">We're excited to host you.</p>
    </div>
    
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
        Hi <strong>${userName}</strong>,<br>
        Your reservation at <span style="color: #2563eb; font-weight: 600;">${hotelName}</span> has been confirmed.
      </p>

      <!-- Booking ID Box -->
      <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <span style="color: #6b7280; text-transform: uppercase; font-size: 12px; font-weight: bold;">Booking Reference</span>
        <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #111827;">${bookingId}</span>
      </div>

      <!-- Details Grid -->
      <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 14px; margin-bottom: 20px;">
        <tr>
          <td style="color: #6b7280; width: 30%;">Hotel</td>
          <td style="font-weight: 600; color: #111827;">${hotelName}</td>
        </tr>
        <tr>
          <td style="color: #6b7280;">Destination</td>
          <td style="font-weight: 600; color: #111827;">${destination}</td>
        </tr>
        <tr>
          <td style="color: #6b7280;">Room Type</td>
          <td style="font-weight: 600; color: #111827;">${roomTypes}</td>
        </tr>
        <tr>
          <td style="color: #6b7280;">Guests</td>
          <td style="font-weight: 600; color: #111827;">${guests} (${numRooms} Room)</td>
        </tr>
      </table>

      <!-- Dates Box -->
      <div style="border-top: 1px dashed #d1d5db; border-bottom: 1px dashed #d1d5db; padding: 15px 0; display: flex; margin-bottom: 20px;">
        <div style="width: 50%; border-right: 1px solid #e5e7eb; padding-right: 10px;">
          <div style="font-size: 11px; color: #9ca3af; font-weight: bold; text-transform: uppercase;">Check-In</div>
          <div style="font-size: 16px; font-weight: bold; color: #1f2937; margin-top: 4px;">${checkIn}</div>
          <div style="font-size: 12px; color: #6b7280;">12:00 PM</div>
        </div>
        <div style="width: 50%; padding-left: 15px;">
          <div style="font-size: 11px; color: #9ca3af; font-weight: bold; text-transform: uppercase;">Check-Out</div>
          <div style="font-size: 16px; font-weight: bold; color: #1f2937; margin-top: 4px;">${checkOut}</div>
          <div style="font-size: 12px; color: #6b7280;">11:00 AM</div>
        </div>
      </div>

      <div style="text-align: right;">
        <span style="font-size: 13px; color: #6b7280;">Total Paid: </span>
        <span style="font-size: 24px; font-weight: bold; color: #2563eb;">₹${price}</span>
      </div>
    </div>
  `;
};

const sendBookingConfirmationMail = async ({ email, subject, bookingData, link }) => {
  const messageHtml = generateBookingHtml(bookingData);
  const linkHtml = link
    ? `<div style="text-align:center; padding: 0 30px 30px 30px;">
         <a href="${link}" style="background-color: #111827; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Full Itinerary</a>
       </div>`
    : "";

  const mailOptions = {
    from: `"HRS (HotelRoomsStay)" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: subject || "Booking Confirmation",
    text: `Booking Confirmed: ${bookingData.bookingId}`,
    html: wrapInTemplate(`${messageHtml}${linkHtml}`),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${email}`);
  } catch (err) {
    console.error("Failed to send booking confirmation email:", err.message);
    throw err;
  }
};

// --- 3. THANK YOU EMAIL ---

const generateThankYouHtml = (data) => {
  const userName = data.user?.name || "Guest";
  const hotelName = data.hotelDetails?.hotelName || "Our Hotel";

  return `
    <div style="background-color: #10b981; padding: 25px; text-align: center; color: white;">
      <h2 style="margin: 0; font-size: 24px;">🌟 Thank You For Your Stay!</h2>
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #374151;">Hi <strong>${userName}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
        Thank you for choosing <strong>${hotelName}</strong>. We hope you had a wonderful visit. 
        Your feedback helps us create better experiences.
      </p>
    </div>
  `;
};

const sendThankYouForVisitMail = async ({ email, subject, bookingData, link }) => {
  const thankYouMessageHtml = generateThankYouHtml(bookingData);
  const reviewLinkHtml = link
    ? `<div style="text-align:center; padding-bottom: 30px;">
         <a href="${link}" style="background-color: #f59e0b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Leave a Review</a>
       </div>`
    : "";

  const mailOptions = {
    from: `"HRS (HotelRoomsStay)" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: subject || `Thank you for staying at ${bookingData.hotelDetails.hotelName}!`,
    html: wrapInTemplate(`${thankYouMessageHtml}${reviewLinkHtml}`),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send Thank You email:", err);
  }
};

// --- 4. CANCELLATION EMAIL ---

const generateBookingCancellationHtml = (data) => {
  const userName = data.user?.name || "Guest";
  const hotelName = data.hotelDetails?.hotelName || "Hotel";
  const bookingId = data.bookingId || "N/A";

  return `
    <div style="background-color: #ef4444; padding: 25px; text-align: center; color: white;">
      <h2 style="margin: 0; font-size: 24px;">Booking Cancelled</h2>
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #374151;">Hi <strong>${userName}</strong>,</p>
      <p style="color: #4b5563;">This email confirms that your booking has been cancelled.</p>
      
      <table width="100%" style="margin-top: 20px; background-color: #fef2f2; border-radius: 8px; padding: 15px;">
        <tr>
          <td style="padding: 5px; font-weight: bold; color: #991b1b;">Hotel:</td>
          <td style="padding: 5px; color: #111827;">${hotelName}</td>
        </tr>
        <tr>
          <td style="padding: 5px; font-weight: bold; color: #991b1b;">ID:</td>
          <td style="padding: 5px; color: #111827;">${bookingId}</td>
        </tr>
      </table>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        Refunds (if applicable) will be processed within 5-7 business days.
      </p>
    </div>
  `;
};

const sendBookingCancellationMail = async ({ email, subject, bookingData, link }) => {
  const content = generateBookingCancellationHtml(bookingData);
  
  const mailOptions = {
    from: `"HRS (HotelRoomsStay)" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: subject || `Cancellation: ${bookingData.bookingId}`,
    html: wrapInTemplate(content),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Cancellation email sent to ${email}`);
  } catch (err) {
    console.error("Failed to send cancellation email:", err);
    throw err;
  }
};

// --- 5. CUSTOM EMAIL ---

const sendCustomEmail = async ({ email, subject, message, link }) => {
  const linkHtml = link
    ? `<div style="text-align:center; margin-top: 30px;">
         <a href="${link}" style="background-color: #3b82f6; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold;">Click Here</a>
       </div>`
    : "";

  const content = `
    <div style="padding: 40px 30px;">
      <h2 style="color: #1a202c; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-top: 0;">${subject}</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #4a5568; white-space: pre-wrap;">${message}</p>
      ${linkHtml}
    </div>
  `;

  const mailOptions = {
    from: `"HRS (HotelRoomsStay)" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject,
    html: wrapInTemplate(content),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Custom email sent to ${email}`);
  } catch (error) {
    console.error("Error sending custom email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = {
  sendOtpEmail,
  generateOtp,
  sendBookingConfirmationMail,
  sendThankYouForVisitMail,
  sendBookingCancellationMail,
  sendCustomEmail,
};
