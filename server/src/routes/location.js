const router = require('express').Router();
const { protect } = require('../middleware/auth');

// Location is handled via Socket.IO in real-time
// This REST endpoint is a fallback for polling
router.post('/update', protect, async (req, res) => {
  try {
    const { lat, lng, sosId } = req.body;
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('location-update', {
        userId: req.user._id,
        sosId,
        lat, lng,
        timestamp: Date.now(),
      });
    }
    res.json({ message: 'Location broadcast' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
