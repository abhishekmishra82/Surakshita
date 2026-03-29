const router = require('express').Router();
const ctrl = require('../controllers/journeyController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/start', ctrl.startJourney);
router.post('/:id/checkin', ctrl.checkIn);
router.post('/:id/complete', ctrl.completeJourney);
router.get('/active', ctrl.getActiveJourney);

module.exports = router;
