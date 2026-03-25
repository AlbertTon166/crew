import { useState } from 'react'
import { 
  Rocket, CheckCircle, ArrowRight, Zap, FolderKanban, 
  Bot, MessageSquare, Key, ChevronRight, Play,
  Copy, ExternalLink, RefreshCw, Clock, Star
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

// Step interface
interface Step {
  id: number
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  icon: React.ReactNode
  link?: string
  linkText?: string
  linkTextEn?: string
  color: string
}

const steps: Step[] = [
  {
    id: 1,
    title: '添加 API 密钥',
    titleEn: 'Add API Key',
    description: '首先添加你的 AI 模型 API 密钥，支持 OpenAI、Anthropic、DeepSeek 等提供商。',
    descriptionEn: 'First, add your AI model API key. Supports OpenAI, Anthropic, DeepSeek and more.',
    icon: <Key size={24} />,
    link: '/api-keys',
    linkText: '去添加密钥',
    linkTextEn: 'Add API Key',
    color: '#10A37F',
  },
  {
    id: 2,
    title: '创建项目',
    titleEn: 'Create a Project',
    description: '创建一个新项目，定义你的目标和团队成员。',
    descriptionEn: 'Create a new project and define your goals and team members.',
    icon: <FolderKanban size={24} />,
    link: '/projects',
    linkText: '去创建项目',
    linkTextEn: 'Create Project',
    color: '#3B82F6',
  },
  {
    id: 3,
    title: '配置智能体',
    titleEn: 'Configure Agents',
    description: '添加并配置你的 AI 团队成员，分配角色和技能。',
    descriptionEn: 'Add and configure your AI team members with roles and skills.',
    icon: <Bot size={24} />,
    link: '/agents',
    linkText: '去配置智能体',
    linkTextEn: 'Configure Agents',
    color: '#8B5CF6',
  },
  {
    id: 4,
    title: '提交需求',
    titleEn: 'Submit Requirements',
    description: '通过 PM Agent 的结构化对话确认你的第一个需求。',
    descriptionEn: 'Confirm your first requirement through PM Agent structured dialogue.',
    icon: <MessageSquare size={24} />,
    link: '/requirements',
    linkText: '去提交需求',
    linkTextEn: 'Submit Requirement',
    color: '#F59E0B',
  },
]

// Feature card
function FeatureCard({ icon, title, titleEn, description, descriptionEn, language }: {
  icon: React.ReactNode
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  language: 'en' | 'zh'
}) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      gap: '16px',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: '#8B5CF6',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
          {language === 'zh' ? title : titleEn}
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          {language === 'zh' ? description : descriptionEn}
        </p>
      </div>
    </div>
  )
}

// Testimonial card
function TestimonialCard({ quote, quoteEn, author, role, language }: {
  quote: string
  quoteEn: string
  author: string
  role: string
  language: 'en' | 'zh'
}) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={14} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
        ))}
      </div>
      <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: '0 0 16px 0', lineHeight: 1.6, fontStyle: 'italic' }}>
        "{language === 'zh' ? quote : quoteEn}"
      </p>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{author}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{role}</div>
      </div>
    </div>
  )
}

export default function QuickStart() {
  const { language } = useLanguage()
  const [activeStep, setActiveStep] = useState(0)
  
  return (
    <div 
      className="page-container animate-fade-in"
      style={{ 
        background: 'var(--bg-primary)',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        padding: '48px 20px 40px',
        background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%)',
        borderRadius: '0 0 32px 32px',
        marginBottom: '32px',
      }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '24px',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 16px 48px rgba(99, 102, 241, 0.3)',
        }}>
          <Rocket size={36} style={{ color: 'white' }} />
        </div>
        
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '12px',
        }}>
          {language === 'zh' ? '5 分钟快速上手' : 'Get Started in 5 Minutes'}
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: 'var(--text-secondary)', 
          maxWidth: '480px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          {language === 'zh' 
            ? '按照以下步骤，快速创建你的第一个 AI Agent 团队，开始自动化工作流程。'
            : 'Follow these steps to quickly create your first AI Agent team and start automating workflows.'}
        </p>
        
        {/* Stats */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '32px', 
          marginTop: '32px' 
        }}>
          {[
            { value: '5', label: language === 'zh' ? '分钟完成设置' : 'min to setup' },
            { value: '3+', label: language === 'zh' ? '智能体同时工作' : 'agents working' },
            { value: '10x', label: language === 'zh' ? '效率提升' : 'efficiency boost' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#8B5CF6' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Steps */}
      <div style={{ padding: '0 20px', marginBottom: '40px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: 'var(--text-primary)', 
          marginBottom: '20px',
        }}>
          {language === 'zh' ? '快速开始' : 'Quick Start'}
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {steps.map((step, index) => {
            const isActive = activeStep === index
            const isCompleted = activeStep > index
            
            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(isActive ? -1 : index)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${isActive ? step.color : 'var(--border)'}`,
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Glow effect when active */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${step.color}, transparent)`,
                  }} />
                )}
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Step number */}
                  <div style={{
                    width: 48, height: 48, borderRadius: '12px',
                    background: isCompleted 
                      ? 'rgba(52, 211, 153, 0.15)' 
                      : isActive 
                      ? `${step.color}15`
                      : 'var(--bg-tertiary)',
                    border: isCompleted 
                      ? '1px solid rgba(52, 211, 153, 0.3)'
                      : isActive
                      ? `1px solid ${step.color}30`
                      : '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    color: isCompleted ? '#34D399' : isActive ? step.color : 'var(--text-tertiary)',
                  }}>
                    {isCompleted ? (
                      <CheckCircle size={20} />
                    ) : (
                      <span style={{ fontSize: '16px', fontWeight: '700' }}>{step.id}</span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: 'var(--text-primary)', 
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}>
                        <span style={{ color: isActive ? step.color : 'var(--text-tertiary)' }}>
                          {step.icon}
                        </span>
                        {language === 'zh' ? step.title : step.titleEn}
                      </h3>
                      <ChevronRight 
                        size={18} 
                        style={{ 
                          color: 'var(--text-tertiary)',
                          transform: isActive ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.2s',
                        }} 
                      />
                    </div>
                    
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-secondary)', 
                      margin: 0,
                      lineHeight: 1.5,
                    }}>
                      {language === 'zh' ? step.description : step.descriptionEn}
                    </p>
                    
                    {/* Expanded content */}
                    {isActive && (
                      <div style={{ marginTop: '16px' }}>
                        <a
                          href={step.link}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`,
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          {language === 'zh' ? step.linkText : step.linkTextEn}
                          <ArrowRight size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Features */}
      <div style={{ padding: '0 20px', marginBottom: '40px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: 'var(--text-primary)', 
          marginBottom: '20px',
        }}>
          {language === 'zh' ? '核心能力' : 'Core Features'}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <FeatureCard
            icon={<Bot size={20} />}
            title="多智能体协作"
            titleEn="Multi-Agent Collaboration"
            description="一个需求进来，多个 Agent 同时工作，自动分解、并行执行。"
            descriptionEn="One requirement in, multiple agents working together, automatically decomposed and parallel executed."
            language={language}
          />
          <FeatureCard
            icon={<MessageSquare size={20} />}
            title="结构化需求确认"
            titleEn="Structured Requirement Confirmation"
            description="PM Agent 通过 3 轮对话确保需求清晰，不遗漏关键信息。"
            descriptionEn="PM Agent ensures clear requirements through 3 rounds of dialogue, never missing key info."
            language={language}
          />
          <FeatureCard
            icon={<FolderKanban size={20} />}
            title="可视化项目管理"
            titleEn="Visual Project Management"
            description="看板视图跟踪任务状态，拖拽切换，流程一目了然。"
            descriptionEn="Kanban view tracks task status, drag-and-drop switching, clear process at a glance."
            language={language}
          />
          <FeatureCard
            icon={<Zap size={20} />}
            title="快速部署上线"
            titleEn="Fast Deployment"
            description="一键部署到生产环境，自动监控，异常自动告警。"
            descriptionEn="One-click deploy to production, automatic monitoring, anomaly alerts."
            language={language}
          />
        </div>
      </div>
      
      {/* Testimonials */}
      <div style={{ padding: '0 20px', marginBottom: '40px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: 'var(--text-primary)', 
          marginBottom: '20px',
        }}>
          {language === 'zh' ? '用户评价' : 'User Testimonials'}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <TestimonialCard
            quote="5分钟就跑通了第一个项目，比我想象的快多了"
            quoteEn="Got my first project running in 5 minutes, much faster than I expected"
            author="张明"
            role="独立开发者"
            language={language}
          />
          <TestimonialCard
            quote="终于有一个工具能让我同时管好几个AI助手了"
            quoteEn="Finally a tool that lets me manage multiple AI assistants at once"
            author="李华"
            role="AI Startup CEO"
            language={language}
          />
          <TestimonialCard
            quote="需求确认流程非常专业，减少了很多沟通成本"
            quoteEn="The requirement confirmation process is very professional, saving a lot of communication costs"
            author="王强"
            role="技术总监"
            language={language}
          />
        </div>
      </div>
      
      {/* CTA */}
      <div style={{ 
        padding: '40px 20px', 
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent, rgba(99, 102, 241, 0.05))',
        borderRadius: '32px 32px 0 0',
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '12px',
        }}>
          {language === 'zh' ? '准备好开始了吗？' : 'Ready to Get Started?'}
        </h2>
        <p style={{ 
          fontSize: '15px', 
          color: 'var(--text-secondary)', 
          marginBottom: '24px',
        }}>
          {language === 'zh' 
            ? '按照上面的步骤，5 分钟创建你的第一个 AI Agent 团队'
            : 'Follow the steps above and create your first AI Agent team in 5 minutes'}
        </p>
        <a
          href="/api-keys"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 28px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: 'white',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Zap size={18} />
          {language === 'zh' ? '立即开始' : 'Get Started Now'}
        </a>
      </div>
    </div>
  )
}
