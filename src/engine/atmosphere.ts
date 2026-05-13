const GAS_CONSTANT_DRY_AIR = 287.058
const GAS_CONSTANT_WATER_VAPOR = 461.495
const SEA_LEVEL_TEMPERATURE_K = 288.15
const LAPSE_RATE = 0.0065
const GRAVITY = 9.80665

export interface AtmosphereInput {
  qnhHpa: number
  temperatureC: number
  elevationM: number
  relativeHumidity: number
}

export interface AtmosphereOutput {
  rho: number
  rhoIsa: number
  rho0: number
  pressurePa: number
  temperatureK: number
  vaporPressurePa: number
}

function saturationVaporPressure(temperatureK: number): number {
  const tC = temperatureK - 273.15
  const es = 6.1078 * Math.exp((17.27 * tC) / (tC + 237.3))
  return es * 100
}

export function computeAirDensity(input: AtmosphereInput): AtmosphereOutput {
  const temperatureK = input.temperatureC + 273.15
  const qnhPa = input.qnhHpa * 100
  const altFactor = 1 - (LAPSE_RATE * input.elevationM) / SEA_LEVEL_TEMPERATURE_K
  const pressurePa = qnhPa * Math.pow(Math.max(altFactor, 0.01), GRAVITY / (GAS_CONSTANT_DRY_AIR * LAPSE_RATE))

  const saturationPa = saturationVaporPressure(temperatureK)
  const vaporPressurePa = saturationPa * Math.max(0, Math.min(1, input.relativeHumidity / 100))
  const dryPressurePa = Math.max(pressurePa - vaporPressurePa, 1)
  const virtualTemperature = temperatureK * (1 + (vaporPressurePa / dryPressurePa) * (GAS_CONSTANT_DRY_AIR / GAS_CONSTANT_WATER_VAPOR - 1))
  const rho = pressurePa / (GAS_CONSTANT_DRY_AIR * virtualTemperature)

  const tIsa = SEA_LEVEL_TEMPERATURE_K - LAPSE_RATE * input.elevationM
  const pIsa = 101325 * Math.pow(Math.max(tIsa / SEA_LEVEL_TEMPERATURE_K, 0.01), GRAVITY / (GAS_CONSTANT_DRY_AIR * LAPSE_RATE))
  const rhoIsa = pIsa / (GAS_CONSTANT_DRY_AIR * Math.max(tIsa, 1))

  return {
    rho,
    rhoIsa,
    rho0: 1.225,
    pressurePa,
    temperatureK,
    vaporPressurePa,
  }
}
