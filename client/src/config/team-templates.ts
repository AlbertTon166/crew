/**
 * Agent Team Preset Templates (Frontend Copy)
 * 与 server/team-templates.js 保持同步
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
  estimatedCost: string
  complexity: 'simple' | 'medium' | 'complex'
}

// 外部依赖配置
export interface ExternalDependency {
  id: string
  name: string           // e.g., "Stripe", "腾讯地图", "Firebase"
  type: 'api' | 'sdk' | 'library' | 'service'
  purpose: string        // 用途描述
  testKey?: string       // 测试 Key (可选)
  docUrl?: string        // 文档链接 (可选)
  envVars?: string[]     // 需要的环境变量名
}

export interface ProjectConfig {
  name: string
  description: string
  template: TeamTemplate
  externalDependencies: ExternalDependency[]
  hasExternalDeps: boolean
}

export const TEAM_TEMPLATES: TeamTemplate[] = [
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

export function calculateTeamSize(template: TeamTemplate): number {
  return template.agents.reduce((sum, agent) => sum + agent.count, 0)
}

export function getRoleDistribution(template: TeamTemplate): Record<string, number> {
  const distribution: Record<string, number> = {}
  for (const agent of template.agents) {
    distribution[agent.role] = (distribution[agent.role] || 0) + agent.count
  }
  return distribution
}

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

export const COMPLEXITY_CONFIG = {
  simple: { label: '简单', color: 'emerald', description: '1-3人团队，快速交付' },
  medium: { label: '中等', color: 'amber', description: '4-6人团队，标准流程' },
  complex: { label: '复杂', color: 'red', description: '7人以上，完整敏捷流程' },
}

// 常用外部服务推荐
export const POPULAR_SERVICES = [
  { name: 'Stripe', type: 'api' as const, category: '支付', icon: '💳', description: '在线支付' },
  { name: 'Firebase', type: 'sdk' as const, category: '后端', icon: '🔥', description: '实时数据库/推送' },
  { name: 'AWS S3', type: 'api' as const, category: '存储', icon: '☁️', description: '文件存储' },
  { name: 'Twilio', type: 'api' as const, category: '通信', icon: '📱', description: '短信/验证码' },
  { name: 'SendGrid', type: 'api' as const, category: '通信', icon: '📧', description: '邮件发送' },
  { name: '阿里云 OSS', type: 'api' as const, category: '存储', icon: '🏢', description: '对象存储' },
  { name: '腾讯云', type: 'sdk' as const, category: '服务', icon: '🐧', description: '地图/短信/推送' },
  { name: '微信支付', type: 'api' as const, category: '支付', icon: '💚', description: '微信支付' },
  { name: '支付宝', type: 'api' as const, category: '支付', icon: '🔵', description: '支付宝支付' },
  { name: '高德地图', type: 'sdk' as const, category: '地图', icon: '📍', description: '地图/定位' },
  { name: 'Google Maps', type: 'sdk' as const, category: '地图', icon: '🌍', description: 'Google 地图' },
  { name: 'OpenAI', type: 'api' as const, category: 'AI', icon: '🤖', description: 'GPT/AI 接口' },
  { name: 'ChatGPT', type: 'api' as const, category: 'AI', icon: '💬', description: 'AI 对话' },
  { name: '阿里云短信', type: 'api' as const, category: '通信', icon: '📩', description: '短信服务' },
  { name: '极光推送', type: 'sdk' as const, category: '推送', icon: '🔔', description: '消息推送' },
]
