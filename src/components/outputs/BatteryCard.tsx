import type { BatteryCardData } from '../../types'
import { OutputCard, Metric } from './OutputCard'

interface Props {
  data: BatteryCardData
  batteryCClass: string
}

export function BatteryCard({ data, batteryCClass }: Props) {
  return (
    <OutputCard title="Battery">
      <Metric label="Load (C)" value={data.loadC.toFixed(2)} statusClassName={batteryCClass} />
      <Metric label="Voltage (load)" value={`${data.voltageUnderLoadV.toFixed(2)} V`} />
      <Metric label="Rated Voltage" value={`${data.ratedVoltageV.toFixed(2)} V`} />
      <Metric label="Energy" value={`${data.energyWh.toFixed(1)} Wh`} />
      <Metric label="Capacity total" value={`${data.capacityTotalMah.toFixed(0)} mAh`} />
      <Metric label="Capacity used" value={`${data.capacityUsedMah.toFixed(0)} mAh`} />
      <Metric label="Min Flight Time" value={`${data.minFlightMin.toFixed(1)} min`} />
      <Metric label="Mixed Flight Time" value={`${data.mixedFlightMin.toFixed(1)} min`} />
      <Metric label="Hover Flight Time" value={`${data.hoverFlightMin.toFixed(1)} min`} />
      <Metric label="Weight" value={`${data.weightG.toFixed(0)} g`} />
    </OutputCard>
  )
}
