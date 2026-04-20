import type { CalculationWarnings } from '../../types'

interface Props {
  warnings: CalculationWarnings
}

const warningLabels: Array<[keyof CalculationWarnings, string]> = [
  ['cannotLiftOff', 'Total maximum thrust is lower than all-up weight (cannot lift off)'],
  ['overspin', 'RPM exceeds safe overspin threshold'],
  ['batteryOverloaded', 'Battery max C-rate/current exceeded'],
  ['hoverOverCurrent', 'Hover current exceeds available current limits'],
  ['voltageLimited', 'Pack voltage under load is below required back-EMF'],
]

export function WarningsCard({ warnings }: Props) {
  const active = warningLabels.filter(([key]) => warnings[key])

  return (
    <section className="warnings-card">
      <h3>Validation Warnings</h3>
      {active.length === 0 ? (
        <p className="ok-line">No critical warnings.</p>
      ) : (
        <ul>
          {active.map(([key, label]) => (
            <li key={key}>{label}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
