import type {
  CalculationResult,
  InputState,
  MotorChartPoint,
  OperatingPoint,
  RangeChartPoint,
} from '../types'
import {
  batteryCStatus,
  escMarginStatus,
  hoverEfficiencyStatus,
  hoverThrottleStatus,
  motorTempStatus,
  twrStatus,
} from '../utils/colors'
import { mpsToFpm, toCelsius, toGrams, toHpa, toInch, toMeters } from '../utils/units'
import { computeAirDensity } from './atmosphere'
import { buildBatteryState, cellVoltageForState, DEFAULT_BY_TYPE, packVoltage } from './battery'
import { findCurrentFromPowerLimit, motorPointFromCurrent } from './motor'
import { buildRangeCurve, climbRateMps, estimateFrontalArea, maxSpeedMps } from './performance'
import { derivePropConstants, propDiscArea, thrustFromRpmGrams } from './propeller'
import { solveHoverPoint } from './solver'

function thermalCoefficient(cooling: 'open' | 'closed', statorDiameterMm: number, statorHeightMm: number): number {
  const d = Math.max(statorDiameterMm, 1)
  const h = Math.max(statorHeightMm, 1)
  const sideAreaMm2 = Math.PI * d * h
  const endAreaMm2 = 2 * Math.PI * Math.pow(d / 2, 2)
  const exposedAreaCm2 = (sideAreaMm2 + endAreaMm2) / 100

  // Approximate steady-state thermal resistance for small outrunner motors.
  const baseThetaCPerW = 35 / Math.max(exposedAreaCm2, 5)
  const coolingFactor = cooling === 'closed' ? 1.35 : 1
  const theta = baseThetaCPerW * coolingFactor

  return Math.min(Math.max(theta, 0.8), 4.5)
}

function estimatedMotorTempC(ambientC: number, currentA: number, rmOhm: number, thetaCPerW: number): number {
  const copperLossW = Math.pow(Math.max(currentA, 0), 2) * Math.max(rmOhm, 0)
  return ambientC + thetaCPerW * copperLossW
}

function clamp(v: number, low: number, high: number): number {
  return Math.min(Math.max(v, low), high)
}

function toOperatingPoint(
  point: {
    currentA: number
    backEmfV: number
    rpm: number
    electricPowerW: number
    mechanicalPowerW: number
    efficiency: number
  },
  thrustG: number,
  motorWeightG: number,
  poles: number,
  motorTempC: number,
  maxThrustG: number,
): OperatingPoint {
  const throttleLinear = maxThrustG > 0 ? (thrustG / maxThrustG) * 100 : 0

  return {
    currentA: point.currentA,
    backEmfV: point.backEmfV,
    rpm: point.rpm,
    electricPowerW: point.electricPowerW,
    mechanicalPowerW: point.mechanicalPowerW,
    efficiencyPct: point.efficiency * 100,
    thrustG,
    motorTempC,
    throttleLogPct: 100 * Math.sqrt(Math.max(0, thrustG / Math.max(maxThrustG, 1e-6))),
    throttleLinearPct: throttleLinear,
    specificThrustGW: thrustG / Math.max(point.electricPowerW, 1e-6),
    powerWeightWkg: (point.electricPowerW * 1000) / Math.max(motorWeightG, 1e-6),
    controllerEpm: point.rpm / Math.max(poles / 2, 1),
  }
}

export function runCalculator(input: InputState): CalculationResult {
  const modelWeightG = toGrams(input.general.modelWeight, input.general.modelWeightUnit)
  const elevationM = toMeters(input.general.elevation, input.general.elevationUnit)
  const tempC = toCelsius(input.general.airTemp, input.general.airTempUnit)
  const qnhHpa = toHpa(input.general.pressure, input.general.pressureUnit)

  const diameterInch = toInch(input.propeller.diameter, input.propeller.diameterUnit)
  const pitchInch = toInch(input.propeller.pitch, input.propeller.pitchUnit)

  const defaults = derivePropConstants(
    diameterInch,
    pitchInch,
    input.propeller.blades,
    input.propeller.yokeTwistDeg,
  )
  const tConst = input.propeller.tConst > 0 ? input.propeller.tConst : defaults.tConst
  const pConst = input.propeller.pConst > 0 ? input.propeller.pConst : defaults.pConst

  const chemistryDefault = DEFAULT_BY_TYPE[input.battery.cellType]
  const normalizedBattery = {
    ...input.battery,
    nominalVoltage: input.battery.nominalVoltage > 0 ? input.battery.nominalVoltage : chemistryDefault.nominal,
    fullChargeVoltage: input.battery.fullChargeVoltage > 0 ? input.battery.fullChargeVoltage : chemistryDefault.full,
  }
  const effectiveVocPerCell = cellVoltageForState(
    input.battery.cellType,
    input.battery.chargeState,
    normalizedBattery.fullChargeVoltage,
    normalizedBattery.nominalVoltage,
  )

  const atmosphere = computeAirDensity({
    qnhHpa,
    temperatureC: tempC,
    elevationM,
  })

  const battery = buildBatteryState(normalizedBattery)
  battery.vOc = effectiveVocPerCell * input.battery.seriesCells
  battery.ratedV = normalizedBattery.nominalVoltage * input.battery.seriesCells
  const rmOhm = input.motor.statorResistanceMOhm / 1000
  const rEscOhm = input.esc.internalResistanceMOhm / 1000

  const propAreaSingle = propDiscArea(diameterInch)
  const totalDiscAreaM2 =
    input.general.rotorLayout === 'coaxial'
      ? input.general.rotors * propAreaSingle * 0.8
      : input.general.rotors * propAreaSingle

  const driveWeightG =
    input.general.rotors * (input.motor.weightG + input.esc.weightG + input.propeller.propWeightG) +
    input.accessories.weightG

  const batteryWeightG = battery.weightG

  let allUpWeightG = modelWeightG
  if (input.general.weightMode === 'withoutDrive') {
    allUpWeightG = modelWeightG + driveWeightG + batteryWeightG
  }
  if (input.general.weightMode === 'lessBattery') {
    allUpWeightG = modelWeightG + batteryWeightG
  }

  const hoverThrustPerMotorG = allUpWeightG / input.general.rotors

  const hoverSolve = solveHoverPoint(
    {
      input,
      vOc: battery.vOc,
      rPack: battery.rPackOhm,
      rho: atmosphere.rho,
      rho0: atmosphere.rho0,
      tConst,
      diameterInch,
    },
    hoverThrustPerMotorG,
  )

  const iBatteryLimitPerMotor =
    (battery.maxCurrentA - input.accessories.currentDrainA) / Math.max(input.general.rotors, 1)
  const iPowerLimit = findCurrentFromPowerLimit(
    input.motor.powerLimitW,
    battery.vOc,
    battery.rPackOhm,
    input.accessories.currentDrainA,
    input.general.rotors,
  )

  const iMax = clamp(
    Math.min(
      input.motor.currentLimitA,
      input.esc.continuousCurrentA,
      iBatteryLimitPerMotor,
      iPowerLimit,
    ),
    input.motor.noLoadCurrentA,
    300,
  )

  const maxPointRaw = motorPointFromCurrent(
    iMax,
    battery.vOc,
    battery.rPackOhm,
    input.accessories.currentDrainA,
    input.general.rotors,
    {
      kv: input.motor.kv,
      i0: input.motor.noLoadCurrentA,
      rmOhm,
      rEscOhm,
      poles: input.motor.poles,
      gearRatio: input.propeller.gearRatio,
    },
  )

  const maxThrustPerMotorG = thrustFromRpmGrams(maxPointRaw.rpm, atmosphere.rho, atmosphere.rho0, {
    diameterInch,
    pitchInch,
    blades: input.propeller.blades,
    tConst,
    pConst,
    gearRatio: input.propeller.gearRatio,
  })

  const hoverPointRaw = motorPointFromCurrent(
    clamp(hoverSolve.currentA, input.motor.noLoadCurrentA, iMax),
    battery.vOc,
    battery.rPackOhm,
    input.accessories.currentDrainA,
    input.general.rotors,
    {
      kv: input.motor.kv,
      i0: input.motor.noLoadCurrentA,
      rmOhm,
      rEscOhm,
      poles: input.motor.poles,
      gearRatio: input.propeller.gearRatio,
    },
  )

  const hoverThrustCalculatedG = thrustFromRpmGrams(
    hoverPointRaw.rpm,
    atmosphere.rho,
    atmosphere.rho0,
    {
      diameterInch,
      pitchInch,
      blades: input.propeller.blades,
      tConst,
      pConst,
      gearRatio: input.propeller.gearRatio,
    },
  )

  const iOptAnalytical = Math.sqrt(
    (input.motor.noLoadCurrentA * battery.vOc) / Math.max(rmOhm, 1e-6),
  )
  const iOpt = clamp(iOptAnalytical, hoverSolve.currentA, iMax)

  const optPointRaw = motorPointFromCurrent(
    iOpt,
    battery.vOc,
    battery.rPackOhm,
    input.accessories.currentDrainA,
    input.general.rotors,
    {
      kv: input.motor.kv,
      i0: input.motor.noLoadCurrentA,
      rmOhm,
      rEscOhm,
      poles: input.motor.poles,
      gearRatio: input.propeller.gearRatio,
    },
  )

  const thrustOptG = thrustFromRpmGrams(optPointRaw.rpm, atmosphere.rho, atmosphere.rho0, {
    diameterInch,
    pitchInch,
    blades: input.propeller.blades,
    tConst,
    pConst,
    gearRatio: input.propeller.gearRatio,
  })

  const kThermal = thermalCoefficient(
    input.motor.cooling,
    input.motor.statorDiameterMm,
    input.motor.statorHeightMm,
  )
  const tMotorHover = estimatedMotorTempC(tempC, hoverPointRaw.currentA, rmOhm, kThermal)
  const tMotorMax = estimatedMotorTempC(tempC, maxPointRaw.currentA, rmOhm, kThermal)

  const motorHover = toOperatingPoint(
    hoverPointRaw,
    hoverThrustCalculatedG,
    input.motor.weightG,
    input.motor.poles,
    tMotorHover,
    maxThrustPerMotorG,
  )

  const motorMax = toOperatingPoint(
    maxPointRaw,
    maxThrustPerMotorG,
    input.motor.weightG,
    input.motor.poles,
    tMotorMax,
    maxThrustPerMotorG,
  )

  const motorOptimum = toOperatingPoint(
    optPointRaw,
    thrustOptG,
    input.motor.weightG,
    input.motor.poles,
    estimatedMotorTempC(tempC, optPointRaw.currentA, rmOhm, kThermal),
    maxThrustPerMotorG,
  )

  const iHoverTotal = input.general.rotors * motorHover.currentA + input.accessories.currentDrainA
  const iMaxTotal = input.general.rotors * motorMax.currentA + input.accessories.currentDrainA
  const hoverCurrentLimited = hoverSolve.currentA > iMax

  const vPackHover = packVoltage(battery.vOc, iHoverTotal, battery.rPackOhm)
  const vPackMax = packVoltage(battery.vOc, iMaxTotal, battery.rPackOhm)

  const usableMah = battery.capacityTotalMah * 0.8
  const tHoverRaw = (usableMah / Math.max(iHoverTotal * 1000, 1e-6)) * 60
  const tHover = hoverCurrentLimited ? 0 : tHoverRaw
  const tMin = (usableMah / Math.max(iMaxTotal * 1000, 1e-6)) * 60
  const iMixed = hoverCurrentLimited ? iMaxTotal : 0.6 * iHoverTotal + 0.4 * iMaxTotal
  const tMixed = (usableMah / Math.max(iMixed * 1000, 1e-6)) * 60

  const tTotalMaxG = input.general.rotors * motorMax.thrustG
  const twr = tTotalMaxG / Math.max(allUpWeightG, 1e-6)

  const allUpWeightN = (allUpWeightG / 1000) * 9.81
  const tTotalMaxN = (tTotalMaxG / 1000) * 9.81

  const thetaMaxPhysics = twr <= 1 ? 0 : (Math.acos(1 / twr) * 180) / Math.PI
  const thetaMax = input.general.noTiltLimit
    ? thetaMaxPhysics
    : Math.min(thetaMaxPhysics, input.general.fcuTiltLimitDeg)

  const horizontalForceN = tTotalMaxN * Math.sin((thetaMax * Math.PI) / 180)
  const frontalArea = estimateFrontalArea(input.general.frameSizeMm)
  const vMaxMps = maxSpeedMps(horizontalForceN, atmosphere.rho, frontalArea)
  const vMaxKmh = vMaxMps * 3.6

  const climbMps = climbRateMps(tTotalMaxN, allUpWeightN, allUpWeightG / 1000)

  const energyWh = (battery.capacityTotalMah * battery.vOc * 0.8) / 1000
  const rangeCurve = buildRangeCurve(
    {
      rho: atmosphere.rho,
      allUpWeightN,
      frameSizeMm: input.general.frameSizeMm,
      totalDiscAreaM2,
      horizontalForceN,
      pHoverTotalW: iHoverTotal * vPackHover,
      pAccessoriesW: input.accessories.currentDrainA * vPackHover,
      energyWh,
    },
    vMaxKmh,
  )

  const peakRangePoint = rangeCurve.reduce(
    (best, point) => (point.rangeKm > best.rangeKm ? point : best),
    { speedKmh: 0, rangeKm: 0 },
  )

  const motorChart: MotorChartPoint[] = []
  const startI = input.motor.noLoadCurrentA
  const steps = 50
  const delta = (iMax - startI) / Math.max(steps, 1)
  for (let i = 0; i <= steps; i += 1) {
    const current = startI + delta * i
    const p = motorPointFromCurrent(
      current,
      battery.vOc,
      battery.rPackOhm,
      input.accessories.currentDrainA,
      input.general.rotors,
      {
        kv: input.motor.kv,
        i0: input.motor.noLoadCurrentA,
        rmOhm,
        rEscOhm,
        poles: input.motor.poles,
        gearRatio: input.propeller.gearRatio,
      },
    )

    const thrust = thrustFromRpmGrams(p.rpm, atmosphere.rho, atmosphere.rho0, {
      diameterInch,
      pitchInch,
      blades: input.propeller.blades,
      tConst,
      pConst,
      gearRatio: input.propeller.gearRatio,
    })

    motorChart.push({
      currentA: current,
      thrustG: thrust,
      electricPowerW: p.electricPowerW,
      mechanicalPowerW: p.mechanicalPowerW,
      efficiencyPct: p.efficiency * 100,
      heatW: Math.max(0, p.electricPowerW - p.mechanicalPowerW),
      temperatureC: estimatedMotorTempC(tempC, current, rmOhm, kThermal),
    })
  }

  const rangeChart: RangeChartPoint[] = rangeCurve.map((r) => ({
    speedKmh: r.speedKmh,
    speedMph: r.speedKmh * 0.62137,
    rangeKm: r.rangeKm,
    rangeMiles: r.rangeKm * 0.62137,
  }))

  const oneMotorFailAvailable = input.general.rotorLayout === 'coaxial'
  const engineFailureStatus = oneMotorFailAvailable
    ? tTotalMaxG - motorMax.thrustG > allUpWeightG
      ? 'Coaxial single-motor failure: degraded hover possible'
      : 'Coaxial single-motor failure: hover impossible'
    : 'N/A for flat layout'

  const warnings = {
    cannotLiftOff: tTotalMaxG < allUpWeightG,
    overspin: motorMax.rpm > input.motor.kv * 4.35 * input.battery.seriesCells,
    batteryOverloaded: iMaxTotal > battery.maxCurrentA,
    hoverOverCurrent: hoverCurrentLimited,
    voltageLimited: vPackMax < battery.vOc * 0.85,
  }

  const errorMessages: string[] = []
  if (warnings.cannotLiftOff) errorMessages.push('Cannot lift off - total maximum thrust is below all-up weight.')
  if (warnings.batteryOverloaded) errorMessages.push('Battery C-rate/current exceeded by the current setup.')
  if (warnings.overspin) errorMessages.push('Propeller overspin risk detected at maximum operating point.')
  if (warnings.hoverOverCurrent) {
    errorMessages.push('Hover point is not achievable within current limits; hover values are capped to maximum allowed current.')
  }

  return {
    airDensity: atmosphere.rho,
    batteryCard: {
      loadC: iHoverTotal / Math.max(battery.capacityAh, 1e-6),
      voltageUnderLoadV: vPackHover,
      ratedVoltageV: battery.ratedV,
      energyWh,
      capacityTotalMah: battery.capacityTotalMah,
      capacityUsedMah: (iHoverTotal * tHover * 1000) / 60,
      minFlightMin: tMin,
      mixedFlightMin: tMixed,
      hoverFlightMin: tHover,
      weightG: batteryWeightG,
    },
    motorOptimum,
    motorMax,
    motorHover,
    totalDrive: {
      driveWeightG,
      thrustWeightRatio: twr,
      currentHoverA: iHoverTotal,
      pinHoverW: vPackHover * iHoverTotal,
      poutHoverW: input.general.rotors * motorHover.mechanicalPowerW,
      efficiencyHoverPct:
        ((input.general.rotors * motorHover.mechanicalPowerW) /
          Math.max(vPackHover * iHoverTotal, 1e-6)) *
        100,
      currentMaxA: iMaxTotal,
      pinMaxW: vPackMax * iMaxTotal,
      poutMaxW: input.general.rotors * motorMax.mechanicalPowerW,
      efficiencyMaxPct:
        ((input.general.rotors * motorMax.mechanicalPowerW) /
          Math.max(vPackMax * iMaxTotal, 1e-6)) *
        100,
    },
    multicopter: {
      allUpWeightG,
      addPayloadG: Math.max(0, tTotalMaxG - allUpWeightG),
      maxTiltDeg: thetaMax,
      maxSpeedKmh: vMaxKmh,
      estimatedRangeKm: peakRangePoint.rangeKm,
      maxClimbMs: climbMps,
      maxClimbFtMin: mpsToFpm(climbMps),
      totalDiscAreaDm2: totalDiscAreaM2 * 100,
      totalDiscAreaIn2: totalDiscAreaM2 * 1550.0031,
      engineFailureStatus,
    },
    wattmeter: {
      currentA: iHoverTotal,
      voltageV: vPackHover,
      powerW: vPackHover * iHoverTotal,
    },
    motorChart,
    rangeChart,
    hoverSpeedKmh: 0,
    peakRangeSpeedKmh: peakRangePoint.speedKmh,
    status: {
      motorTemp: motorTempStatus(motorMax.motorTempC),
      batteryC: batteryCStatus(iMaxTotal / Math.max(battery.capacityAh, 1e-6), input.battery.maxDischargeC),
      twr: twrStatus(twr),
      hoverEfficiency: hoverEfficiencyStatus(motorHover.efficiencyPct),
      hoverThrottle: hoverThrottleStatus(motorHover.throttleLinearPct),
      escMargin: escMarginStatus(motorMax.currentA, input.esc.continuousCurrentA),
    },
    warnings,
    errorMessages,
  }
}
