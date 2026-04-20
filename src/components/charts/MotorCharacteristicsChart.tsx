import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
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
  const iWarn = data.find((row) => row.temperatureC >= 80)?.currentA
  const iCritical = data.find((row) => row.temperatureC >= 100)?.currentA
  const maxCurrent = data[data.length - 1]?.currentA ?? 0

  return (
    <section className="chart-card">
      <h3>Motor Characteristics</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ left: 10, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#24404a" />
          <XAxis dataKey="currentA" stroke="#bfdde8" unit=" A" />
          <YAxis yAxisId="thrust" stroke="#2563eb" />
          <YAxis yAxisId="power" orientation="right" stroke="#ea580c" />
          <YAxis yAxisId="etaTemp" orientation="right" x={560} stroke="#7c3aed" />
          <Tooltip />
          <Legend />
          {iWarn && iCritical && (
            <ReferenceArea x1={iWarn} x2={iCritical} fill="#fbbf24" fillOpacity={0.13} />
          )}
          {iCritical && <ReferenceArea x1={iCritical} x2={maxCurrent} fill="#ef4444" fillOpacity={0.12} />}
          {iWarn && <ReferenceLine x={iWarn} stroke="#fbbf24" strokeDasharray="5 5" label="80C" />}
          {iCritical && <ReferenceLine x={iCritical} stroke="#ef4444" strokeDasharray="5 5" label="100C" />}
          <Line yAxisId="thrust" dataKey="thrustG" name="Thrust (g)" stroke="#2563eb" dot={false} strokeWidth={2} />
          <Line yAxisId="power" dataKey="electricPowerW" name="Electric Power (W)" stroke="#ea580c" dot={false} strokeWidth={2} />
          <Line yAxisId="power" dataKey="mechanicalPowerW" name="Mech. Power (W)" stroke="#16a34a" dot={false} strokeWidth={2} />
          <Line yAxisId="etaTemp" dataKey="efficiencyPct" name="Efficiency (%)" stroke="#7c3aed" dot={false} strokeWidth={2} />
          <Line yAxisId="power" dataKey="heatW" name="Waste Heat (W)" stroke="#dc2626" dot={false} strokeDasharray="4 3" strokeWidth={2} />
          <Line yAxisId="etaTemp" dataKey="temperatureC" name="Temperature (C)" stroke="#fb7185" dot={false} strokeDasharray="6 3" strokeWidth={2} />
          <ReferenceDot x={hoverPoint.currentA} y={hoverPoint.thrustG} yAxisId="thrust" fill="#fef08a" r={5} label="Hover" />
          <ReferenceDot x={maxPoint.currentA} y={maxPoint.thrustG} yAxisId="thrust" fill="#fb7185" r={5} label="Max" />
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}
