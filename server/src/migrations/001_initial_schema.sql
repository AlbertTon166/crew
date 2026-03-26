-- Crew Database Schema Migration
-- Version: 001_initial_schema
-- Description: Initial database schema for Crew platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'on_hold')),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_members UUID[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ============================================
-- AGENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('pm', 'planner', 'coder', 'reviewer', 'tester', 'deployer')),
    model_provider VARCHAR(100) DEFAULT 'openai',
    model_name VARCHAR(255),
    system_prompt TEXT,
    skills TEXT[] DEFAULT '{}',
    personality VARCHAR(255),
    status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'idle', 'error', 'thinking')),
    enabled BOOLEAN DEFAULT true,
    avg_response_time VARCHAR(100),
    task_count INTEGER DEFAULT 0,
    current_load DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agents_role ON agents(role);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_enabled ON agents(enabled);

-- ============================================
-- PROJECT_AGENTS TABLE (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS project_agents (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (project_id, agent_id)
);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'waiting_retry', 'waiting_human', 'fallback', 'failed', 'completed', 'skipped')),
    assignee_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    priority VARCHAR(10) DEFAULT 'P2' CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    
    -- Workflow view
    workflow_position JSONB,
    node_type VARCHAR(50) DEFAULT 'task' CHECK (node_type IN ('task', 'agent', 'interrupt', 'condition', 'parallel', 'join')),
    
    -- Exception handling
    timeout_seconds INTEGER DEFAULT 300,
    max_retries INTEGER DEFAULT 3,
    retry_interval INTEGER DEFAULT 1,
    timeout_strategy VARCHAR(50) DEFAULT 'retry' CHECK (timeout_strategy IN ('retry', 'fallback', 'interrupt')),
    fallback_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    fallback_output TEXT,
    interrupt_on_failure BOOLEAN DEFAULT false,
    notification_users UUID[] DEFAULT '{}',
    is_human_interrupt_point BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- ============================================
-- TASK_DEPENDENCIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'sequential' CHECK (dependency_type IN ('sequential', 'conditional', 'parallel')),
    soft_dependency BOOLEAN DEFAULT false,
    PRIMARY KEY (task_id, depends_on_id)
);

-- ============================================
-- TASK_EXECUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS task_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled', 'superseded')),
    input JSONB DEFAULT '{}',
    output JSONB,
    error TEXT,
    metadata JSONB,
    parent_execution_id UUID REFERENCES task_executions(id) ON DELETE SET NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_executions_task ON task_executions(task_id);
CREATE INDEX idx_executions_status ON task_executions(status);
CREATE INDEX idx_executions_agent ON task_executions(agent_id);

-- ============================================
-- EXECUTION_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES task_executions(id) ON DELETE CASCADE,
    level VARCHAR(20) DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_execution_logs_execution ON execution_logs(execution_id);

-- ============================================
-- TEAM_TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'custom' CHECK (type IN ('custom', 'development', 'review', 'deployment', 'full_stack')),
    workflow_config JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_team_templates_type ON team_templates(type);
CREATE INDEX idx_team_templates_created_by ON team_templates(created_by);

-- ============================================
-- TEAM_TEMPLATE_AGENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_template_agents (
    team_template_id UUID REFERENCES team_templates(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    role_in_template VARCHAR(100),
    PRIMARY KEY (team_template_id, agent_id)
);

-- ============================================
-- REQUIREMENTS TABLE (for PM Agent)
-- ============================================
CREATE TABLE IF NOT EXISTS requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'clarifying', 'confirmed', 'rejected', 'draft')),
    priority VARCHAR(10) DEFAULT 'P2',
    requested_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_requirements_project ON requirements(project_id);
CREATE INDEX idx_requirements_status ON requirements(status);

-- ============================================
-- AUDIT_LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_executions_updated_at BEFORE UPDATE ON task_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT ADMIN USER (password: admin123)
-- ============================================
INSERT INTO users (username, email, password_hash, role)
VALUES (
    'admin',
    'admin@crew.local',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDAOWaYGON.Wq', -- bcrypt hash of 'admin123'
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- INSERT SAMPLE TEAM TEMPLATES
-- ============================================
INSERT INTO team_templates (name, description, type, workflow_config)
VALUES 
    ('Development Team', 'Standard development team with PM, Coder, and Reviewer', 'development',
     '{"stages": ["planning", "development", "review", "testing"]}'),
    ('Full Stack Team', 'Complete team for end-to-end delivery', 'full_stack',
     '{"stages": ["planning", "frontend", "backend", "review", "testing", "deployment"]}')
ON CONFLICT DO NOTHING;
