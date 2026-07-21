require('dotenv').config();
const app = require('./app');
const logger = require('./telemetry/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
