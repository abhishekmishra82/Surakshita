const Contact = require('../models/Contact');
const { isDemo, contacts: demoContacts } = require('../utils/demoStore');

// GET /api/contacts
exports.getContacts = async (req, res) => {
  try {
    if (isDemo(req.user._id)) {
      return res.json({ contacts: demoContacts.findAll(req.user._id) });
    }
    const contacts = await Contact.find({ userId: req.user._id });
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/contacts
exports.addContact = async (req, res) => {
  try {
    const { name, phone, email, relationship, notifyBySMS, notifyByEmail } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });

    if (isDemo(req.user._id)) {
      const contact = demoContacts.create(req.user._id, {
        name, phone, email, relationship,
        notifyBySMS: notifyBySMS !== undefined ? notifyBySMS : true,
        notifyByEmail: notifyByEmail || false,
      });
      return res.status(201).json({ contact });
    }

    const contact = await Contact.create({
      userId: req.user._id,
      name, phone, email, relationship,
      notifyBySMS: notifyBySMS !== undefined ? notifyBySMS : true,
      notifyByEmail: notifyByEmail || false,
    });
    res.status(201).json({ contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/contacts/:id
exports.updateContact = async (req, res) => {
  try {
    if (isDemo(req.user._id)) {
      const contact = demoContacts.update(req.params.id, req.user._id, req.body);
      if (!contact) return res.status(404).json({ error: 'Contact not found' });
      return res.json({ contact });
    }
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/contacts/:id
exports.deleteContact = async (req, res) => {
  try {
    if (isDemo(req.user._id)) {
      const contact = demoContacts.delete(req.params.id, req.user._id);
      if (!contact) return res.status(404).json({ error: 'Contact not found' });
      return res.json({ message: 'Contact deleted' });
    }
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
