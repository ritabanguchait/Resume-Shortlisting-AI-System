const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const oauthController = require('../controllers/oauth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

// OAuth routes
router.post('/oauth', oauthController.oauthLogin);

module.exports = router;
