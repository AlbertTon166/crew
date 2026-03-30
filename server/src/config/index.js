/**
 * Crew Backend Configuration
 * Loads environment variables and provides app configuration
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '../../.env') });

/** @type {string} */
const env = process.env.NODE_ENV || 'development';

/** @type {string} */
const host = process.env.HOST || '0.0.0.0';

/** @type {number} */
const port = parseInt(process.env.PORT || '3001', 10);

/** @type {string} */
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  // Development only - generate a warning but allow startup
  console.warn('WARNING: Using insecure development JWT secret. Set JWT_SECRET for production.');
}

/** @type {number} */
const jwtExpiresIn = parseInt(process.env.JWT_EXPIRES_IN || '604800', 10); // 7 days in seconds

// PostgreSQL Configuration
/** @type {Object} */
const postgres = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'crew',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  max: parseInt(process.env.PGMAX || '20', 10), // Max connections in pool
  idleTimeoutMillis: parseInt(process.env.PGIDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.PGCONNECTION_TIMEOUT || '2000', 10),
};

// CORS Configuration
/** @type {Object} */
const cors = {
  origin: process.env.CORS_ORIGIN || 'https://tzx.aiteamsvr.work',
  credentials: process.env.CORS_CREDENTIALS === 'true',
};

/** @type {boolean} */
const isProduction = env === 'production';

/** @type {boolean} */
const isDevelopment = env === 'development';

export {
  env,
  host,
  port,
  jwtSecret,
  jwtExpiresIn,
  postgres,
  cors,
  isProduction,
  isDevelopment,
};
