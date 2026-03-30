/**
 * Users API Routes
 * User management and authentication
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
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
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { name: username.trim() }
      ]
    }
  });
  
  if (existing) {
    throw new ConflictError('User with this email or username already exists');
  }
  
  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: {
      name: username.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }
  });
  
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  
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
  
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });
  
  if (!user || !user.active) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  const isValidPassword = await comparePassword(password, user.password);
  
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.name,
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
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    }
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
    },
  });
}));

/**
 * GET /api/users - List users (admin only)
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role } = req.query;
  
  if (req.user.role !== 'admin') {
    throw new UnauthorizedError('Only admins can list users');
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const where = role ? { role } : {};
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      }
    }),
    prisma.user.count({ where })
  ]);
  
  res.json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    },
  });
}));

/**
 * GET /api/users/:id - Get user by ID
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    }
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json({
    success: true,
    data: user,
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
  
  const updates = {};
  
  if (username !== undefined) {
    updates.name = username.trim();
  }
  if (email !== undefined) {
    if (!email.includes('@')) {
      throw new BadRequestError('Invalid email format');
    }
    updates.email = email.toLowerCase();
  }
  if (role !== undefined && req.user.role === 'admin') {
    const validRoles = ['user', 'admin', 'manager'];
    if (!validRoles.includes(role)) {
      throw new BadRequestError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    updates.role = role;
  }
  
  if (Object.keys(updates).length === 0) {
    throw new BadRequestError('No valid fields to update');
  }
  
  const user = await prisma.user.update({
    where: { id },
    data: updates,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    }
  });
  
  res.json({
    success: true,
    data: user,
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
  const user = await prisma.user.findUnique({
    where: { id },
    select: { password: true }
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  if (currentPassword) {
    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }
  }
  
  // Update password
  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword }
  });
  
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
  
  await prisma.user.update({
    where: { id: req.params.id },
    data: { active: false }
  });
  
  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
}));

export default router;
