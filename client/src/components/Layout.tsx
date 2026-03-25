import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import LoginModal from './LoginModal'
import { Menu, X, ArrowRight, ArrowLeft, Check, Sparkles, Lock, Globe } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Layout() {
  const { user, isAuthenticated } = useAuth()
  const { language, setLanguage } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [loginOpen, setLoginOpen] = useState(false)
  const [sidebarSettingsTab, setSidebarSettingsTab] = useState<string | undefined>()

  const tourSteps = [
    {
      title: '欢迎使用 Crew！',
      titleZh: '欢迎使用 Crew！',
      description: '这是一个智能项目管理助手，帮助您管理项目需求、智能体团队和知识库。',
      descriptionZh: '这是一个智能项目管理助手，帮助您管理项目需求、智能体团队和知识库。',
      target: null,
      position: 'center'
    },
    {
      title: '第一步：创建项目',
      titleZh: '第一步：创建项目',
      description: '在「项目管理」页面，点击右上角「新建项目」按钮创建一个新项目。',
      descriptionZh: '在「项目管理」页面，点击右上角「新建项目」按钮创建一个新项目。',
      target: '/projects',
      position: 'center'
    },
    {
      title: '第二步：添加需求',
      titleZh: '第二步：添加需求',
      description: '在「需求池」页面，选择您的项目，向AI助手描述您的需求。',
      descriptionZh: '在「需求池」页面，选择您的项目，向AI助手描述您的需求。',
      target: '/requirements',
      position: 'center'
    },
    {
      title: '第三步：智能评估',
      titleZh: '第三步：智能评估',
      description: '点击需求卡片上的「评估」按钮，AI会自动分析需求完整度。通过后项目自动移至「待开发」。',
      descriptionZh: '点击需求卡片上的「评估」按钮，AI会自动分析需求完整度。通过后项目自动移至「待开发」。',
      target: '/requirements',
      position: 'center'
    },
    {
      title: '第四步：分配智能体',
      titleZh: '第四步：分配智能体',
      description: '在「智能体」页面，为项目分配合适的AI智能体（前端、后端、测试等）。',
      descriptionZh: '在「智能体」页面，为项目分配合适的AI智能体（前端、后端、测试等）。',
      target: '/agents',
      position: 'center'
    },
    {
      title: '第五步：配置知识库',
      titleZh: '第五步：配置知识库',
      description: '在「知识库」页面，为智能体配置岗位模板，快速添加角色、技能和规范文档。',
      descriptionZh: '在「知识库」页面，为智能体配置岗位模板，快速添加角色、技能和规范文档。',
      target: '/knowledge',
      position: 'center'
    },
    {
      title: '第六步：开发流程',
      titleZh: '第六步：开发流程',
      description: '项目状态流转：待评估 → 待开发 → 开发中 → 待审核 → 完成',
      descriptionZh: '项目状态流转：待评估 → 待开发 → 开发中 → 待审核 → 完成',
      target: '/projects',
      position: 'center'
    },
    {
      title: '开始使用！',
      titleZh: '开始使用！',
      description: '恭喜您完成新手引导！现在开始创建您的第一个项目吧。',
      descriptionZh: '恭喜您完成新手引导！现在开始创建您的第一个项目吧。',
      target: '/projects',
      position: 'center'
    }
  ]

  const handleNext = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(tourStep + 1)
    } else {
      setTourOpen(false)
      setTourStep(0)
    }
  }

  const handlePrev = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1)
    }
  }

  const handleSkip = () => {
    setTourOpen(false)
    setTourStep(0)
  }

  const currentStep = tourSteps[tourStep]
  const isLastStep = tourStep === tourSteps.length - 1
  const isFirstStep = tourStep === 0

  return (
    <div 
      style={{ 
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 998,
          width: '48px',
          height: '48px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          color: 'var(--text-primary)',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)'
        }}
        className="mobile-menu-btn"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Tour Button - Desktop */}
      <button 
        onClick={() => setTourOpen(true)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '140px',
          zIndex: 997,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="tour-btn"
        title={tourSteps[0].title}
      >
        <Sparkles size={16} />
        <span>引导</span>
      </button>

      {/* Login/User Button */}
      {isAuthenticated ? (
        <button
          onClick={() => {
            setSidebarOpen(true)
            setSidebarSettingsTab('account')
          }}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 997,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className="user-btn"
        >
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: '#fff', fontWeight: '700' }}>{user?.username?.charAt(0).toUpperCase()}</span>
          </div>
          <span>{user?.username}</span>
        </button>
      ) : (
        <button
          onClick={() => setLoginOpen(true)}
          style={{
            position: 'fixed',
            top: '16px',
            right: '20px',
            zIndex: 997,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 16px var(--primary-glow)',
          }}
          className="login-btn"
        >
          <Lock size={14} />
          <span>登录</span>
        </button>
      )}

      {/* Overlay */}
      <div 
        onClick={() => setSidebarOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 997,
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Sidebar - Only show when authenticated */}
      {isAuthenticated && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} openSettingsTab={sidebarSettingsTab} />}

      {/* Lock Screen Overlay - Shown when not authenticated */}
      {!isAuthenticated && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            zIndex: 998,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              boxShadow: '0 8px 32px var(--primary-glow)',
            }}
          >
            <Lock size={36} style={{ color: '#fff' }} />
          </div>
          
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            Crew
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-tertiary)',
              marginBottom: '48px',
            }}
          >
            {language === 'zh' ? '智能项目管理助手' : 'Intelligent Project Management'}
          </p>

          {/* Login Button */}
          <button
            onClick={() => setLoginOpen(true)}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
              border: 'none',
              borderRadius: '14px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px var(--primary-glow)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Lock size={18} />
            {language === 'zh' ? '点击登录' : 'Click to Login'}
          </button>

          {/* Demo hint */}
          <p
            style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              marginTop: '24px',
            }}
          >
            {language === 'zh' ? '演示账号: admin / atm_sk_abc123def456xyz789' : 'Demo: admin / atm_sk_abc123def456xyz789'}
          </p>

          {/* Language Toggle - Bottom Left */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '24px',
              padding: '8px 14px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 999,
              transition: 'all 0.2s',
            }}
          >
            <Globe size={14} style={{ color: 'var(--text-secondary)' }} />
            {language === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
      )}

      {/* Main Content */}
      <main 
        style={{ 
          flex: 1,
          background: 'var(--bg-primary)',
          minHeight: '100vh',
          marginLeft: '280px',
          position: 'relative'
        }}
      >
        {/* Gradient orb decoration */}
        <div 
          style={{
            position: 'fixed',
            top: '-200px',
            right: '-200px',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: 0.5
          }}
        />
        
        {/* Secondary orb */}
        <div 
          style={{
            position: 'fixed',
            bottom: '-300px',
            left: '-200px',
            width: '800px',
            height: '800px',
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Outlet />
        </div>
      </main>

      {/* Tour Modal */}
      {tourOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            position: 'relative',
            animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Step indicator */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '24px'
            }}>
              {tourSteps.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: idx === tourStep ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '100px',
                    background: idx === tourStep 
                      ? 'linear-gradient(135deg, var(--primary), var(--accent-violet))' 
                      : idx < tourStep 
                        ? '#34D399' 
                        : 'var(--bg-tertiary)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              ))}
            </div>

            {/* Step number */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px var(--primary-glow)'
            }}>
              <span style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>{tourStep + 1}</span>
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              textAlign: 'center',
              marginBottom: '16px',
              fontFamily: 'Cabinet Grotesk'
            }}>
              {currentStep.title}
            </h2>

            {/* Description */}
            <p style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              lineHeight: '1.7',
              marginBottom: '32px'
            }}>
              {currentStep.description}
            </p>

            {/* Flow steps preview */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '32px',
              padding: '16px',
              background: 'var(--bg-primary)',
              borderRadius: '14px'
            }}>
              {['项目管理', '新建项目', '需求池', '待开发', '开发中', '待审核', '完成'].map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    background: idx === 1 && tourStep >= 1 
                      ? 'var(--primary)' 
                      : idx <= 1 && tourStep >= 1
                        ? 'rgba(52, 211, 153, 0.2)' 
                        : 'var(--bg-tertiary)',
                    color: idx === 1 && tourStep >= 1 ? '#fff' : 'var(--text-secondary)'
                  }}>
                    {step}
                  </span>
                  {idx < 6 && <ArrowRight size={12} style={{ color: 'var(--text-tertiary)' }} />}
                </div>
              ))}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <ArrowLeft size={16} />
                  上一步
                </button>
              )}
              <button
                onClick={handleNext}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  background: isLastStep 
                    ? 'linear-gradient(135deg, #34D399, #10B981)' 
                    : 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isLastStep 
                    ? '0 4px 16px rgba(52, 211, 153, 0.3)' 
                    : '0 4px 16px var(--primary-glow)'
                }}
              >
                {isLastStep ? (
                  <>
                    <Check size={16} />
                    开始使用
                  </>
                ) : (
                  <>
                    下一步
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {/* Skip button */}
            <button
              onClick={handleSkip}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '8px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile styles */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
          
          .tour-btn {
            top: 20px !important;
            right: 20px !important;
            padding: 8px 14px !important;
          }
          
          .tour-btn span {
            display: none;
          }
          
          main {
            margin-left: 0 !important;
            padding-top: 80px !important;
          }
        }
        
        @media (max-width: 1024px) {
          main {
            margin-left: 0 !important;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Login Modal */}
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
