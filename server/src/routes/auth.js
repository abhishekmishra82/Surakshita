const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/verify-otp', ctrl.verifyOTP);
router.post('/resend-otp', ctrl.resendOTP);
router.post('/login', ctrl.login);
router.post('/login-anonymous', ctrl.loginAnonymous);
router.post('/2fa/setup', protect, ctrl.setup2FA);
router.post('/2fa/verify', ctrl.verify2FA);
router.get('/me', protect, ctrl.getMe);
router.put('/settings', protect, ctrl.updateSettings);

module.exports = router;
