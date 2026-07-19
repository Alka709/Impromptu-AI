const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectToGoogle, handleGoogleCallback } = require('../controllers/googleAuthController');
const authMiddleware = require('../middleware/authMiddleware');

// Signup Flow
router.post('/signup/request-otp', authController.signupRequestOtp);
router.post('/signup/verify-otp', authController.signupVerifyOtp);
router.post('/signup/complete', authController.signupComplete);

// Login Flow
router.post('/login', authController.loginRequestOtp);
router.post('/login/verify-otp', authController.loginVerifyOtp);

router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

// Google OAuth 2.0
router.get('/google', redirectToGoogle);
router.get('/google/callback', handleGoogleCallback);

module.exports = router;

