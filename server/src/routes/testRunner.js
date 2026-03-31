/**
 * Test Runner API Routes
 * Automated testing workflow triggered by code changes
 */

import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler, BadRequestError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const webhookRouter = Router();

// Docker API configuration for running tests on server
const DOCKER_API_URL = process.env.DOCKER_API_URL || 'http://docker-api:3002';
const DOCKER_API_KEY = process.env.DOCKER_API_KEY || 'crew-docker-api-secret-change-in-production';
const TEST_IMAGE = 'mcr.microsoft.com/playwright:v1.40.0';

/**
 * Run UI test on server by spawning a Playwright container
 */
async function runUITestOnServer(executionId) {
  console.log('Starting UI test on server for execution:', executionId);

  try {
    // Call Docker API to spawn test container
    const response = await fetch(`${DOCKER_API_URL}/container/spawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': DOCKER_API_KEY,
      },
      body: JSON.stringify({
        image: TEST_IMAGE,
        command: ['node', '-e', getPlaywrightTestScript()],
        env: [
          `TARGET_URL=https://tzx.aiteamsvr.work`,
          `EXECUTION_ID=${executionId}`,
        ],
        name: `crew-test-${executionId.slice(0, 8)}`,
        resources: { memory: 512 * 1024 * 1024, cpu: 1 * 1e9 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to spawn test container: ${response.statusText}`);
    }

    const { containerId, fullId } = await response.json();
    console.log('Test container spawned:', containerId);

    // Wait for test to complete (max 5 minutes)
    const maxWait = 300000;
    const startTime = Date.now();
    let status = 'running';
    let retryCount = 0;

    while (status === 'running' && Date.now() - startTime < maxWait && retryCount < 30) {
      await new Promise(r => setTimeout(r, 10000)); // Wait 10 seconds
      retryCount++;

      try {
        const statusRes = await fetch(`${DOCKER_API_URL}/container/${fullId}/status`, {
          headers: { 'x-internal-api-key': DOCKER_API_KEY },
        });
        if (!statusRes.ok) {
          console.log('Container status check failed:', statusRes.status);
          status = 'stopped';
          break;
        }
        const statusData = await statusRes.json();
        status = statusData.status;
        console.log('Test container status:', status, `(attempt ${retryCount}/30)`);
      } catch (e) {
        console.log('Container status error:', e.message);
        status = 'stopped';
        break;
      }
    }

    // Get logs
    console.log('Getting logs for container:', fullId);
    const logsRes = await fetch(`${DOCKER_API_URL}/container/${fullId}/logs?tail=200`, {
      headers: { 'x-internal-api-key': DOCKER_API_KEY },
    });
    const logsData = await logsRes.json();
    const logs = logsData.data?.logs || logsData.logs || '';

    // Parse results from logs
    const results = parseTestResults(logs);

    // Update execution with results
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: results.failed > 0 ? 'failed' : 'completed',
        result: results,
        completedAt: new Date(),
      },
    });

    console.log('Test completed:', results);

    // Cleanup container
    console.log('Cleaning up container:', fullId);
    try {
      await fetch(`${DOCKER_API_URL}/container/${fullId}`, {
        method: 'DELETE',
        headers: { 'x-internal-api-key': DOCKER_API_KEY },
      });
    } catch (e) {
      console.log('Cleanup error:', e.message);
    }

    return results;

  } catch (error) {
    console.error('Test run failed:', error);
    await prisma.execution.update({
      where: { id: executionId },
      data: { status: 'failed', error: error.message, completedAt: new Date() },
    });
    throw error;
  }
}

function getPlaywrightTestScript() {
  return `
const { chromium } = require('playwright');
const BASE_URL = process.env.TARGET_URL || 'https://tzx.aiteamsvr.work';
const results = { passed: 0, failed: 0, tests: [], timestamp: new Date().toISOString() };

async function runTests() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  try {
    // Test 1: Page load
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    const title = await page.title();
    if (title === 'CrewForce - AI Agent Teams Orchestrator') {
      results.passed++; results.tests.push({ name: 'Landing page loads', status: 'passed' });
    } else {
      results.failed++; results.tests.push({ name: 'Landing page loads', status: 'failed', error: 'Title mismatch' });
    }

    // Test 2: API health
    const health = await page.request.get(BASE_URL + '/health');
    if (health.status() === 200) {
      results.passed++; results.tests.push({ name: 'API health check', status: 'passed' });
    } else {
      results.failed++; results.tests.push({ name: 'API health check', status: 'failed', error: 'HTTP ' + health.status() });
    }

    // Test 3: Console errors
    await page.waitForTimeout(2000);
    const critical = errors.filter(e => !e.includes('Warning') && !e.includes('DevTools'));
    if (critical.length === 0) {
      results.passed++; results.tests.push({ name: 'No console errors', status: 'passed' });
    } else {
      results.failed++; results.tests.push({ name: 'No console errors', status: 'failed', error: critical[0] });
    }

    // Test 4: Login modal
    const demoBtn = page.locator('button', { hasText: '演示' }).first();
    if (await demoBtn.isVisible().catch(() => false)) {
      results.passed++; results.tests.push({ name: 'Demo button visible', status: 'passed' });
    } else {
      results.failed++; results.tests.push({ name: 'Demo button visible', status: 'failed', error: 'Not found' });
    }

  } catch (e) {
    results.failed++; results.tests.push({ name: 'Fatal error', status: 'failed', error: e.message });
  }

  await browser.close();
  console.log('TEST_RESULTS:' + JSON.stringify(results));
  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(e => { console.error(e); process.exit(1); });
`;
}

function parseTestResults(logs) {
  const match = logs.match(/TEST_RESULTS:({.*})/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {}
  }
  return { passed: 0, failed: 1, tests: [{ name: 'Parse results', status: 'failed', error: 'Could not parse logs' }] };
}

// Webhook router - no auth needed
webhookRouter.post('/github-webhook', asyncHandler(async (req, res) => {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || 'crew-test-secret-2024';
  
  const signature = req.headers['x-hub-signature-256'];
  if (signature) {
    const crypto = await import('crypto');
    const expectedSig = 'sha256=' + crypto.createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (signature !== expectedSig) {
      console.warn('Webhook signature mismatch');
    }
  }

  const { action, ref, commits } = req.body;

  if (action === 'push' && (ref === 'refs/heads/main' || ref === 'refs/heads/master')) {
    console.log('GitHub push detected, initiating test run:', { ref, commits: commits?.length });

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        taskId: `github-push-test-${Date.now()}`,
        agentId: 'github-webhook',
        status: 'running',
        result: { triggeredBy: 'github', ref, commitCount: commits?.length },
      },
    });

    console.log('Test execution created:', execution.id);

    // Immediately spawn test on server - run asynchronously
    runUITestOnServer(execution.id).catch(err => {
      console.error('Test run failed:', err);
      prisma.execution.update({
        where: { id: execution.id },
        data: { status: 'failed', error: err.message },
      });
    });

    res.json({
      success: true,
      data: {
        message: 'Test run triggered by GitHub push',
        executionId: execution.id,
      },
    });
  } else {
    res.json({ success: true, data: { message: 'Push ignored (not main/master)' } });
  }
}));

// Apply authentication to regular routes
router.use(authenticate);

// Test configuration

/**
 * POST /api/test-runner/run - Run all tests
 */
router.post('/run', asyncHandler(async (req, res) => {
  const { type = 'all', serverId } = req.body;

  let targetServerId = serverId;
  if (!targetServerId) {
    const servers = await prisma.serverConnection.findMany({
      where: { status: 'online', isActive: true },
      take: 1,
    });
    if (servers.length === 0) {
      throw new BadRequestError('No online servers available for test execution');
    }
    targetServerId = servers[0].id;
  }

  const execution = await prisma.execution.create({
    data: {
      taskId: `test-run-${Date.now()}`,
      agentId: 'test-runner',
      status: 'running',
    },
  });

  const tests = [];

  if (type === 'all' || type === 'api') {
    console.log('Running API tests...');
    tests.push({ name: 'API Tests', type: 'api', status: 'queued' });
  }

  if (type === 'all' || type === 'ui') {
    console.log('Running UI tests...');
    tests.push({ name: 'UI Tests', type: 'ui', status: 'queued' });
  }

  res.json({
    success: true,
    data: {
      executionId: execution.id,
      tests,
      status: 'started',
      message: 'Test run initiated. Use GET /api/test-runner/status/:id to check progress.',
    },
  });
}));

/**
 * GET /api/test-runner/status/:id - Get test execution status
 */
router.get('/status/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const execution = await prisma.execution.findUnique({
    where: { id },
  });

  if (!execution) {
    throw new BadRequestError('Execution not found');
  }

  res.json({
    success: true,
    data: {
      id: execution.id,
      status: execution.status,
      result: execution.result,
      error: execution.error,
      createdAt: execution.createdAt,
      completedAt: execution.completedAt,
    },
  });
}));

export { webhookRouter };
export default router;
