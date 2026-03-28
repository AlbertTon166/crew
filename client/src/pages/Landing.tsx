import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Sparkles, ArrowRight, Lock, Play, ChevronRight, Layers, Brain, GitBranch, Shield } from 'lucide-react'
import LoginModal from '../components/LoginModal'

export default function Landing() {
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const features = [
    {
      icon: <Layers className="w-6 h-6" />,
      title: '多智能体协作',
      description: '产品经理、架构师、前端、后端、测试等多种AI角色协同工作，自动分解任务并行处理。',
      color: '#6366F1',
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: '智能需求分析',
      description: 'AI自动分析需求完整度，识别潜在风险，提供改进建议，智能分配任务。',
      color: '#22D3EE',
    },
    {
      icon: <GitBranch className="w-6 h-6" />,
      title: '可视化工作流',
      description: '直观的看板视图，实时追踪项目进度和智能体状态，清晰展示任务执行情况。',
      color: '#A78BFA',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: '快速开发迭代',
      description: '自动化测试、代码审查、持续部署流水线，大幅提升开发效率。',
      color: '#34D399',
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
    <div 
      className="min-h-screen animate-fade-in"
      style={{
        background: '#0F172A',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
      }}
    >
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #334155',
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                }}
              >
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">CrewForce</span>
            </div>
            
            {/* Right buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/quickstart')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 transition-all duration-200 hover:text-white hover:bg-slate-800"
              >
                <Play className="w-4 h-4" />
                演示
              </button>
              <button 
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                }}
              >
                <Lock className="w-4 h-4" />
                开始使用
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="pt-32 pb-20 px-6"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#818CF8' }} />
            <span className="text-sm" style={{ color: '#818CF8' }}>AI Agent Teams Orchestrator</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            <span className="text-white">让 </span>
            <span 
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #818CF8 0%, #C084FC 100%)' }}
            >
              AI智能体团队
            </span>
            <br className="hidden md:block" />
            <span className="text-white">帮你开发软件</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            CrewForce 是一个多智能体协作平台，让AI产品经理、架构师、开发者、测试员组成团队，
            像管理人类团队一样管理AI，共同完成软件项目。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setLoginOpen(true)}
              className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
              }}
            >
              立即开始
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/quickstart')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white transition-all duration-200 hover:scale-105 border"
              style={{
                background: '#1E293B',
                borderColor: '#334155',
              }}
            >
              <Play className="w-4 h-4" />
              快速入门
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              核心功能
            </h2>
            <p className="text-slate-400">强大的功能，简洁的体验</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl transition-all duration-200 hover:scale-105"
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.5s ease-out ${index * 100}ms`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#475569'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#334155'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ 
                    background: `${feature.color}15`,
                    border: `1px solid ${feature.color}30`,
                  }}
                >
                  <div style={{ color: feature.color }}>{feature.icon}</div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-6" style={{ background: 'rgba(30, 41, 59, 0.3)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              工作流程
            </h2>
            <p className="text-slate-400">5步完成项目开发</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div 
                  className="p-6 rounded-2xl text-center"
                  style={{
                    background: '#1E293B',
                    border: '1px solid #334155',
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                    transition: `all 0.5s ease-out ${index * 100}ms`,
                  }}
                >
                  <div 
                    className="text-3xl font-bold mb-2"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      opacity: 0.4,
                    }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-xs text-slate-500 hidden md:block">{step.desc}</p>
                </div>
                {/* Connector */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
                    >
                      <ChevronRight className="w-4 h-4 text-indigo-400" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div 
            className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
            }}
          >
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.5) 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                准备好开始了吗？
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                加入成千上万的团队，开始使用AI智能体团队来提升开发效率
              </p>
              <button
                onClick={() => setLoginOpen(true)}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white transition-all duration-200 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
                }}
              >
                立即开始
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid #334155' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-slate-400">CrewForce</span>
            </div>
            <div className="text-sm text-slate-500">
              © 2026 CrewForce. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {loginOpen && (
        <LoginModal 
          isOpen={loginOpen} 
          onClose={() => {
            setLoginOpen(false)
            navigate('/dashboard')
          }} 
        />
      )}
    </div>
  )
}
