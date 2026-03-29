const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: { type: String },
  phone: { type: String, trim: true },
  isAnonymous: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  twoFactorSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  safeWord: { type: String, default: 'help me' },
  shakeThreshold: { type: Number, default: 25 },
  darkMode: { type: Boolean, default: false },
  stealthMode: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never return sensitive fields
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.twoFactorSecret;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
