const router = require('express').Router();
const ctrl = require('../controllers/sosController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/trigger', ctrl.triggerSOS);
router.post('/:id/resolve', ctrl.resolveSOS);
router.post('/:id/location', ctrl.updateSOSLocation);
router.get('/active', ctrl.getActiveSOS);
router.get('/history', ctrl.getSOSHistory);

module.exports = router;
