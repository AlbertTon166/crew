/**
 * Docker Deployment Module
 * 自动化 Docker 容器部署管理
 */

import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const execAsync = promisify(exec)

// Deployment status tracking
const deployments = new Map()

/**
 * Generate unique deployment ID
 */
function generateDeployId() {
  return `deploy-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
}

/**
 * Execute shell command with streaming output
 */
async function execStream(command: string, cwd: string, onData?: (data: string) => void) {
  return new Promise((resolve, reject) => {
    const process = spawn('/bin/sh', ['-c', command], { cwd })
    let output = ''
    
    process.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      onData?.(text)
    })
    
    process.stderr.on('data', (data) => {
      const text = data.toString()
      output += text
      onData?.(text)
    })
    
    process.on('close', (code) => {
      if (code === 0) resolve(output)
      else reject(new Error(`Command failed with code ${code}: ${output}`))
    })
    
    process.on('error', reject)
  })
}

/**
 * Check Docker is available
 */
export async function checkDocker(): Promise<{ available: boolean; version?: string; error?: string }> {
  try {
    const { stdout } = await execAsync('docker --version')
    return { available: true, version: stdout.trim() }
  } catch (error) {
    return { available: false, error: (error as Error).message }
  }
}

/**
 * Check Docker Compose is available
 */
export async function checkDockerCompose(): Promise<{ available: boolean; version?: string; error?: string }> {
  try {
    const { stdout } = await execAsync('docker compose version')
    return { available: true, version: stdout.trim() }
  } catch (error) {
    try {
      const { stdout } = await execAsync('docker-compose --version')
      return { available: true, version: stdout.trim() }
    } catch {
      return { available: false, error: (error as Error).message }
    }
  }
}

/**
 * Get container status
 */
export async function getContainerStatus(containerName: string): Promise<{
  exists: boolean
  running: boolean
  status?: string
  ports?: string[]
}> {
  try {
    const { stdout } = await execAsync(`docker ps -a --filter "name=${containerName}" --format "{{.Status}}"`)
    
    if (!stdout.trim()) {
      return { exists: false, running: false }
    }
    
    const running = stdout.includes('Up')
    
    // Get port mappings
    const { stdout: ports } = await execAsync(
      `docker ps --filter "name=${containerName}" --format "{{.Ports}}"`
    )
    
    return {
      exists: true,
      running,
      status: stdout.trim(),
      ports: ports.trim().split(',').filter(Boolean),
    }
  } catch {
    return { exists: false, running: false }
  }
}

/**
 * Build Docker image
 */
export async function buildImage(options: {
  context: string
  dockerfile?: string
  imageName: string
  tag?: string
  buildArgs?: Record<string, string>
  onProgress?: (step: string) => void
}): Promise<{ success: boolean; imageId?: string; error?: string }> {
  const { context, dockerfile, imageName, tag = 'latest', buildArgs = {}, onProgress } = options
  
  onProgress?.('Building Docker image...')
  
  const tagStr = `${imageName}:${tag}`
  let buildCmd = `docker build`
  
  if (dockerfile) {
    buildCmd += ` -f ${dockerfile}`
  }
  
  for (const [key, value] of Object.entries(buildArgs)) {
    buildCmd += ` --build-arg ${key}="${value}"`
  }
  
  buildCmd += ` -t ${tagStr} ${context}`
  
  try {
    const output = await execStream(buildCmd, context, (data) => {
      // Parse build progress
      if (data.includes('Step')) {
        onProgress?.(data.match(/Step \d+\/\d+ : (.+)/)?.[1] || '')
      }
    })
    
    // Get image ID
    const { stdout } = await execAsync(`docker images -q ${tagStr}`)
    
    return { success: true, imageId: stdout.trim() }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Run container from image
 */
export async function runContainer(options: {
  imageName: string
  containerName: string
  ports?: { host: number; container: number }[]
  env?: Record<string, string>
  volumes?: { host: string; container: string }[]
  command?: string[]
  detach?: boolean
  network?: string
}): Promise<{ success: boolean; containerId?: string; error?: string }> {
  const {
    imageName,
    containerName,
    ports = [],
    env = {},
    volumes = [],
    command = [],
    detach = true,
    network,
  } = options
  
  // Check if container already exists
  const existing = await getContainerStatus(containerName)
  if (existing.exists) {
    // Remove old container
    await execAsync(`docker rm -f ${containerName}`).catch(() => {})
  }
  
  let runCmd = 'docker run'
  
  if (detach) runCmd += ' -d'
  runCmd += ` --name ${containerName}`
  
  // Add port mappings
  for (const { host, container } of ports) {
    runCmd += ` -p ${host}:${container}`
  }
  
  // Add environment variables
  for (const [key, value] of Object.entries(env)) {
    runCmd += ` -e ${key}="${value}"`
  }
  
  // Add volume mounts
  for (const { host, container } of volumes) {
    runCmd += ` -v ${host}:${container}`
  }
  
  // Add network
  if (network) {
    runCmd += ` --network ${network}`
  }
  
  runCmd += ` ${imageName}`
  
  if (command.length > 0) {
    runCmd += ` ${command.join(' ')}`
  }
  
  try {
    const { stdout } = await execAsync(runCmd)
    return { success: true, containerId: stdout.trim() }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Stop and remove container
 */
export async function removeContainer(containerName: string): Promise<{ success: boolean; error?: string }> {
  try {
    await execAsync(`docker stop ${containerName}`).catch(() => {})
    await execAsync(`docker rm ${containerName}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Get container logs
 */
export async function getContainerLogs(
  containerName: string,
  tail = 100,
  follow = false
): Promise<{ success: boolean; logs?: string; error?: string }> {
  try {
    const followFlag = follow ? '-f' : ''
    const { stdout } = await execAsync(`docker logs ${followFlag} --tail ${tail} ${containerName}`)
    return { success: true, logs: stdout }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Execute command inside container
 */
export async function execInContainer(
  containerName: string,
  command: string
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const { stdout } = await execAsync(`docker exec ${containerName} ${command}`)
    return { success: true, output: stdout }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Get container stats (CPU, Memory)
 */
export async function getContainerStats(containerName: string): Promise<{
  cpu?: number
  memory?: { used: number; limit: number; percent: number }
  network?: { rx: number; tx: number }
}> {
  try {
    const { stdout } = await execAsync(
      `docker stats ${containerName} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}|{{.NetIO}}"`
    )
    
    const [cpu, memUsage, netIO] = stdout.trim().split('|')
    
    const cpuPercent = parseFloat(cpu.replace('%', ''))
    
    const [memUsed, memLimit] = memUsage.split('/').map((s: string) => {
      const match = s.match(/([\d.]+)\s*(\w+)/)
      if (!match) return 0
      let value = parseFloat(match[1])
      const unit = match[2]
      if (unit === 'GiB') value *= 1024
      else if (unit === 'MiB') value *= 1
      else if (unit === 'KiB') value /= 1024
      return Math.round(value)
    })
    
    const memPercent = (memUsed / memLimit) * 100
    
    const [rx, tx] = netIO.split(' ').map((s: string) => {
      const match = s.match(/([\d.]+)\s*(\w+)/)
      if (!match) return 0
      let value = parseFloat(match[1])
      const unit = match[2]
      if (unit === 'GB') value *= 1024
      else if (unit === 'MB') value *= 1
      else if (unit === 'KB') value /= 1024
      return Math.round(value)
    })
    
    return {
      cpu: cpuPercent,
      memory: { used: memUsed, limit: memLimit, percent: memPercent },
      network: { rx, tx },
    }
  } catch {
    return {}
  }
}

/**
 * Deploy a full stack application
 */
export async function deployApplication(options: {
  projectId: string
  projectName: string
  frontend?: {
    context: string
    dockerfile?: string
    port: number
    env?: Record<string, string>
  }
  backend?: {
    context: string
    dockerfile?: string
    port: number
    env?: Record<string, string>
    dependencies?: string[]
  }
  network?: string
  onProgress?: (step: string, details?: any) => void
}): Promise<{
  success: boolean
  deploymentId: string
  containers?: Record<string, string>
  error?: string
}> {
  const deploymentId = generateDeployId()
  const containers: Record<string, string> = {}
  
  try {
    // Create Docker network if specified
    if (options.network) {
      options.onProgress?.('Creating network...')
      await execAsync(`docker network create ${options.network}`).catch(() => {})
    }
    
    // Deploy backend
    if (options.backend) {
      const { context, dockerfile, port, env = {} } = options.backend
      
      options.onProgress?.('Building backend image...', { context })
      
      // Build backend image
      const backendImage = `backend-${options.projectName}:${Date.now()}`
      const buildResult = await buildImage({
        context,
        dockerfile,
        imageName: backendImage,
        buildArgs: {},
        onProgress: (step) => options.onProgress?.(step),
      })
      
      if (!buildResult.success) {
        throw new Error(`Backend build failed: ${buildResult.error}`)
      }
      
      options.onProgress?.('Starting backend container...')
      
      const backendEnv = {
        ...env,
        SERVICE_NAME: options.projectName,
        DEPLOYMENT_ID: deploymentId,
      }
      
      const backendResult = await runContainer({
        imageName: backendImage,
        containerName: `${options.projectName}-backend`,
        ports: [{ host: port, container: port }],
        env: backendEnv,
        network: options.network,
      })
      
      if (!backendResult.success) {
        throw new Error(`Backend container failed: ${backendResult.error}`)
      }
      
      containers.backend = backendResult.containerId!
    }
    
    // Deploy frontend
    if (options.frontend) {
      const { context, dockerfile, port, env = {} } = options.frontend
      
      options.onProgress?.('Building frontend image...', { context })
      
      const frontendImage = `frontend-${options.projectName}:${Date.now()}`
      const buildResult = await buildImage({
        context,
        dockerfile,
        imageName: frontendImage,
        buildArgs: {},
        onProgress: (step) => options.onProgress?.(step),
      })
      
      if (!buildResult.success) {
        throw new Error(`Frontend build failed: ${buildResult.error}`)
      }
      
      options.onProgress?.('Starting frontend container...')
      
      const frontendEnv = {
        ...env,
        SERVICE_NAME: options.projectName,
        DEPLOYMENT_ID: deploymentId,
      }
      
      const frontendResult = await runContainer({
        imageName: frontendImage,
        containerName: `${options.projectName}-frontend`,
        ports: [{ host: port, container: 80 }],
        env: frontendEnv,
        network: options.network,
      })
      
      if (!frontendResult.success) {
        throw new Error(`Frontend container failed: ${frontendResult.error}`)
      }
      
      containers.frontend = frontendResult.containerId!
    }
    
    // Wait for containers to be ready
    options.onProgress?.('Waiting for services to be ready...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Store deployment info
    deployments.set(deploymentId, {
      id: deploymentId,
      projectId: options.projectId,
      projectName: options.projectName,
      containers,
      network: options.network,
      createdAt: new Date().toISOString(),
    })
    
    options.onProgress?.('Deployment completed!', { deploymentId, containers })
    
    return { success: true, deploymentId, containers }
  } catch (error) {
    // Cleanup on failure
    for (const [name, id] of Object.entries(containers)) {
      await removeContainer(id).catch(() => {})
    }
    
    return { success: false, deploymentId, error: (error as Error).message }
  }
}

/**
 * Undeploy application
 */
export async function undeployApplication(projectName: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await removeContainer(`${projectName}-frontend`).catch(() => {})
    await removeContainer(`${projectName}-backend`).catch(() => {})
    
    // Remove network
    await execAsync(`docker network rm ${projectName}-network`).catch(() => {})
    
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(projectName: string): Promise<{
  deployed: boolean
  frontend?: { status: string; stats?: any }
  backend?: { status: string; stats?: any }
}> {
  const frontendStatus = await getContainerStatus(`${projectName}-frontend`)
  const backendStatus = await getContainerStatus(`${projectName}-backend`)
  
  const frontendStats = frontendStatus.running ? await getContainerStats(`${projectName}-frontend`) : null
  const backendStats = backendStatus.running ? await getContainerStats(`${projectName}-backend`) : null
  
  return {
    deployed: frontendStatus.exists || backendStatus.exists,
    frontend: frontendStatus.exists ? {
      status: frontendStatus.status,
      stats: frontendStats,
    } : undefined,
    backend: backendStatus.exists ? {
      status: backendStatus.status,
      stats: backendStats,
    } : undefined,
  }
}

/**
 * Get all deployments
 */
export function getAllDeployments() {
  return Array.from(deployments.values())
}
