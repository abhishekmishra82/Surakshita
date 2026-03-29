const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true }, // Mixed to support both ObjectId and demo string id
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  relationship: { type: String, trim: true },
  notifyBySMS: { type: Boolean, default: true },
  notifyByEmail: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);
