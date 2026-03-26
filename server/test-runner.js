/**
 * Test Runner Module - Auto-run tests in Docker sandbox
 * 
 * Supports JUnit (Java), pytest (Python), and Jest (JavaScript).
 * Parses test results and reports back to the agent.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'

const execAsync = promisify(exec)

/**
 * Test framework configurations
 */
const TEST_FRAMEWORKS = {
  // Python
  pytest: {
    language: 'python',
    image: 'python:3.11-slim',
    installCmd: 'pip install pytest pytest-json-report --quiet',
    runCmd: 'pytest --json-report --json-report-file=/tmp/report.json -v',
    resultPath: '/tmp/report.json',
    parseResults,
  },
  unittest: {
    language: 'python',
    image: 'python:3.11-slim',
    installCmd: null, // Built-in
    runCmd: 'python -m unittest discover -v',
    resultPath: null,
    parseResults: parseUnittestResults,
  },
  
  // JavaScript
  jest: {
    language: 'javascript',
    image: 'node:20-slim',
    installCmd: 'npm install jest jest-json --save-dev --silent 2>/dev/null || true',
    runCmd: 'npx jest --json --outputFile=/tmp/jest-report.json',
    resultPath: '/tmp/jest-report.json',
    parseResults: parseJestResults,
  },
  mocha: {
    language: 'javascript',
    image: 'node:20-slim',
    installCmd: 'npm install mocha --save-dev --silent 2>/dev/null || true',
    runCmd: 'npx mocha --reporter json > /tmp/mocha-report.json 2>&1',
    resultPath: '/tmp/mocha-report.json',
    parseResults: parseMochaResults,
  },
  
  // Java
  junit: {
    language: 'java',
    image: ' eclipse-temurin:17-alpine',
    installCmd: null, // Assumes project has Maven/Gradle
    runCmd: 'mvn test -q || gradle test',
    resultPath: null,
    parseResults: parseJUnitResults,
  },
  
  // Go
  go_test: {
    language: 'go',
    image: 'golang:1.22-alpine',
    installCmd: null, // Built-in
    runCmd: 'go test -json ./...',
    resultPath: null,
    parseResults: parseGoTestResults,
  },
}

/**
 * Default resource limits for test containers
 */
const TEST_LIMITS = {
  cpu: '1.0',
  memory: '512m',
  timeout: 120000, // 2 minutes
}

/**
 * Execute docker command
 */
async function dockerExec(command, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Command timeout: ${command}`)), timeout)
    exec(command, { timeout, maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
      clearTimeout(timer)
      resolve({ stdout, stderr, error })
    })
  })
}

/**
 * Parse pytest JSON results
 */
function parseUnittestResults(stdout) {
  const lines = stdout.split('\n')
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: 0,
    tests: [],
    duration: 0,
    summary: stdout,
  }
  
  let currentTest = null
  for (const line of lines) {
    // Parse test result lines like: test_name ... ok/fail/error/skip
    const match = line.match(/^(.+?)\s+\.\.\.\s+(ok|FAIL|ERROR|SKIP)$/)
    if (match) {
      results.total++
      const status = match[2].toLowerCase()
      if (status === 'ok') results.passed++
      else if (status === 'fail') results.failed++
      else if (status === 'error') results.errors++
      else if (status === 'skip') results.skipped++
      
      results.tests.push({
        name: match[1],
        status,
        error: null,
      })
    }
    
    // Parse timing
    const timeMatch = line.match(/Ran (\d+) tests? in ([\d.]+)s/)
    if (timeMatch) {
      results.total = parseInt(timeMatch[1])
      results.duration = parseFloat(timeMatch[2])
    }
    
    // Parse failure details
    if (line.includes('FAIL:') || line.includes('ERROR:')) {
      currentTest = { name: line.replace('FAIL:', '').replace('ERROR:', '').trim(), error: '' }
    } else if (currentTest && line.trim()) {
      currentTest.error += line + '\n'
    }
  }
  
  return results
}

/**
 * Parse Jest JSON results
 */
function parseJestResults(stdout) {
  try {
    const data = typeof stdout === 'string' ? JSON.parse(stdout) : stdout
    return {
      total: data.numTotalTests || data.numTotal || 0,
      passed: data.numPassedTests || data.numPassed || 0,
      failed: data.numFailedTests || data.numFailed || 0,
      skipped: data.numPendingTests || data.numSkipped || 0,
      errors: 0,
      tests: (data.testResults || []).flatMap(file => 
        (file.assertionResults || []).map(test => ({
          name: test.fullName || test.title,
          status: test.status === 'passed' ? 'passed' : test.status === 'pending' ? 'skipped' : 'failed',
          error: test.failureMessages?.join('\n') || null,
          duration: test.duration || 0,
        }))
      ),
      duration: data.testRunTime || data.performanceEnd - data.performanceStart || 0,
      summary: `${data.numPassedTests || 0} passed, ${data.numFailedTests || 0} failed, ${data.numTotalTests || 0} total`,
    }
  } catch {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: 0,
      tests: [],
      duration: 0,
      summary: 'Failed to parse Jest results',
      raw: stdout,
    }
  }
}

/**
 * Parse Mocha JSON results
 */
function parseMochaResults(stdout) {
  try {
    const data = typeof stdout === 'string' ? JSON.parse(stdout) : stdout
    return {
      total: data.stats?.total || 0,
      passed: data.stats?.passes || 0,
      failed: data.stats?.failures || 0,
      skipped: data.stats?.pending || 0,
      errors: 0,
      tests: (data.failures || []).map(f => ({
        name: f.fullTitle || f.title,
        status: 'failed',
        error: f.err?.message || f.err || '',
        duration: f.duration || 0,
      })),
      duration: data.stats?.duration || 0,
      summary: `${data.stats?.passes || 0} passed, ${data.stats?.failures || 0} failed`,
    }
  } catch {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: 0,
      tests: [],
      duration: 0,
      summary: stdout.substring(0, 500),
      raw: stdout,
    }
  }
}

/**
 * Parse JUnit output (simplified)
 */
function parseJUnitResults(stdout) {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: 0,
    tests: [],
    duration: 0,
    summary: stdout,
  }
  
  // Look for common JUnit output patterns
  const passMatch = stdout.match(/Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+)/)
  if (passMatch) {
    results.total = parseInt(passMatch[1])
    results.failed = parseInt(passMatch[2])
    results.errors = parseInt(passMatch[3])
    results.skipped = parseInt(passMatch[4])
    results.passed = results.total - results.failed - results.errors - results.skipped
  }
  
  // Parse failures
  const failureMatches = stdout.matchAll(/FAILURE in.*?(?=\n\n|\n[A-Z]|$)/gs)
  for (const match of failureMatches) {
    results.tests.push({
      name: match[0].substring(0, 100),
      status: 'failed',
      error: match[0],
    })
  }
  
  return results
}

/**
 * Parse Go test JSON results
 */
function parseGoTestResults(stdout) {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: 0,
    tests: [],
    duration: 0,
    summary: '',
  }
  
  try {
    const lines = stdout.split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const entry = JSON.parse(line)
        if (entry.Action === 'pass') {
          results.passed++
          results.tests.push({ name: entry.Test, status: 'passed', error: null, duration: 0 })
        } else if (entry.Action === 'fail') {
          results.failed++
          results.tests.push({ name: entry.Test, status: 'failed', error: entry.Output?.join('\n'), duration: 0 })
        } else if (entry.Action === 'skip') {
          results.skipped++
          results.tests.push({ name: entry.Test, status: 'skipped', error: null, duration: 0 })
        }
        results.total++
      } catch {}
    }
  } catch {}
  
  results.summary = `${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`
  return results
}

/**
 * Detect test framework from project files
 */
async function detectTestFramework(projectPath) {
  const files = await fs.readdir(projectPath).catch(() => [])
  
  if (files.includes('package.json')) {
    const pkg = JSON.parse(await fs.readFile(`${projectPath}/package.json`, 'utf-8').catch(() => '{}'))
    if (pkg.devDependencies?.jest || pkg.dependencies?.jest) return 'jest'
    if (pkg.devDependencies?.mocha || pkg.dependencies?.mocha) return 'mocha'
  }
  
  if (files.includes('pytest.ini') || files.includes('pyproject.toml') || files.includes('requirements.txt')) {
    return 'pytest'
  }
  
  if (files.includes('pom.xml') || files.includes('build.gradle')) {
    return 'junit'
  }
  
  if (files.some(f => f.endsWith('_test.go') || f.endsWith('.go'))) {
    return 'go_test'
  }
  
  return null
}

/**
 * Test Runner class
 */
export class TestRunner {
  constructor(options = {}) {
    this.limits = {
      cpu: options.cpu || TEST_LIMITS.cpu,
      memory: options.memory || TEST_LIMITS.memory,
      timeout: options.timeout || TEST_LIMITS.timeout,
    }
  }

  /**
   * Run tests in an isolated Docker container
   * @param {string} projectPath - Path to the project with tests
   * @param {string} framework - 'pytest', 'jest', 'junit', 'go_test', or 'auto'
   * @param {object} options - Test options
   * @returns {Promise<object>} Test results
   */
  async runTests(projectPath, framework = 'auto', options = {}) {
    const timeout = options.timeout || this.limits.timeout
    
    // Auto-detect framework
    if (framework === 'auto') {
      framework = await detectTestFramework(projectPath)
      if (!framework) {
        return {
          success: false,
          error: 'Could not auto-detect test framework. Please specify manually.',
          framework: null,
        }
      }
    }
    
    const config = TEST_FRAMEWORKS[framework]
    if (!config) {
      return {
        success: false,
        error: `Unsupported test framework: ${framework}`,
        framework,
        supported: Object.keys(TEST_FRAMEWORKS),
      }
    }

    const containerName = `test-runner-${Date.now()}`
    const startTime = Date.now()
    let containerId = null

    try {
      // Create test container
      let createCmd = `docker run -d`
      createCmd += ` --name=${containerName}`
      createCmd += ` --memory=${this.limits.memory}`
      createCmd += ` --cpus=${this.limits.cpu}`
      createCmd += ` --network=none`
      createCmd += ` --read-only=true`
      createCmd += ` --cap-drop=ALL`
      createCmd += ` --tmpfs /tmp:rw,noexec,nosuid,size=100m`
      createCmd += ` -w /workspace`
      createCmd += ` ${config.image}`
      createCmd += ` sleep infinity`

      const { stdout: containerIdOut } = await dockerExec(createCmd, 30000)
      containerId = containerIdOut.trim()

      // Copy project files to container
      await dockerExec(`docker cp "${projectPath}/." ${containerName}:/workspace/`, 30000)

      // Install dependencies
      if (config.installCmd) {
        const installImage = `docker run --rm -v "${projectPath}:/workspace" ${config.image} sh -c "${config.installCmd}"`
        await dockerExec(installImage, 120000)
      }

      // Run tests
      const runCmd = `docker exec ${containerName} sh -c "${config.runCmd}"`
      const result = await dockerExec(runCmd, timeout)

      // Get test results
      let testResults
      if (config.resultPath) {
        const { stdout: resultsOut } = await dockerExec(
          `docker exec ${containerName} cat ${config.resultPath}`,
          10000
        ).catch(() => ({ stdout: '' }))
        testResults = config.parseResults(resultsOut.stdout || result.stdout)
      } else {
        testResults = config.parseResults(result.stdout + result.stderr)
      }

      const duration = Date.now() - startTime

      return {
        success: testResults.failed === 0 && testResults.errors === 0,
        framework,
        language: config.language,
        container: containerName,
        ...testResults,
        duration,
      }
    } catch (error) {
      return {
        success: false,
        framework,
        error: error.message,
        duration: Date.now() - startTime,
      }
    } finally {
      // Cleanup container
      if (containerId) {
        await dockerExec(`docker rm -f ${containerName}`, 10000).catch(() => {})
      }
    }
  }

  /**
   * Run tests after code generation (integration with sandbox)
   * @param {object} sandbox - Sandbox instance
   * @param {string} containerId - Sandbox container ID
   * @param {string} framework - Test framework
   * @returns {Promise<object>} Test results
   */
  async runTestsInSandbox(sandbox, containerId, framework = 'pytest') {
    const config = TEST_FRAMEWORKS[framework]
    if (!config) {
      throw new Error(`Unsupported framework: ${framework}`)
    }

    // Install test dependencies if needed
    if (config.installCmd) {
      await dockerExec(`docker exec ${containerId} ${config.installCmd}`, 60000)
    }

    // Run tests
    const runCmd = `docker exec ${containerId} sh -c "${config.runCmd}"`
    const result = await dockerExec(runCmd, this.limits.timeout)

    // Parse results
    return config.parseResults(result.stdout + result.stderr)
  }

  /**
   * Get supported frameworks
   */
  static getSupportedFrameworks() {
    return Object.entries(TEST_FRAMEWORKS).map(([key, config]) => ({
      key,
      language: config.language,
    }))
  }
}

export default TestRunner
