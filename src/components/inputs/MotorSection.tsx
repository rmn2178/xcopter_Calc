import { useMemo, useState } from 'react'
import { motorDisplayName, motorPresets } from '../../data/presets'
import type { MotorInput } from '../../types'
import { InputRow, NumberInput } from './InputPrimitives'

interface Props {
  value: MotorInput
  onChange: (patch: Partial<MotorInput>) => void
  expertMode: boolean
}

export function MotorSection({ value, onChange, expertMode }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return motorPresets
    return motorPresets.filter((preset) =>
      `${preset.manufacturer} ${preset.series} ${preset.kv}`.toLowerCase().includes(q),
    )
  }, [search])

  const byManufacturer = useMemo(() => {
    const groups = new Map<string, typeof filtered>()
    for (const preset of filtered) {
      const rows = groups.get(preset.manufacturer) ?? []
      rows.push(preset)
      groups.set(preset.manufacturer, rows)
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  const applyPreset = (id: string) => {
    if (id === 'custom') {
      onChange({
        presetId: undefined,
        manufacturerModel: 'Custom',
      })
      return
    }

    const preset = motorPresets.find((item) => item.id === id)
    if (!preset) return
    onChange({
      presetId: id,
      manufacturerModel: `${preset.manufacturer} ${preset.series}`,
      kv: preset.kv,
      noLoadCurrentA: preset.I0_A,
      noLoadVoltage: preset.I0_at_V,
      currentLimitA: preset.limit_A,
      powerLimitW: preset.limit_W,
      statorResistanceMOhm: preset.Rm_mOhm,
      cooling: preset.cooling,
      caseLengthMm: preset.case_length_mm,
      statorDiameterMm: preset.stator_diameter_mm,
      statorHeightMm: preset.stator_height_mm,
      poles: preset.poles,
      weightG: preset.weight_g,
    })
  }

  return (
    <section className="panel-section">
      <h3>Motor {value.cooling === 'open' ? '🌬' : '🔒'}</h3>

      <InputRow label="Find Motor Preset">
        <input placeholder="Search manufacturer, series, Kv" value={search} onChange={(e) => setSearch(e.target.value)} />
      </InputRow>

      <InputRow label="Motor Preset">
        <select value={value.presetId ?? 'custom'} onChange={(e) => applyPreset(e.target.value)}>
          {byManufacturer.map(([manufacturer, options]) => (
            <optgroup key={manufacturer} label={manufacturer}>
              {options.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {motorDisplayName(preset)}
                </option>
              ))}
            </optgroup>
          ))}
          <option value="custom">Custom</option>
        </select>
      </InputRow>

      <InputRow label="Manufacturer / Model">
        <input value={value.manufacturerModel} onChange={(e) => onChange({ manufacturerModel: e.target.value })} />
      </InputRow>

      <InputRow label="Kv (rpm/V)">
        <NumberInput value={value.kv} step={1} onChange={(v) => onChange({ kv: v })} />
      </InputRow>

      {expertMode && (
        <InputRow label="No-load I0 (A)">
          <NumberInput value={value.noLoadCurrentA} step={0.01} onChange={(v) => onChange({ noLoadCurrentA: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="I0 Measured At V">
          <NumberInput value={value.noLoadVoltage} step={0.1} onChange={(v) => onChange({ noLoadVoltage: v })} />
        </InputRow>
      )}

      <InputRow label="Motor Current Limit (A)">
        <NumberInput value={value.currentLimitA} step={0.1} onChange={(v) => onChange({ currentLimitA: v })} />
      </InputRow>

      {expertMode && (
        <InputRow label="Motor Power Limit (W)">
          <NumberInput value={value.powerLimitW} step={1} onChange={(v) => onChange({ powerLimitW: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Stator Rm (mOhm)">
          <NumberInput value={value.statorResistanceMOhm} step={0.1} onChange={(v) => onChange({ statorResistanceMOhm: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Cooling">
          <select value={value.cooling} onChange={(e) => onChange({ cooling: e.target.value as MotorInput['cooling'] })}>
            <option value="open">Open frame</option>
            <option value="closed">Closed / Sealed</option>
          </select>
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Case Length (mm)">
          <NumberInput value={value.caseLengthMm} step={1} onChange={(v) => onChange({ caseLengthMm: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Stator Diameter (mm)">
          <NumberInput value={value.statorDiameterMm} step={1} onChange={(v) => onChange({ statorDiameterMm: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Stator Height (mm)">
          <NumberInput value={value.statorHeightMm} step={1} onChange={(v) => onChange({ statorHeightMm: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Magnetic Poles">
          <NumberInput value={value.poles} step={1} onChange={(v) => onChange({ poles: Math.round(v) })} />
        </InputRow>
      )}

      <InputRow label="Motor Weight (g)">
        <NumberInput value={value.weightG} step={0.1} onChange={(v) => onChange({ weightG: v })} />
      </InputRow>
    </section>
  )
}
