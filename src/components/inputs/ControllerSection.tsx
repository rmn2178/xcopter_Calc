import type { EscInput } from '../../types'
import { InputRow, NumberInput } from './InputPrimitives'

interface Props {
  value: EscInput
  onChange: (patch: Partial<EscInput>) => void
}

export function ControllerSection({ value, onChange }: Props) {
  return (
    <section className="panel-section">
      <h3>Controller (ESC)</h3>

      <InputRow label="ESC Type">
        <input value={value.escType} onChange={(e) => onChange({ escType: e.target.value })} />
      </InputRow>

      <InputRow label="Continuous Current (A)">
        <NumberInput value={value.continuousCurrentA} step={0.1} onChange={(v) => onChange({ continuousCurrentA: v })} />
      </InputRow>

      <InputRow label="Burst Current (A)">
        <NumberInput value={value.burstCurrentA} step={0.1} onChange={(v) => onChange({ burstCurrentA: v })} />
      </InputRow>

      <InputRow label="Internal R (mOhm)">
        <NumberInput value={value.internalResistanceMOhm} step={0.1} onChange={(v) => onChange({ internalResistanceMOhm: v })} />
      </InputRow>

      <InputRow label="ESC Weight (g)">
        <NumberInput value={value.weightG} step={0.1} onChange={(v) => onChange({ weightG: v })} />
      </InputRow>
    </section>
  )
}
