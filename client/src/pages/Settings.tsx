import { useState } from 'react'
import { 
  User, Bell, Shield, Key, Users, FileText, 
  ChevronRight, Save, Trash2, Copy, Check
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

const settingsTabs = [
  { id: 'account', label: '账户', labelEn: 'Account', icon: User, adminOnly: false },
  { id: 'notifications', label: '通知', labelEn: 'Notifications', icon: Bell, adminOnly: false },
  { id: 'security', label: '安全', labelEn: 'Security', icon: Shield, adminOnly: false },
  { id: 'tokens', label: '令牌', labelEn: 'Tokens', icon: Key, adminOnly: false },
  { id: 'users', label: '用户管理', labelEn: 'Users', icon: Users, adminOnly: true },
  { id: 'audit', label: '审计日志', labelEn: 'Audit Logs', icon: FileText, adminOnly: true },
]

export default function Settings() {
  const { language, setLanguage } = useLanguage()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('account')
  const [saved, setSaved] = useState(false)

  const isAdmin = (user as any)?.role === 'admin' || false
  const visibleTabs = settingsTabs.filter(tab => !tab.adminOnly || isAdmin)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
          {language === 'zh' ? '设置' : 'Settings'}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 }}>
          {language === 'zh' ? '管理您的账户和偏好设置' : 'Manage your account and preferences'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '32px' }}>
        {/* Left Tabs */}
        <div style={{
          width: '240px',
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid var(--border)',
          height: 'fit-content'
        }}>
          {visibleTabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#6366F1' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: '4px',
                }}
              >
                <Icon size={18} style={{ color: isActive ? '#6366F1' : 'var(--text-tertiary)' }} />
                {language === 'zh' ? tab.label : tab.labelEn}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid var(--border)',
        }}>
          {/* Account */}
          {activeTab === 'account' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
                {language === 'zh' ? '个人资料' : 'Account'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    {language === 'zh' ? '邮箱' : 'Email'}
                  </label>
                  <input 
                    type="email" 
                    defaultValue={(user as any)?.email || 'user@example.com'}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    {language === 'zh' ? '显示名称' : 'Display Name'}
                  </label>
                  <input 
                    type="text" 
                    defaultValue={(user as any)?.name || '用户'}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    {language === 'zh' ? '时区' : 'Timezone'}
                  </label>
                  <select 
                    defaultValue="Asia/Shanghai"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  >
                    <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                    <option value="Europe/London">Europe/London (UTC+0)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
                {language === 'zh' ? '通知设置' : 'Notifications'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                {[
                  { id: 'email', label: '邮件通知', labelEn: 'Email Notifications' },
                  { id: 'push', label: '推送通知', labelEn: 'Push Notifications' },
                  { id: 'project', label: '项目更新', labelEn: 'Project Updates' },
                  { id: 'agent', label: 'Agent 状态变更', labelEn: 'Agent Status Changes' },
                ].map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <div style={{
                      width: '44px', height: '24px',
                      borderRadius: '12px',
                      background: item.id === 'email' ? '#6366F1' : 'var(--bg-tertiary)',
                      position: 'relative',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{
                        width: '20px', height: '20px',
                        borderRadius: '50%',
                        background: 'white',
                        position: 'absolute',
                        top: '2px',
                        left: item.id === 'email' ? '22px' : '2px',
                        transition: 'all 0.2s',
                      }} />
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {language === 'zh' ? item.label : item.labelEn}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
                {language === 'zh' ? '安全设置' : 'Security'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px' }}>
                <div style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    {language === 'zh' ? '修改密码' : 'Change Password'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input 
                      type="password" 
                      placeholder={language === 'zh' ? '当前密码' : 'Current Password'}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                      }}
                    />
                    <input 
                      type="password" 
                      placeholder={language === 'zh' ? '新密码' : 'New Password'}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                      }}
                    />
                    <button style={{
                      padding: '12px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#6366F1',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}>
                      {language === 'zh' ? '更新密码' : 'Update Password'}
                    </button>
                  </div>
                </div>
                <div style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
                    {language === 'zh' ? '两步验证' : 'Two-Factor Auth'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                    {language === 'zh' ? '启用两步验证提高账户安全性' : 'Enable 2FA for enhanced account security'}
                  </p>
                  <button style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}>
                    {language === 'zh' ? '启用 2FA' : 'Enable 2FA'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tokens */}
          {activeTab === 'tokens' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
                {language === 'zh' ? 'API 令牌' : 'API Tokens'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '1px dashed var(--border)',
                  background: 'transparent',
                  color: '#6366F1',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: 'fit-content',
                }}>
                  + {language === 'zh' ? '创建新令牌' : 'Create New Token'}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {[
                    { name: 'Production Key', created: '2026-03-20', last: '2 hours ago' },
                    { name: 'Development Key', created: '2026-03-15', last: '3 days ago' },
                  ].map((token, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '12px',
                    }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{token.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                          {language === 'zh' ? '创建于' : 'Created'} {token.created} · {language === 'zh' ? '最后使用' : 'Last used'} {token.last}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}>
                          <Copy size={14} />
                        </button>
                        <button style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #EF4444',
                          background: 'transparent',
                          color: '#EF4444',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users (Admin Only) */}
          {activeTab === 'users' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
                {language === 'zh' ? '用户管理' : 'User Management'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '1px dashed var(--border)',
                  background: 'transparent',
                  color: '#6366F1',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: 'fit-content',
                }}>
                  + {language === 'zh' ? '邀请用户' : 'Invite User'}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  {[
                    { name: 'Admin User', email: 'admin@crew.ai', role: 'Admin', status: 'Active' },
                    { name: 'Developer', email: 'dev@crew.ai', role: 'Member', status: 'Active' },
                    { name: 'Guest', email: 'guest@crew.ai', role: 'Viewer', status: 'Pending' },
                  ].map((u, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '14px',
                        }}>
                          {u.name[0]}
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', margin: '0 0 2px 0' }}>{u.name}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>{u.email}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: u.role === 'Admin' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                          color: u.role === 'Admin' ? '#6366F1' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}>
                          {u.role}
                        </span>
                        <span style={{
                          width: '8px', height: '8px',
                          borderRadius: '50%',
                          background: u.status === 'Active' ? '#22C55E' : '#EAB308',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs (Admin Only) */}
          {activeTab === 'audit' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
                {language === 'zh' ? '审计日志' : 'Audit Logs'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { action: 'User invited', user: 'admin@crew.ai', time: '2 hours ago' },
                  { action: 'API token created', user: 'dev@crew.ai', time: '5 hours ago' },
                  { action: 'Password changed', user: 'admin@crew.ai', time: '1 day ago' },
                  { action: 'User role updated', user: 'admin@crew.ai', time: '2 days ago' },
                ].map((log, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={16} style={{ color: 'var(--text-tertiary)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{log.action}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{log.user}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '10px',
                border: 'none',
                background: saved ? '#22C55E' : '#6366F1',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Save size={16} />
              {saved ? (language === 'zh' ? '已保存' : 'Saved') : (language === 'zh' ? '保存更改' : 'Save Changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
