/**
 * Users API Routes
 * User management and authentication
 */

import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, NotFoundError, BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors.js';
import { authenticate, generateToken, hashPassword, comparePassword } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/users/register - Register new user
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || username.trim() === '') {
    throw new BadRequestError('Username is required');
  }
  if (!email || !email.includes('@')) {
    throw new BadRequestError('Valid email is required');
  }
  if (!password || password.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters');
  }
  
  // Check if user exists
  const existing = await query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email.toLowerCase(), username.toLowerCase()]
  );
  
  if (existing.rows.length > 0) {
    throw new ConflictError('User with this email or username already exists');
  }
  
  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  
  const result = await query(
    `INSERT INTO users (username, email, password_hash, role, active, created_at, updated_at)
     VALUES ($1, $2, $3, 'user', true, NOW(), NOW())
     RETURNING id, username, email, role, created_at`,
    [username.trim(), email.toLowerCase(), hashedPassword]
  );
  
  const user = result.rows[0];
  const token = generateToken(user);
  
  res.status(201).json({
    success: true,
    data: {
      user,
      token,
    },
  });
}));

/**
 * POST /api/users/login - User login
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }
  
  const result = await query(
    'SELECT * FROM users WHERE email = $1 AND active = true',
    [email.toLowerCase()]
  );
  
  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  const user = result.rows[0];
  const isValidPassword = await comparePassword(password, user.password_hash);
  
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Update last login
  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
  
  const token = generateToken(user);
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
}));

/**
 * GET /api/users/me - Get current user
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
}));

/**
 * GET /api/users - List users (admin only)
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let sql = 'SELECT id, username, email, role, active, created_at, last_login FROM users WHERE 1=1';
  const params = [];
  let paramCount = 1;
  
  if (role) {
    sql += ` AND role = $${paramCount++}`;
    params.push(role);
  }
  
  sql += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
  params.push(parseInt(limit), offset);
  
  const result = await query(sql, params);
  
  const countResult = await query('SELECT COUNT(*) FROM users');
  
  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].count),
    },
  });
}));

/**
 * GET /api/users/:id - Get user by ID
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(
    'SELECT id, username, email, role, active, created_at, last_login FROM users WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }
  
  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * PUT /api/users/:id - Update user
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;
  
  // Users can only update themselves, unless admin
  if (req.user.id !== id && req.user.role !== 'admin') {
    throw new UnauthorizedError('Cannot update other users');
  }
  
  const updates = [];
  const values = [];
  let paramCount = 1;
  
  if (username !== undefined) {
    updates.push(`username = $${paramCount++}`);
    values.push(username.trim());
  }
  if (email !== undefined) {
    if (!email.includes('@')) {
      throw new BadRequestError('Invalid email format');
    }
    updates.push(`email = $${paramCount++}`);
    values.push(email.toLowerCase());
  }
  if (role !== undefined && req.user.role === 'admin') {
    const validRoles = ['user', 'admin', 'manager'];
    if (!validRoles.includes(role)) {
      throw new BadRequestError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    updates.push(`role = $${paramCount++}`);
    values.push(role);
  }
  
  if (updates.length === 0) {
    throw new BadRequestError('No valid fields to update');
  }
  
  updates.push(`updated_at = NOW()`);
  values.push(id);
  
  const result = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} 
     RETURNING id, username, email, role, active, created_at`,
    values
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }
  
  res.json({
    success: true,
    data: result.rows[0],
  });
}));

/**
 * PUT /api/users/:id/password - Change password
 */
router.put('/:id/password', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  
  if (req.user.id !== id) {
    throw new UnauthorizedError('Cannot change other users password');
  }
  
  if (!newPassword || newPassword.length < 6) {
    throw new BadRequestError('New password must be at least 6 characters');
  }
  
  // Verify current password
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }
  
  if (currentPassword) {
    const isValid = await comparePassword(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }
  }
  
  // Update password
  const hashedPassword = await hashPassword(newPassword);
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, id]
  );
  
  res.json({
    success: true,
    message: 'Password updated successfully',
  });
}));

/**
 * DELETE /api/users/:id - Deactivate user (soft delete)
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new UnauthorizedError('Only admins can deactivate users');
  }
  
  const result = await query(
    'UPDATE users SET active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
    [req.params.id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }
  
  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
}));

export default router;
