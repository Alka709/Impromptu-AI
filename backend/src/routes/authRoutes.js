const express = require('express');
const router = express.Router();
const { signup, login, logout, me } = require('../controllers/authController');
const { redirectToGoogle, handleGoogleCallback } = require('../controllers/googleAuthController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);

// Google OAuth 2.0
router.get('/google', redirectToGoogle);
router.get('/google/callback', handleGoogleCallback);

module.exports = router;

