/**
 * PostgreSQL Connection Pool
 * Uses the `pg` library for connection pooling
 */

import pg from 'pg';
import { postgres as pgConfig, isDevelopment } from './index.js';
import { logger } from './logger.js';

const { Pool } = pg;

// Create connection pool
const pool = new Pool({
  host: pgConfig.host,
  port: pgConfig.port,
  database: pgConfig.database,
  user: pgConfig.user,
  password: pgConfig.password,
  max: pgConfig.max,
  idleTimeoutMillis: pgConfig.idleTimeoutMillis,
  connectionTimeoutMillis: pgConfig.connectionTimeoutMillis,
});

// Log pool errors
pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

// Test connection on startup
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('PostgreSQL connected successfully', { 
      time: result.rows[0].now,
      database: pgConfig.database 
    });
    return true;
  } catch (error) {
    logger.error('PostgreSQL connection failed', { error: error.message });
    return false;
  }
}

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {Array} [params] - Query parameters
 * @returns {Promise<Object>} Query result
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (isDevelopment) {
      logger.debug('Executed query', { 
        text: text.substring(0, 100), 
        duration, 
        rows: result.rowCount 
      });
    }
    
    return result;
  } catch (error) {
    logger.error('Query error', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Pool client
 */
export async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  // Track query count for debugging
  let queryCount = 0;

  // Override release to track
  client.release = () => {
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease();
  };

  return client;
}

/**
 * Execute a transaction
 * @param {Function} callback - Async function receiving client
 * @returns {Promise<any>} Transaction result
 */
export async function transaction(callback) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the pool
 */
export async function closePool() {
  await pool.end();
  logger.info('PostgreSQL pool closed');
}

export default { query, getClient, transaction, testConnection, closePool };
