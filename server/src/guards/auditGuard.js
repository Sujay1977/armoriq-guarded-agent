/**
 * @fileoverview Audit Guard - Logs security audit events.
 */
import { logger } from '../utils/logger.util.js';

export const logAuditEvent = (guardResult, correlationId, context = {}) => {
  const { allowed, reason, severity, category, riskScore } = guardResult;
  
  const logPayload = {
    correlationId,
    action: allowed ? 'ALLOWED' : 'BLOCKED',
    reason,
    severity,
    category,
    riskScore,
    ...context
  };

  if (allowed) {
    logger.debug('Guard Check Passed', logPayload);
  } else {
    logger.warn('Security Audit Violation', logPayload);
  }
};
