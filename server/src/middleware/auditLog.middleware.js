/**
 * @fileoverview Audit logging middleware for requests
 */
import { logger } from '../utils/logger.util.js';

export const auditLogMiddleware = (req, res, next) => {
  logger.info('Incoming Request: ' + req.method + ' ' + req.originalUrl, {
    correlationId: req.correlationId,
    ip: req.ip
  });
  next();
};
