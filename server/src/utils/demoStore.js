/**
 * In-memory store for the demo user (no MongoDB needed).
 * All data resets on server restart — that's fine for demo purposes.
 */

const DEMO_USER_ID = 'demo_user_001';

const store = {
  contacts: [
    {
      _id: 'demo_contact_001',
      userId: 'demo_user_001',
      name: 'Emergency Contact',
      phone: '+919125445682',
      email: 'mailsfor.mrabhishek@gmail.com',
      relationship: 'Trusted Contact',
      notifyBySMS: true,
      notifyByEmail: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ],
  sosEvents: [],
  journeys: [],
  incidents: [],
};

let idCounter = 1;
const newId = () => `demo_${idCounter++}_${Date.now()}`;

const isDemo = (userId) => String(userId) === DEMO_USER_ID;

// ── Contacts ──────────────────────────────────────────────
const contacts = {
  findAll: (userId) => store.contacts.filter((c) => c.userId === userId),
  findById: (id, userId) => store.contacts.find((c) => c._id === id && c.userId === userId),
  create: (userId, data) => {
    const doc = { _id: newId(), userId, createdAt: new Date(), updatedAt: new Date(), ...data };
    store.contacts.push(doc);
    return doc;
  },
  update: (id, userId, data) => {
    const idx = store.contacts.findIndex((c) => c._id === id && c.userId === userId);
    if (idx === -1) return null;
    store.contacts[idx] = { ...store.contacts[idx], ...data, updatedAt: new Date() };
    return store.contacts[idx];
  },
  delete: (id, userId) => {
    const idx = store.contacts.findIndex((c) => c._id === id && c.userId === userId);
    if (idx === -1) return null;
    return store.contacts.splice(idx, 1)[0];
  },
};

// ── SOS Events ────────────────────────────────────────────
const sos = {
  create: (userId, data) => {
    const doc = { _id: newId(), userId, status: 'active', alertsSent: [], locationHistory: [], createdAt: new Date(), ...data };
    store.sosEvents.push(doc);
    return doc;
  },
  findActive: (userId) => store.sosEvents.find((s) => s.userId === userId && s.status === 'active') || null,
  findById: (id, userId) => store.sosEvents.find((s) => s._id === id && s.userId === userId),
  resolve: (id, userId, falseAlarm) => {
    const doc = store.sosEvents.find((s) => s._id === id && s.userId === userId && s.status === 'active');
    if (!doc) return null;
    doc.status = falseAlarm ? 'false_alarm' : 'resolved';
    doc.resolvedAt = new Date();
    return doc;
  },
  updateLocation: (id, userId, lat, lng) => {
    const doc = store.sosEvents.find((s) => s._id === id && s.userId === userId && s.status === 'active');
    if (!doc) return null;
    doc.location = { lat, lng };
    doc.locationHistory.push({ lat, lng, timestamp: new Date() });
    return doc;
  },
  history: (userId) => store.sosEvents.filter((s) => s.userId === userId).slice(-20).reverse(),
};

// ── Journeys ──────────────────────────────────────────────
const journeys = {
  create: (userId, data) => {
    // Cancel existing active
    store.journeys.forEach((j) => { if (j.userId === userId && j.status === 'active') j.status = 'cancelled'; });
    const doc = { _id: newId(), userId, status: 'active', alertSent: false, lastCheckIn: new Date(), createdAt: new Date(), ...data };
    store.journeys.push(doc);
    return doc;
  },
  findActive: (userId) => store.journeys.find((j) => j.userId === userId && j.status === 'active') || null,
  findById: (id, userId) => store.journeys.find((j) => j._id === id && j.userId === userId),
  checkIn: (id, userId) => {
    const doc = store.journeys.find((j) => j._id === id && j.userId === userId && j.status === 'active');
    if (!doc) return null;
    doc.lastCheckIn = new Date();
    return doc;
  },
  complete: (id, userId) => {
    const doc = store.journeys.find((j) => j._id === id && j.userId === userId && j.status === 'active');
    if (!doc) return null;
    doc.status = 'completed';
    return doc;
  },
};

// ── Incidents ─────────────────────────────────────────────
const incidents = {
  create: (userId, data) => {
    const doc = { _id: newId(), userId, status: 'pending', createdAt: new Date(), ...data };
    store.incidents.push(doc);
    return doc;
  },
  findAll: (userId) => store.incidents.filter((i) => i.userId === userId).reverse(),
};

module.exports = { isDemo, DEMO_USER_ID, contacts, sos, journeys, incidents };
