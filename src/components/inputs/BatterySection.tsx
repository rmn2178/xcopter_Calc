import { useMemo, useState } from 'react'
import { batteryDisplayName, batteryPresets } from '../../data/presets'
import type { BatteryInput } from '../../types'
import { InputRow, NumberInput } from './InputPrimitives'

interface Props {
  value: BatteryInput
  onChange: (patch: Partial<BatteryInput>) => void
  expertMode: boolean
}

const chemistryVoltages = {
  LiPo: { nominal: 3.7, full: 4.2 },
  LiHV: { nominal: 3.8, full: 4.35 },
  'Li-Ion': { nominal: 3.6, full: 4.2 },
  NiMH: { nominal: 1.25, full: 1.42 },
  Custom: { nominal: 3.7, full: 4.2 },
} as const

export function BatterySection({ value, onChange, expertMode }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return batteryPresets
    return batteryPresets.filter((preset) => `${preset.brand} ${preset.model}`.toLowerCase().includes(q))
  }, [search])

  const applyPreset = (id: string) => {
    if (id === 'custom') {
      onChange({ presetId: undefined, cellType: 'Custom' })
      return
    }

    const preset = batteryPresets.find((item) => item.id === id)
    if (!preset) return
    onChange({
      presetId: id,
      cellType: preset.chemistry,
      seriesCells: preset.S_default,
      parallelCells: preset.P_default,
      cellCapacityMah: preset.capacity_mAh,
      maxDischargeC: preset.C_cont,
      internalResistanceMOhm: preset.Rm_mOhm,
      nominalVoltage: preset.V_nominal,
      fullChargeVoltage: preset.V_full,
      cellWeightG: preset.weight_g,
    })
  }

  const applyChemistry = (chem: BatteryInput['cellType']) => {
    const v = chemistryVoltages[chem]
    onChange({ cellType: chem, nominalVoltage: v.nominal, fullChargeVoltage: v.full })
  }

  return (
    <section className="panel-section">
      <h3>Battery Cell</h3>

      <InputRow label="Find Battery Preset">
        <input placeholder="Search brand or model" value={search} onChange={(e) => setSearch(e.target.value)} />
      </InputRow>

      <InputRow label="Battery Preset">
        <select value={value.presetId ?? 'custom'} onChange={(e) => applyPreset(e.target.value)}>
          {filtered.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {batteryDisplayName(preset)}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </InputRow>

      <InputRow label="Cell Type">
        <select value={value.cellType} onChange={(e) => applyChemistry(e.target.value as BatteryInput['cellType'])}>
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

      {expertMode && (
        <InputRow label="Cell Internal R (mOhm)">
          <NumberInput
            value={value.internalResistanceMOhm}
            step={0.1}
            onChange={(v) => onChange({ internalResistanceMOhm: v })}
          />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Nominal Voltage (V)">
          <NumberInput value={value.nominalVoltage} step={0.01} onChange={(v) => onChange({ nominalVoltage: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Full Voltage (V)">
          <NumberInput value={value.fullChargeVoltage} step={0.01} onChange={(v) => onChange({ fullChargeVoltage: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Cell Weight (g)">
          <NumberInput value={value.cellWeightG} step={0.1} onChange={(v) => onChange({ cellWeightG: v })} />
        </InputRow>
      )}
    </section>
  )
}
