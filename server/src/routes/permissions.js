/**
 * Permissions API Routes
 * Role-Based Access Control (RBAC)
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, NotFoundError, BadRequestError, UnauthorizedError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Permission definitions
const PERMISSIONS = {
  'project:read': 'View project details',
  'project:write': 'Create/update projects',
  'project:delete': 'Delete projects',
  'agent:read': 'View agents',
  'agent:write': 'Create/update agents',
  'agent:delete': 'Delete agents',
  'agent:execute': 'Execute agent tasks',
  'task:read': 'View tasks',
  'task:write': 'Create/update tasks',
  'task:delete': 'Delete tasks',
  'task:assign': 'Assign tasks to agents',
  'team:read': 'View teams',
  'team:write': 'Create/update teams',
  'team:delete': 'Delete teams',
  'server:read': 'View servers',
  'server:write': 'Create/update servers',
  'server:delete': 'Delete servers',
  'server:execute': 'Execute on servers',
  'admin:users': 'Manage users',
  'admin:roles': 'Manage roles',
  'admin:settings': 'Manage system settings',
};

// Role definitions
const ROLE_DEFS = {
  owner: {
    inherits: ['admin'],
    permissions: ['*'],
  },
  admin: {
    inherits: ['manager'],
    permissions: [
      'project:read', 'project:write', 'project:delete',
      'agent:read', 'agent:write', 'agent:delete', 'agent:execute',
      'task:read', 'task:write', 'task:delete', 'task:assign',
      'team:read', 'team:write', 'team:delete',
      'server:read', 'server:write', 'server:delete', 'server:execute',
      'admin:users', 'admin:roles', 'admin:settings',
    ],
  },
  manager: {
    inherits: ['member'],
    permissions: [
      'project:read', 'project:write',
      'agent:read', 'agent:write',
      'task:read', 'task:write', 'task:assign',
      'team:read', 'team:write',
      'server:read',
    ],
  },
  member: {
    inherits: ['viewer'],
    permissions: [
      'project:read',
      'agent:read',
      'task:read', 'task:write',
      'team:read',
      'server:read',
    ],
  },
  viewer: {
    permissions: [
      'project:read',
      'task:read',
      'agent:read',
    ],
  },
};

// Check if user has permission
function hasPermission(role, permission) {
  const roleDef = ROLE_DEFS[role];
  if (!roleDef) return false;
  if (roleDef.permissions.includes('*')) return true;
  if (roleDef.permissions.includes(permission)) return true;
  if (roleDef.inherits) {
    for (const inheritedRole of roleDef.inherits) {
      if (hasPermission(inheritedRole, permission)) return true;
    }
  }
  return false;
}

/**
 * GET /api/permissions/roles - List all roles
 */
router.get('/roles', (req, res) => {
  const roles = Object.entries(ROLE_DEFS).map(([name, def]) => ({
    name,
    inherits: def.inherits || [],
    permissions: def.permissions,
  }));
  res.json({ success: true, data: roles });
});

/**
 * GET /api/permissions - List current user's permissions
 */
router.get('/', asyncHandler(async (req, res) => {
  const userPermissions = ROLE_DEFS[req.user.role]?.permissions || [];
  const allPermissions = Object.entries(PERMISSIONS).map(([key, description]) => ({
    key,
    description,
    granted: userPermissions.includes('*') || userPermissions.includes(key),
  }));
  
  res.json({
    success: true,
    data: {
      role: req.user.role,
      permissions: allPermissions,
    },
  });
}));

/**
 * GET /api/permissions/check - Check if user has specific permission
 */
router.get('/check', asyncHandler(async (req, res) => {
  const { permission } = req.query;
  if (!permission) throw new BadRequestError('Permission key is required');
  
  const granted = hasPermission(req.user.role, permission);
  res.json({ success: true, data: { permission, granted } });
}));

/**
 * POST /api/permissions/assign - Assign role to user (admin only)
 */
router.post('/assign', asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new UnauthorizedError('Only admins can assign roles');
  }
  
  const { userId, role } = req.body;
  if (!userId) throw new BadRequestError('User ID is required');
  if (!role) throw new BadRequestError('Role is required');
  if (!ROLE_DEFS[role]) throw new BadRequestError('Invalid role');
  
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
  
  res.json({ success: true, message: `Role '${role}' assigned`, data: { userId, role } });
}));

/**
 * GET /api/permissions/users - List users with roles (admin only)
 */
router.get('/users', asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new UnauthorizedError('Only admins can list users');
  }
  
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  
  res.json({ success: true, data: users });
}));

export { PERMISSIONS, ROLE_DEFS, hasPermission };
export default router;
