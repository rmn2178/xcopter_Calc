export interface SpeedPerfInput {
  rho: number
  allUpWeightN: number
  frameSizeMm: number
  totalDiscAreaM2: number
  horizontalForceN: number
  pHoverTotalW: number
  pAccessoriesW: number
  energyWh: number
}

export interface RangePoint {
  speedKmh: number
  rangeKm: number
}

export function estimateFrontalArea(frameSizeMm: number): number {
  return Math.pow(frameSizeMm / 1000, 2) * 0.05
}

export function maxSpeedMps(horizontalForceN: number, rho: number, frontalArea: number): number {
  const cd = 0.8
  const denominator = Math.max(rho * cd * frontalArea, 1e-6)
  return Math.sqrt((2 * Math.max(horizontalForceN, 0)) / denominator)
}

export function climbRateMps(totalThrustN: number, allUpWeightN: number, massKg: number): number {
  const excess = Math.max(0, totalThrustN - allUpWeightN)
  return excess / Math.max(massKg, 1e-6)
}

export function buildRangeCurve(input: SpeedPerfInput, maxSpeedKmh: number): RangePoint[] {
  const cd = 0.8
  const frontalArea = estimateFrontalArea(input.frameSizeMm)
  const points: RangePoint[] = []

  const capSpeed = Math.max(10, Math.floor(maxSpeedKmh))
  for (let speedKmh = 1; speedKmh <= capSpeed; speedKmh += 1) {
    const v = speedKmh / 3.6
    const pInd =
      Math.pow(input.allUpWeightN, 2) /
      (2 * input.rho * v * input.totalDiscAreaM2 + 1e-6)
    const pPar = 0.5 * input.rho * Math.pow(v, 3) * cd * frontalArea
    const pPro = input.pHoverTotalW * 0.05
    const pTot = pInd + pPar + pPro + input.pAccessoriesW
    const rangeM = ((input.energyWh * 3600) / Math.max(pTot, 1e-6)) * v

    points.push({
      speedKmh,
      rangeKm: rangeM / 1000,
    })
  }

  return points
}
