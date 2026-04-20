import batteriesData from './batteries.json'
import escsData from './escs.json'
import motorsData from './motors.json'
import propellersData from './propellers.json'
import provenanceData from './provenance.json'
import type { BatteryPreset, ESCPreset, MotorPreset, PropPreset } from '../types'

const SYNTHETIC_MODEL_PATTERN = /\b(LITE|PRO|V2|HV\s+HV)\b/i
const ENFORCE_VERIFIED_PRESETS =
  import.meta.env.VITE_ENFORCE_VERIFIED_PRESETS === 'true'

interface ProvenanceEntry {
  status: 'verified' | 'pending' | 'rejected'
  sourceName: string
  sourceUrl: string
  verifiedAt: string
}

interface ProvenanceManifest {
  motors: Record<string, ProvenanceEntry>
  escs: Record<string, ProvenanceEntry>
  batteries: Record<string, ProvenanceEntry>
  propellers: Record<string, ProvenanceEntry>
}

const provenance = provenanceData as ProvenanceManifest

function isAllowedByProvenance(
  table: keyof ProvenanceManifest,
  id: string,
): boolean {
  const entry = provenance[table]?.[id]
  if (!entry) return false
  if (entry.status === 'rejected') return false
  if (entry.status === 'verified') return true
  return !ENFORCE_VERIFIED_PRESETS
}

function isTrustedMotor(preset: MotorPreset): boolean {
  if (preset.manufacturer.toLowerCase() === 'custom') return false
  if (!preset.id || !preset.series) return false
  if (preset.kv <= 0 || preset.limit_A <= 0 || preset.limit_W <= 0) return false
  if (preset.weight_g <= 0 || preset.Rm_mOhm <= 0) return false
  return true
}

function isTrustedBattery(preset: BatteryPreset): boolean {
  if (preset.brand.toLowerCase() === 'custom') return false
  if (preset.capacity_mAh <= 0 || preset.weight_g <= 0) return false
  if (preset.C_cont <= 0 || preset.C_max < preset.C_cont) return false
  if (preset.V_nominal <= 0 || preset.V_full < preset.V_nominal) return false
  return true
}

function isTrustedEsc(preset: ESCPreset): boolean {
  if (preset.manufacturer.toLowerCase() === 'custom') return false
  if (SYNTHETIC_MODEL_PATTERN.test(preset.model)) return false
  if (preset.A_cont <= 0 || preset.A_burst < preset.A_cont) return false
  if (preset.Rm_mOhm <= 0 || preset.weight_g <= 0 || preset.voltage_max <= 0) return false
  return true
}

function isTrustedProp(preset: PropPreset): boolean {
  if (preset.brand.toLowerCase() === 'custom') return false
  if (preset.diameter_inch <= 0 || preset.pitch_inch <= 0) return false
  if (preset.TConst <= 0 || preset.PConst <= 0) return false
  if (preset.weight_g < 0) return false
  return true
}

export const motorPresets = (motorsData as MotorPreset[])
  .filter(isTrustedMotor)
  .filter((preset) => isAllowedByProvenance('motors', preset.id))
  .sort((a, b) => `${a.manufacturer} ${a.series}`.localeCompare(`${b.manufacturer} ${b.series}`))

export const batteryPresets = (batteriesData as BatteryPreset[])
  .filter(isTrustedBattery)
  .filter((preset) => isAllowedByProvenance('batteries', preset.id))
  .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`))

export const escPresets = (escsData as ESCPreset[])
  .filter(isTrustedEsc)
  .filter((preset) => isAllowedByProvenance('escs', preset.id))
  .sort((a, b) => `${a.manufacturer} ${a.model}`.localeCompare(`${b.manufacturer} ${b.model}`))

export const propPresets = (propellersData as PropPreset[])
  .filter(isTrustedProp)
  .filter((preset) => isAllowedByProvenance('propellers', preset.id))
  .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`))

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
