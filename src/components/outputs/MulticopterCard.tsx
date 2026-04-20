import type { MulticopterData } from '../../types'
import { dualClimb, dualDistance, dualSpeed, dualWeight } from '../../utils/display'
import { OutputCard, Metric } from './OutputCard'

interface Props {
  data: MulticopterData
}

export function MulticopterCard({ data }: Props) {
  return (
    <OutputCard title="Multicopter">
      <Metric label="All-Up Weight" value={dualWeight(data.allUpWeightG)} />
      <Metric label="Add Payload" value={dualWeight(data.addPayloadG)} />
      <Metric label="Max Tilt" value={`${data.maxTiltDeg.toFixed(1)} deg`} />
      <Metric label="Max Speed" value={dualSpeed(data.maxSpeedKmh)} />
      <Metric label="Est. Range" value={dualDistance(data.estimatedRangeKm)} />
      <Metric label="Max Climb" value={dualClimb(data.maxClimbMs)} />
      <Metric label="Disc Area" value={`${data.totalDiscAreaDm2.toFixed(2)} dm2`} />
      <Metric label="Disc Area" value={`${data.totalDiscAreaIn2.toFixed(1)} in2`} />
      <Metric label="Engine Failure" value={data.engineFailureStatus} />
    </OutputCard>
  )
}
