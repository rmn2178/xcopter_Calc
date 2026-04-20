import type { ReactNode } from 'react'

interface RowProps {
  label: string
  children: ReactNode
}

export function InputRow({ label, children }: RowProps) {
  return (
    <label className="input-row">
      <span>{label}</span>
      <div className="input-controls">{children}</div>
    </label>
  )
}

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
}

export function NumberInput({ value, onChange, step = 1, min, max }: NumberInputProps) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
      step={step}
      min={min}
      max={max}
    />
  )
}
