/**
 * Demo Banner
 * Shows demo mode indicator and load demo data button
 */

import { Eye, X, Loader2 } from 'lucide-react'
import { useDemo } from '../context/DemoContext'
import { useLanguage } from '../context/LanguageContext'

export default function DemoBanner() {
  const { isDemoMode, isLoading, error, loadDemoData, clearDemoData } = useDemo()
  const { language } = useLanguage()

  if (isDemoMode) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '13px',
          zIndex: 9999,
        }}
      >
        <Eye size={14} />
        <span>
          {language === 'zh' 
            ? '📊 演示模式 - 展示示例数据' 
            : '📊 Demo Mode - Showing Sample Data'}
        </span>
        <button
          onClick={clearDemoData}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          <X size={12} />
          {language === 'zh' ? '退出' : 'Exit'}
        </button>
      </div>
    )
  }

  // Only show banner for demo mode, not for logged-in users
  if (!isDemoMode) {
    return null
  }

  if (error) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '13px',
          zIndex: 9999,
        }}
      >
        <span>{error}</span>
        <button
          onClick={loadDemoData}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {language === 'zh' ? '重试' : 'Retry'}
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontSize: '13px',
        zIndex: 9999,
      }}
    >
      <Eye size={14} />
      <span>
        {language === 'zh' 
          ? '📊 Demo模式 - 展示示例数据' 
          : '📊 Demo Mode - Showing Sample Data'}
      </span>
      <button
        onClick={clearDemoData}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
        }}
      >
        <X size={12} />
        {language === 'zh' ? '退出' : 'Exit'}
      </button>
    </div>
  )
}
