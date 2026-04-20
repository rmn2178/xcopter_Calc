import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
}

export function OutputCard({ title, children }: Props) {
  return (
    <section className="output-card">
      <h3>{title}</h3>
      <div className="metrics">{children}</div>
    </section>
  )
}

interface MetricProps {
  label: string
  value: string
  statusClassName?: string
}

export function Metric({ label, value, statusClassName }: MetricProps) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong className={statusClassName}>{value}</strong>
    </div>
  )
}
