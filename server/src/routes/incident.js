const router = require('express').Router();
const ctrl = require('../controllers/incidentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', ctrl.reportIncident);
router.get('/', ctrl.getIncidents);

module.exports = router;
