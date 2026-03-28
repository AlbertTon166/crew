/**
 * Crew Backend API Server
 * Express + PostgreSQL backend for Agent Teams Workflow Management
 */

import express from 'express';
import cors from 'cors';

// Configuration
import { host, port, cors as corsConfig, isProduction } from './config/index.js';
import { testConnection, closePool } from './config/db.js';
import { logger } from './config/logger.js';

// Middleware
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler.js';

// Routes
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';
import agentsRouter from './routes/agents.js';
import teamsRouter from './routes/teams.js';
import executionRouter from './routes/execution.js';
import usersRouter from './routes/users.js';
import userRolesRouter from './routes/userRoles.js';
import rolesRouter from './routes/roles.js';
import webhooksRouter from './routes/webhooks.js';
import apiKeysRouter from './routes/api-keys.js';
import demoRouter from './routes/demo.js';

// Create Express app
const app = express();

// Trust proxy (for accurate IP logging behind reverse proxy)
app.set('trust proxy', 1);

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
  origin: corsConfig.origin,
  credentials: corsConfig.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req, res) => {
  const dbHealthy = await testConnection().catch(() => false);
  
  const status = dbHealthy ? 'healthy' : 'unhealthy';
  const statusCode = dbHealthy ? 200 : 503;
  
  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    service: 'crew-api',
    version: '1.0.0',
    database: dbHealthy ? 'connected' : 'disconnected',
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'Crew API',
    version: '1.0.0',
    description: 'Agent Teams Workflow Management Platform',
    endpoints: {
      health: '/health',
      users: '/api/users',
      projects: '/api/projects',
      tasks: '/api/tasks',
      agents: '/api/agents',
      teams: '/api/teams',
      execution: '/api/execution',
      'api-keys': '/api/api-keys',
      demo: '/api/demo',
    },
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/users', usersRouter);
app.use('/api/users', userRolesRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/api-keys', apiKeysRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/execution', executionRouter);
app.use('/api/demo', demoRouter);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

/**
 * Start the server
 */
async function start() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      logger.warn('Database connection failed - server will start but some features may not work');
    }
    
    // Start listening
    const server = app.listen(port, host, () => {
      logger.info(`Crew API server started`, {
        host,
        port,
        env: isProduction ? 'production' : 'development',
        url: `http://${host}:${port}`,
      });
    });
    
    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await closePool();
          logger.info('Database pool closed');
        } catch (error) {
          logger.error('Error closing database pool', { error: error.message });
        }
        
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

start();

export default app;
