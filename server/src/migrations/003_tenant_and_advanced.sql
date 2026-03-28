-- Migration: Add multi-tenant, webhook, and role/permission support
-- This extends the existing schema with tenant isolation, webhook delivery, and RBAC

-- ============================================
-- 1. Multi-Tenant Support
-- ============================================

-- Add tenant_id to users (nullable for global users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36);
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_users_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

-- Add tenant_id to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36);
ALTER TABLE projects ADD CONSTRAINT IF NOT EXISTS fk_projects_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

-- Add tenant_id to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36);
ALTER TABLE agents ADD CONSTRAINT IF NOT EXISTS fk_agents_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  settings JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agents_tenant ON agents(tenant_id);

-- ============================================
-- 2. Webhook Support
-- ============================================

CREATE TABLE IF NOT EXISTS webhooks (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  secret VARCHAR(64) NOT NULL,
  active BOOLEAN DEFAULT true,
  tenant_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_webhooks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  webhook_id VARCHAR(36) NOT NULL,
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response JSONB,
  status_code INTEGER,
  success BOOLEAN DEFAULT false,
  error TEXT,
  attempts INTEGER DEFAULT 1,
  delivered_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_delivery_webhook FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(active);
CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivered ON webhook_deliveries(delivered_at);

-- ============================================
-- 3. Role & Permission System
-- ============================================

CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  role_id VARCHAR(36) NOT NULL,
  permission_id VARCHAR(36) NOT NULL,
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- ============================================
-- 4. Seed Default Roles and Permissions
-- ============================================

-- Insert system roles
INSERT INTO roles (id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Full system access', true),
  ('00000000-0000-0000-0000-000000000002', 'manager', 'Project and team management', true),
  ('00000000-0000-0000-0000-000000000003', 'user', 'Standard user access', true),
  ('00000000-0000-0000-0000-000000000004', 'viewer', 'Read-only access', true)
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO permissions (id, name, description, resource, action) VALUES
  ('10000000-0000-0000-0000-000000000001', 'users.read', 'View users', 'users', 'read'),
  ('10000000-0000-0000-0000-000000000002', 'users.write', 'Create/edit users', 'users', 'write'),
  ('10000000-0000-0000-0000-000000000003', 'users.delete', 'Delete users', 'users', 'delete'),
  ('10000000-0000-0000-0000-000000000004', 'users.admin', 'Manage users (assign roles)', 'users', 'admin'),

  ('10000000-0000-0000-0000-000000000010', 'projects.read', 'View projects', 'projects', 'read'),
  ('10000000-0000-0000-0000-000000000011', 'projects.write', 'Create/edit projects', 'projects', 'write'),
  ('10000000-0000-0000-0000-000000000012', 'projects.delete', 'Delete projects', 'projects', 'delete'),

  ('10000000-0000-0000-0000-000000000020', 'tasks.read', 'View tasks', 'tasks', 'read'),
  ('10000000-0000-0000-0000-000000000021', 'tasks.write', 'Create/edit tasks', 'tasks', 'write'),
  ('10000000-0000-0000-0000-000000000022', 'tasks.delete', 'Delete tasks', 'tasks', 'delete'),

  ('10000000-0000-0000-0000-000000000030', 'agents.read', 'View agents', 'agents', 'read'),
  ('10000000-0000-0000-0000-000000000031', 'agents.write', 'Create/edit agents', 'agents', 'write'),
  ('10000000-0000-0000-0000-000000000032', 'agents.delete', 'Delete agents', 'agents', 'delete'),

  ('10000000-0000-0000-0000-000000000040', 'webhooks.read', 'View webhooks', 'webhooks', 'read'),
  ('10000000-0000-0000-0000-000000000041', 'webhooks.write', 'Create/edit webhooks', 'webhooks', 'write'),
  ('10000000-0000-0000-0000-000000000042', 'webhooks.delete', 'Delete webhooks', 'webhooks', 'delete'),

  ('10000000-0000-0000-0000-000000000050', 'roles.read', 'View roles', 'roles', 'read'),
  ('10000000-0000-0000-0000-000000000051', 'roles.write', 'Create/edit roles', 'roles', 'write'),
  ('10000000-0000-0000-0000-000000000052', 'roles.delete', 'Delete roles', 'roles', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign project/task/agent permissions to manager
INSERT INTO role_permissionS (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM permissions
WHERE name LIKE 'projects.%' OR name LIKE 'tasks.%' OR name LIKE 'agents.%' OR name LIKE 'tasks.%' OR name LIKE 'users.read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign read permissions to user role
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM permissions
WHERE action IN ('read', 'write')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign read-only permissions to viewer
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM permissions
WHERE action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- 5. Add role column to users if not exists
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
