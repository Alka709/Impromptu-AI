const logger = require('../telemetry/logger');

const adminAuth = (req, res, next) => {
  if (!req.user) {
    logger.warn('Admin access attempt without authenticated user');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.role !== 'admin') {
    logger.warn('Admin access denied for user', { userId: req.user.id, role: req.user.role });
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

module.exports = adminAuth;
