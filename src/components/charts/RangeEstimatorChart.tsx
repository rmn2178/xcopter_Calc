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
import type { RangeChartPoint, SpeedUnit } from '../../types'

interface Props {
  data: RangeChartPoint[]
  speedUnit: SpeedUnit
  peakSpeedKmh: number
}

export function RangeEstimatorChart({ data, speedUnit, peakSpeedKmh }: Props) {
  const xKey = speedUnit === 'kmh' ? 'speedKmh' : 'speedMph'
  const xLabel = speedUnit === 'kmh' ? 'Speed (km/h)' : 'Speed (mph)'
  const yKey = speedUnit === 'kmh' ? 'rangeKm' : 'rangeMiles'
  const yLabel = speedUnit === 'kmh' ? 'Range (km)' : 'Range (miles)'

  const peak =
    data.find((item) => Math.abs(item.speedKmh - peakSpeedKmh) < 0.5) ||
    data.reduce((best, row) => (row.rangeKm > best.rangeKm ? row : best), data[0] ?? {
      speedKmh: 0,
      speedMph: 0,
      rangeKm: 0,
      rangeMiles: 0,
    })

  return (
    <section className="chart-card">
      <h3>Range Estimator</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ left: 10, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#24404a" />
          <XAxis dataKey={xKey} stroke="#bfdde8" label={{ value: xLabel, position: 'insideBottom', offset: -6 }} />
          <YAxis stroke="#8ee3ff" label={{ value: yLabel, angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line dataKey={yKey} name={yLabel} stroke="#4af0c2" dot={false} strokeWidth={2} />
          <ReferenceDot x={peak[xKey]} y={peak[yKey]} fill="#fef08a" r={5} label="Peak" />
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}
