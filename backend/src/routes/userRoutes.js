const express = require('express');
const { getRecentSessionRecords, getDashboardData, getSessionHistory, updateUserProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { internalAuthMiddleware } = require('../middleware/internalAuth.middleware');

const router = express.Router();

// Allow either JWT auth (frontend) or internal service key (AI worker)
const authOrInternal = (req, res, next) => {
  const serviceKey = req.headers['x-internal-service-key'];
  if (serviceKey && serviceKey === process.env.INTERNAL_SERVICE_KEY) {
    return next();
  }
  return authMiddleware(req, res, next);
};

router.get('/:userId/sessions/recent', authOrInternal, getRecentSessionRecords);
router.get('/:userId/dashboard', authMiddleware, getDashboardData);
router.get('/:userId/history', authMiddleware, getSessionHistory);
router.put('/:userId/profile', authMiddleware, updateUserProfile);

module.exports = router;
