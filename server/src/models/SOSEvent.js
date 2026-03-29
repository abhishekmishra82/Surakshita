const mongoose = require('mongoose');

const sosEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },
  triggeredBy: { type: String, enum: ['button', 'shake', 'voice', 'auto'], default: 'button' },
  status: { type: String, enum: ['active', 'resolved', 'false_alarm'], default: 'active' },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
  },
  locationHistory: [{
    lat: Number,
    lng: Number,
    timestamp: { type: Date, default: Date.now },
  }],
  alertsSent: [{
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    method: { type: String, enum: ['sms', 'email'] },
    status: { type: String, enum: ['sent', 'failed'] },
    sentAt: { type: Date, default: Date.now },
  }],
  resolvedAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SOSEvent', sosEventSchema);
