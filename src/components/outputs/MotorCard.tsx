import type { OperatingPoint } from '../../types'
import { OutputCard, Metric } from './OutputCard'

interface Props {
  title: string
  data: OperatingPoint
  efficiencyClass?: string
  tempClass?: string
  throttleClass?: string
  showHoverFields?: boolean
}

export function MotorCard({
  title,
  data,
  efficiencyClass,
  tempClass,
  throttleClass,
  showHoverFields = false,
}: Props) {
  return (
    <OutputCard title={title}>
      <Metric label="Current" value={`${data.currentA.toFixed(2)} A`} />
      <Metric label="Voltage (back-EMF)" value={`${data.backEmfV.toFixed(2)} V`} />
      <Metric label="RPM" value={data.rpm.toFixed(0)} />
      <Metric label="Electric Power" value={`${data.electricPowerW.toFixed(1)} W`} />
      <Metric label="Mechanical Power" value={`${data.mechanicalPowerW.toFixed(1)} W`} />
      <Metric label="Efficiency" value={`${data.efficiencyPct.toFixed(1)} %`} statusClassName={efficiencyClass} />
      <Metric label="Thrust" value={`${data.thrustG.toFixed(0)} g`} />
      <Metric label="Power-Weight" value={`${data.powerWeightWkg.toFixed(1)} W/kg`} />
      <Metric label="Est. Temperature" value={`${data.motorTempC.toFixed(1)} C`} statusClassName={tempClass} />
      <Metric label="Controller EPM" value={data.controllerEpm.toFixed(0)} />
      {showHoverFields && (
        <>
          <Metric label="Throttle (log)" value={`${data.throttleLogPct.toFixed(1)} %`} statusClassName={throttleClass} />
          <Metric label="Throttle (linear)" value={`${data.throttleLinearPct.toFixed(1)} %`} statusClassName={throttleClass} />
          <Metric label="Specific Thrust" value={`${data.specificThrustGW.toFixed(2)} g/W`} />
        </>
      )}
    </OutputCard>
  )
}
