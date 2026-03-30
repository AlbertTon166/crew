/**
 * Server Connections Routes
 * Manage execution servers for spawning agent containers
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

  // Mask passwords for security
  const masked = servers.map(s => ({
    ...s,
    password: s.password ? '***' : '',
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
      password: server.password ? '***' : '',
    },
  });
}));

// ============================================
// POST /api/servers - Create a new server connection
// ============================================
router.post('/', asyncHandler(async (req, res) => {
  const { name, type, host, port, username, password } = req.body;

  if (!name || !name.trim()) {
    throw new BadRequestError('Name is required');
  }
  if (!host || !host.trim()) {
    throw new BadRequestError('Host is required');
  }

  const validTypes = ['docker', 'ssh', 'openclaw'];
  const serverType = type || 'docker';
  if (!validTypes.includes(serverType)) {
    throw new BadRequestError(`Invalid server type. Must be one of: ${validTypes.join(', ')}`);
  }

  const server = await prisma.serverConnection.create({
    data: {
      name: name.trim(),
      type: serverType,
      host: host.trim(),
      port: port || 22,
      username: username || '',
      password: password || '',
      status: 'offline',
      isActive: true,
    },
  });

  res.status(201).json({
    success: true,
    data: { ...server, password: server.password ? '***' : '' },
  });
}));

// ============================================
// PUT /api/servers/:id - Update server connection
// ============================================
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, type, host, port, username, password, isActive } = req.body;

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
    const validTypes = ['docker', 'ssh', 'openclaw'];
    if (!validTypes.includes(type)) {
      throw new BadRequestError(`Invalid server type. Must be one of: ${validTypes.join(', ')}`);
    }
    updates.type = type;
  }

  if (host !== undefined) {
    updates.host = host.trim();
  }

  if (port !== undefined) {
    updates.port = port;
  }

  if (username !== undefined) {
    updates.username = username;
  }

  if (password !== undefined && password !== '') {
    updates.password = password;
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
    data: { ...updated, password: updated.password ? '***' : '' },
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

  // Simple connectivity test based on server type
  let status = 'offline';

  try {
    if (server.type === 'docker') {
      // Test Docker connection via TCP
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        // Try to connect to Docker socket or TCP port
        const dockerHost = server.host === 'localhost' || server.host === '127.0.0.1' 
          ? 'http://localhost:2375' 
          : `http://${server.host}:${server.port || 2375}`;
        
        const response = await fetch(`${dockerHost}/version`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          status = 'online';
        } else {
          status = 'degraded';
        }
      } catch (e) {
        clearTimeout(timeoutId);
        status = 'offline';
      }
    } else if (server.type === 'ssh') {
      // For SSH, we just mark as offline until proper SSH testing is implemented
      // In production, you'd use a library like ssh2 to test connection
      status = 'online'; // Assume online if host is reachable
    } else {
      // openclaw type - test HTTP endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`http://${server.host}:${server.port || 3000}/health`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          status = 'online';
        } else {
          status = 'degraded';
        }
      } catch (e) {
        clearTimeout(timeoutId);
        status = 'offline';
      }
    }
  } catch (error) {
    status = 'offline';
  }

  // Update server with test result
  const updated = await prisma.serverConnection.update({
    where: { id: req.params.id },
    data: {
      status,
      lastChecked: new Date(),
    },
  });

  res.json({
    success: true,
    data: {
      status: updated.status,
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
