const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL on 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const isEmailConfigured = () =>
  !!(process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  !process.env.EMAIL_PASS.includes('your_') &&
  !process.env.EMAIL_PASS.includes('password_here') &&
  process.env.EMAIL_PASS.length >= 16);

const sendEmail = async ({ to, subject, html }) => {
  if (!isEmailConfigured()) {
    console.warn('Email not configured — skipping email to:', to);
    return { success: false, error: 'Email not configured' };
  }
  try {
    await getTransporter().sendMail({
      from: `"Surakshita Safety" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

const buildSOSEmailHTML = (userName, lat, lng, timestamp) => {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:2px solid #e53e3e;border-radius:8px;">
      <h1 style="color:#e53e3e;text-align:center;">🚨 EMERGENCY ALERT</h1>
      <p style="font-size:18px;"><strong>${userName}</strong> has triggered an SOS alert and needs immediate help.</p>
      <div style="background:#fff5f5;padding:16px;border-radius:6px;margin:16px 0;">
        <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <p><strong>Live Location:</strong> <a href="${mapsLink}" style="color:#e53e3e;">${mapsLink}</a></p>
      </div>
      <p style="color:#666;">Please respond immediately or contact emergency services (100/112).</p>
      <p style="font-size:12px;color:#999;margin-top:24px;">This alert was sent by Surakshita Safety App.</p>
    </div>
  `;
};

const sendOTPEmail = async (to, otp) => {
  return sendEmail({
    to,
    subject: 'Surakshita - Your OTP Code',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:20px;">
        <h2 style="color:#7c3aed;">Surakshita Safety</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing:8px;color:#7c3aed;">${otp}</h1>
        <p>This code expires in ${process.env.OTP_EXPIRY || 10} minutes.</p>
        <p style="color:#999;font-size:12px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, buildSOSEmailHTML, sendOTPEmail };
