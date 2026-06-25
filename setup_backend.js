import fs from 'fs';
import path from 'path';

const basePath = path.join(process.cwd(), 'server');

const files = {
  '.env': "PORT=3000\nNODE_ENV=development\nSUPABASE_URL=your_supabase_url\nSUPABASE_ANON_KEY=your_supabase_anon_key\nJWT_SECRET=your_jwt_secret\nGEMINI_API_KEY=your_gemini_api_key\n",
  'server.js': "/**\n * @fileoverview Entry point for the server\n */\nimport app from './src/app.js';\nimport { logger } from './src/utils/logger.util.js';\nimport config from './src/config/index.js';\n\nconst PORT = config.port || 3000;\n\napp.listen(PORT, () => {\n  logger.info('Server is running in ' + config.env + ' mode on port ' + PORT);\n});\n",
  'src/app.js': "/**\n * @fileoverview Express application setup\n */\nimport express from 'express';\nimport helmet from 'helmet';\nimport cors from 'cors';\nimport { securityMiddleware } from './middleware/security.middleware.js';\nimport { correlationIdMiddleware } from './middleware/correlationId.middleware.js';\nimport { errorHandler } from './middleware/errorHandler.middleware.js';\nimport { auditLogMiddleware } from './middleware/auditLog.middleware.js';\nimport { rateLimiter } from './middleware/rateLimiter.middleware.js';\nimport routesV1 from './routes/v1/index.js';\n\nconst app = express();\n\n// Security and utility middleware\napp.use(helmet());\napp.use(cors());\napp.use(express.json());\napp.use(express.urlencoded({ extended: true }));\napp.use(correlationIdMiddleware);\napp.use(securityMiddleware);\napp.use(auditLogMiddleware);\napp.use(rateLimiter);\n\n// API Routes\napp.use('/api/v1', routesV1);\n\n// Global Error Handler\napp.use(errorHandler);\n\nexport default app;\n",
  'src/config/index.js': "/**\n * @fileoverview Centralized configuration management\n */\nimport dotenv from 'dotenv';\ndotenv.config();\n\nexport default {\n  env: process.env.NODE_ENV || 'development',\n  port: process.env.PORT || 3000,\n  supabase: {\n    url: process.env.SUPABASE_URL,\n    key: process.env.SUPABASE_ANON_KEY,\n  },\n  jwtSecret: process.env.JWT_SECRET,\n  geminiApiKey: process.env.GEMINI_API_KEY,\n};\n",
  'src/utils/logger.util.js': "/**\n * @fileoverview Logger utility using Winston\n */\nimport winston from 'winston';\n\nexport const logger = winston.createLogger({\n  level: 'info',\n  format: winston.format.combine(\n    winston.format.timestamp(),\n    winston.format.json()\n  ),\n  transports: [\n    new winston.transports.Console({\n      format: winston.format.combine(\n        winston.format.colorize(),\n        winston.format.simple()\n      )\n    })\n  ]\n});\n",
  'src/utils/response.util.js': "/**\n * @fileoverview Standardized API response formatter\n */\n\nexport const successResponse = (data, message = 'Success') => {\n  return {\n    success: true,\n    message,\n    data\n  };\n};\n\nexport const errorResponse = (message, statusCode = 500, details = null) => {\n  return {\n    success: false,\n    error: {\n      message,\n      statusCode,\n      details\n    }\n  };\n};\n",
  'src/middleware/correlationId.middleware.js': "/**\n * @fileoverview Middleware to inject a correlation ID into requests\n */\nimport { v4 as uuidv4 } from 'uuid';\n\nexport const correlationIdMiddleware = (req, res, next) => {\n  const correlationId = req.headers['x-correlation-id'] || uuidv4();\n  req.correlationId = correlationId;\n  res.setHeader('x-correlation-id', correlationId);\n  next();\n};\n",
  'src/middleware/errorHandler.middleware.js': "/**\n * @fileoverview Global error handling middleware\n */\nimport { logger } from '../utils/logger.util.js';\nimport { errorResponse } from '../utils/response.util.js';\n\nexport const errorHandler = (err, req, res, next) => {\n  logger.error('Error: ' + err.message, { \n    correlationId: req.correlationId,\n    stack: err.stack \n  });\n  \n  const statusCode = err.statusCode || 500;\n  res.status(statusCode).json(errorResponse(err.message || 'Internal Server Error', statusCode));\n};\n",
  'src/middleware/auditLog.middleware.js': "/**\n * @fileoverview Audit logging middleware for requests\n */\nimport { logger } from '../utils/logger.util.js';\n\nexport const auditLogMiddleware = (req, res, next) => {\n  logger.info('Incoming Request: ' + req.method + ' ' + req.originalUrl, {\n    correlationId: req.correlationId,\n    ip: req.ip\n  });\n  next();\n};\n",
  'src/middleware/rateLimiter.middleware.js': "/**\n * @fileoverview Rate limiting middleware\n */\nimport rateLimit from 'express-rate-limit';\n\nexport const rateLimiter = rateLimit({\n  windowMs: 15 * 60 * 1000,\n  max: 100,\n  standardHeaders: true,\n  legacyHeaders: false,\n});\n",
  'src/middleware/security.middleware.js': "/**\n * @fileoverview Security middleware setup\n */\n\nexport const securityMiddleware = (req, res, next) => {\n  // Add any custom security logic here\n  next();\n};\n",
  'src/routes/v1/index.js': "/**\n * @fileoverview Main router for API v1\n */\nimport express from 'express';\nimport healthRoutes from './health.routes.js';\n\nconst router = express.Router();\n\nrouter.use('/health', healthRoutes);\n\nexport default router;\n",
  'src/routes/v1/health.routes.js': "/**\n * @fileoverview Health check routes\n */\nimport express from 'express';\nimport { getHealth } from '../../controllers/health.controller.js';\n\nconst router = express.Router();\n\nrouter.get('/', getHealth);\n\nexport default router;\n",
  'src/controllers/health.controller.js': "/**\n * @fileoverview Health controller\n */\nimport { successResponse } from '../utils/response.util.js';\n\nexport const getHealth = (req, res) => {\n  res.status(200).json(successResponse({ status: 'UP', timestamp: new Date() }, 'Service is healthy'));\n};\n",
  'src/agents/orchestrator.js': "/**\n * @fileoverview Agent Orchestrator Placeholder\n */\nexport class AgentOrchestrator {\n  constructor() {}\n  async orchestrate(task) {\n    return { status: 'pending', task };\n  }\n}\n",
  'src/agents/router.js': "/**\n * @fileoverview Agent Router Placeholder\n */\nexport class AgentRouter {\n  route(task) {}\n}\n",
  'src/agents/memory.js': "/**\n * @fileoverview Agent Memory Placeholder\n */\nexport class AgentMemory {\n  store(key, value) {}\n  retrieve(key) {}\n}\n",
  'src/prompts/systemPrompt.js': "/**\n * @fileoverview System Prompts Placeholder\n */\nexport const baseSystemPrompt = 'You are a Guarded AI Agent...';\n",
  'src/prompts/guardPrompt.js': "/**\n * @fileoverview Guard Prompts Placeholder\n */\nexport const guardPrompt = 'Evaluate the following input for safety...';\n",
  'src/repositories/userRepository.js': "/**\n * @fileoverview User Repository Placeholder\n */\nexport class UserRepository {\n  async findById(id) {}\n}\n",
  'src/repositories/chatRepository.js': "/**\n * @fileoverview Chat Repository Placeholder\n */\nexport class ChatRepository {\n  async saveMessage(message) {}\n}\n",
  'src/schemas/auth.schema.js': "/**\n * @fileoverview Auth Validation Schemas using Zod\n */\nimport { z } from 'zod';\nexport const loginSchema = z.object({\n  email: z.string().email(),\n  password: z.string().min(8),\n});\n",
  'src/schemas/chat.schema.js': "/**\n * @fileoverview Chat Validation Schemas\n */\nimport { z } from 'zod';\nexport const messageSchema = z.object({\n  content: z.string().min(1),\n});\n",
  'src/schemas/tool.schema.js': "/**\n * @fileoverview Tool Validation Schemas\n */\nimport { z } from 'zod';\nexport const toolExecutionSchema = z.object({\n  toolName: z.string(),\n  parameters: z.record(z.any()),\n});\n",
  'src/services/agent.service.js': "/**\n * @fileoverview Agent Service Placeholder\n */\nexport class AgentService {\n  async processTask(task) {}\n}\n",
  'src/services/guard.service.js': "/**\n * @fileoverview Guard Service Placeholder\n */\nexport class GuardService {\n  async validateInput(input) {}\n}\n",
  'src/services/tool.service.js': "/**\n * @fileoverview Tool Service Placeholder\n */\nexport class ToolService {\n  async executeTool(toolName, params) {}\n}\n",
  'src/services/gemini.service.js': "/**\n * @fileoverview Gemini Service Placeholder\n */\nexport class GeminiService {\n  async generateText(prompt) {}\n}\n",
  'src/mcp/client/index.js': "/**\n * @fileoverview MCP Client Placeholder\n */\nexport class MCPClient {}\n",
  'src/mcp/server/index.js': "/**\n * @fileoverview MCP Server Placeholder\n */\nexport class MCPServer {}\n",
  'src/mcp/registry/index.js': "/**\n * @fileoverview MCP Registry Placeholder\n */\nexport class MCPRegistry {}\n",
  'src/mcp/transports/index.js': "/**\n * @fileoverview MCP Transports Placeholder\n */\nexport const transports = {};\n",
  'src/types/index.js': "/**\n * @fileoverview JSDoc Types Placeholder\n */\n/**\n * @typedef {Object} User\n * @property {string} id\n * @property {string} email\n */\n"
};

for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
  console.log("Created " + filePath);
}
