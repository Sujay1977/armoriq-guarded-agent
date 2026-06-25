/**
 * @fileoverview Express application setup
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { securityMiddleware } from './middleware/security.middleware.js';
import { correlationIdMiddleware } from './middleware/correlationId.middleware.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { auditLogMiddleware } from './middleware/auditLog.middleware.js';
import { rateLimiter } from './middleware/rateLimiter.middleware.js';
import routesV1 from './routes/v1/index.js';

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      process.env.CORS_ORIGIN,
    ].filter(Boolean),
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware
app.use(correlationIdMiddleware);
app.use(securityMiddleware);
app.use(auditLogMiddleware);
app.use(rateLimiter);

// API Routes
app.use('/api/v1', routesV1);

// Global Error Handler
app.use(errorHandler);

export default app;