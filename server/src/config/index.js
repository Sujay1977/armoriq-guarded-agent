/**
 * @fileoverview Centralized configuration management
 */
import dotenv from 'dotenv';
dotenv.config();

export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  },
  jwtSecret: process.env.JWT_SECRET,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : undefined,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  },
};
