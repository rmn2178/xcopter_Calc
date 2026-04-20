import type { AccessoriesInput } from '../../types'
import { InputRow, NumberInput } from './InputPrimitives'

interface Props {
  value: AccessoriesInput
  onChange: (patch: Partial<AccessoriesInput>) => void
}

export function AccessoriesSection({ value, onChange }: Props) {
  return (
    <section className="panel-section">
      <h3>Accessories</h3>

      <InputRow label="Accessory Current (A)">
        <NumberInput value={value.currentDrainA} step={0.1} onChange={(v) => onChange({ currentDrainA: v })} />
      </InputRow>

      <InputRow label="Accessory Weight (g)">
        <NumberInput value={value.weightG} step={0.1} onChange={(v) => onChange({ weightG: v })} />
      </InputRow>
    </section>
  )
}
