import type { MotorInput } from '../../types'
import { InputRow, NumberInput } from './InputPrimitives'

interface Props {
  value: MotorInput
  onChange: (patch: Partial<MotorInput>) => void
}

export function MotorSection({ value, onChange }: Props) {
  return (
    <section className="panel-section">
      <h3>Motor</h3>

      <InputRow label="Manufacturer / Model">
        <input value={value.manufacturerModel} onChange={(e) => onChange({ manufacturerModel: e.target.value })} />
      </InputRow>

      <InputRow label="Kv (rpm/V)">
        <NumberInput value={value.kv} step={1} onChange={(v) => onChange({ kv: v })} />
      </InputRow>

      <InputRow label="No-load I0 (A)">
        <NumberInput value={value.noLoadCurrentA} step={0.01} onChange={(v) => onChange({ noLoadCurrentA: v })} />
      </InputRow>

      <InputRow label="I0 Measured At V">
        <NumberInput value={value.noLoadVoltage} step={0.1} onChange={(v) => onChange({ noLoadVoltage: v })} />
      </InputRow>

      <InputRow label="Motor Current Limit (A)">
        <NumberInput value={value.currentLimitA} step={0.1} onChange={(v) => onChange({ currentLimitA: v })} />
      </InputRow>

      <InputRow label="Motor Power Limit (W)">
        <NumberInput value={value.powerLimitW} step={1} onChange={(v) => onChange({ powerLimitW: v })} />
      </InputRow>

      <InputRow label="Stator Rm (mOhm)">
        <NumberInput value={value.statorResistanceMOhm} step={0.1} onChange={(v) => onChange({ statorResistanceMOhm: v })} />
      </InputRow>

      <InputRow label="Case Length (mm)">
        <NumberInput value={value.caseLengthMm} step={1} onChange={(v) => onChange({ caseLengthMm: v })} />
      </InputRow>

      <InputRow label="Magnetic Poles">
        <NumberInput value={value.poles} step={1} onChange={(v) => onChange({ poles: Math.round(v) })} />
      </InputRow>

      <InputRow label="Motor Weight (g)">
        <NumberInput value={value.weightG} step={0.1} onChange={(v) => onChange({ weightG: v })} />
      </InputRow>
    </section>
  )
}
