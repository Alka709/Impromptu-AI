require('dotenv').config();
const app = require('./app');
const logger = require('./telemetry/logger');
const { initRetryJob } = require('./jobs/retryFailedSessions');
const { initCleanupJob } = require('./jobs/cleanupOrphanedFiles');

const PORT = process.env.PORT || 3000;

// Initialize background jobs
initRetryJob();
initCleanupJob();

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
