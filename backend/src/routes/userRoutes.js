const express = require('express');
const { getRecentSessionRecords, getDashboardData, getSessionHistory } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:userId/sessions/recent', getRecentSessionRecords);
router.get('/:userId/dashboard', authMiddleware, getDashboardData, getSessionHistory);

module.exports = router;
