import type {
  DistanceUnit,
  PressureUnit,
  PropLengthUnit,
  SpeedUnit,
  TemperatureUnit,
  WeightUnit,
} from '../types'

export const OZ_PER_G = 0.03527
export const IN_PER_MM = 0.03937
export const INHG_PER_HPA = 0.02953
export const FT_PER_M = 3.28084
export const MPH_PER_KMH = 0.62137
export const MI_PER_M = 0.000621

export function toGrams(value: number, unit: WeightUnit): number {
  return unit === 'g' ? value : value / OZ_PER_G
}

export function fromGrams(value: number, unit: WeightUnit): number {
  return unit === 'g' ? value : value * OZ_PER_G
}

export function toMeters(value: number, unit: DistanceUnit): number {
  return unit === 'm' ? value : value / FT_PER_M
}

export function toCelsius(value: number, unit: TemperatureUnit): number {
  return unit === 'c' ? value : (value - 32) * (5 / 9)
}

export function fromCelsius(value: number, unit: TemperatureUnit): number {
  return unit === 'c' ? value : value * (9 / 5) + 32
}

export function toHpa(value: number, unit: PressureUnit): number {
  return unit === 'hPa' ? value : value / INHG_PER_HPA
}

export function toInch(value: number, unit: PropLengthUnit): number {
  return unit === 'inch' ? value : value * IN_PER_MM
}

export function inchToMeter(inch: number): number {
  return inch * 0.0254
}

export function kmhToUnit(value: number, unit: SpeedUnit): number {
  return unit === 'kmh' ? value : value * MPH_PER_KMH
}

export function kmToUnit(value: number, unit: 'km' | 'mi'): number {
  return unit === 'km' ? value : value * MI_PER_M * 1000
}

export function mpsToFpm(value: number): number {
  return value * 196.8504
}
