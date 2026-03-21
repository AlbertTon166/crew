/**
 * Agent Team Preset Templates
 * 根据项目类型推荐不同的 Agent 组合配置
 */

export interface AgentRole {
  role: 'pm' | 'planner' | 'frontend' | 'backend' | 'reviewer' | 'tester' | 'deployer' | 'game-dev'
  count: number
  skills?: string[]
}

export interface TeamTemplate {
  id: string
  name: string
  description: string
  icon: string
  tags: string[]
  agents: AgentRole[]
  estimatedCost: string // 相对成本: '$' ~ '$$$$'
  complexity: 'simple' | 'medium' | 'complex'
}

// 预设模板配置
export const TEAM_TEMPLATES: TeamTemplate[] = [
  // ===== 应用开发 =====
  {
    id: 'mobile-app',
    name: '移动应用',
    description: 'iOS/Android App 开发，包含 UI 开发、API 对接、本地存储',
    icon: '📱',
    tags: ['App', '小程序', 'React Native', 'Flutter'],
    agents: [
      { role: 'pm', count: 1 },
      { role: 'planner', count: 1 },
      { role: 'frontend', count: 2, skills: ['mobile', 'react-native', 'flutter'] },
      { role: 'backend', count: 1, skills: ['api', 'database'] },
      { role: 'reviewer', count: 1 },
      { role: 'tester', count: 1 },
    ],
    estimatedCost: '$$$',
    complexity: 'medium',
  },
  {
    id: 'web-app',
    name: 'Web 应用',
    description: '前后端分离的 Web 应用，适合管理系统、Saas 产品',
    icon: '🌐',
    tags: ['Web', 'React', 'Vue', '管理系统'],
    agents: [
      { role: 'pm', count: 1 },
      { role: 'planner', count: 1 },
      { role: 'frontend', count: 2, skills: ['react', 'vue', 'typescript'] },
      { role: 'backend', count: 2, skills: ['nodejs', 'python', 'api'] },
      { role: 'reviewer', count: 1 },
      { role: 'tester', count: 1 },
    ],
    estimatedCost: '$$$',
    complexity: 'medium',
  },
  {
    id: 'fullstack-web',
    name: '全栈 Web',
    description: '全栈开发团队，适合快速迭代的 MVP 和初创项目',
    icon: '🚀',
    tags: ['全栈', 'MVP', '快速开发'],
    agents: [
      { role: 'pm', count: 1 },
      { role: 'planner', count: 1 },
      { role: 'frontend', count: 1, skills: ['react', 'fullstack'] },
      { role: 'backend', count: 1, skills: ['nodejs', 'fullstack'] },
      { role: 'reviewer', count: 1 },
    ],
    estimatedCost: '$$',
    complexity: 'simple',
  },

  // ===== 游戏开发 =====
  {
    id: 'casual-game',
    name: '休闲游戏',
    description: '2D 休闲游戏、卡牌游戏、消除类游戏开发',
    icon: '🎮',
    tags: ['游戏', '2D', 'Unity', 'Cocos'],
    agents: [
      { role: 'pm', count: 1 },
      { role: 'planner', count: 1 },
      { role: 'game-dev', count: 2, skills: ['unity', 'cocos', '2d'] },
      { role: 'frontend', count: 1, skills: ['ui', 'animation'] },
      { role: 'backend', count: 1, skills: ['game-server', 'api'] },
      { role: 'reviewer', count: 1 },
      { role: 'tester', count: 1 },
    ],
    estimatedCost: '$$$',
    complexity: 'medium',
  },
  {
    id: '3d-game',
    name: '3D 游戏',
    description: '3D 游戏开发，包含场景、角色、动画、引擎开发',
    icon: '🎨',
    tags: ['游戏', '3D', 'Unity', 'Unreal'],
    agents: [
      { role: 'pm', count: 1 },
      { role: 'planner', count: 1 },
      { role: 'game-dev', count: 3, skills: ['unity3d', 'unreal', '3d-modeling'] },
      { role: 'backend', count: 2, skills: ['game-server', 'realtime'] },
      { role: 'reviewer', count: 1 },
      { role: 'tester', count: 2 },
      { role: 'deployer', count: 1 },
    ],
    estimatedCost: '$$$$',
    complexity: 'complex',
  },

  // ===== 企业工具 =====
  {
    id: 'enterprise-app',
    name: '企业应用',
    description: '企业内部系统、数据看板、CRM、ERP 等',
    icon: '🏢',
    tags: ['企业', 'CRM', 'ERP', '数据看板'],
    agents: [
      { role: 'pm', count: 1 },
      { role: 'planner', count: 1 },
      { role: 'frontend', count: 2, skills: ['dashboard', 'admin'] },
      { role: 'backend', count: 2, skills: ['java', 'python', 'database'] },
      { role: 'reviewer', count: 1 },
      { role: 'tester', count: 1 },
      { role: 'deployer', count: 1 },
    ],
    estimatedCost: '$$$',
    complexity: 'medium',
  },
  {
    id: 'api-service',
    name: 'API 服务',
    description: '微服务、API 平台、第三方集成服务',
    icon: '⚙️',
    tags: ['API', '微服务', 'BFF'],
    agents: [
      { role: 'pm', count: 1 },
      { role: 'planner', count: 1 },
      { role: 'backend', count: 3, skills: ['microservice', 'api', 'devops'] },
      { role: 'reviewer', count: 1 },
      { role: 'deployer', count: 1 },
    ],
    estimatedCost: '$$',
    complexity: 'medium',
  },

  // ===== 小型/快速项目 =====
  {
    id: 'landing-page',
    name: '落地页/官网',
    description: '企业官网、营销落地页、个人主页',
    icon: '📄',
    tags: ['官网', '落地页', '静态站点'],
    agents: [
      { role: 'pm', count: 1 },
      { role: 'planner', count: 1 },
      { role: 'frontend', count: 1, skills: ['html', 'css', 'seo'] },
      { role: 'reviewer', count: 1 },
    ],
    estimatedCost: '$',
    complexity: 'simple',
  },
  {
    id: 'bot-assistant',
    name: 'Bot/助手',
    description: '聊天机器人、AI 助手、客服系统',
    icon: '🤖',
    tags: ['Bot', 'AI', 'Chatbot', '客服'],
    agents: [
      { role: 'pm', count: 1 },
      { role: 'planner', count: 1 },
      { role: 'backend', count: 2, skills: ['ai', 'nlp', 'api'] },
      { role: 'frontend', count: 1, skills: ['chat-ui'] },
      { role: 'reviewer', count: 1 },
    ],
    estimatedCost: '$$',
    complexity: 'medium',
  },
]

// 根据项目类型获取推荐模板
export function getRecommendedTemplates(projectType: string): TeamTemplate[] {
  const typeMap: Record<string, string[]> = {
    'app': ['mobile-app', 'web-app'],
    'mobile': ['mobile-app'],
    'ios': ['mobile-app'],
    'android': ['mobile-app'],
    'miniprogram': ['mobile-app'],
    'web': ['web-app', 'fullstack-web', 'landing-page'],
    'website': ['landing-page', 'web-app'],
    'game': ['casual-game', '3d-game'],
    '3d': ['3d-game'],
    'enterprise': ['enterprise-app', 'api-service'],
    'api': ['api-service'],
    'bot': ['bot-assistant'],
    'ai': ['bot-assistant'],
  }

  const keywords = projectType.toLowerCase().split(/[\s,\-+]+/)
  
  for (const keyword of keywords) {
    if (typeMap[keyword]) {
      return typeMap[keyword]
        .map(id => TEAM_TEMPLATES.find(t => t.id === id))
        .filter(Boolean) as TeamTemplate[]
    }
  }

  // 默认返回 Web 应用
  return [TEAM_TEMPLATES.find(t => t.id === 'web-app')!]
}

// 计算团队总人数
export function calculateTeamSize(template: TeamTemplate): number {
  return template.agents.reduce((sum, agent) => sum + agent.count, 0)
}

// 获取模板角色分布
export function getRoleDistribution(template: TeamTemplate): Record<string, number> {
  const distribution: Record<string, number> = {}
  for (const agent of template.agents) {
    distribution[agent.role] = (distribution[agent.role] || 0) + agent.count
  }
  return distribution
}

// 角色显示配置
export const ROLE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  pm: { label: 'Product Manager', color: 'violet', emoji: '📋' },
  planner: { label: 'Planner', color: 'blue', emoji: '📐' },
  frontend: { label: 'Frontend Dev', color: 'cyan', emoji: '🎨' },
  backend: { label: 'Backend Dev', color: 'green', emoji: '⚙️' },
  reviewer: { label: 'Reviewer', color: 'yellow', emoji: '🔍' },
  tester: { label: 'Tester', color: 'pink', emoji: '🧪' },
  deployer: { label: 'DevOps', color: 'orange', emoji: '🚀' },
  'game-dev': { label: 'Game Developer', color: 'purple', emoji: '🎮' },
}

// 复杂度配置
export const COMPLEXITY_CONFIG = {
  simple: { label: '简单', color: 'emerald', description: '1-3人团队，快速交付' },
  medium: { label: '中等', color: 'amber', description: '4-6人团队，标准流程' },
  complex: { label: '复杂', color: 'red', description: '7人以上，完整敏捷流程' },
}
