/**
 * @fileoverview Entry point for the server
 */
import app from './src/app.js';
import { logger } from './src/utils/logger.util.js';
import config from './src/config/index.js';

const PORT = config.port || 3000;

app.listen(PORT, () => {
  logger.info('Server is running in ' + config.env + ' mode on port ' + PORT);
});
