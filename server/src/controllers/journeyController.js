const Journey = require('../models/Journey');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { sendSMS } = require('../services/smsService');
const { isDemo, contacts: demoContacts, journeys: demoJourneys } = require('../utils/demoStore');

// POST /api/journey/start
exports.startJourney = async (req, res) => {
  try {
    const { destination, destinationCoords, expectedArrival, startLocation, checkInInterval } = req.body;
    if (!destination || !expectedArrival) {
      return res.status(400).json({ error: 'Destination and expected arrival time are required' });
    }

    if (isDemo(req.user._id)) {
      const journey = demoJourneys.create(req.user._id, {
        destination, destinationCoords,
        expectedArrival: new Date(expectedArrival),
        startLocation,
        checkInInterval: checkInInterval || 15,
      });
      return res.status(201).json({ journey });
    }

    await Journey.updateMany({ userId: req.user._id, status: 'active' }, { status: 'cancelled' });
    const journey = await Journey.create({
      userId: req.user._id, destination, destinationCoords,
      expectedArrival: new Date(expectedArrival), startLocation,
      checkInInterval: checkInInterval || 15, lastCheckIn: new Date(),
    });
    res.status(201).json({ journey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/journey/:id/checkin
exports.checkIn = async (req, res) => {
  try {
    if (isDemo(req.user._id)) {
      const journey = demoJourneys.checkIn(req.params.id, req.user._id);
      if (!journey) return res.status(404).json({ error: 'Active journey not found' });
      return res.json({ message: 'Check-in successful', journey });
    }
    const journey = await Journey.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: 'active' },
      { lastCheckIn: new Date() }, { new: true }
    );
    if (!journey) return res.status(404).json({ error: 'Active journey not found' });
    res.json({ message: 'Check-in successful', journey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/journey/:id/complete
exports.completeJourney = async (req, res) => {
  try {
    if (isDemo(req.user._id)) {
      const journey = demoJourneys.complete(req.params.id, req.user._id);
      if (!journey) return res.status(404).json({ error: 'Active journey not found' });
      const contacts = demoContacts.findAll(req.user._id);
      contacts.forEach((c) => {
        if (c.notifyBySMS && c.phone) {
          sendSMS(c.phone, `✅ Demo User has safely arrived at ${journey.destination}.`);
        }
      });
      return res.json({ message: 'Journey completed', journey });
    }

    const journey = await Journey.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: 'active' },
      { status: 'completed' }, { new: true }
    );
    if (!journey) return res.status(404).json({ error: 'Active journey not found' });
    const user = await User.findById(req.user._id);
    const contacts = await Contact.find({ userId: req.user._id });
    contacts.forEach((c) => {
      if (c.notifyBySMS && c.phone) {
        sendSMS(c.phone, `✅ ${user?.name || 'Your contact'} has safely arrived at ${journey.destination}.`);
      }
    });
    res.json({ message: 'Journey completed', journey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/journey/active
exports.getActiveJourney = async (req, res) => {
  try {
    if (isDemo(req.user._id)) {
      return res.json({ journey: demoJourneys.findActive(req.user._id) });
    }
    const journey = await Journey.findOne({ userId: req.user._id, status: 'active' });
    res.json({ journey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Background job: check overdue journeys
exports.checkOverdueJourneys = async () => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) return;

    const now = new Date();
    const overdueJourneys = await Journey.find({
      status: 'active', expectedArrival: { $lt: now }, alertSent: false,
    }).populate('userId');

    for (const journey of overdueJourneys) {
      const contacts = await Contact.find({ userId: journey.userId._id });
      const userName = journey.userId.name || 'A user';
      for (const contact of contacts) {
        if (contact.notifyBySMS && contact.phone) {
          await sendSMS(contact.phone,
            `⚠️ SAFETY ALERT: ${userName} was expected to arrive at ${journey.destination} by ${journey.expectedArrival.toLocaleString()} but hasn't checked in.`
          );
        }
      }
      journey.alertSent = true;
      journey.status = 'overdue';
      await journey.save();
    }
  } catch (err) {
    console.error('Overdue journey check error:', err.message);
  }
};
