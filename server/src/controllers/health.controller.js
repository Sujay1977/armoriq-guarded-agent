/**
 * @fileoverview Health controller
 */
import { successResponse } from '../utils/response.util.js';

export const getHealth = (req, res) => {
  res.status(200).json(successResponse({ status: 'UP', timestamp: new Date() }, 'Service is healthy'));
};
