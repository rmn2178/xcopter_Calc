import type { BatteryInput, ChargeState, CellType } from '../types'

const DEFAULT_BY_TYPE: Record<CellType, { nominal: number; full: number; low: number; normal: number }> = {
  LiPo: { nominal: 3.7, full: 4.2, low: 3.7, normal: 3.85 },
  LiHV: { nominal: 3.8, full: 4.35, low: 3.75, normal: 3.9 },
  'Li-Ion': { nominal: 3.6, full: 4.2, low: 3.3, normal: 3.7 },
  NiMH: { nominal: 1.2, full: 1.4, low: 1.1, normal: 1.25 },
  Custom: { nominal: 3.7, full: 4.2, low: 3.7, normal: 3.85 },
}

export interface BatteryState {
  capacityTotalMah: number
  capacityAh: number
  rPackOhm: number
  vOc: number
  ratedV: number
  maxCurrentA: number
  weightG: number
}

export function cellVoltageForState(
  type: CellType,
  chargeState: ChargeState,
  userFullV: number,
  userNominalV: number,
): number {
  const preset = DEFAULT_BY_TYPE[type]
  if (type === 'Custom') {
    if (chargeState === 'full') return userFullV
    if (chargeState === 'normal') return userNominalV
    return userNominalV * 0.95
  }

  if (chargeState === 'full') return preset.full
  if (chargeState === 'normal') return preset.normal
  return preset.low
}

export function buildBatteryState(battery: BatteryInput): BatteryState {
  const cellV = cellVoltageForState(
    battery.cellType,
    battery.chargeState,
    battery.fullChargeVoltage,
    battery.nominalVoltage,
  )
  const vOc = cellV * battery.seriesCells
  const ratedV = battery.nominalVoltage * battery.seriesCells
  const capacityTotalMah = battery.cellCapacityMah * battery.parallelCells
  const capacityAh = capacityTotalMah / 1000
  const rCell = battery.internalResistanceMOhm / 1000
  const rPackOhm = (rCell / Math.max(battery.parallelCells, 1)) * battery.seriesCells

  return {
    capacityTotalMah,
    capacityAh,
    rPackOhm,
    vOc,
    ratedV,
    maxCurrentA: battery.maxDischargeC * capacityAh,
    weightG: battery.seriesCells * battery.parallelCells * battery.cellWeightG,
  }
}

export function packVoltage(vOc: number, iTotal: number, rPack: number): number {
  return Math.max(0.1, vOc - iTotal * rPack)
}
