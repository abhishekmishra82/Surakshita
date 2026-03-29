const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },
  destination: { type: String, required: true },
  destinationCoords: { lat: Number, lng: Number },
  expectedArrival: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed', 'overdue', 'cancelled'], default: 'active' },
  startLocation: { lat: Number, lng: Number },
  checkInInterval: { type: Number, default: 15 }, // minutes
  lastCheckIn: { type: Date },
  alertSent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Journey', journeySchema);
