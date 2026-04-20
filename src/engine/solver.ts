import type { InputState } from '../types'
import { currentForRpmWithSag, kvEffective, rpmFromCurrent } from './motor'
import { thrustFromRpmGrams } from './propeller'

interface HoverSolveContext {
  input: InputState
  vOc: number
  rPack: number
  rho: number
  rho0: number
  tConst: number
  diameterInch: number
}

export interface HoverSolution {
  rpm: number
  currentA: number
  thrustPerMotorG: number
}

export function solveHoverPoint(ctx: HoverSolveContext, targetThrustG: number): HoverSolution {
  const rotors = ctx.input.general.rotors
  const accessoryA = ctx.input.accessories.currentDrainA
  const kvEff = kvEffective(ctx.input.motor.kv, ctx.input.propeller.gearRatio)

  let low = 0
  let high = kvEff * ctx.vOc
  let bestRpm = 0

  for (let i = 0; i < 50; i += 1) {
    const mid = (low + high) / 2
    const thrust = thrustFromRpmGrams(mid, ctx.rho, ctx.rho0, {
      diameterInch: ctx.diameterInch,
      pitchInch: 0,
      blades: ctx.input.propeller.blades,
      tConst: ctx.tConst,
      pConst: 0,
      gearRatio: ctx.input.propeller.gearRatio,
    })

    if (thrust > targetThrustG) {
      high = mid
    } else {
      low = mid
    }

    bestRpm = mid
    if (Math.abs(high - low) < 0.1) {
      break
    }
  }

  const currentA = currentForRpmWithSag(bestRpm, ctx.vOc, ctx.rPack, accessoryA, rotors, {
    kv: ctx.input.motor.kv,
    i0: ctx.input.motor.noLoadCurrentA,
    rmOhm: ctx.input.motor.statorResistanceMOhm / 1000,
    rEscOhm: ctx.input.esc.internalResistanceMOhm / 1000,
    poles: ctx.input.motor.poles,
    gearRatio: ctx.input.propeller.gearRatio,
  })

  return {
    rpm: bestRpm,
    currentA,
    thrustPerMotorG: thrustFromRpmGrams(bestRpm, ctx.rho, ctx.rho0, {
      diameterInch: ctx.diameterInch,
      pitchInch: 0,
      blades: ctx.input.propeller.blades,
      tConst: ctx.tConst,
      pConst: 0,
      gearRatio: ctx.input.propeller.gearRatio,
    }),
  }
}

export function solveCurrentForTargetRpm(
  targetRpm: number,
  input: InputState,
  vOc: number,
  rPack: number,
): number {
  let low = input.motor.noLoadCurrentA
  let high = Math.max(input.esc.burstCurrentA, input.motor.currentLimitA, 120)

  for (let i = 0; i < 50; i += 1) {
    const mid = (low + high) / 2
    const rpm = rpmFromCurrent(mid, vOc, rPack, input.accessories.currentDrainA, input.general.rotors, {
      kv: input.motor.kv,
      i0: input.motor.noLoadCurrentA,
      rmOhm: input.motor.statorResistanceMOhm / 1000,
      rEscOhm: input.esc.internalResistanceMOhm / 1000,
      poles: input.motor.poles,
      gearRatio: input.propeller.gearRatio,
    })

    if (rpm > targetRpm) {
      low = mid
    } else {
      high = mid
    }

    if (Math.abs(high - low) < 0.1) {
      break
    }
  }

  return (low + high) / 2
}
