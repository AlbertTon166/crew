import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Sparkles, Users, Zap, ArrowRight, Github, Lock, Menu, X, Play, ChevronRight, Star, Quote, CheckCircle2 } from 'lucide-react'
import LoginModal from '../components/LoginModal'

// Animated counter component
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let start = 0
          const increment = end / (duration / 16)
          const timer = setInterval(() => {
            start += increment
            if (start >= end) {
              setCount(end)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 16)
        }
      },
      { threshold: 0.5 }
    )
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, hasAnimated])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// Fade in on scroll
function FadeInSection({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.8s ease-out ${delay}ms, transform 0.8s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: '多智能体协作',
      titleEn: 'Multi-Agent Collaboration',
      description: '支持产品经理、架构师、前端、后端、测试等多种角色的AI智能体协同工作，自动分解任务并行处理。',
      color: '#E879F9',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: '智能需求分析',
      titleEn: 'Smart Requirements Analysis',
      description: 'AI自动分析需求完整度，识别潜在风险，提供改进建议，智能分配任务给合适的智能体。',
      color: '#22D3EE',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: '可视化工作流',
      titleEn: 'Visual Workflow',
      description: '直观的看板视图，实时追踪项目进度和智能体状态，清晰展示每个任务的执行情况。',
      color: '#A78BFA',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: '快速开发迭代',
      titleEn: 'Rapid Development',
      description: '自动化测试、代码审查、持续部署流水线，大幅提升开发效率，减少重复性工作。',
      color: '#34D399',
    },
  ]

  const steps = [
    { num: '01', title: '创建项目', desc: '输入项目需求和基本信息，系统自动初始化项目结构' },
    { num: '02', title: '添加需求', desc: '向AI描述您的业务需求，智能体自动解析和补充细节' },
    { num: '03', title: '智能评估', desc: 'AI自动分析需求完整性和可行性，给出专业建议' },
    { num: '04', title: '分配智能体', desc: '根据任务类型自动分配合适的AI角色和工具链' },
    { num: '05', title: '协同开发', desc: '多智能体并行工作，自动完成任务并生成完整文档' },
  ]

  const testimonials = [
    {
      quote: 'CrewForce 让我们的团队效率提升了3倍，AI智能体团队接管了大部分重复性工作。',
      author: '张明',
      role: '技术负责人',
      company: '某科技公司',
      avatar: '👨‍💻',
    },
    {
      quote: '第一次体验到真正的多智能体协作，开发周期从两周缩短到了三天。',
      author: '李华',
      role: '产品经理',
      company: '创业团队',
      avatar: '👩‍🎨',
    },
    {
      quote: '智能体团队自动完成了代码审查和测试用例生成，减少了60%的人工工作量。',
      author: '王强',
      role: '全栈工程师',
      company: '互联网企业',
      avatar: '👨‍🔬',
    },
  ]

  const stats = [
    { value: 5000, suffix: '+', label: '活跃项目', labelEn: 'Active Projects' },
    { value: 98, suffix: '%', label: '用户满意度', labelEn: 'User Satisfaction' },
    { value: 3, suffix: 'x', label: '效率提升', labelEn: 'Efficiency Gain' },
    { value: 50, suffix: 'K+', label: 'AI智能体', labelEn: 'AI Agents' },
  ]

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0F172A 0%, #1a1a2e 50%, #16213e 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Large gradient orbs */}
        <div 
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-3xl animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-3xl animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            animationDelay: '1s'
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 w-1/3 h-1/3 rounded-full blur-3xl animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(232, 121, 249, 0.1) 0%, transparent 70%)',
            animationDelay: '2s'
          }}
        />
      </div>

      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: isLoaded ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div 
                className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
                }}
              >
                <Bot className="w-6 h-6 text-white" />
                <div 
                  className="absolute -inset-1 rounded-xl opacity-30"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                    filter: 'blur(10px)',
                    zIndex: -1
                  }}
                />
              </div>
              <div>
                <span className="text-xl font-bold text-white">CrewForce</span>
                <span 
                  className="ml-2 text-xs px-2 py-0.5 rounded-full"
                  style={{ 
                    background: 'rgba(99, 102, 241, 0.2)', 
                    color: '#818CF8',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}
                >
                  v0.3 Beta
                </span>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
              >
                功能特性
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
              >
                工作流程
              </button>
              <button 
                onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
              >
                用户评价
              </button>
              <button 
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
                }}
              >
                <Lock className="w-4 h-4" />
                立即体验
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-300" /> : <Menu className="w-6 h-6 text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          className={`md:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}
          style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)' }}
        >
          <div className="px-4 py-4 space-y-3 border-t border-slate-800">
            <button 
              onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-slate-300 hover:text-white"
            >
              功能特性
            </button>
            <button 
              onClick={() => { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-slate-300 hover:text-white"
            >
              工作流程
            </button>
            <button 
              onClick={() => { document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 text-slate-300 hover:text-white"
            >
              用户评价
            </button>
            <button 
              onClick={() => setLoginOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl font-medium"
            >
              <Lock className="w-4 h-4" />
              立即体验
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 transition-all duration-700"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#818CF8' }} />
            <span className="text-sm" style={{ color: '#818CF8' }}>AI Agent Teams Orchestrator</span>
          </div>
          
          {/* Main headline */}
          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight transition-all duration-700 delay-100"
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)'
            }}
          >
            <span className="text-white">让 </span>
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r"
              style={{ backgroundImage: 'linear-gradient(135deg, #818CF8 0%, #C084FC 50%, #F472B6 100%)' }}
            >
              AI智能体团队
            </span>
            <br className="hidden md:block" />
            <span className="text-white">帮你开发软件</span>
          </h1>
          
          {/* Subheadline */}
          <p 
            className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200"
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)'
            }}
          >
            CrewForce 是一个多智能体协作平台，让AI产品经理、架构师、开发者、测试员组成团队，
            像管理人类团队一样管理AI，共同完成软件项目。
          </p>

          {/* CTA Buttons */}
          <div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 delay-300"
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)'
            }}
          >
            <button
              onClick={() => setLoginOpen(true)}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)'
              }}
            >
              开始免费使用
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/quickstart')}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white transition-all duration-300 hover:scale-105 border border-slate-700 hover:border-slate-600"
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Play className="w-5 h-5" />
              快速入门
            </button>
          </div>

          {/* Trust badges */}
          <div 
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 transition-all duration-700 delay-400"
            style={{
              opacity: isLoaded ? 1 : 0
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>无需信用卡</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>5分钟快速上手</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>免费试用14天</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section className="py-20 px-4 relative z-10">
        <FadeInSection className="max-w-6xl mx-auto">
          {/* Demo container */}
          <div 
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#FBBF24' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#22C55E' }} />
              <div className="flex-1 text-center text-sm text-slate-500">CrewForce Dashboard</div>
            </div>
            
            {/* Mock dashboard content */}
            <div className="p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: '活跃智能体', value: '12', color: '#E879F9' },
                  { label: '进行中任务', value: '28', color: '#22D3EE' },
                  { label: '本周完成', value: '156', color: '#34D399' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                    <div className="mt-2 h-1 rounded-full" style={{ background: stat.color, width: '60%', opacity: 0.6 }} />
                  </div>
                ))}
              </div>
              
              {/* Kanban preview */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { title: '待处理', items: ['用户登录功能', '数据库优化', 'API文档'], color: '#FBBF24' },
                  { title: '开发中', items: ['支付模块', '消息通知'], color: '#6366F1' },
                  { title: '已完成', items: ['首页UI', '权限系统', '日志模块'], color: '#34D399' },
                ].map((column, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: column.color }} />
                      <span className="text-sm font-medium text-slate-300">{column.title}</span>
                    </div>
                    {column.items.map((item, j) => (
                      <div key={j} className="p-3 rounded-lg mb-2" style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <div className="text-sm text-slate-200">{item}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <FadeInSection key={index} delay={index * 100}>
                <div className="text-center">
                  <div 
                    className="text-4xl md:text-5xl font-bold mb-2"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-slate-400">{stat.labelEn}</div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 relative z-10" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <Sparkles className="w-4 h-4" style={{ color: '#818CF8' }} />
                <span className="text-sm" style={{ color: '#818CF8' }}>核心功能</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">为什么选择 CrewForce？</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">强大的功能，简洁的体验，让AI智能体团队为你工作</p>
            </div>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FadeInSection key={index} delay={index * 100}>
                <div 
                  className="group p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ 
                      background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
                      border: `1px solid ${feature.color}30`
                    }}
                  >
                    <div style={{ color: feature.color }}>{feature.icon}</div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                <ChevronRight className="w-4 h-4" style={{ color: '#34D399' }} />
                <span className="text-sm" style={{ color: '#34D399' }}>工作流程</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">5步完成项目开发</h2>
              <p className="text-slate-400">从需求到上线，AI智能体团队全程协作</p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {steps.map((step, index) => (
              <FadeInSection key={index} delay={index * 100}>
                <div className="relative group">
                  <div 
                    className="p-6 rounded-2xl text-center transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div 
                      className="text-4xl font-bold mb-3"
                      style={{
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        opacity: 0.3
                      }}
                    >
                      {step.num}
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-xs text-slate-400 hidden md:block">{step.desc}</p>
                  </div>
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                      >
                        <ChevronRight className="w-3 h-3 text-indigo-400" />
                      </div>
                    </div>
                  )}
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 relative z-10" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                <Star className="w-4 h-4" style={{ color: '#FBBF24' }} />
                <span className="text-sm" style={{ color: '#FBBF24' }}>用户评价</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">来自真实用户的反馈</h2>
              <p className="text-slate-400">听听他们是怎么评价 CrewForce 的</p>
            </div>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <FadeInSection key={index} delay={index * 100}>
                <div 
                  className="p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Quote className="w-8 h-8 mb-4" style={{ color: '#6366F1', opacity: 0.5 }} />
                  <p className="text-slate-300 mb-6 leading-relaxed">{testimonial.quote}</p>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                    >
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.author}</div>
                      <div className="text-sm text-slate-400">{testimonial.role} · {testimonial.company}</div>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <FadeInSection>
            <div 
              className="relative rounded-3xl overflow-hidden p-8 md:p-12 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              {/* Background glow */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.4) 0%, transparent 70%)'
                }}
              />
              
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">准备好开始了吗？</h2>
                <p className="text-slate-300 mb-8 max-w-xl mx-auto">加入成千上万的团队，开始使用 AI 智能体团队来提升开发效率</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    立即开始
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a
                    href="https://github.com/AlbertTon166/crew"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white transition-all duration-300 hover:scale-105 border border-slate-600 hover:border-slate-500"
                    style={{ background: 'rgba(30, 41, 59, 0.8)' }}
                  >
                    <Github className="w-5 h-5" />
                    查看 GitHub
                  </a>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 relative z-10" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
                }}
              >
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-white font-semibold">CrewForce</span>
                <p className="text-xs text-slate-500 mt-0.5">AI Agent Teams Orchestrator</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">文档</a>
              <a href="#" className="hover:text-white transition-colors">API</a>
              <a href="https://github.com/AlbertTon166/crew" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">联系</a>
            </div>
            
            <div className="text-sm text-slate-500">
              © 2026 CrewForce. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {loginOpen && <LoginModal isOpen={loginOpen} onClose={() => {
        setLoginOpen(false)
        navigate('/dashboard')
      }} />}
    </div>
  )
}
