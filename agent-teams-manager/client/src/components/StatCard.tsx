import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: { value: number; isPositive: boolean }
  color: 'primary' | 'success' | 'warning' | 'error' | 'secondary'
  onClick?: () => void
}

const colorClasses = {
  primary: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  success: 'bg-success/10 text-success border-emerald-500/20',
  warning: 'bg-warning/10 text-warning border-amber-500/20',
  error: 'bg-error/10 text-error border-red-500/20',
  secondary: 'bg-secondary/10 text-secondary border-violet-500/20',
}

export default function StatCard({ title, value, icon: Icon, trend, color, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-800 rounded-xl p-6 border ${colorClasses[color]} transition-all hover:scale-[1.02] cursor-pointer ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.isPositive ? 'text-success' : 'text-error'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
