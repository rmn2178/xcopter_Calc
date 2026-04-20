import batteriesData from './batteries.json'
import escsData from './escs.json'
import motorsData from './motors.json'
import propellersData from './propellers.json'
import type { BatteryPreset, ESCPreset, MotorPreset, PropPreset } from '../types'

export const motorPresets = motorsData as MotorPreset[]
export const batteryPresets = batteriesData as BatteryPreset[]
export const escPresets = escsData as ESCPreset[]
export const propPresets = propellersData as PropPreset[]

export function motorDisplayName(preset: MotorPreset): string {
  const suffix = preset.discontinued ? '²' : ''
  return `${preset.manufacturer} - ${preset.series}${suffix} (${preset.kv} Kv)`
}

export function batteryDisplayName(preset: BatteryPreset): string {
  return `${preset.brand} - ${preset.model}`
}

export function escDisplayName(preset: ESCPreset): string {
  return `${preset.manufacturer} - ${preset.model}`
}

export function propDisplayName(preset: PropPreset): string {
  return `${preset.brand} - ${preset.model}`
}
