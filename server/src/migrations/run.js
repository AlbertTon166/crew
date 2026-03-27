/**
 * Migration Runner
 * Executes SQL migrations against PostgreSQL
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import { postgres } from '../config/index.js';
import { logger } from '../config/logger.js';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run all pending migrations
 */
async function runMigrations() {
  logger.info('Starting database migrations...');
  
  // First, ensure the database exists
  const adminClient = new Client({
    host: postgres.host,
    port: postgres.port,
    database: 'postgres', // Connect to default db first
    user: postgres.user,
    password: postgres.password,
  });
  
  try {
    await adminClient.connect();
    
    // Check if crew database exists
    const dbCheck = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [postgres.database]
    );
    
    if (dbCheck.rows.length === 0) {
      logger.info(`Creating database: ${postgres.database}`);
      await adminClient.query(`CREATE DATABASE ${postgres.database}`);
    }
  } finally {
    await adminClient.end();
  }
  
  // Now connect to the crew database
  const client = new Client({
    host: postgres.host,
    port: postgres.port,
    database: postgres.database,
    user: postgres.user,
    password: postgres.password,
  });
  
  try {
    await client.connect();
    logger.info('Connected to crew database');
    
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Get list of migration files
    const migrationFiles = [
      '001_initial_schema.sql',
      '002_demo_data.sql',
    ];
    
    for (const filename of migrationFiles) {
      // Check if already executed
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [filename]
      );
      
      if (rows.length > 0) {
        logger.info(`Skipping ${filename} (already executed)`);
        continue;
      }
      
      // Read and execute migration
      const migrationPath = join(__dirname, filename);
      const sql = readFileSync(migrationPath, 'utf8');
      
      logger.info(`Executing migration: ${filename}`);
      await client.query(sql);
      
      // Record migration
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [filename]
      );
      
      logger.info(`Migration ${filename} completed`);
    }
    
    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed', { error: error.message });
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
runMigrations()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });

export { runMigrations };
