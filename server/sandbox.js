/**
 * Sandbox Module - Docker-in-Docker Container Management
 * 
 * Manages isolated container execution for AI agent code generation and testing.
 * Supports Python, JavaScript, and Go with resource limits and timeout handling.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import crypto from 'crypto'

const execAsync = promisify(exec)

// Container lifecycle tracking
const activeContainers = new Map()

/**
 * Language runtime configurations
 */
const RUNTIME_IMAGES = {
  python: {
    image: 'python:3.11-slim',
    cmd: 'python',
    fileExt: '.py',
  },
  javascript: {
    image: 'node:20-slim',
    cmd: 'node',
    fileExt: '.js',
  },
  go: {
    image: 'golang:1.22-alpine',
    cmd: 'go run',
    fileExt: '.go',
  },
}

/**
 * Default resource limits per container
 */
const DEFAULT_LIMITS = {
  cpu: '1.0',        // 1 CPU core
  memory: '512m',    // 512 MB
  pids: 100,         // Max processes
  storage: '100m',   // Storage limit
}

/**
 * Generate unique container ID
 */
function generateContainerId(prefix = 'sandbox') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
}

/**
 * Execute docker command with error handling
 */
async function dockerExec(command, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Command timeout: ${command}`)), timeout)
    exec(command, { timeout, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      clearTimeout(timer)
      if (error && !stdout) reject(error)
      else resolve({ stdout, stderr })
    })
  })
}

/**
 * Docker Sandbox class for agent code execution
 */
export class Sandbox {
  constructor(options = {}) {
    this.limits = {
      cpu: options.cpu || DEFAULT_LIMITS.cpu,
      memory: options.memory || DEFAULT_LIMITS.memory,
      pids: options.pids || DEFAULT_LIMITS.pids,
      storage: options.storage || DEFAULT_LIMITS.storage,
    }
    this.networkMode = options.networkMode || 'none' // 'bridge', 'none', 'host'
    this.timeout = options.timeout || 60000 // Default 60s execution timeout
  }

  /**
   * Create a new sandbox container
   * @param {string} language - 'python', 'javascript', or 'go'
   * @param {object} options - Container options
   * @returns {Promise<{containerId: string, name: string}>}
   */
  async createContainer(language = 'python', options = {}) {
    const runtime = RUNTIME_IMAGES[language]
    if (!runtime) {
      throw new Error(`Unsupported language: ${language}. Supported: ${Object.keys(RUNTIME_IMAGES).join(', ')}`)
    }

    const containerId = generateContainerId(`crew-${language}`)
    const workDir = options.workDir || '/workspace'
    
    // Build docker run command with resource limits
    let dockerCmd = `docker run -d`
    
    // Resource limits
    dockerCmd += ` --memory=${this.limits.memory}`
    dockerCmd += ` --cpus=${this.limits.cpu}`
    dockerCmd += ` --pids-limit=${this.limits.pids}`
    dockerCmd += ` --memory-swap=${this.limits.memory}` // Disable swap
    
    // Security options
    dockerCmd += ` --read-only=true` // Read-only filesystem
    dockerCmd += ` --cap-drop=ALL` // Drop all capabilities
    dockerCmd += ` --security-opt=no-new-privileges`
    
    // Network configuration
    if (this.networkMode === 'none') {
      dockerCmd += ` --network=none`
    } else if (this.networkMode === 'bridge') {
      dockerCmd += ` --network=bridge`
    }
    
    // Auto-remove container after exit (ephemeral)
    dockerCmd += ` --rm`
    
    // Container name
    dockerCmd += ` --name=${containerId}`
    
    // Working directory
    dockerCmd += ` -w ${workDir}`
    
    // Mount temporary workspace (tmpfs for security)
    dockerCmd += ` --tmpfs /tmp:rw,noexec,nosuid,size=100m`
    
    // Environment variables
    dockerCmd += ` -e HOME=/tmp`
    dockerCmd += ` -e TMPDIR=/tmp`
    
    // Image
    dockerCmd += ` ${runtime.image}`
    
    // Sleep command to keep container alive
    dockerCmd += ` sleep infinity`

    try {
      const { stdout } = await dockerExec(dockerCmd, 30000)
      const actualContainerId = stdout.trim()
      
      activeContainers.set(containerId, {
        id: actualContainerId,
        name: containerId,
        language,
        created: new Date().toISOString(),
        status: 'running',
        runtime: runtime.image,
      })

      return {
        containerId: actualContainerId,
        name: containerId,
        language,
        runtime: runtime.image,
      }
    } catch (error) {
      throw new Error(`Failed to create container: ${error.message}`)
    }
  }

  /**
   * Execute code in a running sandbox container
   * @param {string} containerId - Container ID or name
   * @param {string} code - Code to execute
   * @param {string} language - 'python', 'javascript', or 'go'
   * @param {object} options - Execution options
   * @returns {Promise<{output: string, error: string, exitCode: number, duration: number}>}
   */
  async executeCode(containerId, code, language = 'python', options = {}) {
    const runtime = RUNTIME_IMAGES[language]
    if (!runtime) {
      throw new Error(`Unsupported language: ${language}`)
    }

    const timeout = options.timeout || this.timeout
    const codeFile = `/tmp/exec_${Date.now()}${runtime.fileExt}`
    const startTime = Date.now()

    try {
      // Write code to container
      const escapedCode = code.replace(/'/g, "'\\''")
      await dockerExec(
        `docker exec ${containerId} sh -c "echo '${escapedCode}' > ${codeFile}"`,
        10000
      )

      // Execute code based on language
      let execCmd
      switch (language) {
        case 'python':
          execCmd = `docker exec ${containerId} python ${codeFile}`
          break
        case 'javascript':
          execCmd = `docker exec ${containerId} node ${codeFile}`
          break
        case 'go':
          execCmd = `docker exec ${containerId} sh -c "cd /tmp && go run ${codeFile}"`
          break
        default:
          throw new Error(`Unsupported language: ${language}`)
      }

      // Execute with timeout
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Execution timeout (${timeout}ms)`))
        }, timeout)
        
        exec(execCmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
          clearTimeout(timer)
          const duration = Date.now() - startTime
          
          if (error && !stdout && !stderr) {
            reject(error)
          } else {
            resolve({
              stdout: stdout || '',
              stderr: stderr || '',
              exitCode: error?.code || 0,
              duration,
            })
          }
        })
      })

      // Cleanup code file
      await dockerExec(`docker exec ${containerId} rm -f ${codeFile}`, 5000).catch(() => {})

      return {
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exitCode,
        duration: result.duration,
      }
    } catch (error) {
      // Cleanup on error
      await dockerExec(`docker exec ${containerId} rm -f ${codeFile}`, 5000).catch(() => {})
      
      return {
        output: '',
        error: error.message,
        exitCode: -1,
        duration: Date.now() - startTime,
      }
    }
  }

  /**
   * Stop and remove a sandbox container
   * @param {string} containerId - Container ID or name
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async stopContainer(containerId) {
    try {
      // Force stop and remove
      await dockerExec(`docker rm -f ${containerId}`, 10000)
      activeContainers.delete(containerId)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * List all active sandbox containers
   * @param {object} filters - Optional filters
   * @returns {Promise<Array>}
   */
  async listContainers(filters = {}) {
    try {
      const format = '{{.ID}}|{{.Names}}|{{.Status}}|{{.CreatedAt}}|{{.Image}}'
      const { stdout } = await dockerExec('docker ps --format="' + format + '"', 10000)
      
      const containers = stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const [id, name, status, created, image] = line.split('|')
          return { id, name, status, created, image }
        })

      // Apply filters
      let filtered = containers
      if (filters.language) {
        filtered = filtered.filter(c => c.image.includes(filters.language))
      }
      if (filters.status) {
        filtered = filtered.filter(c => c.status.includes(filters.status))
      }

      return filtered
    } catch (error) {
      return []
    }
  }

  /**
   * Get container stats (CPU, Memory)
   * @param {string} containerId - Container ID or name
   * @returns {Promise<object>}
   */
  async getContainerStats(containerId) {
    try {
      const { stdout } = await dockerExec(
        `docker stats ${containerId} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}"`,
        5000
      )
      
      const [cpu, memUsage] = stdout.trim().split('|')
      const [memUsed, memLimit] = memUsage.split('/').map(s => s.trim())

      return {
        cpu: parseFloat(cpu?.replace('%', '') || '0'),
        memory: {
          used: memUsed,
          limit: memLimit,
        },
      }
    } catch (error) {
      return { cpu: 0, memory: { used: '0', limit: '0' } }
    }
  }

  /**
   * Check Docker availability
   * @returns {Promise<{available: boolean, version?: string, error?: string}>}
   */
  static async checkDocker() {
    try {
      const { stdout } = await execAsync('docker --version')
      return { available: true, version: stdout.trim() }
    } catch (error) {
      return { available: false, error: error.message }
    }
  }

  /**
   * Check Docker socket permissions
   * @returns {Promise<{accessible: boolean, error?: string}>}
   */
  static async checkDockerSocket() {
    try {
      await execAsync('docker ps')
      return { accessible: true }
    } catch (error) {
      return { accessible: false, error: error.message }
    }
  }
}

export default Sandbox
