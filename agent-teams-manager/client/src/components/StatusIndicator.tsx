import { useDeployMode } from '../context/DeployModeContext'
import { Wifi, WifiOff, Cloud, Server } from 'lucide-react'

export default function StatusIndicator() {
  const { isConnected, mode } = useDeployMode()

  if (!isConnected) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(248, 113, 113, 0.1)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#F87171',
        }}
      >
        <WifiOff size={14} />
        <span>未连接</span>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: mode === 'cloud' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(52, 211, 153, 0.1)',
        borderRadius: '8px',
        fontSize: '12px',
        color: mode === 'cloud' ? '#22D3EE' : '#34D399',
      }}
    >
      {mode === 'cloud' ? <Cloud size={14} /> : <Server size={14} />}
      <span>{mode === 'cloud' ? '云端模式' : '本地模式'}</span>
      <span style={{ opacity: 0.7 }}>•</span>
      <Wifi size={14} />
      <span>已连接</span>
    </div>
  )
}
