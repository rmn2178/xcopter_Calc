import type { PropellerInput } from '../../types'
import { InputRow, NumberInput } from './InputPrimitives'

interface Props {
  value: PropellerInput
  onChange: (patch: Partial<PropellerInput>) => void
}

export function PropellerSection({ value, onChange }: Props) {
  return (
    <section className="panel-section">
      <h3>Propeller</h3>

      <InputRow label="Prop Type / Preset">
        <input value={value.propType} onChange={(e) => onChange({ propType: e.target.value })} />
      </InputRow>

      <InputRow label="Yoke Twist (deg)">
        <NumberInput value={value.yokeTwistDeg} min={-7} max={7} step={0.1} onChange={(v) => onChange({ yokeTwistDeg: v })} />
      </InputRow>

      <InputRow label="Diameter">
        <NumberInput value={value.diameter} step={0.1} onChange={(v) => onChange({ diameter: v })} />
        <select value={value.diameterUnit} onChange={(e) => onChange({ diameterUnit: e.target.value as PropellerInput['diameterUnit'] })}>
          <option value="inch">inch</option>
          <option value="mm">mm</option>
        </select>
      </InputRow>

      <InputRow label="Pitch">
        <NumberInput value={value.pitch} step={0.1} onChange={(v) => onChange({ pitch: v })} />
        <select value={value.pitchUnit} onChange={(e) => onChange({ pitchUnit: e.target.value as PropellerInput['pitchUnit'] })}>
          <option value="inch">inch</option>
          <option value="mm">mm</option>
        </select>
      </InputRow>

      <InputRow label="Blade Count">
        <NumberInput value={value.blades} min={2} max={6} step={1} onChange={(v) => onChange({ blades: Math.round(v) })} />
      </InputRow>

      <InputRow label="Thrust Constant">
        <NumberInput value={value.tConst} step={0.001} onChange={(v) => onChange({ tConst: v })} />
      </InputRow>

      <InputRow label="Power Constant">
        <NumberInput value={value.pConst} step={0.001} onChange={(v) => onChange({ pConst: v })} />
      </InputRow>

      <InputRow label="Gear Ratio : 1">
        <NumberInput value={value.gearRatio} min={0.1} step={0.01} onChange={(v) => onChange({ gearRatio: v })} />
      </InputRow>

      <InputRow label="Prop Weight (g)">
        <NumberInput value={value.propWeightG} step={0.1} onChange={(v) => onChange({ propWeightG: v })} />
      </InputRow>
    </section>
  )
}
