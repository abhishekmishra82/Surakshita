const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const { sendOTPEmail } = require('../services/emailService');
const mongoose = require('mongoose');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'surakshita_dev_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const isDBConnected = () => mongoose.connection.readyState === 1;

// In-memory demo account (works without MongoDB)
const DEMO_USER = {
  _id: 'demo_user_001',
  name: 'Demo User',
  email: 'email123@gmail.com',
  password: '@Email1234', // plain — compared directly for demo
  isAnonymous: false,
  isVerified: true,
  twoFactorEnabled: false,
  safeWord: 'help me',
  shakeThreshold: 25,
  darkMode: false,
  stealthMode: false,
};

const demoToSafe = () => {
  const { password, ...safe } = DEMO_USER;
  return safe;
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + (process.env.OTP_EXPIRY || 10) * 60 * 1000);

    const user = await User.create({ name, email, password, phone, otp, otpExpiry });

    const emailResult = await sendOTPEmail(email, otp);

    // If email not configured, auto-verify for dev convenience
    if (!emailResult.success) {
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      const token = generateToken(user._id);
      return res.status(201).json({
        message: 'Registration successful. Email not configured — auto-verified for development.',
        autoVerified: true,
        token,
        user: user.toSafeObject(),
      });
    }

    res.status(201).json({ message: 'Registration successful. Check your email for OTP.', userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Already verified' });
    if (user.otp !== otp || new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Demo account — works without MongoDB
    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      const token = generateToken(DEMO_USER._id);
      return res.json({ token, user: demoToSafe() });
    }

    // Require DB for all other accounts
    if (!isDBConnected()) {
      return res.status(503).json({ error: 'Database not connected. Only the demo account (email123@gmail.com) is available right now.' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ error: 'Please verify your email first' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.twoFactorEnabled) {
      return res.json({ requires2FA: true, userId: user._id });
    }

    const token = generateToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login-anonymous
exports.loginAnonymous = async (req, res) => {
  try {
    const anonId = crypto.randomBytes(8).toString('hex');
    const user = await User.create({
      name: `Anonymous_${anonId}`,
      email: `anon_${anonId}@surakshita.local`,
      isAnonymous: true,
      isVerified: true,
    });
    const token = generateToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/resend-otp
exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Already verified' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + (process.env.OTP_EXPIRY || 10) * 60 * 1000);
    await user.save();
    await sendOTPEmail(user.email, otp);

    res.json({ message: 'OTP resent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/2fa/setup
exports.setup2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `Surakshita (${req.user.email})` });
    req.user.twoFactorSecret = secret.base32;
    await req.user.save();

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ qrCode: qrDataUrl, secret: secret.base32 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/2fa/verify
exports.verify2FA = async (req, res) => {
  try {
    const { token, userId } = req.body;
    const user = await User.findById(userId || req.user?._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) return res.status(400).json({ error: 'Invalid 2FA token' });

    if (!user.twoFactorEnabled) {
      user.twoFactorEnabled = true;
      await user.save();
    }

    const jwtToken = generateToken(user._id);
    res.json({ token: jwtToken, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
};

// PUT /api/auth/settings
exports.updateSettings = async (req, res) => {
  try {
    const { safeWord, shakeThreshold, darkMode, stealthMode } = req.body;
    const user = await User.findById(req.user._id);
    if (safeWord !== undefined) user.safeWord = safeWord;
    if (shakeThreshold !== undefined) user.shakeThreshold = shakeThreshold;
    if (darkMode !== undefined) user.darkMode = darkMode;
    if (stealthMode !== undefined) user.stealthMode = stealthMode;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
