const logger = require('../telemetry/logger');

const test = (req, res) => {
  logger.info('Admin test endpoint accessed successfully', { userId: req.user.id });
  return res.status(200).json({
    message: 'Admin access granted'
  });
};

module.exports = {
  test
};
