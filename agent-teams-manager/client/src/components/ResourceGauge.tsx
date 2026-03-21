import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface ResourceGaugeProps {
  label: string
  value: number
  unit?: string
}

const getColor = (value: number) => {
  if (value >= 90) return '#EF4444'
  if (value >= 70) return '#F59E0B'
  return '#10B981'
}

export default function ResourceGauge({ label, value, unit = '%' }: ResourceGaugeProps) {
  const data = [
    { name: 'used', value },
    { name: 'free', value: 100 - value },
  ]

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-lg font-bold" style={{ color: getColor(value) }}>
          {value}{unit}
        </span>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={45}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={getColor(value)} />
              <Cell fill="#334155" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
