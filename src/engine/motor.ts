import motorEfficiencyTables from '../data/motorEfficiencyTables.json'

export interface MotorConfig {
  kv: number
  i0: number
  rmOhm: number
  rEscOhm: number
  poles: number
  gearRatio: number
  presetId?: string
}

export interface MotorPoint {
  currentA: number
  backEmfV: number
  rpm: number
  electricPowerW: number
  mechanicalPowerW: number
  efficiency: number
}

export function kvEffective(kv: number, gearRatio: number): number {
  return kv / Math.max(gearRatio, 1e-6)
}

function torqueConstantNmPerA(kv: number): number {
  return 60 / (2 * Math.PI * Math.max(kv, 1e-6))
}

function interpolateEfficiency(table: Array<{ torqueNm: number; efficiency: number }>, torque: number): number {
  if (table.length === 0) return 0
  const sorted = [...table].sort((a, b) => a.torqueNm - b.torqueNm)
  if (torque <= sorted[0].torqueNm) return sorted[0].efficiency
  if (torque >= sorted[sorted.length - 1].torqueNm) return sorted[sorted.length - 1].efficiency

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]
    const next = sorted[i]
    if (torque <= next.torqueNm) {
      const f = (torque - prev.torqueNm) / Math.max(next.torqueNm - prev.torqueNm, 1e-6)
      return prev.efficiency + (next.efficiency - prev.efficiency) * f
    }
  }

  return sorted[sorted.length - 1].efficiency
}

function lookupMotorEfficiency(currentA: number, rpm: number, motor: MotorConfig): { efficiency: number; source: 'table' | 'fallback' } {
  const table = motor.presetId ? (motorEfficiencyTables as Record<string, Array<{ torqueNm: number; efficiency: number }>>)[motor.presetId] : undefined
  const kt = torqueConstantNmPerA(motor.kv)
  const torque = Math.max(0, currentA - motor.i0) * kt

  if (table && table.length > 0) {
    return { efficiency: interpolateEfficiency(table, torque), source: 'table' }
  }

  const vin = currentA * (motor.rmOhm + motor.rEscOhm)
  const vBack = rpm / Math.max(kvEffective(motor.kv, motor.gearRatio), 1e-6)
  const e = Math.max(0, vBack) * Math.max(currentA - motor.i0, 0)
  const p = Math.max(vin + vBack, 1e-6) * currentA
  return { efficiency: p > 0 ? e / p : 0, source: 'fallback' }
}

export function currentForRpmWithSag(
  rpm: number,
  vOc: number,
  rPack: number,
  accessoryCurrent: number,
  rotors: number,
  motor: MotorConfig,
): number {
  const kvEff = kvEffective(motor.kv, motor.gearRatio)
  const backEmf = rpm / Math.max(kvEff, 1e-6)
  const rSum = motor.rmOhm + motor.rEscOhm

  const numerator = vOc - accessoryCurrent * rPack - backEmf
  const denominator = rSum + rotors * rPack
  const i = numerator / Math.max(denominator, 1e-6)

  return Math.max(motor.i0, i)
}

export function rpmFromCurrent(
  currentA: number,
  vOc: number,
  rPack: number,
  accessoryCurrent: number,
  rotors: number,
  motor: MotorConfig,
): number {
  const iTotal = rotors * currentA + accessoryCurrent
  const vPack = Math.max(0.1, vOc - iTotal * rPack)
  const rSum = motor.rmOhm + motor.rEscOhm
  const kvEff = kvEffective(motor.kv, motor.gearRatio)
  const rpm = (vPack - currentA * rSum) * kvEff
  return Math.max(0, rpm)
}

export function motorPointFromCurrent(
  currentA: number,
  vOc: number,
  rPack: number,
  accessoryCurrent: number,
  rotors: number,
  motor: MotorConfig,
): MotorPoint {
  const iTotal = rotors * currentA + accessoryCurrent
  const vPack = Math.max(0.1, vOc - iTotal * rPack)
  const rSum = motor.rmOhm + motor.rEscOhm
  const backEmf = Math.max(0, vPack - currentA * rSum)
  const kvEff = kvEffective(motor.kv, motor.gearRatio)
  const rpm = Math.max(0, backEmf * kvEff)
  const electricPowerW = vPack * currentA
  const { efficiency } = lookupMotorEfficiency(currentA, rpm, motor)
  const mechanicalPowerW = electricPowerW * efficiency

  return {
    currentA,
    backEmfV: backEmf,
    rpm,
    electricPowerW,
    mechanicalPowerW,
    efficiency,
  }
}

export function findCurrentFromPowerLimit(
  powerLimitW: number,
  vOc: number,
  rPack: number,
  accessoryCurrent: number,
  rotors: number,
): number {
  let low = 0
  let high = 400

  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2
    const iTotal = rotors * mid + accessoryCurrent
    const vPack = Math.max(0.1, vOc - iTotal * rPack)
    const p = vPack * mid

    if (p > powerLimitW) {
      high = mid
    } else {
      low = mid
    }
  }

  return low
}
