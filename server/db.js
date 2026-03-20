import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let db

export function initDb() {
  db = new Database(join(__dirname, 'data.db'))
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      githubRepo TEXT,
      githubToken TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
    
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      assignedAgentId TEXT,
      parentTaskId TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );
    
    CREATE TABLE IF NOT EXISTS task_executions (
      id TEXT PRIMARY KEY,
      taskId TEXT,
      agentId TEXT,
      agentName TEXT,
      status TEXT DEFAULT 'pending',
      input TEXT,
      output TEXT,
      error TEXT,
      startedAt TEXT,
      completedAt TEXT,
      sessionId TEXT,
      FOREIGN KEY (taskId) REFERENCES tasks(id)
    );
    
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      modelProvider TEXT,
      modelName TEXT,
      systemPrompt TEXT,
      skills TEXT,
      status TEXT DEFAULT 'offline',
      enabled INTEGER DEFAULT 1,
      createdAt TEXT
    );
    
    CREATE TABLE IF NOT EXISTS knowledge (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT,
      parentId TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
    
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      taskId TEXT,
      agentId TEXT,
      agentName TEXT,
      level TEXT,
      message TEXT,
      timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY,
      projectId TEXT,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      source TEXT DEFAULT 'user',
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id)
    );
  `)
  
  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_projectId ON tasks(projectId);
    CREATE INDEX IF NOT EXISTS idx_tasks_parentTaskId ON tasks(parentTaskId);
    CREATE INDEX IF NOT EXISTS idx_task_executions_taskId ON task_executions(taskId);
    CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
    CREATE INDEX IF NOT EXISTS idx_requirements_projectId ON requirements(projectId);
  `)
  
  console.log('Database initialized')
}

export function getDb() {
  if (!db) {
    initDb()
  }
  return db
}
