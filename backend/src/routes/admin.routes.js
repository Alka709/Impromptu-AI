const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth.middleware');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

router.get('/test', authMiddleware, adminAuth, adminController.test);

module.exports = router;
