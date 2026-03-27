/**
 * ExecutionLogsPanel
 * Displays task execution history and logs
 */

import { useState, useEffect } from 'react'
import { X, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Play, RotateCcw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getExecution, retryExecution, type ExecutionWithLogs, type ExecutionLog } from '../lib/executionApi'
import { logLevelConfig } from '../lib/executionApi'

interface ExecutionLogsPanelProps {
  executionId: string | null
  onClose: () => void
  language: 'en' | 'zh'
}

export default function ExecutionLogsPanel({ executionId, onClose, language }: ExecutionLogsPanelProps) {
  const [execution, setExecution] = useState<ExecutionWithLogs | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (executionId) {
      loadExecution(executionId)
    }
  }, [executionId])

  const loadExecution = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getExecution(id)
      setExecution(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async () => {
    if (!executionId) return
    setIsRetrying(true)
    try {
      const newExecution = await retryExecution(executionId)
      if (newExecution) {
        await loadExecution(newExecution.id)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsRetrying(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; bg: string; label: string }> = {
      running: { icon: Loader2, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', label: language === 'zh' ? '运行中' : 'Running' },
      completed: { icon: CheckCircle, color: '#34D399', bg: 'rgba(52, 211, 153, 0.1)', label: language === 'zh' ? '已完成' : 'Completed' },
      failed: { icon: XCircle, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', label: language === 'zh' ? '失败' : 'Failed' },
      cancelled: { icon: XCircle, color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', label: language === 'zh' ? '已取消' : 'Cancelled' },
    }
    return configs[status] || configs.running
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  if (!executionId) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '480px',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            {language === 'zh' ? '执行日志' : 'Execution Logs'}
          </h3>
          {execution && (
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
              {execution.task_title || execution.task_id}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => executionId && loadExecution(executionId)}
            disabled={isLoading}
            style={{
              background: 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
            <Loader2 size={24} className="animate-spin" />
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#EF4444', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {execution && (
          <>
            {/* Execution Summary */}
            <div
              style={{
                background: 'var(--bg-tertiary)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {(() => {
                    const cfg = getStatusConfig(execution.status)
                    const Icon = cfg.icon
                    return (
                      <>
                        <Icon size={16} style={{ color: cfg.color }} />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </>
                    )
                  })()}
                </div>
                {execution.status === 'failed' && (
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#3B82F6',
                      fontSize: '12px',
                      cursor: isRetrying ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <RotateCcw size={12} className={isRetrying ? 'animate-spin' : ''} />
                    {language === 'zh' ? '重试' : 'Retry'}
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {language === 'zh' ? '开始时间' : 'Started'}:
                  </span>
                  <span style={{ color: 'var(--text-primary)', marginLeft: '6px' }}>
                    {formatTime(execution.started_at)}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {language === 'zh' ? '耗时' : 'Duration'}:
                  </span>
                  <span style={{ color: 'var(--text-primary)', marginLeft: '6px' }}>
                    {formatDuration(execution.duration_ms)}
                  </span>
                </div>
              </div>

              {execution.error && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#EF4444',
                    fontFamily: 'monospace',
                  }}
                >
                  {execution.error}
                </div>
              )}
            </div>

            {/* Logs */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
                {language === 'zh' ? '日志' : 'Logs'}
              </h4>

              {execution.logs && execution.logs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {execution.logs.map((log) => {
                    const cfg = logLevelConfig[log.level] || logLevelConfig.info
                    return (
                      <div
                        key={log.id}
                        style={{
                          display: 'flex',
                          gap: '10px',
                          padding: '8px 10px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ color: 'var(--text-tertiary)', fontFamily: 'monospace', minWidth: '60px' }}>
                          {formatTime(log.created_at)}
                        </span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: cfg.bg,
                            color: cfg.color,
                            fontSize: '10px',
                            fontWeight: '600',
                          }}
                        >
                          {cfg.icon} {log.level.toUpperCase()}
                        </span>
                        <span style={{ color: 'var(--text-primary)', flex: 1, wordBreak: 'break-word' }}>
                          {log.message}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                  {language === 'zh' ? '暂无日志' : 'No logs yet'}
                </div>
              )}
            </div>
          </>
        )}

        {!isLoading && !execution && !error && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
            {language === 'zh' ? '未找到执行记录' : 'Execution not found'}
          </div>
        )}
      </div>
    </div>
  )
}
