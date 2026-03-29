const Incident = require('../models/Incident');
const { isDemo, incidents: demoIncidents } = require('../utils/demoStore');

exports.reportIncident = async (req, res) => {
  try {
    const { type, description, location, anonymous } = req.body;

    if (isDemo(req.user._id)) {
      const incident = demoIncidents.create(anonymous ? null : req.user._id, {
        type, description, location, anonymous: anonymous || false,
      });
      return res.status(201).json({ incident });
    }

    const incident = await Incident.create({
      userId: anonymous ? undefined : req.user._id,
      type, description, location, anonymous: anonymous || false,
    });
    res.status(201).json({ incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIncidents = async (req, res) => {
  try {
    if (isDemo(req.user._id)) {
      return res.json({ incidents: demoIncidents.findAll(req.user._id) });
    }
    const incidents = await Incident.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ incidents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
