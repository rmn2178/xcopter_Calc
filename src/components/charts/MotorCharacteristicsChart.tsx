import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MotorChartPoint } from '../../types'

interface Props {
  data: MotorChartPoint[]
  hoverPoint: { currentA: number; thrustG: number }
  maxPoint: { currentA: number; thrustG: number }
}

export function MotorCharacteristicsChart({ data, hoverPoint, maxPoint }: Props) {
  return (
    <section className="chart-card">
      <h3>Motor Characteristics</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ left: 10, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#24404a" />
          <XAxis dataKey="currentA" stroke="#bfdde8" unit=" A" />
          <YAxis yAxisId="left" stroke="#8ee3ff" />
          <YAxis yAxisId="right" orientation="right" stroke="#f5c28b" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" dataKey="thrustG" name="Thrust (g)" stroke="#35d4ff" dot={false} strokeWidth={2} />
          <Line yAxisId="right" dataKey="powerW" name="Power (W)" stroke="#ff9c52" dot={false} strokeWidth={2} />
          <Line yAxisId="left" dataKey="efficiencyPct" name="Efficiency (%)" stroke="#9eff8f" dot={false} strokeWidth={2} />
          <ReferenceDot x={hoverPoint.currentA} y={hoverPoint.thrustG} yAxisId="left" fill="#fef08a" r={5} label="Hover" />
          <ReferenceDot x={maxPoint.currentA} y={maxPoint.thrustG} yAxisId="left" fill="#fb7185" r={5} label="Max" />
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}
