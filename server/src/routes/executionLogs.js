/**
 * Execution Logs API Routes
 * Real-time execution log streaming with Redis Pub/Sub
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { createLogSubscriber, publishLog } from '../lib/redisPubSub.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Store active subscribers
const activeSubscribers = new Map();

/**
 * GET /api/execution-logs - List execution logs
 */
router.get('/', asyncHandler(async (req, res) => {
  const { executionId, level, page = 1, limit = 100 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (executionId) where.executionId = executionId;
  if (level) where.level = level;

  const [logs, total] = await Promise.all([
    prisma.executionLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { timestamp: 'desc' },
    }),
    prisma.executionLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { page: parseInt(page), limit: parseInt(limit), total },
  });
}));

/**
 * GET /api/execution-logs/:executionId/stream - Stream logs via SSE (Redis Pub/Sub)
 */
router.get('/:executionId/stream', asyncHandler(async (req, res) => {
  const { executionId } = req.params;

  // Verify execution exists
  const execution = await prisma.execution.findUnique({
    where: { id: executionId },
  });

  if (!execution) {
    throw new NotFoundError('Execution not found');
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', executionId })}\n\n`);

  // Create Redis subscriber
  const subscriber = createLogSubscriber(executionId);
  
  try {
    await subscriber.start((log) => {
      res.write(`data: ${JSON.stringify({ type: 'log', ...log })}\n\n`);
    });

    // Store subscriber for cleanup
    activeSubscribers.set(req.socket, subscriber);

    // Send heartbeat every 30s
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', time: new Date().toISOString() })}\n\n`);
    }, 30000);

    // Cleanup on client disconnect
    req.on('close', async () => {
      clearInterval(heartbeat);
      await subscriber.stop();
      activeSubscribers.delete(req.socket);
    });
  } catch (error) {
    // Fallback to polling if Redis fails
    console.error('Redis subscriber failed, falling back to polling:', error.message);
    
    let lastLogTime = new Date();
    
    const pollInterval = setInterval(async () => {
      try {
        const newLogs = await prisma.executionLog.findMany({
          where: {
            executionId,
            timestamp: { gt: lastLogTime },
          },
          orderBy: { timestamp: 'asc' },
        });

        if (newLogs.length > 0) {
          for (const log of newLogs) {
            res.write(`data: ${JSON.stringify({ type: 'log', ...log })}\n\n`);
            lastLogTime = log.timestamp;
          }
        }
      } catch (pollError) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: pollError.message })}\n\n`);
      }
    }, 1000);

    req.on('close', () => {
      clearInterval(pollInterval);
    });
  }
}));

/**
 * POST /api/execution-logs - Create log entry (and publish to Redis)
 */
router.post('/', asyncHandler(async (req, res) => {
  const { executionId, level = 'info', message, metadata } = req.body;

  if (!executionId) throw new BadRequestError('Execution ID is required');
  if (!message) throw new BadRequestError('Message is required');

  // Create log in database
  const log = await prisma.executionLog.create({
    data: {
      executionId,
      level,
      message,
      metadata: metadata || {},
      timestamp: new Date(),
    },
  });

  // Publish to Redis for real-time subscribers
  await publishLog(executionId, log);

  res.status(201).json({ success: true, data: log });
}));

/**
 * DELETE /api/execution-logs/:executionId - Clear logs for execution
 */
router.delete('/:executionId', asyncHandler(async (req, res) => {
  const { executionId } = req.params;

  await prisma.executionLog.deleteMany({
    where: { executionId },
  });

  res.json({ success: true, message: 'Logs cleared' });
}));

export default router;
