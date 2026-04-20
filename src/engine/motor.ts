export interface MotorConfig {
  kv: number
  i0: number
  rmOhm: number
  rEscOhm: number
  poles: number
  gearRatio: number
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
  const mechanicalPowerW = backEmf * Math.max(0, currentA - motor.i0)
  const efficiency = electricPowerW > 0 ? mechanicalPowerW / electricPowerW : 0

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
