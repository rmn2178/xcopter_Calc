import { describe, expect, it } from 'vitest'
import { defaultInput } from '../defaults'
import { runCalculator } from './index'

function isFiniteResult(result: ReturnType<typeof runCalculator>): boolean {
  const values = [
    result.airDensity,
    result.batteryCard.hoverFlightMin,
    result.batteryCard.minFlightMin,
    result.batteryCard.mixedFlightMin,
    result.motorHover.currentA,
    result.motorMax.currentA,
    result.motorHover.motorTempC,
    result.motorMax.motorTempC,
    result.totalDrive.thrustWeightRatio,
    result.totalDrive.efficiencyHoverPct,
    result.totalDrive.efficiencyMaxPct,
    result.multicopter.maxSpeedKmh,
    result.multicopter.estimatedRangeKm,
    result.multicopter.maxClimbMs,
  ]

  return values.every((v) => Number.isFinite(v))
}

describe('runCalculator', () => {
  it('returns finite numeric outputs for default input', () => {
    const result = runCalculator(defaultInput)
    expect(isFiniteResult(result)).toBe(true)
  })

  it('sets hover flight time to zero when hover current is over limits', () => {
    const constrained = structuredClone(defaultInput)
    constrained.motor.currentLimitA = 10
    constrained.esc.continuousCurrentA = 10
    const result = runCalculator(constrained)

    if (result.warnings.hoverOverCurrent) {
      expect(result.batteryCard.hoverFlightMin).toBe(0)
    }
  })

  it('has non-increasing max thrust from full to normal to low charge', () => {
    const base = structuredClone(defaultInput)
    const full = runCalculator({ ...base, battery: { ...base.battery, chargeState: 'full' } })
    const normal = runCalculator({ ...base, battery: { ...base.battery, chargeState: 'normal' } })
    const low = runCalculator({ ...base, battery: { ...base.battery, chargeState: 'low' } })

    expect(full.motorMax.thrustG).toBeGreaterThanOrEqual(normal.motorMax.thrustG)
    expect(normal.motorMax.thrustG).toBeGreaterThanOrEqual(low.motorMax.thrustG)
  })
})
