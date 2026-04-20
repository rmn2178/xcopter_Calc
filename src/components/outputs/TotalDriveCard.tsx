import type { TotalDriveData } from '../../types'
import { dualWeight } from '../../utils/display'
import { OutputCard, Metric } from './OutputCard'

interface Props {
  data: TotalDriveData
  twrClass: string
}

export function TotalDriveCard({ data, twrClass }: Props) {
  return (
    <OutputCard title="Total Drive">
      <Metric label="Drive Weight" value={dualWeight(data.driveWeightG)} />
      <Metric label="Thrust-Weight" value={data.thrustWeightRatio.toFixed(2)} statusClassName={twrClass} />
      <Metric label="Current @ Hover" value={`${data.currentHoverA.toFixed(2)} A`} />
      <Metric label="P(in) @ Hover" value={`${data.pinHoverW.toFixed(1)} W`} />
      <Metric label="P(out) @ Hover" value={`${data.poutHoverW.toFixed(1)} W`} />
      <Metric label="Eff. @ Hover" value={`${data.efficiencyHoverPct.toFixed(1)} %`} />
      <Metric label="Current @ Max" value={`${data.currentMaxA.toFixed(2)} A`} />
      <Metric label="P(in) @ Max" value={`${data.pinMaxW.toFixed(1)} W`} />
      <Metric label="P(out) @ Max" value={`${data.poutMaxW.toFixed(1)} W`} />
      <Metric label="Eff. @ Max" value={`${data.efficiencyMaxPct.toFixed(1)} %`} />
    </OutputCard>
  )
}
