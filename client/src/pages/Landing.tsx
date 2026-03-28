import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Sparkles, ArrowRight, Lock, Play, ChevronRight } from 'lucide-react'
import LoginModal from '../components/LoginModal'

export default function Landing() {
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)

  const features = [
    {
      icon: '🤖',
      title: '多智能体协作',
      description: '产品经理、架构师、前端、后端、测试等多种AI角色协同工作，自动分解任务并行处理。',
    },
    {
      icon: '🧠',
      title: '智能需求分析',
      description: 'AI自动分析需求完整度，识别潜在风险，提供改进建议，智能分配任务。',
    },
    {
      icon: '📊',
      title: '可视化工作流',
      description: '直观的看板视图，实时追踪项目进度和智能体状态，清晰展示任务执行情况。',
    },
    {
      icon: '⚡',
      title: '快速开发迭代',
      description: '自动化测试、代码审查、持续部署流水线，大幅提升开发效率。',
    },
  ]

  const steps = [
    { num: '01', title: '创建项目', desc: '输入项目需求，系统自动初始化' },
    { num: '02', title: '添加需求', desc: '描述业务需求，AI智能解析' },
    { num: '03', title: '智能评估', desc: 'AI分析需求完整性和可行性' },
    { num: '04', title: '分配任务', desc: '自动分配合适的AI角色' },
    { num: '05', title: '协同开发', desc: '多智能体并行完成开发' },
  ]

  return (
    <div style={{ background: '#0F172A', minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1E293B',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={20} color="white" />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>CrewForce</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate('/quickstart')}
                style={{
                  padding: '8px 16px', borderRadius: '10px', border: 'none',
                  background: 'transparent', color: '#94A3B8', cursor: 'pointer',
                  fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <Play size={16} /> 演示
              </button>
              <button
                onClick={() => setLoginOpen(true)}
                style={{
                  padding: '8px 16px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <Lock size={16} /> 开始使用
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        paddingTop: '140px', paddingBottom: '80px', textAlign: 'center',
        background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '20px', marginBottom: '24px',
            background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)',
          }}>
            <Sparkles size={14} color="#6366F1" />
            <span style={{ fontSize: '13px', color: '#A5B4FC' }}>AI Agent Teams Orchestrator</span>
          </div>
          
          <h1 style={{
            fontSize: '48px', fontWeight: '800', lineHeight: '1.1', marginBottom: '24px',
            letterSpacing: '-0.02em',
          }}>
            让 <span style={{ background: 'linear-gradient(135deg, #6366F1, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI智能体团队</span> 帮你开发
          </h1>
          
          <p style={{ fontSize: '18px', color: '#94A3B8', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6' }}>
            CrewForce 是一个多智能体协作平台，让AI产品经理、架构师、开发者、测试员组成团队，像管理人类团队一样管理AI，共同完成软件项目。
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setLoginOpen(true)}
              style={{
                padding: '14px 28px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white', cursor: 'pointer', fontSize: '16px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              立即开始 <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/quickstart')}
              style={{
                padding: '14px 28px', borderRadius: '12px',
                background: '#1E293B', border: '1px solid #334155',
                color: 'white', cursor: 'pointer', fontSize: '16px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <Play size={18} /> 快速入门
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 24px', background: '#0F172A' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>核心功能</h2>
            <p style={{ color: '#64748B' }}>强大的功能，简洁的体验</p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {features.map((feature, index) => (
              <div key={index} style={{
                padding: '24px', borderRadius: '16px',
                background: '#1E293B', border: '1px solid #334155',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', marginBottom: '16px',
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{feature.title}</h3>
                <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section style={{ padding: '80px 24px', background: 'rgba(30, 41, 59, 0.3)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>工作流程</h2>
            <p style={{ color: '#64748B' }}>5步完成项目开发</p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px',
          }}>
            {steps.map((step, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <div style={{
                  padding: '24px 16px', borderRadius: '16px', textAlign: 'center',
                  background: '#1E293B', border: '1px solid #334155',
                }}>
                  <div style={{
                    fontSize: '32px', fontWeight: '700', marginBottom: '12px',
                    background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    opacity: 0.5,
                  }}>
                    {step.num}
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>{step.title}</h3>
                  <p style={{ fontSize: '12px', color: '#64748B' }}>{step.desc}</p>
                </div>
                {index < steps.length - 1 && (
                  <div style={{
                    position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
                    zIndex: 10,
                  }}>
                    <ChevronRight size={20} color="#6366F1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 24px', background: '#0F172A' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            padding: '48px', borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
              准备好开始了吗？
            </h2>
            <p style={{ color: '#94A3B8', marginBottom: '32px' }}>
              加入成千上万的团队，开始使用AI智能体团队来提升开发效率
            </p>
            <button
              onClick={() => setLoginOpen(true)}
              style={{
                padding: '14px 32px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white', cursor: 'pointer', fontSize: '16px', fontWeight: '600',
              }}
            >
              立即开始
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 24px', borderTop: '1px solid #1E293B' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={20} color="#6366F1" />
            <span style={{ fontWeight: '600' }}>CrewForce</span>
          </div>
          <div style={{ color: '#64748B', fontSize: '13px' }}>
            © 2026 CrewForce. AI Agent Teams Orchestrator.
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
