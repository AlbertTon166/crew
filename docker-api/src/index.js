/**
 * Crew Docker API Service
 * Manages container lifecycle for agent execution
 * Uses dockerode v4 with async/await
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Docker connection
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const PORT = process.env.PORT || 3002;
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || 'crew-docker-api-secret-change-in-production';

let docker;

try {
  docker = new Docker({ socketPath: DOCKER_SOCKET });
  logger.info(`Docker API connecting to socket: ${DOCKER_SOCKET}`);
} catch (error) {
  logger.error('Failed to initialize Docker client:', error);
  process.exit(1);
}

// Express app
const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: false }));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Internal API Key authentication
function internalAuth(req, res, next) {
  const key = req.headers['x-internal-api-key'];
  if (!key || key !== INTERNAL_KEY) {
    logger.warn('Unauthorized internal API access', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.use(internalAuth);

/**
 * POST /container/spawn
 * Create and start a new container
 */
app.post('/container/spawn', async (req, res) => {
  try {
    const { image, command, env = [], name, resources, network } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const containerId = uuidv4();
    const containerName = name || `crew-agent-${containerId.slice(0, 8)}`;

    // Container config
    const containerConfig = {
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      Env: env,
      Cmd: command ? (Array.isArray(command) ? command : command.split(' ')) : null,
      Image: image,
      HostConfig: {
        Memory: resources?.memory || 512 * 1024 * 1024,
        NanoCPUs: resources?.cpu || 1 * 1e9,
        NetworkMode: network || 'bridge',
        AutoRemove: true,
        RestartPolicy: { Name: 'no' },
      },
      Labels: {
        'crew.service': 'docker-api',
        'crew.container.id': containerId,
        'crew.created.at': new Date().toISOString(),
      },
    };

    logger.info(`Spawning container: ${containerName}`, { image, containerId });

    // Pull image if needed
    try {
      await new Promise((resolve, reject) => {
        docker.pull(image, (err, stream) => {
          if (err) { logger.warn(`Pull warning: ${err.message}`); resolve(); return; }
          docker.modem.followProgress(stream, (err, output) => {
            if (err) { logger.warn(`Pull progress error: ${err.message}`); }
            resolve();
          });
        });
      });
    } catch (pullError) {
      logger.warn(`Failed to pull image ${image}:`, pullError.message);
    }

    // Create and start container using dockerode v4 API
    // Name must be in containerConfig for dockerode v4
    const containerInfo = { ...containerConfig, name: containerName };
    const container = await docker.createContainer(containerInfo);
    await container.start();

    const info = await container.inspect();

    res.status(201).json({
      success: true,
      containerId: info.Id.slice(0, 12),
      fullId: info.Id,
      name: containerName,
      image,
      status: info.State.Status,
      created: info.Created,
    });

  } catch (error) {
    logger.error('Failed to spawn container:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /container/:id/status
 * Get container status
 */
app.get('/container/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const container = docker.getContainer(id);
    const info = await container.inspect();

    res.json({
      success: true,
      containerId: info.Id.slice(0, 12),
      fullId: info.Id,
      name: info.Name.slice(1),
      image: info.Config.Image,
      status: info.State.Status,
      running: info.State.Running,
      startedAt: info.State.StartedAt,
      finishedAt: info.State.FinishedAt,
      exitCode: info.State.ExitCode,
    });

  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Container not found' });
    }
    logger.error('Failed to get container status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /container/:id/kill
 * Kill a container
 */
app.post('/container/:id/kill', async (req, res) => {
  try {
    const { id } = req.params;
    const container = docker.getContainer(id);
    await container.kill();
    logger.info(`Container killed: ${id.slice(0, 12)}`);
    res.json({ success: true, message: 'Container killed' });

  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Container not found' });
    }
    logger.error('Failed to kill container:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /container/:id
 * Remove a container
 */
app.delete('/container/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const container = docker.getContainer(id);
    await container.remove({ force: true });
    logger.info(`Container removed: ${id.slice(0, 12)}`);
    res.json({ success: true, message: 'Container removed' });

  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Container not found' });
    }
    logger.error('Failed to remove container:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /container/:id/logs
 * Get container logs
 */
app.get('/container/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { stream, tail = '100' } = req.query;
    const container = docker.getContainer(id);

    if (stream === 'true') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      const logStream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        tail: parseInt(tail),
        timestamps: true,
      });

      logStream.on('data', (chunk) => {
        const data = chunk.toString().slice(8);
        res.write(`data: ${JSON.stringify({ log: data })}\n\n`);
      });

      logStream.on('error', (error) => {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      });

      logStream.on('end', () => {
        res.write(`data: ${JSON.stringify({ end: true })}\n\n`);
        res.end();
      });

      req.on('close', () => logStream.destroy());
    } else {
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: parseInt(tail),
        timestamps: true,
      });
      res.json({ success: true, logs: logs.toString() });
    }

  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Container not found' });
    }
    logger.error('Failed to get container logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /container/:id/exec
 * Execute command in container
 */
app.post('/container/:id/exec', async (req, res) => {
  try {
    const { id } = req.params;
    const { command, env = [] } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const container = docker.getContainer(id);
    const exec = await container.exec({
      Cmd: Array.isArray(command) ? command : command.split(' '),
      Env: env,
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    let output = '';
    await new Promise((resolve) => {
      stream.on('data', (chunk) => {
        output += chunk.toString().slice(8);
      });
      stream.on('end', resolve);
    });

    const info = await exec.inspect();
    res.json({ success: true, exitCode: info.ExitCode, output });

  } catch (error) {
    logger.error('Failed to exec in container:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /containers
 * List all containers
 */
app.get('/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const formatted = containers.map(c => ({
      id: c.Id.slice(0, 12),
      fullId: c.Id,
      names: c.Names.map(n => n.slice(1)),
      image: c.Image,
      status: c.Status,
      state: c.State,
      created: c.Created,
    }));
    res.json({ success: true, containers: formatted });

  } catch (error) {
    logger.error('Failed to list containers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /test/spawn
 * Spawn a Playwright test container
 */
app.post('/test/spawn', async (req, res) => {
  try {
    const { targetUrl, testType = 'ui' } = req.body;
    const containerId = `test-${Date.now()}`;
    
    const testImage = 'mcr.microsoft.com/playwright:v1.40.0';
    
    // Pull image if needed
    try {
      await new Promise((resolve, reject) => {
        docker.pull(testImage, (err, stream) => {
          if (err) { logger.warn(`Pull warning: ${err.message}`); resolve(); return; }
          docker.modem.followProgress(stream, (err, output) => {
            if (err) logger.warn(`Pull progress error: ${err.message}`);
            resolve();
          });
        });
      });
    } catch (pullError) {
      logger.warn(`Failed to pull test image: ${pullError.message}`);
    }

    // Create test container with script
    const testScript = `
const { chromium } = require('playwright');

(async () => {
  const BASE_URL = process.env.TARGET_URL || '${targetUrl || 'https://tzx.aiteamsvr.work'}';
  const results = { passed: 0, failed: 0, tests: [], timestamp: new Date().toISOString() };
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Test 1: Page loads
    console.log('Testing page load...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    console.log('Title:', title);
    results.passed++;
    results.tests.push({ name: 'Page loads', status: 'passed', details: { title } });
    
    // Test 2: No critical errors
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.waitForTimeout(1000);
    
    if (errors.length === 0) {
      results.passed++;
      results.tests.push({ name: 'No console errors', status: 'passed' });
    } else {
      results.failed++;
      results.tests.push({ name: 'No console errors', status: 'failed', details: { errors } });
    }
    
  } catch (e) {
    results.failed++;
    results.tests.push({ name: 'Fatal', status: 'failed', error: e.message });
  }
  
  if (browser) await browser.close();
  
  console.log('RESULTS:' + JSON.stringify(results));
  process.exit(results.failed > 0 ? 1 : 0);
})();
`;

    const container = await docker.createContainer({
      Image: testImage,
      Cmd: ['node', '-e', testScript],
      Env: [
        `TARGET_URL=${targetUrl || 'https://tzx.aiteamsvr.work'}`,
        `NODE_ENV=production`,
      ],
      Tty: false,
      AttachStdout: true,
      AttachStderr: true,
      HostConfig: {
        Memory: 512 * 1024 * 1024,
        AutoRemove: true,
      },
      Labels: {
        'crew.service': 'test-runner',
        'crew.test.type': testType,
      },
    });

    await container.start();

    // Follow logs
    const logStream = await container.logs({ follow: true, stdout: true, stderr: true });
    
    let testOutput = '';
    logStream.on('data', (chunk) => {
      testOutput += chunk.toString();
    });

    // Wait for completion (max 2 minutes)
    await new Promise((resolve) => setTimeout(resolve, 120000));

    // Get final status
    const info = await container.inspect();
    
    res.json({
      success: true,
      testId: containerId,
      containerId: info.Id.slice(0, 12),
      status: info.State.Status,
      output: testOutput,
    });

  } catch (error) {
    logger.error('Failed to spawn test container:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'docker-api' });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Crew Docker API started on port ${PORT}`);
});

export default app;
