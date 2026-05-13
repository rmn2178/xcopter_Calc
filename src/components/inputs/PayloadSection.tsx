import type { GeneralInput } from '../../types'
import { InputRow, NumberInput } from './InputPrimitives'

interface Props {
  value: Pick<GeneralInput, 'payloadWeightG' | 'payloadWeightUnit'>
  onChange: (patch: Partial<Pick<GeneralInput, 'payloadWeightG' | 'payloadWeightUnit'>>) => void
}

export function PayloadSection({ value, onChange }: Props) {
  return (
    <section className="panel-section">
      <h3>Payload</h3>
      <InputRow label="Payload Weight">
        <NumberInput value={value.payloadWeightG} step={1} onChange={(v) => onChange({ payloadWeightG: v })} />
        <select
          value={value.payloadWeightUnit}
          onChange={(e) => onChange({ payloadWeightUnit: e.target.value as GeneralInput['payloadWeightUnit'] })}
        >
          <option value="g">g</option>
          <option value="oz">oz</option>
        </select>
      </InputRow>
    </section>
  )
}
