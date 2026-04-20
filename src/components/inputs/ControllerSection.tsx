import { useMemo, useState } from 'react'
import { escDisplayName, escPresets } from '../../data/presets'
import type { EscInput } from '../../types'
import { InputRow, NumberInput } from './InputPrimitives'

interface Props {
  value: EscInput
  onChange: (patch: Partial<EscInput>) => void
  expertMode: boolean
}

export function ControllerSection({ value, onChange, expertMode }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return escPresets
    return escPresets.filter((preset) => `${preset.manufacturer} ${preset.model}`.toLowerCase().includes(q))
  }, [search])

  const applyPreset = (id: string) => {
    if (id === 'custom') {
      onChange({ presetId: undefined, escType: 'Custom' })
      return
    }

    const preset = escPresets.find((item) => item.id === id)
    if (!preset) return
    onChange({
      presetId: id,
      escType: `${preset.manufacturer} ${preset.model}`,
      continuousCurrentA: preset.A_cont,
      burstCurrentA: preset.A_burst,
      internalResistanceMOhm: preset.Rm_mOhm,
      voltageMax: preset.voltage_max,
      protocol: preset.protocol,
      weightG: preset.weight_g,
    })
  }

  return (
    <section className="panel-section">
      <h3>Controller (ESC)</h3>

      <InputRow label="Find ESC Preset">
        <input placeholder="Search manufacturer or model" value={search} onChange={(e) => setSearch(e.target.value)} />
      </InputRow>

      <InputRow label="ESC Preset">
        <select value={value.presetId ?? 'custom'} onChange={(e) => applyPreset(e.target.value)}>
          {filtered.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {escDisplayName(preset)}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </InputRow>

      <InputRow label="ESC Type">
        <input value={value.escType} onChange={(e) => onChange({ escType: e.target.value })} />
      </InputRow>

      <InputRow label="Continuous Current (A)">
        <NumberInput value={value.continuousCurrentA} step={0.1} onChange={(v) => onChange({ continuousCurrentA: v })} />
      </InputRow>

      {expertMode && (
        <InputRow label="Burst Current (A)">
          <NumberInput value={value.burstCurrentA} step={0.1} onChange={(v) => onChange({ burstCurrentA: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Internal R (mOhm)">
          <NumberInput value={value.internalResistanceMOhm} step={0.1} onChange={(v) => onChange({ internalResistanceMOhm: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Max Voltage (V)">
          <NumberInput value={value.voltageMax} step={0.1} onChange={(v) => onChange({ voltageMax: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Protocol">
          <select value={value.protocol} onChange={(e) => onChange({ protocol: e.target.value as EscInput['protocol'] })}>
            <option value="PWM">PWM</option>
            <option value="DSHOT300">DSHOT300</option>
            <option value="DSHOT600">DSHOT600</option>
            <option value="BLHeli32">BLHeli32</option>
          </select>
        </InputRow>
      )}

      <InputRow label="ESC Weight (g)">
        <NumberInput value={value.weightG} step={0.1} onChange={(v) => onChange({ weightG: v })} />
      </InputRow>
    </section>
  )
}
