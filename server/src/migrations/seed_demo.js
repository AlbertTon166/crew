/**
 * Demo Data Seed Script
 * Run with: node src/migrations/seed_demo.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'crew',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting demo data seed...');
    
    // Read demo data SQL
    const sqlPath = path.join(__dirname, '002_demo_data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute demo data
    await client.query(sql);
    
    console.log('✅ Demo data seeded successfully!');
    console.log('');
    console.log('📊 Demo Data Summary:');
    console.log('   - 1 Demo User: demo / admin123');
    console.log('   - 6 Demo Agents: PM, Planner, Coder, Reviewer, Tester, Deployer');
    console.log('   - 3 Demo Projects');
    console.log('   - 12 Demo Tasks');
    console.log('   - 3 Demo Requirements');
    console.log('');
    
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
