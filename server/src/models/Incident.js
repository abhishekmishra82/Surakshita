const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed },
  type: { type: String, required: true },
  description: { type: String },
  location: { lat: Number, lng: Number, address: String },
  anonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
