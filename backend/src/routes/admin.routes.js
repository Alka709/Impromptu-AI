const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth.middleware');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

router.get('/dashboard', authMiddleware, adminAuth, adminController.getDashboard);
router.get('/users', authMiddleware, adminAuth, adminController.getUsers);
router.get('/users/:id', authMiddleware, adminAuth, adminController.getUserDetails);
router.get('/sessions', authMiddleware, adminAuth, adminController.getSessions);
router.get('/sessions/:id', authMiddleware, adminAuth, adminController.getSessionDetails);

module.exports = router;
