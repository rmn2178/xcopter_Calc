import type { BatteryInput, ChargeState, CellType } from '../types'

export const DEFAULT_BY_TYPE: Record<CellType, { nominal: number; full: number; low: number; normal: number }> = {
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

function voltageAtSoc(cellType: CellType, soc: number, ageCycles: number, nominal: number, full: number): number {
  const baseLow = typeBasedLow(cellType, nominal)
  const curve = baseLow + (full - baseLow) * Math.sqrt(Math.max(0, soc))
  const cycleLoss = Math.min(0.15, ageCycles / 1000)
  return curve - cycleLoss * (full - baseLow)
}

function typeBasedLow(type: CellType, nominal: number): number {
  if (type === 'LiPo') return 3.7
  if (type === 'LiHV') return 3.75
  if (type === 'Li-Ion') return 3.3
  if (type === 'NiMH') return 1.1
  return nominal * 0.95
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
  const idlingLoss = Math.min(0.12, battery.ageCycles * 0.00004)
  const degradedVoc = vOc * (1 - idlingLoss)
  const ratedV = battery.nominalVoltage * battery.seriesCells
  const capacityTotalMah = battery.cellCapacityMah * battery.parallelCells
  const capacityAh = capacityTotalMah / 1000
  const rCell = battery.internalResistanceMOhm / 1000
  const rPackOhm = (rCell / Math.max(battery.parallelCells, 1)) * battery.seriesCells

  return {
    capacityTotalMah,
    capacityAh,
    rPackOhm,
    vOc: degradedVoc,
    ratedV,
    maxCurrentA: battery.maxDischargeC * capacityAh,
    weightG: battery.seriesCells * battery.parallelCells * battery.cellWeightG,
  }
}

export function packVoltage(vOc: number, iTotal: number, rPack: number): number {
  return Math.max(0.1, vOc - iTotal * rPack)
}
