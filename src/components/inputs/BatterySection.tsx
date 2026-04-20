import type { BatteryInput } from '../../types'
import { InputRow, NumberInput } from './InputPrimitives'

interface Props {
  value: BatteryInput
  onChange: (patch: Partial<BatteryInput>) => void
}

export function BatterySection({ value, onChange }: Props) {
  return (
    <section className="panel-section">
      <h3>Battery Cell</h3>

      <InputRow label="Cell Type">
        <select value={value.cellType} onChange={(e) => onChange({ cellType: e.target.value as BatteryInput['cellType'] })}>
          <option>LiPo</option>
          <option>LiHV</option>
          <option>Li-Ion</option>
          <option>NiMH</option>
          <option>Custom</option>
        </select>
      </InputRow>

      <InputRow label="Charge State">
        <select
          value={value.chargeState}
          onChange={(e) => onChange({ chargeState: e.target.value as BatteryInput['chargeState'] })}
        >
          <option value="full">full</option>
          <option value="normal">normal</option>
          <option value="low">low</option>
        </select>
      </InputRow>

      <InputRow label="Configuration S x P">
        <NumberInput value={value.seriesCells} min={1} step={1} onChange={(v) => onChange({ seriesCells: Math.round(v) })} />
        <NumberInput value={value.parallelCells} min={1} step={1} onChange={(v) => onChange({ parallelCells: Math.round(v) })} />
      </InputRow>

      <InputRow label="Cell Capacity (mAh)">
        <NumberInput value={value.cellCapacityMah} step={1} onChange={(v) => onChange({ cellCapacityMah: v })} />
      </InputRow>

      <InputRow label="Max Discharge (C)">
        <NumberInput value={value.maxDischargeC} step={0.1} onChange={(v) => onChange({ maxDischargeC: v })} />
      </InputRow>

      <InputRow label="Cell Internal R (mOhm)">
        <NumberInput
          value={value.internalResistanceMOhm}
          step={0.1}
          onChange={(v) => onChange({ internalResistanceMOhm: v })}
        />
      </InputRow>

      <InputRow label="Nominal Voltage (V)">
        <NumberInput value={value.nominalVoltage} step={0.01} onChange={(v) => onChange({ nominalVoltage: v })} />
      </InputRow>

      <InputRow label="Full Voltage (V)">
        <NumberInput value={value.fullChargeVoltage} step={0.01} onChange={(v) => onChange({ fullChargeVoltage: v })} />
      </InputRow>

      <InputRow label="Cell Weight (g)">
        <NumberInput value={value.cellWeightG} step={0.1} onChange={(v) => onChange({ cellWeightG: v })} />
      </InputRow>
    </section>
  )
}
