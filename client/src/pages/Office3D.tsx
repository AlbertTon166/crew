/**
 * Office3D - 3D 可视化 Agent 工作空间
 * 使用 Three.js + React Three Fiber
 */

import { useState, Suspense, useRef } from 'react'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, Environment, ContactShadows, Float } from '@react-three/drei'
import { X, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Users, Bot, Activity } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useDashboardStore } from '../stores/dashboardStore'
import * as THREE from 'three'

// Agent 类型
interface Agent3D {
  id: string
  name: string
  role: string
  status: 'online' | 'idle' | 'busy' | 'thinking' | 'error' | 'offline'
  color: string
  position: [number, number, number]
}

// Agent 颜色配置
const agentColors: Record<string, string> = {
  pm: '#8B5CF6',      // 紫色
  planner: '#3B82F6', // 蓝色
  coder: '#10B981',   // 绿色
  reviewer: '#F59E0B', // 黄色
  tester: '#EF4444',   // 红色
  deployer: '#06B6D4', // 青色
  default: '#64748B',
}

// Agent 位置布局
const agentLayout: Agent3D[] = [
  { id: '1', name: 'PM Agent', role: 'pm', status: 'online', color: agentColors.pm, position: [-3, 0, 0] },
  { id: '2', name: 'Planner', role: 'planner', status: 'busy', color: agentColors.planner, position: [-1, 0, 1] },
  { id: '3', name: 'Coder', role: 'coder', status: 'thinking', color: agentColors.coder, position: [1, 0, 1] },
  { id: '4', name: 'Reviewer', role: 'reviewer', status: 'idle', color: agentColors.reviewer, position: [3, 0, 0] },
  { id: '5', name: 'Tester', role: 'tester', status: 'offline', color: agentColors.tester, position: [-2, 0, -1] },
  { id: '6', name: 'Deployer', role: 'deployer', status: 'online', color: agentColors.deployer, position: [2, 0, -1] },
]

// 状态动画颜色
const statusColors: Record<string, string> = {
  online: '#34D399',
  idle: '#64748B',
  busy: '#FBBF24',
  thinking: '#8B5CF6',
  error: '#EF4444',
  offline: '#334155',
}

// Agent 3D 化身组件
function AgentAvatar({ agent, onClick }: { agent: Agent3D; onClick: (agent: Agent3D) => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // 状态动画
  useFrame((state) => {
    if (meshRef.current) {
      // 思考状态 - 上下浮动
      if (agent.status === 'thinking') {
        meshRef.current.position.y = agent.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
      }
      // 忙碌状态 - 轻微旋转
      else if (agent.status === 'busy') {
        meshRef.current.rotation.y += 0.02
      }
      // 其他状态保持静止
      else {
        meshRef.current.position.y = agent.position[1]
      }
    }
  })

  return (
    <group position={agent.position}>
      {/* 身体 - 圆柱体 */}
      <mesh
        ref={meshRef}
        onClick={() => onClick(agent)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.4, 0.5, 1.2, 16]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : agent.color}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* 头部 - 球体 */}
      <mesh position={[0, 0.9, 0]} onClick={() => onClick(agent)}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : agent.color}
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>

      {/* 状态指示灯 */}
      <mesh position={[0, 1.4, 0.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color={statusColors[agent.status]}
          emissive={statusColors[agent.status]}
          emissiveIntensity={agent.status === 'online' ? 2 : 0.5}
        />
      </mesh>

      {/* 名字标签 */}
      <Html position={[0, -0.8, 0]} center>
        <div
          style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {agent.name}
        </div>
      </Html>
    </group>
  )
}

// 地板组件
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.9} />
    </mesh>
  )
}

// 办公室墙壁
function Walls() {
  return (
    <group>
      {/* 后墙 */}
      <mesh position={[0, 1.5, -4]}>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial color="#16213e" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* 左墙 */}
      <mesh position={[-6, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* 右墙 */}
      <mesh position={[6, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.9} />
      </mesh>
    </group>
  )
}

// 桌子组件
function Desk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* 桌面 */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.1, 0.8]} />
        <meshStandardMaterial color="#4a4a6a" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* 桌腿 */}
      {[[-0.6, -0.5, -0.3], [0.6, -0.5, -0.3], [-0.6, -0.5, 0.3], [0.6, -0.5, 0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
          <meshStandardMaterial color="#3a3a5a" metalness={0.3} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// 3D 场景
function Scene({ onAgentClick }: { onAgentClick: (agent: Agent3D) => void }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={50} />
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} maxPolarAngle={Math.PI / 2.2} />

      {/* 灯光 */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#8B5CF6" />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#3B82F6" />

      {/* 环境 */}
      <Environment preset="city" />

      {/* 地板和墙壁 */}
      <Floor />
      <Walls />

      {/* 桌子 */}
      <Desk position={[-3, 0, 0]} />
      <Desk position={[3, 0, 0]} />
      <Desk position={[0, 0, 1.5]} />

      {/* Agent 化身 */}
      {agentLayout.map((agent) => (
        <AgentAvatar key={agent.id} agent={agent} onClick={onAgentClick} />
      ))}

      {/* 阴影 */}
      <ContactShadows position={[0, -0.49, 0]} opacity={0.4} scale={20} blur={2} />
    </>
  )
}

// Agent 详情弹窗
function AgentDetailModal({ agent, onClose, language }: { agent: Agent3D; onClose: () => void; language: 'en' | 'zh' }) {
  const statusLabels: Record<string, { en: string; zh: string }> = {
    online: { en: 'Online', zh: '在线' },
    idle: { en: 'Idle', zh: '空闲' },
    busy: { en: 'Busy', zh: '忙碌' },
    thinking: { en: 'Thinking', zh: '思考中' },
    error: { en: 'Error', zh: '异常' },
    offline: { en: 'Offline', zh: '离线' },
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          padding: '24px',
          width: '320px',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${agent.color}, ${agent.color}88)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            <Bot size={28} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{agent.name}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
              {agent.role}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: statusColors[agent.status],
            }}
          />
          <span style={{ fontSize: '13px', color: statusColors[agent.status] }}>
            {statusLabels[agent.status][language === 'zh' ? 'zh' : 'en']}
          </span>
        </div>

        <div
          style={{
            background: 'var(--bg-tertiary)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
            {language === 'zh' ? '角色' : 'Role'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {agent.role}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--bg-tertiary)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {language === 'zh' ? '关闭' : 'Close'}
        </button>
      </div>
    </div>
  )
}

// 主组件
export default function Office3D() {
  const { language } = useLanguage()
  const { agents: storeAgents } = useDashboardStore()
  const [selectedAgent, setSelectedAgent] = useState<Agent3D | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHelp, setShowHelp] = useState(true)

  const handleAgentClick = (agent: Agent3D) => {
    setSelectedAgent(agent)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a14',
        zIndex: 900,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={24} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'white' }}>
              3D Office
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              {language === 'zh' ? '可视化 Agent 工作空间' : 'Visual Agent Workspace'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              padding: '8px 12px',
              background: showHelp ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {language === 'zh' ? '帮助' : 'Help'}
          </button>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            right: '24px',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '12px',
            padding: '16px',
            zIndex: 10,
            minWidth: '200px',
          }}
        >
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'white' }}>
            {language === 'zh' ? '操作说明' : 'Controls'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
            <div>🖱️ {language === 'zh' ? '拖拽旋转视角' : 'Drag to rotate'}</div>
            <div>🔍 {language === 'zh' ? '滚轮缩放' : 'Scroll to zoom'}</div>
            <div>👆 {language === 'zh' ? '点击 Agent 查看详情' : 'Click agent for details'}</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          display: 'flex',
          gap: '16px',
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Users size={16} color="#8B5CF6" />
          <span style={{ fontSize: '12px', color: 'white' }}>
            {agentLayout.length} {language === 'zh' ? 'Agents' : 'Agents'}
          </span>
        </div>
        <div
          style={{
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Activity size={16} color="#34D399" />
          <span style={{ fontSize: '12px', color: 'white' }}>
            {agentLayout.filter((a) => a.status === 'online').length} {language === 'zh' ? '在线' : 'Online'}
          </span>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene onAgentClick={handleAgentClick} />
        </Suspense>
      </Canvas>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          language={language}
        />
      )}
    </div>
  )
}
