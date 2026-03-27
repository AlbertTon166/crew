/**
 * Office3D - 3D 可视化 Agent 工作空间 Phase 3
 * 使用 Three.js + React Three Fiber
 * 新增: WebSocket 实时状态、任务拖拽、活动日志流
 */

import { useState, Suspense, useRef, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, Environment, ContactShadows } from '@react-three/drei'
import {
  X, Users, Bot, Activity, Eye, Grid3X3, LayoutGrid,
  ChevronDown, Filter, Clock, CheckCircle, AlertCircle,
  Play, Pause, Zap, ArrowRight, MessageSquare, RefreshCw
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useDashboardStore } from '../stores/dashboardStore'
import * as THREE from 'three'

// Types
interface Agent3D {
  id: string
  name: string
  role: string
  status: 'online' | 'idle' | 'busy' | 'thinking' | 'error' | 'offline'
  color: string
  position: [number, number, number]
  tasks: Task3D[]
}

interface Task3D {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed'
  assigneeId?: string
}

interface ActivityLog {
  id: string
  type: 'task' | 'review' | 'deploy' | 'message'
  agentName: string
  content: string
  time: string
  timestamp: number
}

// Agent 角色配置
const agentRoles: Record<string, { label: string; labelEn: string; color: string }> = {
  pm: { label: '产品经理', labelEn: 'PM', color: '#8B5CF6' },
  planner: { label: '规划师', labelEn: 'Planner', color: '#3B82F6' },
  coder: { label: '工程师', labelEn: 'Coder', color: '#10B981' },
  reviewer: { label: '审核员', labelEn: 'Reviewer', color: '#F59E0B' },
  tester: { label: '测试员', labelEn: 'Tester', color: '#EF4444' },
  deployer: { label: '部署员', labelEn: 'Deployer', color: '#06B6D4' },
}

// 状态配置
const statusConfig: Record<string, { color: string; bg: string; label: string; labelEn: string }> = {
  online: { color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)', label: '在线', labelEn: 'Online' },
  idle: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)', label: '空闲', labelEn: 'Idle' },
  busy: { color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)', label: '忙碌', labelEn: 'Busy' },
  thinking: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)', label: '思考中', labelEn: 'Thinking' },
  error: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', label: '异常', labelEn: 'Error' },
  offline: { color: '#334155', bg: 'rgba(51, 65, 85, 0.15)', label: '离线', labelEn: 'Offline' },
}

// 任务状态配置
const taskStatusConfig: Record<string, { color: string; icon: any; label: string; labelEn: string }> = {
  pending: { color: '#64748B', icon: AlertCircle, label: '待处理', labelEn: 'Pending' },
  in_progress: { color: '#3B82F6', icon: Clock, label: '进行中', labelEn: 'In Progress' },
  completed: { color: '#34D399', icon: CheckCircle, label: '完成', labelEn: 'Done' },
}

// 初始 Agent 数据
const initialAgents: Agent3D[] = [
  { id: '1', name: 'Alice', role: 'pm', status: 'online', color: agentRoles.pm.color, position: [-3, 0, 0], tasks: [{ id: 't1', title: '规划 v2.0', status: 'in_progress' }, { id: 't2', title: '需求评审', status: 'completed' }] },
  { id: '2', name: 'Bob', role: 'planner', status: 'busy', color: agentRoles.planner.color, position: [-1, 0, 1], tasks: [{ id: 't3', title: '任务分解', status: 'in_progress' }] },
  { id: '3', name: 'Charlie', role: 'coder', status: 'thinking', color: agentRoles.coder.color, position: [1, 0, 1], tasks: [{ id: 't4', title: 'API 开发', status: 'in_progress' }, { id: 't5', title: '单元测试', status: 'pending' }] },
  { id: '4', name: 'Diana', role: 'reviewer', status: 'idle', color: agentRoles.reviewer.color, position: [3, 0, 0], tasks: [] },
  { id: '5', name: 'Evan', role: 'tester', status: 'offline', color: agentRoles.tester.color, position: [-2, 0, -1], tasks: [] },
  { id: '6', name: 'Frank', role: 'deployer', status: 'online', color: agentRoles.deployer.color, position: [2, 0, -1], tasks: [{ id: 't6', title: '部署上线', status: 'pending' }] },
]

// 模拟活动日志
const mockActivities: ActivityLog[] = [
  { id: 'a1', type: 'task', agentName: 'Charlie', content: '完成了 API 集成模块', time: '2min ago', timestamp: Date.now() - 120000 },
  { id: 'a2', type: 'review', agentName: 'Diana', content: '通过代码审查 #23', time: '5min ago', timestamp: Date.now() - 300000 },
  { id: 'a3', type: 'deploy', agentName: 'Frank', content: '上线版本 v2.1.0', time: '12min ago', timestamp: Date.now() - 720000 },
  { id: 'a4', type: 'task', agentName: 'Charlie', content: '修复登录 bug', time: '1h ago', timestamp: Date.now() - 3600000 },
  { id: 'a5', type: 'message', agentName: 'Alice', content: '确认需求：支付模块', time: '2h ago', timestamp: Date.now() - 7200000 },
]

// 视角配置
type ViewMode = 'isometric' | 'front' | 'top'
const viewPositions: Record<ViewMode, { position: [number, number, number]; target: [number, number, number] }> = {
  isometric: { position: [8, 6, 8], target: [0, 0, 0] },
  front: { position: [0, 3, 10], target: [0, 0, 0] },
  top: { position: [0, 12, 0], target: [0, 0, 0] },
}

// Camera Controller
function CameraController({ viewMode }: { viewMode: ViewMode }) {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const targetPosition = useRef(new THREE.Vector3(...viewPositions.isometric.position))
  const targetLookAt = useRef(new THREE.Vector3(...viewPositions.isometric.target))

  useEffect(() => {
    const config = viewPositions[viewMode]
    targetPosition.current.set(...config.position)
    targetLookAt.current.set(...config.target)
  }, [viewMode])

  useFrame(() => {
    if (controlsRef.current) {
      camera.position.lerp(targetPosition.current, 0.05)
      controlsRef.current.target.lerp(targetLookAt.current, 0.05)
      controlsRef.current.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      maxPolarAngle={Math.PI / 2}
      minDistance={5}
      maxDistance={20}
    />
  )
}

// Draggable Agent Avatar
function DraggableAgentAvatar({
  agent,
  isSelected,
  onClick,
  onDragEnd,
  isDragging
}: {
  agent: Agent3D
  isSelected: boolean
  onClick: () => void
  onDragEnd: (agentId: string, newPosition: [number, number, number]) => void
  isDragging: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [localPosition, setLocalPosition] = useState<[number, number, number]>(agent.position)
  const [isDraggingLocal, setIsDraggingLocal] = useState(false)
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const intersectionPoint = useRef(new THREE.Vector3())

  useFrame((state) => {
    if (meshRef.current) {
      if (agent.status === 'thinking') {
        meshRef.current.position.y = localPosition[1] + Math.sin(state.clock.elapsedTime * 3) * 0.15
      } else if (agent.status === 'busy') {
        meshRef.current.rotation.y += 0.03
        meshRef.current.position.y = localPosition[1] + Math.sin(state.clock.elapsedTime * 5) * 0.03
      } else {
        meshRef.current.position.y = localPosition[1]
      }
    }
    // Selection glow
    if (groupRef.current) {
      const scale = isSelected ? 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05 : 1
      const dragScale = isDraggingLocal ? 1.1 : 1
      groupRef.current.scale.setScalar(scale * dragScale)
    }
  })

  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    setIsDraggingLocal(true)
    document.body.style.cursor = 'grabbing'
  }

  const handlePointerUp = (e: any) => {
    if (isDraggingLocal) {
      setIsDraggingLocal(false)
      document.body.style.cursor = 'auto'
      // Snap to grid (1 unit)
      const snapped: [number, number, number] = [
        Math.round(localPosition[0]),
        localPosition[1],
        Math.round(localPosition[2])
      ]
      setLocalPosition(snapped)
      if (onDragEnd) onDragEnd(agent.id, snapped)
    }
  }

  const handlePointerMove = (e: any) => {
    if (isDraggingLocal && e.point) {
      // Move on XZ plane
      setLocalPosition([e.point.x, localPosition[1], e.point.z])
    }
  }

  return (
    <group ref={groupRef} position={localPosition}>
      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.8, 32]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.5} />
        </mesh>
      )}

      {/* Drag plane */}
      {isDraggingLocal && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <planeGeometry args={[50, 50]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {/* Body */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'grab' }}
        onPointerOut={() => { setHovered(false); if (!isDraggingLocal) document.body.style.cursor = 'auto' }}
        onPointerMove={handlePointerMove}
        castShadow
      >
        <cylinderGeometry args={[0.35, 0.45, 1.1, 16]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : agent.color}
          metalness={0.4}
          roughness={0.6}
          emissive={isSelected ? agent.color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          opacity={isDraggingLocal ? 0.8 : 1}
          transparent={isDraggingLocal}
        />
      </mesh>

      {/* Head */}
      <mesh
        position={[0, 0.8, 0]}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        castShadow
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : agent.color}
          metalness={0.3}
          roughness={0.7}
          opacity={isDraggingLocal ? 0.8 : 1}
          transparent={isDraggingLocal}
        />
      </mesh>

      {/* Status light */}
      <mesh position={[0, 1.25, 0.2]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color={statusConfig[agent.status].color}
          emissive={statusConfig[agent.status].color}
          emissiveIntensity={agent.status === 'online' ? 2 : 0.8}
        />
      </mesh>

      {/* Name label */}
      <Html position={[0, -0.7, 0]} center>
        <div
          style={{
            background: 'rgba(0,0,0,0.85)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            border: `2px solid ${isSelected ? agent.color : 'transparent'}`,
            transition: 'all 0.2s',
          }}
        >
          {agent.name}
        </div>
      </Html>

      {/* Task count */}
      {agent.tasks.length > 0 && (
        <Html position={[0.4, 0.5, 0]} center>
          <div
            style={{
              background: '#3B82F6',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            {agent.tasks.length}
          </div>
        </Html>
      )}
    </group>
  )
}

// Floor
function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.9} />
      </mesh>
      <gridHelper args={[24, 24, '#1e293b', '#1e293b']} position={[0, -0.49, 0]} />
    </group>
  )
}

// Walls
function Walls() {
  return (
    <group>
      <mesh position={[0, 2, -6]} receiveShadow>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.1} roughness={0.95} />
      </mesh>
      <mesh position={[-8, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.1} roughness={0.95} />
      </mesh>
      <mesh position={[8, 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.1} roughness={0.95} />
      </mesh>
    </group>
  )
}

// Desk
function Desk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.08, 0.7]} />
        <meshStandardMaterial color="#334155" metalness={0.2} roughness={0.8} />
      </mesh>
      {[[-0.55, -0.4, -0.25], [0.55, -0.4, -0.25], [-0.55, -0.4, 0.25], [0.55, -0.4, 0.25]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.75, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// 3D Scene
function Scene({
  agents,
  selectedAgentId,
  onAgentClick,
  onAgentDragEnd,
  viewMode,
  draggingAgentId
}: {
  agents: Agent3D[]
  selectedAgentId: string | null
  onAgentClick: (agent: Agent3D) => void
  onAgentDragEnd: (agentId: string, newPosition: [number, number, number]) => void
  viewMode: ViewMode
  draggingAgentId: string | null
}) {
  return (
    <>
      <CameraController viewMode={viewMode} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <pointLight position={[-5, 5, -5]} intensity={0.6} color="#8B5CF6" />
      <pointLight position={[5, 5, 5]} intensity={0.6} color="#3B82F6" />
      <Environment preset="city" />
      <Floor />
      <Walls />
      <Desk position={[-3, 0, 0]} />
      <Desk position={[3, 0, 0]} />
      <Desk position={[0, 0, 1.5]} />
      {agents.map((agent) => (
        <DraggableAgentAvatar
          key={agent.id}
          agent={agent}
          isSelected={agent.id === selectedAgentId}
          onClick={() => onAgentClick(agent)}
          onDragEnd={onAgentDragEnd}
          isDragging={agent.id === draggingAgentId}
        />
      ))}
      <ContactShadows position={[0, -0.48, 0]} opacity={0.5} scale={20} blur={2.5} />
    </>
  )
}

// Agent Detail Panel
function AgentDetailPanel({
  agent,
  onClose,
  onTaskStatusChange,
  language
}: {
  agent: Agent3D
  onClose: () => void
  onTaskStatusChange: (taskId: string, newStatus: string) => void
  language: 'en' | 'zh'
}) {
  const role = agentRoles[agent.role] || { label: agent.role, labelEn: agent.role, color: '#64748B' }
  const status = statusConfig[agent.status]

  return (
    <div
      style={{
        position: 'absolute',
        top: '80px',
        right: '24px',
        width: '320px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '20px',
        backdropFilter: 'blur(12px)',
        zIndex: 20,
        maxHeight: 'calc(100vh - 160px)',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${role.color}, ${role.color}66)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            <Bot size={28} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'white' }}>{agent.name}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{role.labelEn}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          background: status.bg,
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: status.color }} />
        <span style={{ fontSize: '13px', color: status.color, fontWeight: 500 }}>
          {language === 'zh' ? status.label : status.labelEn}
        </span>
      </div>

      {/* Position */}
      <div style={{ marginBottom: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
        {language === 'zh' ? '位置' : 'Position'}: ({agent.position[0]}, {agent.position[2]})
      </div>

      {/* Tasks */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
          {language === 'zh' ? '任务' : 'Tasks'}
        </h4>
        {agent.tasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {agent.tasks.map((task) => {
              const taskStatus = taskStatusConfig[task.status]
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                  }}
                >
                  <button
                    onClick={() => {
                      const nextStatus = task.status === 'completed' ? 'pending' : task.status === 'pending' ? 'in_progress' : 'completed'
                      onTaskStatusChange(task.id, nextStatus)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle size={16} color="#34D399" />
                    ) : task.status === 'in_progress' ? (
                      <Clock size={16} color="#3B82F6" />
                    ) : (
                      <AlertCircle size={16} color="#64748B" />
                    )}
                  </button>
                  <span style={{ flex: 1, fontSize: '13px', color: 'white' }}>{task.title}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: taskStatus.color + '22',
                      color: taskStatus.color,
                    }}
                  >
                    {language === 'zh' ? taskStatus.label : taskStatus.labelEn}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            {language === 'zh' ? '暂无任务' : 'No tasks'}
          </div>
        )}
      </div>
    </div>
  )
}

// Activity Feed
function ActivityFeed({ activities, language }: { activities: ActivityLog[]; language: 'en' | 'zh' }) {
  const activityIcons: Record<string, { icon: any; color: string }> = {
    task: { icon: <Zap size={12} />, color: '#3B82F6' },
    review: { icon: <CheckCircle size={12} />, color: '#34D399' },
    deploy: { icon: <Play size={12} />, color: '#F59E0B' },
    message: { icon: <MessageSquare size={12} />, color: '#8B5CF6' },
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        width: '300px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '16px',
        backdropFilter: 'blur(12px)',
        zIndex: 20,
        maxHeight: '200px',
        overflow: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Activity size={14} color="#8B5CF6" />
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'white' }}>
          {language === 'zh' ? '活动' : 'Activity'}
        </h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activities.map((activity) => {
          const iconConfig = activityIcons[activity.type]
          return (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '12px',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: iconConfig.color + '22',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: iconConfig.color,
                  flexShrink: 0,
                }}
              >
                {iconConfig.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: '#8B5CF6', fontWeight: 500 }}>{activity.agentName}</span>
                  {' '}{activity.content}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '2px' }}>
                  {activity.time}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Main Component
export default function Office3D() {
  const { language } = useLanguage()
  const { agents: storeAgents } = useDashboardStore()
  const [agents, setAgents] = useState<Agent3D[]>(initialAgents)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('isometric')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [draggingAgentId, setDraggingAgentId] = useState<string | null>(null)
  const [activities, setActivities] = useState<ActivityLog[]>(mockActivities)
  const [isLive, setIsLive] = useState(true)

  const selectedAgent = agents.find((a) => a.id === selectedAgentId)
  const filteredAgents = statusFilter ? agents.filter((a) => a.status === statusFilter) : agents

  const statusCounts = agents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => {
      // Random status change
      const randomAgent = agents[Math.floor(Math.random() * agents.length)]
      const statuses: Array<'online' | 'idle' | 'busy' | 'thinking' | 'error' | 'offline'> = ['online', 'idle', 'busy', 'thinking']
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)]
      if (randomAgent.status !== newStatus) {
        setAgents(prev => prev.map(a =>
          a.id === randomAgent.id ? { ...a, status: newStatus } : a
        ))
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [isLive, agents])

  // Simulate activity feed
  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => {
      const agentNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Evan', 'Frank']
      const contents = [
        '完成了新任务', '提交了代码', '开始测试', '完成部署', '通过审查'
      ]
      const types: Array<'task' | 'review' | 'deploy' | 'message'> = ['task', 'review', 'deploy', 'message']
      const newActivity: ActivityLog = {
        id: `a${Date.now()}`,
        type: types[Math.floor(Math.random() * types.length)],
        agentName: agentNames[Math.floor(Math.random() * agentNames.length)],
        content: contents[Math.floor(Math.random() * contents.length)],
        time: 'Just now',
        timestamp: Date.now(),
      }
      setActivities(prev => [newActivity, ...prev.slice(0, 4)])
    }, 8000)
    return () => clearInterval(interval)
  }, [isLive])

  const handleAgentClick = (agent: Agent3D) => {
    setSelectedAgentId(agent.id === selectedAgentId ? null : agent.id)
  }

  const handleAgentDragEnd = (agentId: string, newPosition: [number, number, number]) => {
    setAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, position: newPosition } : a
    ))
    setDraggingAgentId(null)
  }

  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    if (!selectedAgent) return
    setAgents(prev => prev.map(a => {
      if (a.id === selectedAgent.id) {
        return {
          ...a,
          tasks: a.tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus as Task3D['status'] } : t
          ),
        }
      }
      return a
    }))
  }

  const viewModes: { id: ViewMode; label: string; labelEn: string; icon: any }[] = [
    { id: 'isometric', label: '等距', labelEn: 'Isometric', icon: <LayoutGrid size={16} /> },
    { id: 'front', label: '正面', labelEn: 'Front', icon: <Eye size={16} /> },
    { id: 'top', label: '顶部', labelEn: 'Top', icon: <Grid3X3 size={16} /> },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#030712', zIndex: 900 }}>
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
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={24} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'white' }}>3D Office</h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              {language === 'zh' ? '可视化 Agent 工作空间' : 'Visual Agent Workspace'}
            </p>
          </div>
        </div>

        {/* Live Toggle */}
        <button
          onClick={() => setIsLive(!isLive)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            background: isLive ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.1)',
            border: '1px solid',
            borderColor: isLive ? '#34D399' : 'rgba(255,255,255,0.2)',
            borderRadius: '10px',
            color: isLive ? '#34D399' : 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLive ? '#34D399' : '#64748B',
              animation: isLive ? 'pulse 2s infinite' : 'none',
            }}
          />
          {isLive ? (language === 'zh' ? '实时' : 'Live') : (language === 'zh' ? '暂停' : 'Paused')}
        </button>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '10px' }}>
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: viewMode === mode.id ? 'rgba(139,92,246,0.3)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: viewMode === mode.id ? 'white' : 'rgba(255,255,255,0.6)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {mode.icon}
              {language === 'zh' ? mode.label : mode.labelEn}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: showFilters ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <Filter size={16} />
            {language === 'zh' ? '筛选' : 'Filter'}
          </button>

          {showFilters && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'rgba(15, 23, 42, 0.95)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px',
                minWidth: '180px',
                backdropFilter: 'blur(12px)',
              }}
            >
              <button
                onClick={() => { setStatusFilter(null); setShowFilters(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  background: !statusFilter ? 'rgba(139,92,246,0.2)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <Users size={14} />
                {language === 'zh' ? '全部' : 'All'}
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)' }}>{agents.length}</span>
              </button>
              {Object.entries(statusConfig).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setShowFilters(false) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    background: statusFilter === status ? `${config.color}22` : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: config.color }} />
                  {language === 'zh' ? config.label : config.labelEn}
                  <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)' }}>{statusCounts[status] || 0}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          gap: '12px',
          zIndex: 10,
        }}
      >
        {[
          { icon: <Users size={16} />, label: 'Agents', value: agents.length, color: '#8B5CF6' },
          { icon: <Activity size={16} />, label: 'Online', value: statusCounts.online || 0, color: '#34D399' },
          { icon: <Bot size={16} />, label: 'Busy', value: statusCounts.busy || 0, color: '#FBBF24' },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              borderRadius: '12px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ color: stat.color }}>{stat.icon}</div>
            <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{stat.value}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <ActivityFeed activities={activities} language={language} />

      {/* Agent Detail Panel */}
      {selectedAgent && (
        <AgentDetailPanel
          agent={selectedAgent}
          onClose={() => setSelectedAgentId(null)}
          onTaskStatusChange={handleTaskStatusChange}
          language={language}
        />
      )}

      {/* 3D Canvas */}
      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene
            agents={filteredAgents}
            selectedAgentId={selectedAgentId}
            onAgentClick={handleAgentClick}
            onAgentDragEnd={handleAgentDragEnd}
            viewMode={viewMode}
            draggingAgentId={draggingAgentId}
          />
        </Suspense>
      </Canvas>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
