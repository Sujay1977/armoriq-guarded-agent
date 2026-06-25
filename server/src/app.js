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
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(helmet({
  contentSecurityPolicy: false // Allows frontend to execute inline scripts if needed in Vite
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN || false) // In prod, require explicit origin or serve locally
    : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(correlationIdMiddleware);
app.use(securityMiddleware);
app.use(auditLogMiddleware);
app.use(rateLimiter);

app.use('/api/v1', routesV1);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.use(errorHandler);

export default app;
