import type { MulticopterData } from '../../types'
import { OutputCard, Metric } from './OutputCard'

interface Props {
  data: MulticopterData
}

export function MulticopterCard({ data }: Props) {
  return (
    <OutputCard title="Multicopter">
      <Metric label="All-Up Weight" value={`${data.allUpWeightG.toFixed(0)} g`} />
      <Metric label="Add Payload" value={`${data.addPayloadG.toFixed(0)} g`} />
      <Metric label="Max Tilt" value={`${data.maxTiltDeg.toFixed(1)} deg`} />
      <Metric label="Max Speed" value={`${data.maxSpeedKmh.toFixed(1)} km/h`} />
      <Metric label="Est. Range" value={`${data.estimatedRangeKm.toFixed(2)} km`} />
      <Metric label="Max Climb" value={`${data.maxClimbMs.toFixed(2)} m/s`} />
      <Metric label="Max Climb" value={`${data.maxClimbFtMin.toFixed(0)} ft/min`} />
      <Metric label="Disc Area" value={`${data.totalDiscAreaDm2.toFixed(2)} dm2`} />
      <Metric label="Disc Area" value={`${data.totalDiscAreaIn2.toFixed(1)} in2`} />
      <Metric label="Engine Failure" value={data.engineFailureStatus} />
    </OutputCard>
  )
}
