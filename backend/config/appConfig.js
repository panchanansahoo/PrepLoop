/**
 * Centralized Application Configuration
 * Single source of truth for all app settings
 * Environment-aware with validation
 */

import dotenv from 'dotenv';

dotenv.config();

const ENV = process.env.NODE_ENV || 'development';
const isDev = ENV === 'development';
const isProd = ENV === 'production';
const isTest = ENV === 'test';

/**
 * Core server configuration
 */
export const server = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || 'localhost',
  env: ENV,
  isDev,
  isProd,
  isTest,
  trustProxy: parseInt(process.env.TRUST_PROXY || '0', 10),
  gracefulShutdownTimeout: parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT || '30000', 10),
};

/**
 * Database configuration
 */
export const database = {
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  postgres: {
    connectionString: process.env.DATABASE_URL,
  },
};

/**
 * Cache/Redis configuration
 */
export const cache = {
  redis: {
    url: process.env.REDIS_URL,
  },
  upstash: {
    restUrl: process.env.UPSTASH_REDIS_REST_URL,
    restToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  ttl: {
    default: 3600, // 1 hour
    short: 300, // 5 minutes
    long: 86400, // 1 day
  },
};

/**
 * Authentication configuration
 */
export const auth = {
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  supabase: {
    enabled: !!process.env.SUPABASE_URL,
  },
  passwordHash: {
    rounds: 10,
  },
};

/**
 * CORS configuration
 */
export const cors = {
  origins: [
    'http://localhost:5173', // Frontend dev
    'http://localhost:5174', // Frontend dev alternate
    'http://localhost:4173', // Frontend preview
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
};

/**
 * Rate limiting configuration
 */
export const rateLimiting = {
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 250, // requests per window
    message: 'Too many requests, please try again later.',
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 30, // Stricter for auth
  },
  ai: {
    windowMs: 60 * 1000, // 1 minute
    max: 20,
  },
  payment: {
    windowMs: 60 * 1000,
    max: 10,
  },
  jobs: {
    windowMs: 60 * 1000,
    max: 30,
  },
  admin: {
    windowMs: 60 * 1000,
    max: 100,
  },
};

/**
 * API configuration
 */
export const api = {
  version: 'v1',
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
};

/**
 * External services configuration
 */
export const services = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    enabled: !!process.env.GROQ_API_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    enabled: !!process.env.OPENAI_API_KEY,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    enabled: !!process.env.GEMINI_API_KEY,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    enabled: !!process.env.RAZORPAY_KEY_ID,
  },
  email: {
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM || 'noreply@preploop.me',
    enabled: !!process.env.SMTP_USER,
  },
};

/**
 * Monitoring & Telemetry
 */
export const monitoring = {
  appInsights: {
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    enabled: !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  },
  errorTracking: {
    enabled: isProd,
  },
};

/**
 * Feature flags
 */
export const features = {
  interview: true,
  dsa: true,
  voice: true,
  collaboration: process.env.ENABLE_COLLABORATION === 'true',
  discord: process.env.ENABLE_DISCORD === 'true',
};

/**
 * Logging configuration
 */
export const logging = {
  level: process.env.LOG_LEVEL || (isProd ? 'warn' : 'debug'),
  format: process.env.LOG_FORMAT || 'json',
  disableConsoleLogs: isProd,
};

/**
 * Security configuration
 */
export const security = {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.example.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  },
  sanitization: {
    enabled: true,
    excludeWebhooks: true,
  },
};

export default {
  server,
  database,
  cache,
  auth,
  cors,
  rateLimiting,
  api,
  services,
  monitoring,
  features,
  logging,
  security,
};
