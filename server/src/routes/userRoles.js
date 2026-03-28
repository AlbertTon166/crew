/**
 * User Roles API Routes
 * Manage user role assignments
 */

import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Valid roles
const VALID_ROLES = ['user', 'admin', 'manager', 'viewer'];

// ============================================
// PUT /api/users/:id/role - Update user role
// ============================================
router.put('/:id/role', authorize('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    throw new BadRequestError('Role is required');
  }

  if (!VALID_ROLES.includes(role)) {
    throw new BadRequestError(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  // Check user exists
  const userCheck = await query('SELECT id, tenant_id FROM users WHERE id = $1', [id]);
  if (userCheck.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  // Check target user tenant matches admin or admin is global
  const targetTenantId = userCheck.rows[0].tenant_id;
  const adminTenantId = req.user.tenant_id;

  // Non-global admins can only modify users in their tenant
  if (adminTenantId && targetTenantId !== adminTenantId) {
    throw new ForbiddenError('Cannot modify users outside your tenant');
  }

  // Cannot demote yourself from admin
  if (req.user.id === id && role !== 'admin') {
    throw new BadRequestError('Cannot demote yourself from admin');
  }

  const result = await query(
    `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, username, email, role, tenant_id, active, created_at`,
    [role, id]
  );

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

// ============================================
// GET /api/users/:id/permissions - Get user effective permissions
// ============================================
router.get('/:id/permissions', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Users can view their own permissions, admins can view any
  if (req.user.id !== id && req.user.role !== 'admin') {
    throw new ForbiddenError('Can only view your own permissions');
  }

  // Get user's role
  const userResult = await query(
    'SELECT id, username, email, role FROM users WHERE id = $1',
    [id]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = userResult.rows[0];

  // Get permissions for the role
  const permResult = await query(
    `SELECT p.*
     FROM permissions p
     INNER JOIN role_permissions rp ON p.id = rp.permission_id
     INNER JOIN roles r ON rp.role_id = r.id
     WHERE r.name = $1`,
    [user.role]
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      permissions: permResult.rows,
    },
  });
}));

export default router;
