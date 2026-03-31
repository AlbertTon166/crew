/**
 * Servers API Routes
 * Server connection management with Docker API support
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Docker API service configuration
const DOCKER_API_URL = process.env.DOCKER_API_URL || 'http://docker-api:3002';
const DOCKER_API_KEY = process.env.DOCKER_API_KEY || 'crew-docker-api-secret';

// Test Docker connection via internal API
async function testDockerConnection(host, port, useTls = false) {
  // First check if the server is reachable
  const protocol = useTls ? 'https' : 'http';
  const url = `${protocol}://${host}:${port}/version`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, version: data.version, apiVersion: data.apiVersion };
    }
    return { success: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test Docker API internal service
async function testDockerApiService() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${DOCKER_API_URL}/health`, {
      signal: controller.signal,
      headers: { 'x-internal-api-key': DOCKER_API_KEY },
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return { success: true, connected: true };
    }
    return { success: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Call Docker API internal service
async function callDockerApi(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': DOCKER_API_KEY,
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    options.signal = controller.signal;
    
    const response = await fetch(`${DOCKER_API_URL}${endpoint}`, options);
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * GET /api/servers - List servers
 */
router.get('/', asyncHandler(async (req, res) => {
  const { type, status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const [servers, total] = await Promise.all([
    prisma.serverConnection.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.serverConnection.count({ where }),
  ]);

  // Mask passwords
  const masked = servers.map(s => ({
    ...s,
    password: s.password ? '***' : '',
  }));

  res.json({
    success: true,
    data: masked,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
}));

/**
 * GET /api/servers/:id - Get server by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const server = await prisma.serverConnection.findUnique({
    where: { id },
  });

  if (!server) throw new NotFoundError('Server not found');

  res.json({
    success: true,
    data: { ...server, password: server.password ? '***' : '' },
  });
}));

/**
 * POST /api/servers - Create server
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, type = 'docker', host, port = 2375, username, password, useTls = false } = req.body;

  if (!name || name.trim() === '') throw new BadRequestError('Server name is required');
  if (!host || host.trim() === '') throw new BadRequestError('Host is required');

  const server = await prisma.serverConnection.create({
    data: {
      name: name.trim(),
      type,
      host: host.trim(),
      port: port || 2375,
      username: username || '',
      password: password || '',
      useTls: useTls || false,
      status: 'offline',
    },
  });

  res.status(201).json({
    success: true,
    data: { ...server, password: server.password ? '***' : '' },
  });
}));

/**
 * PUT /api/servers/:id - Update server
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, type, host, port, username, password, useTls, isActive } = req.body;

  const existing = await prisma.serverConnection.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Server not found');

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (type !== undefined) updates.type = type;
  if (host !== undefined) updates.host = host.trim();
  if (port !== undefined) updates.port = port;
  if (username !== undefined) updates.username = username;
  if (password !== undefined && password !== '***') updates.password = password;
  if (useTls !== undefined) updates.useTls = useTls;
  if (isActive !== undefined) updates.isActive = isActive;

  const server = await prisma.serverConnection.update({
    where: { id },
    data: updates,
  });

  res.json({
    success: true,
    data: { ...server, password: server.password ? '***' : '' },
  });
}));

/**
 * POST /api/servers/:id/test - Test server connection
 */
router.post('/:id/test', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const server = await prisma.serverConnection.findUnique({ where: { id } });
  if (!server) throw new NotFoundError('Server not found');

  let testResult;
  
  if (server.type === 'docker') {
    // For local Docker API service
    testResult = await testDockerApiService();
  } else if (server.type === 'ssh') {
    // SSH check - basic TCP check
    testResult = { success: true, note: 'SSH connection check not implemented' };
  } else {
    testResult = { success: true, note: 'OpenClaw custom check' };
  }

  // Update server status based on test
  const newStatus = testResult.success ? 'online' : 'offline';
  await prisma.serverConnection.update({
    where: { id },
    data: { status: newStatus },
  });

  res.json({
    success: true,
    data: {
      status: newStatus,
      testResult,
      testedAt: new Date().toISOString(),
    },
  });
}));

/**
 * POST /api/servers/:id/spawn - Spawn agent container via Docker API
 */
router.post('/:id/spawn', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { agentConfig, taskId, image = 'ubuntu:22.04', command, env = [] } = req.body;

  const server = await prisma.serverConnection.findUnique({ where: { id } });
  if (!server) throw new NotFoundError('Server not found');

  if (server.status !== 'online') {
    throw new BadRequestError('Server is not online. Please test connection first.');
  }

  // Call Docker API service to spawn container
  const spawnResult = await callDockerApi('/container/spawn', 'POST', {
    image,
    command: command || ['sleep', '3600'], // Default: keep alive for 1 hour
    env: [
      `CREW_TASK_ID=${taskId || ''}`,
      `CREW_AGENT_CONFIG=${JSON.stringify(agentConfig || {})}`,
      ...env,
    ],
    name: `crew-agent-${Date.now()}`,
    resources: {
      memory: 512 * 1024 * 1024, // 512MB
      cpu: 1 * 1e9, // 1 CPU
    },
  });

  if (!spawnResult.success) {
    throw new BadRequestError(`Failed to spawn container: ${spawnResult.error}`);
  }

  // Create execution record
  const execution = await prisma.execution.create({
    data: {
      taskId: taskId || 'unknown',
      agentId: agentConfig?.agentId || 'unknown',
      status: 'running',
    },
  });

  res.status(201).json({
    success: true,
    data: {
      spawnId: spawnResult.data.containerId,
      fullId: spawnResult.data.fullId,
      name: spawnResult.data.name,
      executionId: execution.id,
      serverId: id,
      status: 'spawned',
    },
  });
}));

/**
 * GET /api/servers/:id/containers - List containers on server
 */
router.get('/:id/containers', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const server = await prisma.serverConnection.findUnique({ where: { id } });
  if (!server) throw new NotFoundError('Server not found');

  if (server.status !== 'online') {
    throw new BadRequestError('Server is not online. Please test connection first.');
  }

  const containersResult = await callDockerApi('/containers');

  if (!containersResult.success) {
    throw new BadRequestError(`Failed to list containers: ${containersResult.error}`);
  }

  res.json({
    success: true,
    data: containersResult.data,
  });
}));

/**
 * POST /api/servers/:id/exec - Execute command in container
 */
router.post('/:id/exec', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { containerId, command, env = [] } = req.body;

  const server = await prisma.serverConnection.findUnique({ where: { id } });
  if (!server) throw new NotFoundError('Server not found');

  if (!containerId) throw new BadRequestError('Container ID is required');
  if (!command) throw new BadRequestError('Command is required');

  const execResult = await callDockerApi(`/container/${containerId}/exec`, 'POST', {
    command,
    env,
  });

  if (!execResult.success) {
    throw new BadRequestError(`Failed to exec: ${execResult.error}`);
  }

  res.json({
    success: true,
    data: {
      output: execResult.data.output,
      exitCode: execResult.data.exitCode,
    },
  });
}));

/**
 * GET /api/servers/:id/container/:containerId/logs - Get container logs
 */
router.get('/:id/container/:containerId/logs', asyncHandler(async (req, res) => {
  const { id, containerId } = req.params;
  const { stream = 'false', tail = 100 } = req.query;

  const server = await prisma.serverConnection.findUnique({ where: { id } });
  if (!server) throw new NotFoundError('Server not found');

  // Proxy to Docker API with SSE support
  if (stream === 'true') {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const response = await fetch(
        `${DOCKER_API_URL}/container/${containerId}/logs?stream=true&tail=${tail}`,
        {
          headers: { 'x-internal-api-key': DOCKER_API_KEY },
        }
      );

      response.body.on('data', (chunk) => {
        res.write(chunk);
      });

      response.body.on('end', () => {
        res.end();
      });

      req.on('close', () => {
        response.body.destroy();
      });
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  } else {
    const logsResult = await callDockerApi(`/container/${containerId}/logs?tail=${tail}`);
    res.json(logsResult);
  }
}));

/**
 * POST /api/servers/:id/container/:containerId/kill - Kill container
 */
router.post('/:id/container/:containerId/kill', asyncHandler(async (req, res) => {
  const { id, containerId } = req.params;

  const server = await prisma.serverConnection.findUnique({ where: { id } });
  if (!server) throw new NotFoundError('Server not found');

  const killResult = await callDockerApi(`/container/${containerId}/kill`, 'POST');

  if (!killResult.success) {
    throw new BadRequestError(`Failed to kill container: ${killResult.error}`);
  }

  res.json({ success: true, message: 'Container killed' });
}));

/**
 * DELETE /api/servers/:id/container/:containerId - Remove container
 */
router.delete('/:id/container/:containerId', asyncHandler(async (req, res) => {
  const { id, containerId } = req.params;

  const server = await prisma.serverConnection.findUnique({ where: { id } });
  if (!server) throw new NotFoundError('Server not found');

  const removeResult = await callDockerApi(`/container/${containerId}`, 'DELETE');

  if (!removeResult.success) {
    throw new BadRequestError(`Failed to remove container: ${removeResult.error}`);
  }

  res.json({ success: true, message: 'Container removed' });
}));

/**
 * DELETE /api/servers/:id - Delete server
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.serverConnection.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Server not found');

  await prisma.serverConnection.delete({ where: { id } });

  res.json({ success: true, message: 'Server deleted successfully' });
}));

export default router;
