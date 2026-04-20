import type { CalculationResult } from '../../types'
import { dualTemperature } from '../../utils/display'
import { OutputCard, Metric } from './OutputCard'

interface Props {
  result: CalculationResult
}

export function SimpleSummaryCard({ result }: Props) {
  return (
    <OutputCard title="Simple Summary">
      <Metric label="Hover Flight Time" value={`${result.batteryCard.hoverFlightMin.toFixed(1)} min`} />
      <Metric label="Thrust-Weight Ratio" value={result.totalDrive.thrustWeightRatio.toFixed(2)} />
      <Metric label="Hover Throttle" value={`${result.motorHover.throttleLinearPct.toFixed(1)} %`} />
      <Metric label="Motor Temperature" value={dualTemperature(result.motorHover.motorTempC)} />
    </OutputCard>
  )
}
