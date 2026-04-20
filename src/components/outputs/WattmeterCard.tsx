import type { WattmeterData } from '../../types'
import { OutputCard, Metric } from './OutputCard'

interface Props {
  data: WattmeterData
}

export function WattmeterCard({ data }: Props) {
  return (
    <OutputCard title="Wattmeter & Logger Readings">
      <Metric label="Current" value={`${data.currentA.toFixed(2)} A`} />
      <Metric label="Voltage" value={`${data.voltageV.toFixed(2)} V`} />
      <Metric label="Power" value={`${data.powerW.toFixed(1)} W`} />
    </OutputCard>
  )
}
