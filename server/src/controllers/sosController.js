const SOSEvent = require('../models/SOSEvent');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { sendSMS, buildSOSMessage } = require('../services/smsService');
const { sendEmail, buildSOSEmailHTML } = require('../services/emailService');
const { isDemo, contacts: demoContacts, sos: demoSOS } = require('../utils/demoStore');

// POST /api/sos/trigger
exports.triggerSOS = async (req, res) => {
  try {
    const { lat, lng, address, triggeredBy } = req.body;
    const timestamp = Date.now();

    if (isDemo(req.user._id)) {
      const contacts = demoContacts.findAll(req.user._id);
      const sosEvent = demoSOS.create(req.user._id, {
        triggeredBy: triggeredBy || 'button',
        location: { lat, lng, address },
        locationHistory: [{ lat, lng }],
      });

      // Emit via socket
      const io = req.app.get('io');
      if (io) {
        io.to(req.user._id.toString()).emit('sos-active', {
          sosId: sosEvent._id, userId: req.user._id, location: { lat, lng }, timestamp,
        });
      }

      // Still try to send SMS/email if contacts have them
      const userName = req.user.name || 'Demo User';
      contacts.forEach((contact) => {
        if (contact.notifyBySMS && contact.phone) {
          sendSMS(contact.phone, buildSOSMessage(userName, lat, lng, timestamp));
        }
        if (contact.notifyByEmail && contact.email) {
          sendEmail({ to: contact.email, subject: `🚨 EMERGENCY: ${userName} needs help!`, html: buildSOSEmailHTML(userName, lat, lng, timestamp) });
        }
      });

      return res.status(201).json({
        message: 'SOS triggered successfully',
        sosId: sosEvent._id,
        contactsAlerted: contacts.length,
      });
    }

    // Real DB path
    const contacts = await Contact.find({ userId: req.user._id });
    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No emergency contacts found. Please add at least one contact.' });
    }

    const sosEvent = await SOSEvent.create({
      userId: req.user._id,
      triggeredBy: triggeredBy || 'button',
      location: { lat, lng, address },
      locationHistory: [{ lat, lng }],
      status: 'active',
    });

    const alertsSent = [];
    const user = await User.findById(req.user._id);
    const userName = user?.name || 'A Surakshita user';

    Promise.all(contacts.map(async (contact) => {
      if (contact.notifyBySMS && contact.phone) {
        const result = await sendSMS(contact.phone, buildSOSMessage(userName, lat, lng, timestamp));
        alertsSent.push({ contactId: contact._id, method: 'sms', status: result.success ? 'sent' : 'failed' });
      }
      if (contact.notifyByEmail && contact.email) {
        const result = await sendEmail({ to: contact.email, subject: `🚨 EMERGENCY: ${userName} needs help!`, html: buildSOSEmailHTML(userName, lat, lng, timestamp) });
        alertsSent.push({ contactId: contact._id, method: 'email', status: result.success ? 'sent' : 'failed' });
      }
    })).then(async () => {
      sosEvent.alertsSent = alertsSent;
      await sosEvent.save();
    });

    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('sos-active', {
        sosId: sosEvent._id, userId: req.user._id, location: { lat, lng }, timestamp,
      });
    }

    res.status(201).json({ message: 'SOS triggered successfully', sosId: sosEvent._id, contactsAlerted: contacts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/sos/:id/resolve
exports.resolveSOS = async (req, res) => {
  try {
    if (isDemo(req.user._id)) {
      const sos = demoSOS.resolve(req.params.id, req.user._id, req.body.falseAlarm);
      if (!sos) return res.status(404).json({ error: 'Active SOS not found' });
      const io = req.app.get('io');
      if (io) io.to(req.user._id.toString()).emit('sos-cancelled', { sosId: sos._id });
      return res.json({ message: 'SOS resolved', sos });
    }

    const sos = await SOSEvent.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: 'active' },
      { status: req.body.falseAlarm ? 'false_alarm' : 'resolved', resolvedAt: new Date() },
      { new: true }
    );
    if (!sos) return res.status(404).json({ error: 'Active SOS not found' });
    const io = req.app.get('io');
    if (io) io.to(req.user._id.toString()).emit('sos-cancelled', { sosId: sos._id });
    res.json({ message: 'SOS resolved', sos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/sos/:id/location
exports.updateSOSLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (isDemo(req.user._id)) {
      const sos = demoSOS.updateLocation(req.params.id, req.user._id, lat, lng);
      if (!sos) return res.status(404).json({ error: 'Active SOS not found' });
      const io = req.app.get('io');
      if (io) io.to(req.user._id.toString()).emit('location-update', { sosId: sos._id, userId: req.user._id, lat, lng, timestamp: Date.now() });
      return res.json({ message: 'Location updated' });
    }

    const sos = await SOSEvent.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: 'active' },
      { $set: { 'location.lat': lat, 'location.lng': lng }, $push: { locationHistory: { lat, lng, timestamp: new Date() } } },
      { new: true }
    );
    if (!sos) return res.status(404).json({ error: 'Active SOS not found' });
    const io = req.app.get('io');
    if (io) io.to(req.user._id.toString()).emit('location-update', { sosId: sos._id, userId: req.user._id, lat, lng, timestamp: Date.now() });
    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/sos/active
exports.getActiveSOS = async (req, res) => {
  try {
    if (isDemo(req.user._id)) {
      return res.json({ sos: demoSOS.findActive(req.user._id) });
    }
    const sos = await SOSEvent.findOne({ userId: req.user._id, status: 'active' }).sort({ createdAt: -1 });
    res.json({ sos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/sos/history
exports.getSOSHistory = async (req, res) => {
  try {
    if (isDemo(req.user._id)) {
      return res.json({ events: demoSOS.history(req.user._id) });
    }
    const events = await SOSEvent.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
