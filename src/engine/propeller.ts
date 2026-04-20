import { inchToMeter } from '../utils/units'

const G = 9.81

export interface PropConfig {
  diameterInch: number
  pitchInch: number
  blades: number
  tConst: number
  pConst: number
  gearRatio: number
}

export function estimateDefaultConstants(diameterInch: number, pitchInch: number, blades: number) {
  const pitchRatio = pitchInch / Math.max(diameterInch, 1e-6)
  const bladeFactor = 1 + Math.max(0, blades - 2) * 0.075

  return {
    tConst: 0.1045 * pitchRatio * bladeFactor,
    pConst: 0.06 * pitchRatio * bladeFactor,
  }
}

export function propDiscArea(diameterInch: number): number {
  const dM = inchToMeter(diameterInch)
  return Math.PI * Math.pow(dM / 2, 2)
}

export function thrustFromRpmGrams(
  rpm: number,
  rho: number,
  rho0: number,
  config: PropConfig,
): number {
  const n = rpm / 60
  const dM = inchToMeter(config.diameterInch)
  const thrustN =
    config.tConst *
    (rho / rho0) *
    Math.pow(n, 2) *
    Math.pow(dM, 4)

  return ((thrustN * 1000) / G) * Math.pow(config.gearRatio, 2)
}

export function propMechanicalPowerW(
  rpm: number,
  rho: number,
  rho0: number,
  config: PropConfig,
): number {
  const n = rpm / 60
  const dM = inchToMeter(config.diameterInch)
  return (
    (config.pConst * (rho / rho0) * Math.pow(n, 3) * Math.pow(dM, 5)) /
    Math.pow(Math.max(config.gearRatio, 1e-6), 3)
  )
}
