import { useState } from 'react'
import { 
  X, Globe, Palette, Info, Bot,
  Moon, Sun, Monitor
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SettingsSection {
  id: string
  title: string
  titleEn: string
  icon: React.ReactNode
}

const settingsSections: SettingsSection[] = [
  { id: 'appearance', title: '外观', titleEn: 'Appearance', icon: <Palette size={18} /> },
  { id: 'language', title: '语言', titleEn: 'Language', icon: <Globe size={18} /> },
  { id: 'about', title: '关于', titleEn: 'About', icon: <Info size={18} /> },
]

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { language, setLanguage } = useLanguage()
  const [activeSection, setActiveSection] = useState('appearance')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')

  if (!isOpen) return null

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          width: '90%',
          maxWidth: '720px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div style={{
          width: '200px',
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--border)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', padding: '0 8px' }}>
            {language === 'zh' ? '设置' : 'Settings'}
          </div>
          
          {settingsSections.map(section => {
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#6366F1' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  marginBottom: '4px',
                }}
              >
                <span style={{ color: isActive ? '#6366F1' : 'var(--text-tertiary)' }}>
                  {section.icon}
                </span>
                {language === 'zh' ? section.title : section.titleEn}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {settingsSections.find(s => s.id === activeSection)?.[language === 'zh' ? 'title' : 'titleEn']}
            </h2>
            <button 
              onClick={onClose}
              style={{
                width: '36px', height: '36px',
                borderRadius: '10px',
                background: 'var(--bg-tertiary)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
                  {language === 'zh' ? '主题' : 'Theme'}
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { id: 'light', icon: <Sun size={18} />, label: '浅色', labelEn: 'Light' },
                    { id: 'dark', icon: <Moon size={18} />, label: '深色', labelEn: 'Dark' },
                    { id: 'system', icon: <Monitor size={18} />, label: '跟随系统', labelEn: 'System' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as typeof theme)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '16px',
                        borderRadius: '12px',
                        border: theme === t.id ? '2px solid #6366F1' : '1px solid var(--border)',
                        background: theme === t.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)',
                        color: theme === t.id ? '#6366F1' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {t.icon}
                      <span style={{ fontSize: '12px', fontWeight: '500' }}>
                        {language === 'zh' ? t.label : t.labelEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Language */}
          {activeSection === 'language' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
                  {language === 'zh' ? '语言' : 'Language'}
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setLanguage('zh')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '14px',
                      borderRadius: '12px',
                      border: language === 'zh' ? '2px solid #6366F1' : '1px solid var(--border)',
                      background: language === 'zh' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)',
                      color: language === 'zh' ? '#6366F1' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    🇨🇳 中文
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '14px',
                      borderRadius: '12px',
                      border: language === 'en' ? '2px solid #6366F1' : '1px solid var(--border)',
                      background: language === 'en' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)',
                      color: language === 'en' ? '#6366F1' : 'var(--text-secondary)',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* About */}
          {activeSection === 'about' && (
            <div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '20px',
                background: 'var(--bg-tertiary)',
                borderRadius: '16px',
                marginBottom: '20px',
              }}>
                <div style={{
                  width: '64px', height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <Bot size={28} style={{ color: 'white' }} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  Crew
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>
                  AI Agent Teams Orchestrator
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '8px 0 0 0' }}>
                  {language === 'zh' ? '版本' : 'Version'} 2.2.0
                </p>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {[
                  { label: language === 'zh' ? 'GitHub' : 'GitHub', value: 'github.com/AlbertTon166/crew' },
                  { label: language === 'zh' ? '技术栈' : 'Tech Stack', value: 'React + Node.js + PostgreSQL' },
                  { label: language === 'zh' ? '许可证' : 'License', value: 'MIT' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '10px',
                  }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
