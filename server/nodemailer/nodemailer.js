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

const BRAND_NAME = "HotelRoomsStay";
const SUPPORT_EMAIL = "info@hotelrroomsstay.com";

const buildLuxuryEmailTemplate = ({ title, content, hotelName }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e0e0e0;">
              <tr>
                <td align="center" style="padding: 50px 40px 30px 40px; border-bottom: 1px solid #eeeeee;">
                  <h1 style="font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; margin: 0; font-size: 28px; font-weight: normal; letter-spacing: 1px;">${title}</h1>
                  <p style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; color: #777777; margin: 15px 0 0 0; font-size: 16px;">Thank you for choosing ${BRAND_NAME}</p>
                  ${hotelName ? `<p style="font-size: 13px; color: #666666; margin: 10px 0 0 0;">Hotel: ${hotelName}</p>` : ""}
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
                  <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 14px; color: #cccccc; line-height: 1.6;">
                    For any help and inquiry, contact and mail us at<br>
                    <a href="mailto:${SUPPORT_EMAIL}" style="color: #ffffff; text-decoration: none; border-bottom: 1px solid #555555;">${SUPPORT_EMAIL}</a>
                  </p>
                </td>
              </tr>
            </table>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <tr>
                <td style="padding: 25px 20px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #999999; font-family: Arial, Helvetica, sans-serif;">
                    &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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

  const otpContent = `
    <p style="font-size: 15px; color: #333333; margin: 0 0 25px 0; line-height: 1.8;">
      Dear Guest,<br><br>
      To continue securely, please use the verification code below.
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; border-top: 1px solid #1a1a1a; border-bottom: 1px solid #1a1a1a;">
      <tr>
        <td style="padding: 20px 10px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" style="font-family: Georgia, 'Times New Roman', serif; color: #555555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">One-Time Password</td>
              <td align="right" style="font-size: 28px; font-weight: bold; color: #1a1a1a; letter-spacing: 8px;">${otp}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="font-size: 14px; color: #555555; margin: 0; line-height: 1.7;">
      This OTP is valid for 10 minutes. Please do not share this code with anyone.
    </p>
  `;

  const mailOptions = {
    from: `"HRS (HotelRoomsStay)" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: "Your OTP for Email Verification - HotelRoomsStay",
    text: `Your OTP is: ${otp}`,
    html: buildLuxuryEmailTemplate({
      title: "Email Verification",
      content: otpContent,
    }),
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
  const bookingId = data.bookingId || "N/A";
  const hotelName = data.hotelDetails?.hotelName || "Hotel";
  const destination = data.hotelDetails?.destination || data.destination || "Unknown";
  const userName = data.user?.name || "Guest";
  const price = data.price || 0;
  const guests = data.guests || 1;
  const numRooms = data.numRooms || 1;
  const checkIn = data.checkInDate ? format(new Date(data.checkInDate), "dd MMM yyyy") : "N/A";
  const checkOut = data.checkOutDate ? format(new Date(data.checkOutDate), "dd MMM yyyy") : "N/A";
  
  const roomTypes = Array.isArray(data.roomDetails)
    ? data.roomDetails.map((room) => room.type || room.roomType || "Standard Room").join(", ")
    : (data.roomTypes || "Standard Room");

  const bookingContent = `
    <p style="font-size: 15px; color: #333333; margin: 0 0 30px 0; line-height: 1.8;">
      Dear <strong>${userName}</strong>,<br><br>
      We are delighted to confirm your upcoming reservation. We eagerly anticipate your arrival and remain at your disposal to ensure a truly memorable stay. Please review the details of your booking below.
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 35px; border-top: 1px solid #1a1a1a; border-bottom: 1px solid #1a1a1a;">
      <tr>
        <td style="padding: 20px 10px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="left" style="font-family: Georgia, 'Times New Roman', serif; color: #555555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Confirmation Number</td>
              <td align="right" style="font-size: 18px; font-weight: bold; color: #1a1a1a; letter-spacing: 2px;">${bookingId}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table border="0" cellpadding="15" cellspacing="0" width="100%" style="font-size: 14px; margin-bottom: 40px; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; width: 40%; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Hotel Name</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">${hotelName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; width: 40%; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Destination</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">${destination}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Room Category</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">${roomTypes}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Guests</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">${guests} Guests, ${numRooms} Room(s)</td>
      </tr>
    </table>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px; background-color: #fafafa; border: 1px solid #eeeeee;">
      <tr>
        <td width="50%" align="center" style="padding: 30px 20px; border-right: 1px solid #eeeeee;">
          <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Check-In</div>
          <div style="font-size: 18px; color: #1a1a1a; margin-bottom: 5px;">${checkIn}</div>
          <div style="font-size: 13px; color: #555555;">From 12:00 PM</div>
        </td>
        <td width="50%" align="center" style="padding: 30px 20px;">
          <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Check-Out</div>
          <div style="font-size: 18px; color: #1a1a1a; margin-bottom: 5px;">${checkOut}</div>
          <div style="font-size: 13px; color: #555555;">By 11:00 AM</div>
        </td>
      </tr>
    </table>

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="right" style="padding-top: 15px; border-top: 1px solid #eeeeee;">
          <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 14px; color: #666666; margin-right: 15px; text-transform: uppercase; letter-spacing: 1px;">Total Amount</span>
          <span style="font-size: 26px; color: #1a1a1a;">₹${price}</span>
        </td>
      </tr>
    </table>
  `;

  return buildLuxuryEmailTemplate({
    title: "Reservation Confirmation",
    content: bookingContent,
    hotelName,
  });
};

const sendBookingConfirmationMail = async ({ email, subject, bookingData }) => {
  const messageHtml = generateBookingHtml(bookingData);

  const mailOptions = {
    from: `"HRS (HotelRoomsStay)" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: subject || "Booking Confirmation",
    text: `Booking Confirmed: ${bookingData.bookingId}`,
    html: messageHtml,
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
  const bookingId = data.bookingId || "N/A";

  return `
    <p style="font-size: 15px; color: #333333; margin: 0 0 25px 0; line-height: 1.8;">
      Dear <strong>${userName}</strong>,<br><br>
      Thank you for staying with us. We hope your experience at <strong>${hotelName}</strong> was truly memorable.
    </p>
    <table border="0" cellpadding="15" cellspacing="0" width="100%" style="font-size: 14px; margin-bottom: 30px; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; width: 40%; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Hotel Name</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">${hotelName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Booking ID</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">${bookingId}</td>
      </tr>
    </table>
    <p style="font-size: 14px; color: #555555; margin: 0; line-height: 1.7;">
      We look forward to welcoming you again soon.
    </p>
  `;
};

const sendThankYouForVisitMail = async ({ email, subject, bookingData, link }) => {
  const hotelName = bookingData?.hotelDetails?.hotelName || "Our Hotel";
  const thankYouMessageHtml = generateThankYouHtml(bookingData);
  const reviewLinkHtml = link
    ? `<div style="text-align:center; padding-top: 25px;">
         <a href="${link}" style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 0; font-weight: normal; font-family: Georgia, 'Times New Roman', serif;">Leave a Review</a>
       </div>`
    : "";

  const mailOptions = {
    from: `"HRS (HotelRoomsStay)" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: subject || `Thank you for staying at ${hotelName}!`,
    html: buildLuxuryEmailTemplate({
      title: "Thank You For Your Stay",
      content: `${thankYouMessageHtml}${reviewLinkHtml}`,
      hotelName,
    }),
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
  const destination = data.hotelDetails?.destination || data.destination || "Unknown";
  const bookingId = data.bookingId || "N/A";
  const checkIn = data.checkInDate ? format(new Date(data.checkInDate), "dd MMM yyyy") : "N/A";
  const checkOut = data.checkOutDate ? format(new Date(data.checkOutDate), "dd MMM yyyy") : "N/A";
  const refundAmount = data.price || 0;

  return `
    <p style="font-size: 15px; color: #333333; margin: 0 0 30px 0; line-height: 1.8;">
      Dear <strong>${userName}</strong>,<br><br>
      This is to confirm that your reservation has been cancelled. Please review the cancellation details below.
    </p>

    <table border="0" cellpadding="15" cellspacing="0" width="100%" style="font-size: 14px; margin-bottom: 30px; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; width: 40%; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Confirmation Number</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">${bookingId}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Hotel Name</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">${hotelName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Destination</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">${destination}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Check-In</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">${checkIn}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Check-Out</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">${checkOut}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="color: #666666; padding-left: 5px; font-family: Georgia, 'Times New Roman', serif;">Eligible Refund</td>
        <td style="color: #1a1a1a; padding-right: 5px; text-align: right;">₹${refundAmount}</td>
      </tr>
    </table>

    <p style="font-size: 14px; color: #555555; margin: 0; line-height: 1.7;">
      Refunds (if applicable) are generally processed within 5-7 business days.
    </p>
  `;
};

const sendBookingCancellationMail = async ({ email, subject, bookingData }) => {
  const content = generateBookingCancellationHtml(bookingData);
  const hotelName = bookingData?.hotelDetails?.hotelName || "Hotel";
  
  const mailOptions = {
    from: `"HRS (HotelRoomsStay)" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: subject || `Cancellation: ${bookingData.bookingId}`,
    html: buildLuxuryEmailTemplate({
      title: "Reservation Cancellation",
      content,
      hotelName,
    }),
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
         <a href="${link}" style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 0; font-family: Georgia, 'Times New Roman', serif;">Click Here</a>
       </div>`
    : "";

  const content = `
    <p style="font-size: 15px; color: #333333; margin: 0; line-height: 1.8; white-space: pre-wrap;">${message}</p>
    ${linkHtml}
  `;

  const mailOptions = {
    from: `"HRS (HotelRoomsStay)" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject,
    html: buildLuxuryEmailTemplate({
      title: subject || "Notification",
      content,
    }),
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
