/**
 * Roles & Permissions API Routes
 * Role-based access control management
 */

import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// ============================================
// GET /api/permissions - List all permissions
// ============================================
router.get('/permissions', asyncHandler(async (req, res) => {
  const { resource } = req.query;

  let sql = `SELECT * FROM permissions`;
  const params = [];

  if (resource) {
    sql += ` WHERE resource = $1`;
    params.push(resource);
  }

  sql += ` ORDER BY resource, action`;

  const result = await query(sql, params);

  res.json({
    success: true,
    data: result.rows,
  });
}));

// ============================================
// GET /api/roles - List all roles
// ============================================
router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT r.*,
            COALESCE(json_agg(
              json_build_object('id', p.id, 'name', p.name, 'resource', p.resource, 'action', p.action)
            ) FILTER (WHERE p.id IS NOT NULL), '[]') as permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON r.id = rp.role_id
     LEFT JOIN permissions p ON rp.permission_id = p.id
     GROUP BY r.id
     ORDER BY r.is_system DESC, r.name`
  );

  res.json({
    success: true,
    data: result.rows,
  });
}));

// ============================================
// GET /api/roles/:id - Get role by ID
// ============================================
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT r.*,
            COALESCE(json_agg(
              json_build_object('id', p.id, 'name', p.name, 'resource', p.resource, 'action', p.action)
            ) FILTER (WHERE p.id IS NOT NULL), '[]') as permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON r.id = rp.role_id
     LEFT JOIN permissions p ON rp.permission_id = p.id
     WHERE r.id = $1
     GROUP BY r.id`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Role not found');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

// ============================================
// POST /api/roles - Create role (admin only)
// ============================================
router.post('/', authorize('admin'), asyncHandler(async (req, res) => {
  const { name, description, permission_ids = [] } = req.body;

  if (!name || name.trim() === '') {
    throw new BadRequestError('Role name is required');
  }

  // Check name uniqueness
  const existing = await query('SELECT id FROM roles WHERE name = $1', [name.toLowerCase()]);
  if (existing.rows.length > 0) {
    throw new BadRequestError('Role with this name already exists');
  }

  const result = await query(
    `INSERT INTO roles (name, description, is_system, created_at)
     VALUES ($1, $2, false, NOW())
     RETURNING *`,
    [name.toLowerCase(), description || null]
  );

  const role = result.rows[0];

  // Add permissions
  if (permission_ids.length > 0) {
    const values = permission_ids.map((pid, i) => `('${role.id}', $${i + 1})`).join(', ');
    await query(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
      permission_ids
    );
  }

  // Fetch role with permissions
  const roleResult = await query(
    `SELECT r.*,
            COALESCE(json_agg(
              json_build_object('id', p.id, 'name', p.name, 'resource', p.resource, 'action', p.action)
            ) FILTER (WHERE p.id IS NOT NULL), '[]') as permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON r.id = rp.role_id
     LEFT JOIN permissions p ON rp.permission_id = p.id
     WHERE r.id = $1
     GROUP BY r.id`,
    [role.id]
  );

  res.status(201).json({
    success: true,
    data: roleResult.rows[0],
  });
}));

// ============================================
// PUT /api/roles/:id - Update role (admin only)
// ============================================
router.put('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, permission_ids } = req.body;

  // Check role exists and is not system
  const check = await query('SELECT * FROM roles WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    throw new NotFoundError('Role not found');
  }
  if (check.rows[0].is_system) {
    throw new ForbiddenError('Cannot modify system role');
  }

  const updates = [];
  const values = [];
  let p = 1;

  if (name !== undefined) {
    const existing = await query('SELECT id FROM roles WHERE name = $1 AND id != $2', [name.toLowerCase(), id]);
    if (existing.rows.length > 0) {
      throw new BadRequestError('Role name already in use');
    }
    updates.push(`name = $${p++}`);
    values.push(name.toLowerCase());
  }
  if (description !== undefined) {
    updates.push(`description = $${p++}`);
    values.push(description);
  }

  if (updates.length > 0) {
    updates.push(`name = COALESCE(NULLIF($${p++}, ''), name)`); // placeholder
    values.push(id);
    await query(
      `UPDATE roles SET ${updates.filter(u => !u.includes('COALESCE') && !u.includes('name = COALESCE')).join(', ')} WHERE id = $${p}`,
      values.slice(0, -1)
    );
  }

  // Update permissions if provided
  if (permission_ids !== undefined) {
    await query('DELETE FROM role_permissions WHERE role_id = $1', [id]);

    if (permission_ids.length > 0) {
      const permValues = permission_ids.map((pid, i) => `('${id}', $${i + 1})`).join(', ');
      await query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${permValues}`,
        permission_ids
      );
    }
  }

  // Fetch updated role
  const result = await query(
    `SELECT r.*,
            COALESCE(json_agg(
              json_build_object('id', p.id, 'name', p.name, 'resource', p.resource, 'action', p.action)
            ) FILTER (WHERE p.id IS NOT NULL), '[]') as permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON r.id = rp.role_id
     LEFT JOIN permissions p ON rp.permission_id = p.id
     WHERE r.id = $1
     GROUP BY r.id`,
    [id]
  );

  res.json({
    success: true,
    data: result.rows[0],
  });
}));

// ============================================
// DELETE /api/roles/:id - Delete role (admin only)
// ============================================
router.delete('/:id', authorize('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const check = await query('SELECT is_system FROM roles WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    throw new NotFoundError('Role not found');
  }
  if (check.rows[0].is_system) {
    throw new ForbiddenError('Cannot delete system role');
  }

  await query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
  await query('DELETE FROM roles WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Role deleted successfully',
  });
}));

export default router;
