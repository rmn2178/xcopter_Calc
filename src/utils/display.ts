import { fromCelsius, kmhToUnit, mpsToFpm, OZ_PER_G, toGrams } from './units'
import type { UnitPrefs } from '../types'

const CONV = {
  mmToInch: 0.03937,
  hPaToInHg: 0.02953,
  mToFt: 3.28084,
  kmToMi: 0.62137,
  kmhToMph: 0.62137,
}

export function dualWeight(g: number): string {
  return `${g.toFixed(0)} g / ${(g * OZ_PER_G).toFixed(2)} oz`
}

export function dualSpeed(kmh: number): string {
  return `${kmh.toFixed(1)} km/h / ${(kmh * CONV.kmhToMph).toFixed(1)} mph`
}

export function dualDistance(km: number): string {
  return `${km.toFixed(2)} km / ${(km * CONV.kmToMi).toFixed(2)} mi`
}

export function dualTemperature(c: number): string {
  return `${c.toFixed(1)} C / ${(c * 9 / 5 + 32).toFixed(1)} F`
}

export function dualClimb(ms: number): string {
  return `${ms.toFixed(2)} m/s / ${mpsToFpm(ms).toFixed(0)} ft/min`
}

export function displayValue(value: number, unit: string, prefs: UnitPrefs): string {
  switch (unit) {
    case 'g':
      return prefs.weight === 'oz' ? `${(value * 0.035274).toFixed(2)} oz` : `${value.toFixed(1)} g`
    case 'mm':
      return prefs.length === 'inch' ? `${(value * CONV.mmToInch).toFixed(2)} in` : `${value.toFixed(1)} mm`
    case 'C':
      return prefs.temperature === 'F' ? `${fromCelsius(value, 'f').toFixed(1)} F` : `${value.toFixed(1)} C`
    case 'km/h':
      return prefs.speed === 'mph' ? `${kmhToUnit(value, 'mph').toFixed(1)} mph` : `${value.toFixed(1)} km/h`
    case 'hPa':
      return prefs.pressure === 'inHg' ? `${(value * CONV.hPaToInHg).toFixed(2)} inHg` : `${value.toFixed(2)} hPa`
    case 'm':
      return prefs.altitude === 'ft' ? `${(value * CONV.mToFt).toFixed(0)} ft` : `${value.toFixed(1)} m`
    case 'km':
      return prefs.distance === 'mi' ? `${(value * CONV.kmToMi).toFixed(2)} mi` : `${value.toFixed(2)} km`
    default:
      return value.toFixed(2)
  }
}

export function dualMassFromInput(value: number, currentUnit: 'g' | 'oz'): string {
  const grams = toGrams(value, currentUnit)
  return dualWeight(grams)
}
