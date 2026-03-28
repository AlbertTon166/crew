import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Sparkles, Users, Zap, ArrowRight, Github, Lock, Menu, X } from 'lucide-react'
import LoginModal from '../components/LoginModal'

export default function Landing() {
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(true) // 自动弹出登录
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: '多智能体协作',
      titleEn: 'Multi-Agent Collaboration',
      description: '支持产品经理、架构师、前端、后端、测试等多种角色的AI智能体协同工作',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: '智能需求分析',
      titleEn: 'Smart Requirements Analysis',
      description: 'AI自动分析需求完整度，提供改进建议，智能分配任务',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: '可视化工作流',
      titleEn: 'Visual Workflow',
      description: '直观的看板视图，实时追踪项目进度和智能体状态',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: '快速开发迭代',
      titleEn: 'Rapid Development',
      description: '自动化测试、代码审查、持续部署，大幅提升开发效率',
    },
  ]

  const steps = [
    { num: '01', title: '创建项目', desc: '输入项目需求和基本信息' },
    { num: '02', title: '添加需求', desc: '向AI描述您的业务需求' },
    { num: '03', title: '智能评估', desc: 'AI自动分析需求完整性' },
    { num: '04', title: '分配智能体', desc: '系统自动分配合适的AI角色' },
    { num: '05', title: '协同开发', desc: '多智能体并行工作，自动完成任务' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CrewForce</span>
              <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">v0.3</span>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-slate-300 hover:text-white transition"
              >
                功能特性
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-slate-300 hover:text-white transition"
              >
                工作流程
              </button>
              <button 
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Lock className="w-4 h-4" />
                登录
              </button>
            </div>

            <button 
              className="md:hidden text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 py-4 space-y-3">
            <button 
              onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}
              className="block w-full text-left text-slate-300 hover:text-white"
            >
              功能特性
            </button>
            <button 
              onClick={() => { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}
              className="block w-full text-left text-slate-300 hover:text-white"
            >
              工作流程
            </button>
            <button 
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg w-full justify-center"
            >
              <Lock className="w-4 h-4" />
              登录
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300">AI Agent Teams Orchestrator</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            让
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> AI智能体团队 </span>
            帮你开发
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
           CrewForce 是一个多智能体协作平台，让AI产品经理、架构师、开发者、测试员组成团队，
            像管理人类团队一样管理AI，共同完成软件项目。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setLoginOpen(true)}
              className="group flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition"
            >
              开始使用
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </button>
            <button
              onClick={() => navigate('/quickstart')}
              className="flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-white px-8 py-4 rounded-xl text-lg font-medium transition border border-slate-600"
            >
              快速入门
            </button>
          </div>

          {/* Demo hint */}
          <div className="mt-8 text-sm text-slate-500">
            点击"开始使用"登录后即可体验完整功能
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">为什么选择 CrewForce？</h2>
            <p className="text-slate-400">强大的功能，简洁的体验</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 hover:border-indigo-500/50 transition"
              >
                <div className="w-14 h-14 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 text-indigo-400">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">如何工作</h2>
            <p className="text-slate-400">5步完成项目开发</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-indigo-500/30 mb-3">{step.num}</div>
                  <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-400">{step.desc}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-700">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-medium">CrewForce</span>
          </div>
          <div className="text-sm text-slate-400">
            © 2026 Crew. AI Agent Teams Orchestrator.
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {loginOpen && <LoginModal onClose={() => {
        setLoginOpen(false)
        // 登录成功后跳转 Dashboard
        navigate('/dashboard')
      }} />}
    </div>
  )
}
