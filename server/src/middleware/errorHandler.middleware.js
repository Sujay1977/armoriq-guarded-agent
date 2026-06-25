/**
 * @fileoverview Global error handling middleware
 */
import { logger } from '../utils/logger.util.js';
import { errorResponse } from '../utils/response.util.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error: ' + err.message, { 
    correlationId: req.correlationId,
    stack: err.stack 
  });
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(errorResponse(err.message || 'Internal Server Error', statusCode));
};
