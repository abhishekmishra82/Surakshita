const router = require('express').Router();
const ctrl = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getContacts);
router.post('/', ctrl.addContact);
router.put('/:id', ctrl.updateContact);
router.delete('/:id', ctrl.deleteContact);

module.exports = router;
