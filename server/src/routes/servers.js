/**
 * Server Connections Routes
 * Manage self-hosted model servers and API endpoints
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// ============================================
// GET /api/servers - List all server connections
// ============================================
router.get('/', asyncHandler(async (req, res) => {
  const servers = await prisma.serverConnection.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Mask API keys for security
  const masked = servers.map(s => ({
    ...s,
    apiKey: s.prefix,
  }));

  res.json({ success: true, data: masked });
}));

// ============================================
// GET /api/servers/:id - Get server details
// ============================================
router.get('/:id', asyncHandler(async (req, res) => {
  const server = await prisma.serverConnection.findUnique({ 
    where: { id: req.params.id } 
  });

  if (!server) {
    throw new NotFoundError('Server not found');
  }

  res.json({
    success: true,
    data: {
      ...server,
      apiKey: server.prefix, // Mask the key
    },
  });
}));

// ============================================
// POST /api/servers - Create a new server connection
// ============================================
router.post('/', asyncHandler(async (req, res) => {
  const { name, type, baseURL, apiKey, rateLimit, rateLimitWindow } = req.body;

  if (!name || !name.trim()) {
    throw new BadRequestError('Name is required');
  }
  if (!baseURL || !baseURL.trim()) {
    throw new BadRequestError('Base URL is required');
  }
  if (!apiKey || !apiKey.trim()) {
    throw new BadRequestError('API key is required');
  }

  const validTypes = ['openai', 'anthropic', 'deepseek', 'custom'];
  const serverType = type || 'custom';
  if (!validTypes.includes(serverType)) {
    throw new BadRequestError(`Invalid server type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Generate prefix from API key (first 8 chars)
  const prefix = apiKey.substring(0, 8);

  const server = await prisma.serverConnection.create({
    data: {
      name: name.trim(),
      type: serverType,
      baseURL: baseURL.trim(),
      apiKey: apiKey.trim(),
      prefix,
      rateLimit: rateLimit || 60,
      rateLimitWindow: rateLimitWindow || 60,
      isActive: true,
      isConnected: false,
      health: 'offline',
    },
  });

  res.status(201).json({
    success: true,
    data: { ...server, apiKey: server.prefix },
  });
}));

// ============================================
// PUT /api/servers/:id - Update server connection
// ============================================
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, type, baseURL, apiKey, rateLimit, rateLimitWindow, isActive } = req.body;

  const existing = await prisma.serverConnection.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw new NotFoundError('Server not found');
  }

  const updates = {};

  if (name !== undefined) {
    if (!name.trim()) throw new BadRequestError('Name cannot be empty');
    updates.name = name.trim();
  }

  if (type !== undefined) {
    const validTypes = ['openai', 'anthropic', 'deepseek', 'custom'];
    if (!validTypes.includes(type)) {
      throw new BadRequestError(`Invalid server type. Must be one of: ${validTypes.join(', ')}`);
    }
    updates.type = type;
  }

  if (baseURL !== undefined) {
    updates.baseURL = baseURL.trim();
  }

  if (apiKey !== undefined && apiKey.trim() !== '') {
    updates.apiKey = apiKey.trim();
    updates.prefix = apiKey.trim().substring(0, 8);
  }

  if (rateLimit !== undefined) {
    updates.rateLimit = rateLimit;
  }

  if (rateLimitWindow !== undefined) {
    updates.rateLimitWindow = rateLimitWindow;
  }

  if (isActive !== undefined) {
    updates.isActive = isActive;
  }

  const updated = await prisma.serverConnection.update({
    where: { id: req.params.id },
    data: updates,
  });

  res.json({
    success: true,
    data: { ...updated, apiKey: updated.prefix },
  });
}));

// ============================================
// POST /api/servers/:id/test - Test server connection
// ============================================
router.post('/:id/test', asyncHandler(async (req, res) => {
  const server = await prisma.serverConnection.findUnique({ where: { id: req.params.id } });
  
  if (!server) {
    throw new NotFoundError('Server not found');
  }

  // Simple connectivity test - in production you'd make an actual API call
  let isConnected = false;
  let health = 'offline';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(server.baseURL + '/health', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${server.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      isConnected = true;
      health = 'healthy';
    } else if (response.status >= 500) {
      health = 'degraded';
    } else {
      // Could still be connected but returned error (e.g., auth error means connection works)
      isConnected = true;
      health = 'healthy';
    }
  } catch (error) {
    // Connection failed
    isConnected = false;
    health = 'offline';
  }

  // Update server with test result
  const updated = await prisma.serverConnection.update({
    where: { id: req.params.id },
    data: {
      isConnected,
      health,
      lastChecked: new Date(),
    },
  });

  res.json({
    success: true,
    data: {
      isConnected: updated.isConnected,
      health: updated.health,
      lastChecked: updated.lastChecked,
    },
  });
}));

// ============================================
// DELETE /api/servers/:id - Delete server connection
// ============================================
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await prisma.serverConnection.delete({ where: { id: req.params.id } });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new NotFoundError('Server not found');
    }
    throw error;
  }

  res.json({ success: true, message: 'Server deleted successfully' });
}));

export default router;
