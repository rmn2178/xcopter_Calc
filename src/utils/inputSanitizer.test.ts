import { describe, expect, it } from 'vitest'
import { defaultInput } from '../defaults'
import { sanitizeInputState } from './inputSanitizer'

describe('sanitizeInputState', () => {
  it('clamps extreme values into safe ranges', () => {
    const bad = structuredClone(defaultInput)
    bad.general.rotors = 999 as never
    bad.motor.kv = -100 as never
    bad.battery.seriesCells = 0 as never
    bad.propeller.gearRatio = 1000 as never

    const safe = sanitizeInputState(bad)

    expect(safe.general.rotors).toBeLessThanOrEqual(16)
    expect(safe.general.rotors).toBeGreaterThanOrEqual(1)
    expect(safe.motor.kv).toBeGreaterThanOrEqual(50)
    expect(safe.battery.seriesCells).toBeGreaterThanOrEqual(1)
    expect(safe.propeller.gearRatio).toBeLessThanOrEqual(20)
  })
})
