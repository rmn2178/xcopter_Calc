import { defaultInput } from '../defaults'
import type { InputState } from '../types'

function toFiniteNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}

export function sanitizeInputState(input: InputState): InputState {
  const safe = structuredClone(input)

  safe.general.modelWeight = clamp(toFiniteNumber(safe.general.modelWeight, defaultInput.general.modelWeight), 1, 100000)
  safe.general.rotors = Math.round(clamp(toFiniteNumber(safe.general.rotors, defaultInput.general.rotors), 1, 16))
  safe.general.frameSizeMm = clamp(toFiniteNumber(safe.general.frameSizeMm, defaultInput.general.frameSizeMm), 50, 5000)
  safe.general.fcuTiltLimitDeg = clamp(toFiniteNumber(safe.general.fcuTiltLimitDeg, defaultInput.general.fcuTiltLimitDeg), 0, 90)
  safe.general.elevation = clamp(toFiniteNumber(safe.general.elevation, defaultInput.general.elevation), -500, 10000)
  safe.general.airTemp = clamp(toFiniteNumber(safe.general.airTemp, defaultInput.general.airTemp), -60, 80)
  safe.general.pressure = clamp(toFiniteNumber(safe.general.pressure, defaultInput.general.pressure), 800, 1100)

  safe.battery.seriesCells = Math.round(clamp(toFiniteNumber(safe.battery.seriesCells, defaultInput.battery.seriesCells), 1, 20))
  safe.battery.parallelCells = Math.round(clamp(toFiniteNumber(safe.battery.parallelCells, defaultInput.battery.parallelCells), 1, 20))
  safe.battery.cellCapacityMah = clamp(toFiniteNumber(safe.battery.cellCapacityMah, defaultInput.battery.cellCapacityMah), 50, 100000)
  safe.battery.maxDischargeC = clamp(toFiniteNumber(safe.battery.maxDischargeC, defaultInput.battery.maxDischargeC), 1, 300)
  safe.battery.internalResistanceMOhm = clamp(toFiniteNumber(safe.battery.internalResistanceMOhm, defaultInput.battery.internalResistanceMOhm), 0.01, 500)
  safe.battery.nominalVoltage = clamp(toFiniteNumber(safe.battery.nominalVoltage, defaultInput.battery.nominalVoltage), 0.5, 5)
  safe.battery.fullChargeVoltage = clamp(toFiniteNumber(safe.battery.fullChargeVoltage, defaultInput.battery.fullChargeVoltage), 0.5, 5)
  safe.battery.cellWeightG = clamp(toFiniteNumber(safe.battery.cellWeightG, defaultInput.battery.cellWeightG), 1, 5000)

  safe.esc.continuousCurrentA = clamp(toFiniteNumber(safe.esc.continuousCurrentA, defaultInput.esc.continuousCurrentA), 0.1, 500)
  safe.esc.burstCurrentA = clamp(toFiniteNumber(safe.esc.burstCurrentA, defaultInput.esc.burstCurrentA), safe.esc.continuousCurrentA, 800)
  safe.esc.internalResistanceMOhm = clamp(toFiniteNumber(safe.esc.internalResistanceMOhm, defaultInput.esc.internalResistanceMOhm), 0, 200)
  safe.esc.voltageMax = clamp(toFiniteNumber(safe.esc.voltageMax, defaultInput.esc.voltageMax), 1, 100)
  safe.esc.weightG = clamp(toFiniteNumber(safe.esc.weightG, defaultInput.esc.weightG), 0.1, 1000)

  safe.accessories.currentDrainA = clamp(toFiniteNumber(safe.accessories.currentDrainA, defaultInput.accessories.currentDrainA), 0, 100)
  safe.accessories.weightG = clamp(toFiniteNumber(safe.accessories.weightG, defaultInput.accessories.weightG), 0, 10000)

  safe.motor.kv = clamp(toFiniteNumber(safe.motor.kv, defaultInput.motor.kv), 50, 10000)
  safe.motor.noLoadCurrentA = clamp(toFiniteNumber(safe.motor.noLoadCurrentA, defaultInput.motor.noLoadCurrentA), 0, 20)
  safe.motor.noLoadVoltage = clamp(toFiniteNumber(safe.motor.noLoadVoltage, defaultInput.motor.noLoadVoltage), 0.1, 100)
  safe.motor.currentLimitA = clamp(toFiniteNumber(safe.motor.currentLimitA, defaultInput.motor.currentLimitA), safe.motor.noLoadCurrentA, 500)
  safe.motor.powerLimitW = clamp(toFiniteNumber(safe.motor.powerLimitW, defaultInput.motor.powerLimitW), 1, 20000)
  safe.motor.statorResistanceMOhm = clamp(toFiniteNumber(safe.motor.statorResistanceMOhm, defaultInput.motor.statorResistanceMOhm), 0.1, 2000)
  safe.motor.caseLengthMm = clamp(toFiniteNumber(safe.motor.caseLengthMm, defaultInput.motor.caseLengthMm), 1, 500)
  safe.motor.statorDiameterMm = clamp(toFiniteNumber(safe.motor.statorDiameterMm, defaultInput.motor.statorDiameterMm), 1, 500)
  safe.motor.statorHeightMm = clamp(toFiniteNumber(safe.motor.statorHeightMm, defaultInput.motor.statorHeightMm), 1, 500)
  safe.motor.poles = Math.round(clamp(toFiniteNumber(safe.motor.poles, defaultInput.motor.poles), 2, 64))
  safe.motor.weightG = clamp(toFiniteNumber(safe.motor.weightG, defaultInput.motor.weightG), 1, 5000)

  safe.propeller.yokeTwistDeg = clamp(toFiniteNumber(safe.propeller.yokeTwistDeg, defaultInput.propeller.yokeTwistDeg), -30, 30)
  safe.propeller.diameter = clamp(toFiniteNumber(safe.propeller.diameter, defaultInput.propeller.diameter), 1, 80)
  safe.propeller.pitch = clamp(toFiniteNumber(safe.propeller.pitch, defaultInput.propeller.pitch), 0.1, 50)
  safe.propeller.blades = Math.round(clamp(toFiniteNumber(safe.propeller.blades, defaultInput.propeller.blades), 1, 12))
  safe.propeller.tConst = clamp(toFiniteNumber(safe.propeller.tConst, defaultInput.propeller.tConst), 0.0001, 10)
  safe.propeller.pConst = clamp(toFiniteNumber(safe.propeller.pConst, defaultInput.propeller.pConst), 0.0001, 10)
  safe.propeller.gearRatio = clamp(toFiniteNumber(safe.propeller.gearRatio, defaultInput.propeller.gearRatio), 0.05, 20)
  safe.propeller.propWeightG = clamp(toFiniteNumber(safe.propeller.propWeightG, defaultInput.propeller.propWeightG), 0, 1000)

  return safe
}

export function isLikelyInputState(value: unknown): value is InputState {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return Boolean(v.general && v.battery && v.esc && v.accessories && v.motor && v.propeller)
}
