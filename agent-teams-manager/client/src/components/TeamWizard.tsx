import { useState } from 'react'
import { 
  Users, CheckCircle, XCircle, AlertCircle, 
  ChevronRight, ChevronLeft, 
  Award, Shield, Clock,
  Sparkles
} from 'lucide-react'
import { ROLE_TEMPLATES, SKILL_TEMPLATES } from '../types/roles'
import { useLanguage } from '../context/LanguageContext'

interface TeamWizardProps {
  onComplete: (team: TeamComposition) => void
  onCancel: () => void
}

interface TeamComposition {
  roles: {
    roleId: string
    agentId?: string
    agentName?: string
    certified: boolean
    proofUrl?: string
  }[]
}

interface RoleSelection {
  roleId: string
  count: number
  agentId?: string
  agentName?: string
}

export default function TeamWizard({ onComplete, onCancel }: TeamWizardProps) {
  const { language } = useLanguage()
  const [step, setStep] = useState(1)
  const [selectedRoles, setSelectedRoles] = useState<RoleSelection[]>([])

  // Step 1: Select roles needed for the project
  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => {
      const exists = prev.find(r => r.roleId === roleId)
      if (exists) {
        return prev.filter(r => r.roleId !== roleId)
      }
      return [...prev, { roleId, count: 1 }]
    })
  }

  // Step 2: Assign agents to roles
  const assignAgent = (roleId: string, agentId: string, agentName: string) => {
    setSelectedRoles(prev => prev.map(r => 
      r.roleId === roleId ? { ...r, agentId, agentName } : r
    ))
  }

  // Step 3: Review and complete
  const handleComplete = () => {
    const team: TeamComposition = {
      roles: selectedRoles.map(r => ({
        roleId: r.roleId,
        agentId: r.agentId,
        agentName: r.agentName,
        certified: false, // 默认未认证
      }))
    }
    onComplete(team)
  }

  const getRoleById = (id: string) => ROLE_TEMPLATES.find(r => r.id === id)

  const selectedCount = selectedRoles.reduce((sum, r) => sum + r.count, 0)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        width: '800px',
        maxHeight: '90vh',
        background: 'var(--bg-secondary)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {language === 'zh' ? '团队组建向导' : 'Team Composition Wizard'}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {language === 'zh' ? 'Step ' : '步骤 '}{step} / 3
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XCircle size={18} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Progress */}
        <div style={{
          height: '4px',
          background: 'var(--bg-tertiary)',
        }}>
          <div style={{
            height: '100%',
            width: `${(step / 3) * 100}%`,
            background: 'linear-gradient(90deg, var(--primary), var(--accent-violet))',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Step 1: Select Roles */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                {language === 'zh' ? '选择需要的角色' : 'Select Required Roles'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {language === 'zh' 
                  ? '根据项目需求，选择需要的团队角色。可选择多个同一角色。'
                  : 'Select team roles based on project requirements. Multiple of the same role can be selected.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {ROLE_TEMPLATES.map(role => {
                  const isSelected = selectedRoles.some(r => r.roleId === role.id)
                  return (
                    <div
                      key={role.id}
                      onClick={() => handleRoleToggle(role.id)}
                      style={{
                        padding: '16px',
                        background: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-tertiary)',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '24px' }}>{role.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {language === 'zh' ? role.name : role.nameEn}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            {role.description}
                          </div>
                        </div>
                        {isSelected && <CheckCircle size={20} style={{ color: 'var(--primary)' }} />}
                      </div>
                      {/* Required Skills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                        {role.requiredSkills.filter(s => s.required).map(skill => {
                          const skillInfo = SKILL_TEMPLATES.find(s => s.id === skill.skillId)
                          return (
                            <span
                              key={skill.skillId}
                              style={{
                                padding: '2px 8px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '4px',
                                fontSize: '10px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {skillInfo?.name || skill.skillId}
                            </span>
                          )
                        })}
                      </div>
                      {/* Experience */}
                      {role.minExperience && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          <Clock size={12} />
                          <span>{language === 'zh' ? '最低' : 'Min'} {role.minExperience.years} {language === 'zh' ? '年经验' : 'years exp'}</span>
                          {role.minExperience.proofRequired && <Shield size={12} style={{ color: 'var(--warning)' }} />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Assign Agents */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                {language === 'zh' ? '为角色分配 Agent' : 'Assign Agents to Roles'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {language === 'zh' 
                  ? '从已创建的 Agent 中选择合适的分配到各个角色。'
                  : 'Select suitable agents from existing ones and assign them to roles.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedRoles.map(selection => {
                  const role = getRoleById(selection.roleId)
                  if (!role) return null
                  return (
                    <div
                      key={selection.roleId}
                      style={{
                        padding: '16px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '20px' }}>{role.icon}</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {language === 'zh' ? role.name : role.nameEn}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {language === 'zh' ? '需要' : 'Required' } {selection.count} {language === 'zh' ? '人' : 'person(s)'}
                        </span>
                      </div>
                      {/* Agent Selection */}
                      <select
                        value={selection.agentId || ''}
                        onChange={(e) => {
                          const agentName = e.target.options[e.target.selectedIndex]?.text || ''
                          assignAgent(selection.roleId, e.target.value, agentName)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">
                          {language === 'zh' ? '-- 选择 Agent --' : '-- Select Agent --'}
                        </option>
                        <option value="agent-1">Agent: 前端开发者 Alpha</option>
                        <option value="agent-2">Agent: 后端开发者 Beta</option>
                        <option value="agent-3">Agent: 测试专家 Gamma</option>
                      </select>
                      {/* Certification Status */}
                      {selection.agentId && (
                        <div style={{
                          marginTop: '12px',
                          padding: '12px',
                          background: 'var(--bg-secondary)',
                          borderRadius: '8px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Award size={16} style={{ color: 'var(--warning)' }} />
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {language === 'zh' ? '认证状态' : 'Certification Status'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {language === 'zh' 
                              ? '⚠️ 此 Agent 尚未认证。建议提供 GitHub/作品集链接以通过认证。'
                              : '⚠️ This Agent is not certified. Provide GitHub/portfolio link for verification.'}
                          </div>
                          <input
                            type="text"
                            placeholder={language === 'zh' ? '输入证明链接...' : 'Enter proof URL...'}
                            style={{
                              width: '100%',
                              marginTop: '8px',
                              padding: '8px 12px',
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                {language === 'zh' ? '团队预览' : 'Team Preview'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedRoles.map(selection => {
                  const role = getRoleById(selection.roleId)
                  if (!role) return null
                  const hasAgent = !!selection.agentId
                  return (
                    <div
                      key={selection.roleId}
                      style={{
                        padding: '16px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${hasAgent ? 'var(--success)' : 'var(--warning)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '24px' }}>{role.icon}</span>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                              {language === 'zh' ? role.name : role.nameEn}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {selection.agentName || (language === 'zh' ? '未分配' : 'Unassigned')}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {hasAgent ? (
                            <>
                              <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                              <span style={{ fontSize: '12px', color: 'var(--success)' }}>
                                {language === 'zh' ? '已分配' : 'Assigned'}
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={18} style={{ color: 'var(--warning)' }} />
                              <span style={{ fontSize: '12px', color: 'var(--warning)' }}>
                                {language === 'zh' ? '待分配' : 'Pending'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Responsibilities */}
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                          {language === 'zh' ? '职责' : 'Responsibilities'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {role.responsibilities.map((resp, i) => (
                            <span
                              key={i}
                              style={{
                                padding: '2px 8px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {resp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Summary */}
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <Users size={24} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {language === 'zh' ? '团队规模' : 'Team Size'}: {selectedCount} {language === 'zh' ? '人' : 'people'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {language === 'zh' 
                      ? `${selectedRoles.length} 个角色，${selectedRoles.filter(r => r.agentId).length} 个已分配`
                      : `${selectedRoles.length} roles, ${selectedRoles.filter(r => r.agentId).length} assigned`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} />
            {step > 1 ? (language === 'zh' ? '上一步' : 'Previous') : (language === 'zh' ? '取消' : 'Cancel')}
          </button>
          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleComplete()}
            disabled={step === 1 && selectedRoles.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: step === 1 && selectedRoles.length === 0 ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
              border: 'none',
              borderRadius: '8px',
              color: step === 1 && selectedRoles.length === 0 ? 'var(--text-tertiary)' : '#fff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: step === 1 && selectedRoles.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {step < 3 ? (language === 'zh' ? '下一步' : 'Next') : (language === 'zh' ? '完成' : 'Complete')}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
