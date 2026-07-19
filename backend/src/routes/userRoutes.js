const express = require('express');
const { getRecentSessionRecords, getDashboardData, getSessionHistory } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:userId/sessions/recent', authMiddleware, getRecentSessionRecords);
router.get('/:userId/dashboard', authMiddleware, getDashboardData);
router.get('/:userId/history', authMiddleware, getSessionHistory);

module.exports = router;
