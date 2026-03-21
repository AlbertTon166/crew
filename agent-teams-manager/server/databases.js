/**
 * Database Layer - PostgreSQL + Redis + ChromaDB
 * 
 * PostgreSQL: 结构化数据 (项目、任务、Agent配置、用户权限)
 * Redis: 缓存、会话、实时事件
 * ChromaDB: 向量知识库、代码片段检索
 */

import { Pool } from 'pg'
import { createClient } from 'redis'
import { ChromaClient } from 'chromadb'
import fs from 'fs/promises'
import path from 'path'

// Configuration
const config = {
  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: process.env.PG_DATABASE || 'agent_teams',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  chromadb: {
    host: process.env.CHROMA_HOST || 'localhost',
    port: parseInt(process.env.CHROMA_PORT || '8000'),
  }
}

// PostgreSQL Pool
let pgPool = null

export async function initPostgres() {
  pgPool = new Pool(config.postgres)
  
  // Create tables
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      github_repo VARCHAR(500),
      github_token VARCHAR(500),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)
  
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      assigned_agent_id VARCHAR(100),
      depends_on UUID[],
      execution_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)
  
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'offline',
      model_provider VARCHAR(100),
      model_name VARCHAR(100),
      system_prompt TEXT,
      skills TEXT[],
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS execution_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
      agent_id UUID REFERENCES agents(id),
      agent_name VARCHAR(255),
      status VARCHAR(50),
      input TEXT,
      output TEXT,
      error TEXT,
      token_used INT,
      started_at TIMESTAMP,
      completed_at TIMESTAMP
    )
  `)
  
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS code_snippets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      file_path VARCHAR(500),
      language VARCHAR(50),
      content TEXT,
      embedding_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  
  // Users table
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `)
  
  // Project requirements table
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS project_requirements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(500),
      content TEXT,
      file_name VARCHAR(255),
      file_size INT,
      file_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
  
  console.log('✅ PostgreSQL initialized')
  return pgPool
}

export function getPgPool() {
  if (!pgPool) throw new Error('PostgreSQL not initialized')
  return pgPool
}

// Redis Client
let redisClient = null

export async function initRedis() {
  redisClient = createClient({
    socket: {
      host: config.redis.host,
      port: config.redis.port,
    },
    password: config.redis.password,
  })
  
  redisClient.on('error', (err) => console.error('Redis Error:', err))
  await redisClient.connect()
  
  console.log('✅ Redis initialized')
  return redisClient
}

export function getRedis() {
  if (!redisClient) throw new Error('Redis not initialized')
  return redisClient
}

// Redis Helper Functions
export async function cacheSet(key, value, ttlSeconds = 3600) {
  const redis = getRedis()
  await redis.setEx(key, ttlSeconds, JSON.stringify(value))
}

export async function cacheGet(key) {
  const redis = getRedis()
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}

export async function cacheDelete(key) {
  const redis = getRedis()
  await redis.del(key)
}

// Redis Pub/Sub for Agent Communication
export async function publishEvent(channel, message) {
  const redis = getRedis()
  await redis.publish(channel, JSON.stringify(message))
}

export async function subscribeChannel(channel, callback) {
  const redis = getRedis()
  const subscriber = redis.duplicate()
  await subscriber.connect()
  await subscriber.subscribe(channel, (message) => {
    callback(JSON.parse(message))
  })
  return subscriber
}

// ChromaDB Client
let chromaClient = null

export async function initChromaDB() {
  chromaClient = new ChromaClient({
    path: `http://${config.chromadb.host}:${config.chromadb.port}`
  })
  
  // Create collections if not exist
  await chromaClient.getOrCreateCollection({ name: 'code_snippets' })
  await chromaClient.getOrCreateCollection({ name: 'knowledge_base' })
  
  console.log('✅ ChromaDB initialized')
  return chromaClient
}

export function getChroma() {
  if (!chromaClient) throw new Error('ChromaDB not initialized')
  return chromaClient
}

// Vector Search for Code
export async function addCodeEmbedding(projectId, filePath, code, language) {
  const chroma = getChroma()
  const collection = await chroma.getCollection({ name: 'code_snippets' })
  
  const id = `${projectId}-${Date.now()}`
  
  await collection.add({
    id,
    documents: [code],
    metadatas: [{ projectId, filePath, language }],
  })
  
  return id
}

export async function searchCode(projectId, query, topK = 5) {
  const chroma = getChroma()
  const collection = await chroma.getCollection({ name: 'code_snippets' })
  
  const results = await collection.query({
    queryTexts: [query],
    nResults: topK,
    where: { projectId }
  })
  
  return results
}

// Knowledge Base RAG
export async function addKnowledge(title, content, metadata = {}) {
  const chroma = getChroma()
  const collection = await chroma.getCollection({ name: 'knowledge_base' })
  
  const id = `kb-${Date.now()}`
  
  await collection.add({
    id,
    documents: [`${title}\n\n${content}`],
    metadatas: [metadata],
  })
  
  return id
}

export async function searchKnowledge(query, topK = 3) {
  const chroma = getChroma()
  const collection = await chroma.getCollection({ name: 'knowledge_base' })
  
  const results = await collection.query({
    queryTexts: [query],
    nResults: topK,
  })
  
  return results
}

// Session Management with Redis
export async function createSession(sessionId, data, ttlSeconds = 86400) {
  await cacheSet(`session:${sessionId}`, data, ttlSeconds)
}

export async function getSession(sessionId) {
  return cacheGet(`session:${sessionId}`)
}

export async function updateSession(sessionId, data) {
  const current = await getSession(sessionId)
  if (current) {
    await createSession(sessionId, { ...current, ...data })
  }
}

export async function deleteSession(sessionId) {
  await cacheDelete(`session:${sessionId}`)
}

// Agent Heartbeat with Redis
export async function updateAgentHeartbeat(agentId, status) {
  await cacheSet(`agent:heartbeat:${agentId}`, {
    status,
    lastSeen: new Date().toISOString()
  }, 300) // 5 min TTL
}

export async function getAgentHeartbeat(agentId) {
  return cacheGet(`agent:heartbeat:${agentId}`)
}

// Initialize All Databases
export async function initAllDatabases() {
  try {
    await initPostgres()
    await initRedis()
    await initChromaDB()
    console.log('✅ All databases initialized')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// Graceful Shutdown
export async function closeAllDatabases() {
  if (pgPool) await pgPool.end()
  if (redisClient) await redisClient.quit()
  console.log('✅ All database connections closed')
}
