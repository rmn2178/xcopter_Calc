import type { GeneralInput } from '../../types'
import { InputRow, NumberInput } from './InputPrimitives'

interface Props {
  value: GeneralInput
  onChange: (patch: Partial<GeneralInput>) => void
  expertMode: boolean
}

export function GeneralSection({ value, onChange, expertMode }: Props) {
  return (
    <section className="panel-section">
      <h3>General</h3>
      <InputRow label="Model Weight">
        <NumberInput value={value.modelWeight} onChange={(v) => onChange({ modelWeight: v })} />
        <select
          value={value.modelWeightUnit}
          onChange={(e) => onChange({ modelWeightUnit: e.target.value as GeneralInput['modelWeightUnit'] })}
        >
          <option value="g">g</option>
          <option value="oz">oz</option>
        </select>
      </InputRow>

      <InputRow label="Weight Mode">
        <select
          value={value.weightMode}
          onChange={(e) => onChange({ weightMode: e.target.value as GeneralInput['weightMode'] })}
        >
          <option value="inclDrive">incl. Drive</option>
          <option value="lessBattery">less Battery</option>
          <option value="withoutDrive">without Drive</option>
        </select>
      </InputRow>

      <InputRow label="# of Rotors">
        <NumberInput value={value.rotors} min={2} step={1} onChange={(v) => onChange({ rotors: Math.round(v) })} />
      </InputRow>

      {expertMode && (
        <InputRow label="Rotor Layout">
          <select
            value={value.rotorLayout}
            onChange={(e) => onChange({ rotorLayout: e.target.value as GeneralInput['rotorLayout'] })}
          >
            <option value="flat">flat</option>
            <option value="coaxial">coaxial</option>
          </select>
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Frame Size (mm)">
          <NumberInput value={value.frameSizeMm} step={1} onChange={(v) => onChange({ frameSizeMm: v })} />
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="FCU Tilt Limit">
          <NumberInput
            value={value.fcuTiltLimitDeg}
            min={10}
            max={80}
            step={1}
            onChange={(v) => onChange({ fcuTiltLimitDeg: v })}
          />
          <label className="inline-check">
            <input
              type="checkbox"
              checked={value.noTiltLimit}
              onChange={(e) => onChange({ noTiltLimit: e.target.checked })}
            />
            no limit
          </label>
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Field Elevation">
          <NumberInput value={value.elevation} step={1} onChange={(v) => onChange({ elevation: v })} />
          <select
            value={value.elevationUnit}
            onChange={(e) => onChange({ elevationUnit: e.target.value as GeneralInput['elevationUnit'] })}
          >
            <option value="m">m ASL</option>
            <option value="ft">ft ASL</option>
          </select>
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Air Temperature">
          <NumberInput value={value.airTemp} step={0.1} onChange={(v) => onChange({ airTemp: v })} />
          <select
            value={value.airTempUnit}
            onChange={(e) => onChange({ airTempUnit: e.target.value as GeneralInput['airTempUnit'] })}
          >
            <option value="c">C</option>
            <option value="f">F</option>
          </select>
        </InputRow>
      )}

      {expertMode && (
        <InputRow label="Pressure (QNH)">
          <NumberInput value={value.pressure} step={0.01} onChange={(v) => onChange({ pressure: v })} />
          <select
            value={value.pressureUnit}
            onChange={(e) => onChange({ pressureUnit: e.target.value as GeneralInput['pressureUnit'] })}
          >
            <option value="hPa">hPa</option>
            <option value="inHg">inHg</option>
          </select>
        </InputRow>
      )}
    </section>
  )
}
