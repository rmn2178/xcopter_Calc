const GAS_CONSTANT_DRY_AIR = 287.058

export interface AtmosphereInput {
  qnhHpa: number
  temperatureC: number
  elevationM: number
}

export interface AtmosphereOutput {
  rho: number
  rhoIsa: number
  rho0: number
  pressurePa: number
  temperatureK: number
}

export function computeAirDensity(input: AtmosphereInput): AtmosphereOutput {
  const temperatureK = input.temperatureC + 273.15
  const pressurePa = input.qnhHpa * 100
  const rho = pressurePa / (GAS_CONSTANT_DRY_AIR * temperatureK)

  const tIsa = 288.15 - 0.0065 * input.elevationM
  const pIsa = 101325 * Math.pow(tIsa / 288.15, 5.2561)
  const rhoIsa = pIsa / (GAS_CONSTANT_DRY_AIR * tIsa)

  return {
    rho,
    rhoIsa,
    rho0: 1.225,
    pressurePa,
    temperatureK,
  }
}
