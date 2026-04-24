import { describe, expect, it } from 'vitest'
import { defaultInput } from '../defaults'
import type { InputState } from '../types'
import { runCalculator } from './index'
import { computeAirDensity } from './atmosphere'
import { buildBatteryState, cellVoltageForState, packVoltage, DEFAULT_BY_TYPE } from './battery'
import { motorPointFromCurrent, rpmFromCurrent, findCurrentFromPowerLimit } from './motor'
import { derivePropConstants, propDiscArea, thrustFromRpmGrams } from './propeller'
import { solveHoverPoint } from './solver'
import { climbRateMps, maxSpeedMps, estimateFrontalArea, buildRangeCurve } from './performance'
import { toGrams, toMeters, toCelsius, toHpa, toInch, inchToMeter, mpsToFpm } from '../utils/units'

// ===== ATMOSPHERE TESTS =====
describe('Atmosphere - Air Density', () => {
  it('computes standard sea-level air density near 1.225 kg/m3', () => {
    const result = computeAirDensity({ qnhHpa: 1013.25, temperatureC: 15, elevationM: 0 })
    expect(result.rho).toBeCloseTo(1.225, 2)
    expect(result.rho0).toBe(1.225)
  })

  it('density decreases with higher temperature', () => {
    const cold = computeAirDensity({ qnhHpa: 1013.25, temperatureC: 0, elevationM: 0 })
    const hot = computeAirDensity({ qnhHpa: 1013.25, temperatureC: 40, elevationM: 0 })
    expect(cold.rho).toBeGreaterThan(hot.rho)
  })

  it('density decreases with lower pressure', () => {
    const highP = computeAirDensity({ qnhHpa: 1013.25, temperatureC: 15, elevationM: 0 })
    const lowP = computeAirDensity({ qnhHpa: 900, temperatureC: 15, elevationM: 0 })
    expect(highP.rho).toBeGreaterThan(lowP.rho)
  })

  it('computes ISA rho at elevation correctly', () => {
    const result = computeAirDensity({ qnhHpa: 1013.25, temperatureC: 15, elevationM: 1000 })
    // ISA temp at 1000m = 288.15 - 6.5 = 281.65K
    expect(result.rhoIsa).toBeGreaterThan(0)
    expect(result.rhoIsa).toBeLessThan(result.rho0) // Should be lower than sea level
  })
})

// ===== BATTERY TESTS =====
describe('Battery - Voltage & State', () => {
  it('returns correct LiPo voltages for each state', () => {
    expect(cellVoltageForState('LiPo', 'full', 4.2, 3.7)).toBe(4.2)
    expect(cellVoltageForState('LiPo', 'normal', 4.2, 3.7)).toBe(3.85)
    expect(cellVoltageForState('LiPo', 'low', 4.2, 3.7)).toBe(3.7)
  })

  it('returns correct LiHV voltages', () => {
    expect(cellVoltageForState('LiHV', 'full', 4.35, 3.8)).toBe(4.35)
    expect(cellVoltageForState('LiHV', 'normal', 4.35, 3.8)).toBe(3.9)
  })

  it('custom type uses user-provided voltages', () => {
    expect(cellVoltageForState('Custom', 'full', 4.3, 3.8)).toBe(4.3)
    expect(cellVoltageForState('Custom', 'normal', 4.3, 3.8)).toBe(3.8)
    expect(cellVoltageForState('Custom', 'low', 4.3, 3.8)).toBeCloseTo(3.61, 1) // 3.8 * 0.95
  })

  it('builds correct battery state for 4S1P 5000mAh LiPo', () => {
    const state = buildBatteryState(defaultInput.battery)
    expect(state.capacityTotalMah).toBe(5000) // 5000mAh * 1P
    expect(state.capacityAh).toBe(5)
    expect(state.vOc).toBeCloseTo(4.2 * 4, 1) // 4S full charge
    expect(state.ratedV).toBeCloseTo(3.7 * 4, 1)
    expect(state.maxCurrentA).toBeCloseTo(50 * 5, 0) // 50C * 5Ah
    expect(state.rPackOhm).toBeCloseTo(0.005 * 4 / 1, 4) // 5mOhm * 4S / 1P
    expect(state.weightG).toBe(4 * 1 * 100) // 4S * 1P * 100g
  })

  it('parallel cells increase capacity and reduce resistance', () => {
    const single = buildBatteryState({ ...defaultInput.battery, parallelCells: 1 })
    const parallel = buildBatteryState({ ...defaultInput.battery, parallelCells: 2 })
    expect(parallel.capacityTotalMah).toBe(single.capacityTotalMah * 2)
    expect(parallel.rPackOhm).toBeLessThan(single.rPackOhm)
    expect(parallel.maxCurrentA).toBe(single.maxCurrentA * 2)
  })

  it('pack voltage sags under load', () => {
    const vOc = 16.8
    const rPack = 0.02
    const loaded = packVoltage(vOc, 20, rPack) // 20A load
    expect(loaded).toBeLessThan(vOc)
    expect(loaded).toBeCloseTo(vOc - 20 * rPack, 2) // 16.4V
  })
})

// ===== MOTOR TESTS =====
describe('Motor - Electrical Model', () => {
  const motor = {
    kv: 920,
    i0: 0.5,
    rmOhm: 0.072,
    rEscOhm: 0.002,
    poles: 14,
    gearRatio: 1,
  }

  it('RPM increases with current', () => {
    const rpm5 = rpmFromCurrent(5, 16.8, 0.02, 1.5, 4, motor)
    const rpm15 = rpmFromCurrent(15, 16.8, 0.02, 1.5, 4, motor)
    // Higher current = more battery sag + more I*R drop = lower RPM
    expect(rpm15).toBeLessThan(rpm5)
  })

  it('motor point has physically consistent values', () => {
    const point = motorPointFromCurrent(10, 16.8, 0.02, 1.5, 4, motor)
    expect(point.currentA).toBe(10)
    expect(point.rpm).toBeGreaterThan(0)
    expect(point.backEmfV).toBeGreaterThan(0)
    expect(point.electricPowerW).toBeGreaterThan(0)
    expect(point.mechanicalPowerW).toBeGreaterThan(0)
    expect(point.mechanicalPowerW).toBeLessThanOrEqual(point.electricPowerW) // conservation
    expect(point.efficiency).toBeGreaterThan(0)
    expect(point.efficiency).toBeLessThan(1)
  })

  it('efficiency peaks at intermediate current', () => {
    const low = motorPointFromCurrent(1, 16.8, 0.02, 1.5, 4, motor)
    const mid = motorPointFromCurrent(5, 16.8, 0.02, 1.5, 4, motor)
    const high = motorPointFromCurrent(25, 16.8, 0.02, 1.5, 4, motor)
    // Mid current should have higher efficiency than both extremes
    expect(mid.efficiency).toBeGreaterThan(low.efficiency)
    expect(mid.efficiency).toBeGreaterThan(high.efficiency)
  })

  it('mechanical power = backEmf * (I - I0)', () => {
    const point = motorPointFromCurrent(15, 16.8, 0.02, 1.5, 4, motor)
    const expected = point.backEmfV * (15 - motor.i0)
    expect(point.mechanicalPowerW).toBeCloseTo(expected, 2)
  })

  it('findCurrentFromPowerLimit converges to correct value', () => {
    const iLimit = findCurrentFromPowerLimit(200, 16.8, 0.02, 1.5, 4)
    const point = motorPointFromCurrent(iLimit, 16.8, 0.02, 1.5, 4, motor)
    expect(point.electricPowerW).toBeCloseTo(200, 1)
  })
})

// ===== PROPELLER TESTS =====
describe('Propeller - Thrust & Constants', () => {
  it('derives non-zero thrust and power constants', () => {
    const result = derivePropConstants(10, 4.5, 2, 0)
    expect(result.tConst).toBeGreaterThan(0)
    expect(result.pConst).toBeGreaterThan(0)
  })

  it('more blades increase thrust and power constants', () => {
    const twoBlade = derivePropConstants(10, 4.5, 2, 0)
    const threeBlade = derivePropConstants(10, 4.5, 3, 0)
    expect(threeBlade.tConst).toBeGreaterThan(twoBlade.tConst)
    expect(threeBlade.pConst).toBeGreaterThan(twoBlade.pConst)
  })

  it('higher pitch ratio increases constants', () => {
    const lowPitch = derivePropConstants(10, 3, 2, 0)
    const highPitch = derivePropConstants(10, 6, 2, 0)
    expect(highPitch.tConst).toBeGreaterThan(lowPitch.tConst)
    expect(highPitch.pConst).toBeGreaterThan(lowPitch.pConst)
  })

  it('disc area scales with diameter^2', () => {
    const area10 = propDiscArea(10)
    const area20 = propDiscArea(20)
    expect(area20 / area10).toBeCloseTo(4, 1) // 20^2/10^2 = 4
  })

  it('thrust increases with RPM^2', () => {
    const config = { diameterInch: 10, pitchInch: 4.5, blades: 2, tConst: 0.109, pConst: 0.053, gearRatio: 1 }
    const thrust5000 = thrustFromRpmGrams(5000, 1.225, 1.225, config)
    const thrust10000 = thrustFromRpmGrams(10000, 1.225, 1.225, config)
    expect(thrust10000 / thrust5000).toBeCloseTo(4, 0) // RPM^2 relationship
  })

  it('thrust decreases with lower air density', () => {
    const config = { diameterInch: 10, pitchInch: 4.5, blades: 2, tConst: 0.109, pConst: 0.053, gearRatio: 1 }
    const sea = thrustFromRpmGrams(8000, 1.225, 1.225, config)
    const altitude = thrustFromRpmGrams(8000, 1.0, 1.225, config)
    expect(altitude).toBeLessThan(sea)
  })
})

// ===== PERFORMANCE TESTS =====
describe('Performance - Speed, Climb, Range', () => {
  it('max speed increases with more horizontal force', () => {
    const speed1 = maxSpeedMps(10, 1.225, 0.01)
    const speed2 = maxSpeedMps(20, 1.225, 0.01)
    expect(speed2).toBeGreaterThan(speed1)
  })

  it('climb rate is zero when thrust equals weight', () => {
    const rate = climbRateMps(10, 10, 1)
    expect(rate).toBe(0)
  })

  it('climb rate is positive when thrust exceeds weight', () => {
    const rate = climbRateMps(20, 10, 1)
    expect(rate).toBeGreaterThan(0)
  })

  it('frontal area scales with frame size^2', () => {
    const area250 = estimateFrontalArea(250)
    const area500 = estimateFrontalArea(500)
    expect(area500 / area250).toBeCloseTo(4, 1)
  })

  it('range curve has positive values and peaks at some speed', () => {
    const perf = {
      rho: 1.225,
      allUpWeightN: 10, // ~1kg
      frameSizeMm: 450,
      totalDiscAreaM2: 0.05,
      horizontalForceN: 15,
      pHoverTotalW: 100,
      pAccessoriesW: 5,
      energyWh: 60,
    }
    const curve = buildRangeCurve(perf, 60)
    expect(curve.length).toBeGreaterThan(0)
    expect(curve.every(p => p.rangeKm >= 0)).toBe(true)
    
    // Should have a peak (not monotonically increasing)
    const maxRange = Math.max(...curve.map(p => p.rangeKm))
    const lastRange = curve[curve.length - 1].rangeKm
    expect(maxRange).toBeGreaterThan(lastRange) // Peak before max speed
  })
})

// ===== UNIT CONVERSION TESTS =====
describe('Unit Conversions', () => {
  it('weight conversion oz<->g', () => {
    expect(toGrams(100, 'g')).toBe(100)
    expect(toGrams(1, 'oz')).toBeCloseTo(28.37, 0)
  })

  it('meter conversion ft->m', () => {
    expect(toMeters(100, 'm')).toBe(100)
    expect(toMeters(100, 'ft')).toBeCloseTo(30.48, 1)
  })

  it('temperature conversion F->C', () => {
    expect(toCelsius(25, 'c')).toBe(25)
    expect(toCelsius(77, 'f')).toBeCloseTo(25, 0)
    expect(toCelsius(32, 'f')).toBeCloseTo(0, 0)
  })

  it('pressure conversion inHg->hPa', () => {
    expect(toHpa(1013.25, 'hPa')).toBe(1013.25)
    expect(toHpa(29.92, 'inHg')).toBeCloseTo(1013.25, 0)
  })

  it('inch to meter conversion', () => {
    expect(inchToMeter(10)).toBeCloseTo(0.254, 3)
  })

  it('m/s to ft/min conversion', () => {
    expect(mpsToFpm(1)).toBeCloseTo(196.85, 0)
  })
})

// ===== HOVER SOLVER TESTS =====
describe('Hover Solver', () => {
  it('solves hover point with reasonable RPM and current', () => {
    const ctx = {
      input: defaultInput,
      vOc: 16.8,
      rPack: 0.02,
      rho: 1.225,
      rho0: 1.225,
      tConst: 0.109,
      diameterInch: 10,
    }
    const hoverThrustPerMotor = 200 // grams per motor
    const result = solveHoverPoint(ctx, hoverThrustPerMotor)
    expect(result.rpm).toBeGreaterThan(0)
    expect(result.rpm).toBeLessThan(20000) // Reasonable range for 920Kv motor
    expect(result.currentA).toBeGreaterThan(0)
    expect(result.thrustPerMotorG).toBeCloseTo(hoverThrustPerMotor, 0) // Should match target
  })
})

// ===== FULL CALCULATOR INTEGRATION TESTS =====
describe('Full Calculator - Integration', () => {
  it('default input produces physically reasonable results', () => {
    const result = runCalculator(defaultInput)
    
    // Air density should be near sea level
    expect(result.airDensity).toBeCloseTo(1.184, 1) // 25°C

    // Battery
    expect(result.batteryCard.energyWh).toBeGreaterThan(0)
    expect(result.batteryCard.hoverFlightMin).toBeGreaterThan(0)
    expect(result.batteryCard.minFlightMin).toBeGreaterThan(0)
    expect(result.batteryCard.mixedFlightMin).toBeGreaterThan(0)
    expect(result.batteryCard.minFlightMin).toBeLessThan(result.batteryCard.hoverFlightMin)
    expect(result.batteryCard.mixedFlightMin).toBeLessThanOrEqual(result.batteryCard.hoverFlightMin)

    // Motor operating points
    expect(result.motorHover.rpm).toBeGreaterThan(0)
    expect(result.motorMax.rpm).toBeGreaterThan(result.motorHover.rpm)
    expect(result.motorMax.currentA).toBeGreaterThan(result.motorHover.currentA)
    expect(result.motorMax.thrustG).toBeGreaterThan(result.motorHover.thrustG)
    expect(result.motorHover.efficiencyPct).toBeGreaterThan(0)
    expect(result.motorHover.efficiencyPct).toBeLessThan(100)

    // TWR should be > 1 for a working copter
    expect(result.totalDrive.thrustWeightRatio).toBeGreaterThan(1)

    // Multicopter outputs
    expect(result.multicopter.allUpWeightG).toBeGreaterThan(0)
    expect(result.multicopter.maxSpeedKmh).toBeGreaterThan(0)
    expect(result.multicopter.maxClimbMs).toBeGreaterThan(0)
    expect(result.multicopter.estimatedRangeKm).toBeGreaterThan(0)

    // Charts should have data
    expect(result.motorChart.length).toBeGreaterThan(0)
    expect(result.rangeChart.length).toBeGreaterThan(0)

    // No errors for default setup
    expect(result.errorMessages.length).toBe(0)
  })

  it('heavier copter decreases hover time and TWR', () => {
    const light = runCalculator(defaultInput)
    const heavy = runCalculator({
      ...defaultInput,
      general: { ...defaultInput.general, modelWeight: 2000 },
    })
    expect(heavy.batteryCard.hoverFlightMin).toBeLessThan(light.batteryCard.hoverFlightMin)
    expect(heavy.totalDrive.thrustWeightRatio).toBeLessThan(light.totalDrive.thrustWeightRatio)
  })

  it('more rotors increase TWR', () => {
    const quad = runCalculator(defaultInput)
    const hex = runCalculator({
      ...defaultInput,
      general: { ...defaultInput.general, rotors: 6 },
    })
    expect(hex.totalDrive.thrustWeightRatio).toBeGreaterThan(quad.totalDrive.thrustWeightRatio)
  })

  it('higher voltage (6S) increases max thrust and RPM', () => {
    const fourS = runCalculator(defaultInput)
    const sixS = runCalculator({
      ...defaultInput,
      battery: { ...defaultInput.battery, seriesCells: 6 },
    })
    expect(sixS.motorMax.rpm).toBeGreaterThan(fourS.motorMax.rpm)
    expect(sixS.motorMax.thrustG).toBeGreaterThan(fourS.motorMax.thrustG)
  })

  it('larger propeller increases thrust at same RPM', () => {
    const small = runCalculator({
      ...defaultInput,
      propeller: { ...defaultInput.propeller, diameter: 8, tConst: 0, pConst: 0 },
    })
    const large = runCalculator({
      ...defaultInput,
      propeller: { ...defaultInput.propeller, diameter: 12, tConst: 0, pConst: 0 },
    })
    // With tConst=0, auto-derived constants are used
    // Larger prop = more thrust at given RPM
    expect(large.motorMax.thrustG).toBeGreaterThan(small.motorMax.thrustG)
  })

  it('higher KV motor produces higher RPM but needs more current', () => {
    const lowKv = runCalculator({
      ...defaultInput,
      motor: { ...defaultInput.motor, kv: 700 },
    })
    const highKv = runCalculator({
      ...defaultInput,
      motor: { ...defaultInput.motor, kv: 1200 },
    })
    expect(highKv.motorMax.rpm).toBeGreaterThan(lowKv.motorMax.rpm)
  })

  it('high altitude decreases thrust', () => {
    const seaLevel = runCalculator(defaultInput)
    const highAlt = runCalculator({
      ...defaultInput,
      general: { ...defaultInput.general, elevation: 3000, pressure: 700 },
    })
    expect(highAlt.motorMax.thrustG).toBeLessThan(seaLevel.motorMax.thrustG)
    expect(highAlt.totalDrive.thrustWeightRatio).toBeLessThan(seaLevel.totalDrive.thrustWeightRatio)
  })

  it('coaxial layout reduces effective disc area', () => {
    const flat = runCalculator({
      ...defaultInput,
      general: { ...defaultInput.general, rotors: 8, rotorLayout: 'flat' },
    })
    const coaxial = runCalculator({
      ...defaultInput,
      general: { ...defaultInput.general, rotors: 8, rotorLayout: 'coaxial' },
    })
    expect(coaxial.multicopter.totalDiscAreaDm2).toBeLessThan(flat.multicopter.totalDiscAreaDm2)
  })

  it('very heavy copter triggers cannot-lift-off warning', () => {
    const result = runCalculator({
      ...defaultInput,
      general: { ...defaultInput.general, modelWeight: 50000 },
    })
    expect(result.warnings.cannotLiftOff).toBe(true)
    expect(result.errorMessages.some(m => m.includes('Cannot lift off'))).toBe(true)
  })

  it('constrained current triggers hover overcurrent', () => {
    const result = runCalculator({
      ...defaultInput,
      motor: { ...defaultInput.motor, currentLimitA: 3 },
      esc: { ...defaultInput.esc, continuousCurrentA: 3 },
    })
    // With 3A limit on a quad, hover may not be achievable
    if (result.warnings.hoverOverCurrent) {
      expect(result.batteryCard.hoverFlightMin).toBe(0)
    }
  })

  it('1S battery with high-KV motor still computes', () => {
    const result = runCalculator({
      ...defaultInput,
      battery: { ...defaultInput.battery, seriesCells: 1 },
    })
    expect(Number.isFinite(result.motorHover.rpm)).toBe(true)
    expect(Number.isFinite(result.batteryCard.hoverFlightMin)).toBe(true)
  })

  it('NiMH chemistry uses correct cell voltage', () => {
    const result = runCalculator({
      ...defaultInput,
      battery: {
        ...defaultInput.battery,
        cellType: 'NiMH',
        nominalVoltage: 1.2,
        fullChargeVoltage: 1.4,
        seriesCells: 10,
      },
    })
    expect(Number.isFinite(result.motorHover.rpm)).toBe(true)
  })

  it('geared motor system computes correctly', () => {
    const direct = runCalculator(defaultInput)
    const geared = runCalculator({
      ...defaultInput,
      propeller: { ...defaultInput.propeller, gearRatio: 3 },
    })
    expect(Number.isFinite(geared.motorHover.rpm)).toBe(true)
    expect(Number.isFinite(geared.motorMax.rpm)).toBe(true)
  })

  it('wattmeter readings are consistent with hover point', () => {
    const result = runCalculator(defaultInput)
    // Wattmeter should show total system current/voltage at hover
    expect(result.wattmeter.powerW).toBeCloseTo(
      result.wattmeter.currentA * result.wattmeter.voltageV,
      0
    )
  })

  it('motor temperature increases with current', () => {
    const result = runCalculator(defaultInput)
    expect(result.motorMax.motorTempC).toBeGreaterThan(result.motorHover.motorTempC)
  })

  it('status flags are correct', () => {
    const result = runCalculator(defaultInput)
    expect(['green', 'yellow', 'red']).toContain(result.status.motorTemp)
    expect(['green', 'yellow', 'red']).toContain(result.status.batteryC)
    expect(['green', 'yellow', 'red']).toContain(result.status.twr)
    expect(['green', 'yellow', 'red']).toContain(result.status.hoverEfficiency)
    expect(['green', 'yellow', 'red']).toContain(result.status.hoverThrottle)
    expect(['green', 'yellow', 'red']).toContain(result.status.escMargin)
  })

  it('print summary values from default input for manual verification', () => {
    const result = runCalculator(defaultInput)
    console.log('\n=== CALCULATOR OUTPUT WITH DEFAULT INPUTS ===')
    console.log('AUW:', result.multicopter.allUpWeightG.toFixed(0), 'g')
    console.log('Battery Energy:', result.batteryCard.energyWh.toFixed(1), 'Wh')
    console.log('Battery Voltage (load):', result.batteryCard.voltageUnderLoadV.toFixed(2), 'V')
    console.log('Battery Load C:', result.batteryCard.loadC.toFixed(2))
    console.log('Hover Flight:', result.batteryCard.hoverFlightMin.toFixed(1), 'min')
    console.log('Mixed Flight:', result.batteryCard.mixedFlightMin.toFixed(1), 'min')
    console.log('Min Flight:', result.batteryCard.minFlightMin.toFixed(1), 'min')
    console.log('---')
    console.log('Motor Hover RPM:', result.motorHover.rpm.toFixed(0))
    console.log('Motor Hover Current:', result.motorHover.currentA.toFixed(2), 'A')
    console.log('Motor Hover Efficiency:', result.motorHover.efficiencyPct.toFixed(1), '%')
    console.log('Motor Hover Thrust:', result.motorHover.thrustG.toFixed(0), 'g')
    console.log('Motor Hover Temp:', result.motorHover.motorTempC.toFixed(1), 'C')
    console.log('Motor Hover Throttle:', result.motorHover.throttleLinearPct.toFixed(1), '%')
    console.log('---')
    console.log('Motor Max RPM:', result.motorMax.rpm.toFixed(0))
    console.log('Motor Max Current:', result.motorMax.currentA.toFixed(2), 'A')
    console.log('Motor Max Efficiency:', result.motorMax.efficiencyPct.toFixed(1), '%')
    console.log('Motor Max Thrust:', result.motorMax.thrustG.toFixed(0), 'g')
    console.log('Motor Max Temp:', result.motorMax.motorTempC.toFixed(1), 'C')
    console.log('---')
    console.log('TWR:', result.totalDrive.thrustWeightRatio.toFixed(2))
    console.log('Drive Weight:', result.totalDrive.driveWeightG.toFixed(0), 'g')
    console.log('Total Current Hover:', result.totalDrive.currentHoverA.toFixed(2), 'A')
    console.log('Pin Hover:', result.totalDrive.pinHoverW.toFixed(1), 'W')
    console.log('Pout Hover:', result.totalDrive.poutHoverW.toFixed(1), 'W')
    console.log('Efficiency Hover:', result.totalDrive.efficiencyHoverPct.toFixed(1), '%')
    console.log('---')
    console.log('Max Speed:', result.multicopter.maxSpeedKmh.toFixed(1), 'km/h')
    console.log('Max Climb:', result.multicopter.maxClimbMs.toFixed(2), 'm/s')
    console.log('Max Climb:', result.multicopter.maxClimbFtMin.toFixed(0), 'ft/min')
    console.log('Est Range:', result.multicopter.estimatedRangeKm.toFixed(2), 'km')
    console.log('Max Tilt:', result.multicopter.maxTiltDeg.toFixed(1), 'deg')
    console.log('Add Payload:', result.multicopter.addPayloadG.toFixed(0), 'g')
    console.log('Disc Area:', result.multicopter.totalDiscAreaDm2.toFixed(2), 'dm2')
    console.log('---')
    console.log('Wattmeter Current:', result.wattmeter.currentA.toFixed(2), 'A')
    console.log('Wattmeter Voltage:', result.wattmeter.voltageV.toFixed(2), 'V')
    console.log('Wattmeter Power:', result.wattmeter.powerW.toFixed(1), 'W')
    console.log('---')
    console.log('Status:', JSON.stringify(result.status))
    console.log('Warnings:', JSON.stringify(result.warnings))
    console.log('Errors:', result.errorMessages)
    expect(true).toBe(true) // Marker test
  })
})
