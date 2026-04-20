import { useMemo, useState } from 'react'
import { propDisplayName, propPresets } from '../../data/presets'
import { derivePropConstants } from '../../engine/propeller'
import type { PropellerInput } from '../../types'
import { InputRow, NumberInput } from './InputPrimitives'

interface Props {
  value: PropellerInput
  onChange: (patch: Partial<PropellerInput>) => void
  expertMode: boolean
}

export function PropellerSection({ value, onChange, expertMode }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return propPresets
    return propPresets.filter((preset) => `${preset.brand} ${preset.model}`.toLowerCase().includes(q))
  }, [search])

  const applyPreset = (id: string) => {
    if (id === 'custom') {
      onChange({ presetId: undefined, propType: 'Custom' })
      return
    }

    const preset = propPresets.find((item) => item.id === id)
    if (!preset) return
    onChange({
      presetId: id,
      propType: `${preset.brand} ${preset.model}`,
      yokeTwistDeg: preset.twist_deg,
      diameter: preset.diameter_inch,
      diameterUnit: 'inch',
      pitch: preset.pitch_inch,
      pitchUnit: 'inch',
      blades: preset.blades,
      tConst: preset.TConst,
      pConst: preset.PConst,
      propWeightG: preset.weight_g,
    })
  }

  const updateGeometry = (patch: Partial<Pick<PropellerInput, 'diameter' | 'pitch' | 'blades' | 'yokeTwistDeg'>>) => {
    const next = { ...value, ...patch }
    const diameterIn = next.diameterUnit === 'inch' ? next.diameter : next.diameter * 0.03937
    const pitchIn = next.pitchUnit === 'inch' ? next.pitch : next.pitch * 0.03937
    const derived = derivePropConstants(diameterIn, pitchIn, next.blades, next.yokeTwistDeg)
    onChange({ ...patch, tConst: derived.tConst, pConst: derived.pConst, presetId: undefined })
  }

  return (
    <section className="panel-section">
      <h3>Propeller</h3>

      <InputRow label="Find Prop Preset">
        <input placeholder="Search brand or model" value={search} onChange={(e) => setSearch(e.target.value)} />
      </InputRow>

      <InputRow label="Prop Preset">
        <select value={value.presetId ?? 'custom'} onChange={(e) => applyPreset(e.target.value)}>
          {filtered.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {propDisplayName(preset)}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </InputRow>

      <InputRow label="Prop Type / Preset">
        <input value={value.propType} onChange={(e) => onChange({ propType: e.target.value })} />
      </InputRow>

      <InputRow label="Yoke Twist (deg)">
        <NumberInput value={value.yokeTwistDeg} min={-7} max={7} step={0.1} onChange={(v) => updateGeometry({ yokeTwistDeg: v })} />
      </InputRow>

      <InputRow label="Diameter">
        <NumberInput value={value.diameter} step={0.1} onChange={(v) => updateGeometry({ diameter: v })} />
        <select value={value.diameterUnit} onChange={(e) => onChange({ diameterUnit: e.target.value as PropellerInput['diameterUnit'] })}>
          <option value="inch">inch</option>
          <option value="mm">mm</option>
        </select>
      </InputRow>

      <InputRow label="Pitch">
        <NumberInput value={value.pitch} step={0.1} onChange={(v) => updateGeometry({ pitch: v })} />
        <select value={value.pitchUnit} onChange={(e) => onChange({ pitchUnit: e.target.value as PropellerInput['pitchUnit'] })}>
          <option value="inch">inch</option>
          <option value="mm">mm</option>
        </select>
      </InputRow>

      <InputRow label="Blade Count">
        <NumberInput value={value.blades} min={2} max={6} step={1} onChange={(v) => updateGeometry({ blades: Math.round(v) })} />
      </InputRow>

      {expertMode && (
        <InputRow label="Thrust Constant">
          <NumberInput value={value.tConst} step={0.001} onChange={(v) => onChange({ tConst: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Power Constant">
          <NumberInput value={value.pConst} step={0.001} onChange={(v) => onChange({ pConst: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Gear Ratio : 1">
          <NumberInput value={value.gearRatio} min={0.1} step={0.01} onChange={(v) => onChange({ gearRatio: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Prop Weight (g)">
          <NumberInput value={value.propWeightG} step={0.1} onChange={(v) => onChange({ propWeightG: v })} />
        </InputRow>
      )}
    </section>
  )
}
