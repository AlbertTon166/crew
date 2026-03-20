/**
 * OpenClaw 版本锁定配置
 * 避免部署时版本更新导致不兼容
 */

export const OPENCLAW_CONFIG = {
  // 当前锁定版本
  version: '2026.3.13',
  build: '61d171a',
  
  // 兼容版本范围 (semver)
  // 如果需要降级或升级，修改此配置
  compatibleVersions: {
    min: '2026.3.0',
    max: '2026.4.0',
  },
  
  // 推荐的模型版本
  recommendedModels: {
    // MiniMax 系列
    'MiniMax-M2.5': 'custom-mydmx-huoyuanqudao-cn/MiniMax-M2.5',
    'MiniMax-M2.7': 'custom-mydamoxing-cn/MiniMax-M2.7',
    'MiniMax-M3': 'custom-mydamoxing-cn/MiniMax-M3',
    
    // Qwen 系列
    'Qwen3-Max': 'custom-apis-iflow-cn/qwen3-max',
    'Qwen3-32B': 'custom-apis-iflow-cn/qwen3-32b',
  },
  
  // Node.js 版本要求
  nodeVersion: {
    min: '18.0.0',
    recommended: '22.0.0',
  },
  
  // 必需的核心依赖
  coreDependencies: {
    'express': '^4.21.0',
    'cors': '^2.8.5',
    'uuid': '^10.0.0',
    'pg': '^8.13.0',
    'redis': '^4.7.0',
    'chromadb': '^1.8.1',
  },
}

/**
 * 获取当前版本信息
 */
export function getVersionInfo() {
  return {
    version: OPENCLAW_CONFIG.version,
    build: OPENCLAW_CONFIG.build,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  }
}

/**
 * 检查版本兼容性
 */
export function checkCompatibility(currentVersion: string): {
  compatible: boolean
  message: string
} {
  const [major, minor, patch] = currentVersion.split('.').map(Number)
  const [minMajor, minMinor] = OPENCLAW_CONFIG.compatibleVersions.min.split('.').map(Number)
  const [maxMajor, maxMinor] = OPENCLAW_CONFIG.compatibleVersions.max.split('.').map(Number)
  
  // 简化的版本检查
  if (major < minMajor || (major === minMajor && minor < minMinor)) {
    return { 
      compatible: false, 
      message: `版本过低，需要至少 ${OPENCLAW_CONFIG.compatibleVersions.min}` 
    }
  }
  
  if (major > maxMajor || (major === maxMajor && minor > maxMinor)) {
    return { 
      compatible: false, 
      message: `版本过高，最高支持 ${OPENCLAW_CONFIG.compatibleVersions.max}` 
    }
  }
  
  return { 
    compatible: true, 
    message: '版本兼容' 
  }
}

export default OPENCLAW_CONFIG
