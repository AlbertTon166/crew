// Agent Role & Certification Types

export interface Skill {
  id: string
  name: string
  nameEn: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  verified: boolean
  proofUrl?: string
}

export interface Certification {
  id: string
  type: 'skill' | 'credential' | 'experience' | 'portfolio'
  name: string
  issuer?: string // 发证机构
  issuedAt?: string
  expiresAt?: string
  verified: boolean
  proofUrl?: string
  verifiedAt?: string
}

export interface RoleDefinition {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  icon: string
  color: string
  requiredSkills: {
    skillId: string
    minLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    required: boolean
  }[]
  minExperience?: {
    years: number
    proofRequired: boolean
  }
  responsibilities: string[]
  createdBy: 'system' | 'user' // 系统预置 or 用户创建
}

// 预定义角色模板
export const ROLE_TEMPLATES: RoleDefinition[] = [
  {
    id: 'frontend-expert',
    name: '前端开发专家',
    nameEn: 'Frontend Expert',
    description: '负责用户界面开发、组件封装、性能优化',
    descriptionEn: 'Responsible for UI development, component encapsulation, performance optimization',
    icon: '🎨',
    color: '#38BDF8',
    requiredSkills: [
      { skillId: 'react', minLevel: 'advanced', required: true },
      { skillId: 'typescript', minLevel: 'intermediate', required: true },
      { skillId: 'css', minLevel: 'advanced', required: true },
      { skillId: 'performance', minLevel: 'intermediate', required: false },
    ],
    minExperience: { years: 3, proofRequired: true },
    responsibilities: [
      '页面开发与组件封装',
      '前端性能优化',
      '响应式设计实现',
      '前端技术方案评审',
    ],
    createdBy: 'system',
  },
  {
    id: 'backend-expert',
    name: '后端开发专家',
    nameEn: 'Backend Expert',
    description: '负责业务逻辑开发、API设计、数据库建模',
    descriptionEn: 'Responsible for business logic, API design, database modeling',
    icon: '⚙️',
    color: '#34D399',
    requiredSkills: [
      { skillId: 'nodejs', minLevel: 'advanced', required: true },
      { skillId: 'database', minLevel: 'advanced', required: true },
      { skillId: 'api-design', minLevel: 'intermediate', required: true },
      { skillId: 'microservice', minLevel: 'intermediate', required: false },
    ],
    minExperience: { years: 3, proofRequired: true },
    responsibilities: [
      'API 接口开发',
      '业务逻辑实现',
      '数据库设计与优化',
      '后端技术方案评审',
    ],
    createdBy: 'system',
  },
  {
    id: 'architect',
    name: '架构师',
    nameEn: 'Architect',
    description: '负责系统架构设计、技术选型、性能调优',
    descriptionEn: 'Responsible for system architecture, technology selection, performance tuning',
    icon: '🏗️',
    color: '#A78BFA',
    requiredSkills: [
      { skillId: 'system-design', minLevel: 'expert', required: true },
      { skillId: 'microservice', minLevel: 'advanced', required: true },
      { skillId: 'performance', minLevel: 'advanced', required: true },
      { skillId: 'security', minLevel: 'intermediate', required: true },
    ],
    minExperience: { years: 5, proofRequired: true },
    responsibilities: [
      '系统架构设计',
      '技术选型决策',
      '性能优化方案',
      '技术难题攻关',
      '代码评审把控',
    ],
    createdBy: 'system',
  },
  {
    id: 'test-expert',
    name: '测试专家',
    nameEn: 'QA Expert',
    description: '负责测试计划、用例设计、缺陷管理',
    descriptionEn: 'Responsible for test planning, case design, defect management',
    icon: '🧪',
    color: '#F472B6',
    requiredSkills: [
      { skillId: 'automated-testing', minLevel: 'advanced', required: true },
      { skillId: 'performance-testing', minLevel: 'intermediate', required: false },
      { skillId: 'security-testing', minLevel: 'intermediate', required: false },
    ],
    minExperience: { years: 2, proofRequired: false },
    responsibilities: [
      '测试计划制定',
      '测试用例设计',
      '自动化测试开发',
      '缺陷跟踪管理',
      '测试报告输出',
    ],
    createdBy: 'system',
  },
  {
    id: 'product-manager',
    name: '产品经理',
    nameEn: 'Product Manager',
    description: '负责需求分析、产品设计、项目管理',
    descriptionEn: 'Responsible for requirements analysis, product design, project management',
    icon: '📋',
    color: '#FBBF24',
    requiredSkills: [
      { skillId: 'requirements', minLevel: 'advanced', required: true },
      { skillId: 'product-design', minLevel: 'intermediate', required: true },
      { skillId: 'project-management', minLevel: 'intermediate', required: true },
    ],
    minExperience: { years: 3, proofRequired: true },
    responsibilities: [
      '需求调研与分析',
      '产品原型设计',
      '优先级排序',
      '项目进度把控',
      '跨团队协调',
    ],
    createdBy: 'system',
  },
  {
    id: 'devops-engineer',
    name: 'DevOps工程师',
    nameEn: 'DevOps Engineer',
    description: '负责 CI/CD、容器化、监控系统',
    descriptionEn: 'Responsible for CI/CD, containerization, monitoring systems',
    icon: '🔧',
    color: '#FB923C',
    requiredSkills: [
      { skillId: 'docker', minLevel: 'advanced', required: true },
      { skillId: 'cicd', minLevel: 'advanced', required: true },
      { skillId: 'kubernetes', minLevel: 'intermediate', required: false },
      { skillId: 'monitoring', minLevel: 'intermediate', required: true },
    ],
    minExperience: { years: 2, proofRequired: false },
    responsibilities: [
      'CI/CD 流程搭建',
      '容器化部署',
      '监控系统维护',
      '日志收集分析',
      '应急响应处理',
    ],
    createdBy: 'system',
  },
  {
    id: 'data-engineer',
    name: '数据工程师',
    nameEn: 'Data Engineer',
    description: '负责数据管道、仓库建模、数据治理',
    descriptionEn: 'Responsible for data pipelines, warehouse modeling, data governance',
    icon: '📊',
    color: '#22D3EE',
    requiredSkills: [
      { skillId: 'sql', minLevel: 'advanced', required: true },
      { skillId: 'data-modeling', minLevel: 'advanced', required: true },
      { skillId: 'etl', minLevel: 'intermediate', required: true },
      { skillId: 'big-data', minLevel: 'intermediate', required: false },
    ],
    minExperience: { years: 3, proofRequired: true },
    responsibilities: [
      '数据管道开发',
      '数据仓库设计',
      '数据质量保障',
      'ETL 流程优化',
      '数据治理规范',
    ],
    createdBy: 'system',
  },
  {
    id: 'security-expert',
    name: '安全专家',
    nameEn: 'Security Expert',
    description: '负责安全审计、漏洞修复、安全培训',
    descriptionEn: 'Responsible for security audits, vulnerability fixes, security training',
    icon: '🔒',
    color: '#EF4444',
    requiredSkills: [
      { skillId: 'security', minLevel: 'expert', required: true },
      { skillId: 'penetration-testing', minLevel: 'advanced', required: true },
      { skillId: 'compliance', minLevel: 'intermediate', required: false },
    ],
    minExperience: { years: 4, proofRequired: true },
    responsibilities: [
      '安全漏洞扫描',
      '渗透测试实施',
      '安全方案设计',
      '安全培训组织',
      '合规审计支持',
    ],
    createdBy: 'system',
  },
]

// 预定义技能库
export const SKILL_TEMPLATES = [
  { id: 'react', name: 'React', category: 'Frontend' },
  { id: 'vue', name: 'Vue.js', category: 'Frontend' },
  { id: 'angular', name: 'Angular', category: 'Frontend' },
  { id: 'typescript', name: 'TypeScript', category: 'Language' },
  { id: 'javascript', name: 'JavaScript', category: 'Language' },
  { id: 'css', name: 'CSS/SCSS', category: 'Frontend' },
  { id: 'html', name: 'HTML', category: 'Frontend' },
  { id: 'nodejs', name: 'Node.js', category: 'Backend' },
  { id: 'python', name: 'Python', category: 'Backend' },
  { id: 'java', name: 'Java', category: 'Backend' },
  { id: 'golang', name: 'Go', category: 'Backend' },
  { id: 'rust', name: 'Rust', category: 'Backend' },
  { id: 'database', name: '数据库设计', category: 'Data' },
  { id: 'sql', name: 'SQL', category: 'Data' },
  { id: 'api-design', name: 'API设计', category: 'Architecture' },
  { id: 'microservice', name: '微服务', category: 'Architecture' },
  { id: 'system-design', name: '系统设计', category: 'Architecture' },
  { id: 'docker', name: 'Docker', category: 'DevOps' },
  { id: 'kubernetes', name: 'Kubernetes', category: 'DevOps' },
  { id: 'cicd', name: 'CI/CD', category: 'DevOps' },
  { id: 'monitoring', name: '监控', category: 'DevOps' },
  { id: 'performance', name: '性能优化', category: 'Quality' },
  { id: 'automated-testing', name: '自动化测试', category: 'Quality' },
  { id: 'performance-testing', name: '性能测试', category: 'Quality' },
  { id: 'security-testing', name: '安全测试', category: 'Quality' },
  { id: 'security', name: '安全', category: 'Security' },
  { id: 'penetration-testing', name: '渗透测试', category: 'Security' },
  { id: 'requirements', name: '需求分析', category: 'Product' },
  { id: 'product-design', name: '产品设计', category: 'Product' },
  { id: 'project-management', name: '项目管理', category: 'Product' },
  { id: 'data-modeling', name: '数据建模', category: 'Data' },
  { id: 'etl', name: 'ETL', category: 'Data' },
  { id: 'big-data', name: '大数据', category: 'Data' },
  { id: 'compliance', name: '合规', category: 'Security' },
]
