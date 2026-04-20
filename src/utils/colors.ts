export type TrafficColor = 'green' | 'yellow' | 'red'

export function statusClass(color: TrafficColor): string {
  if (color === 'green') return 'status-green'
  if (color === 'yellow') return 'status-yellow'
  return 'status-red'
}

export function motorTempStatus(tempC: number): TrafficColor {
  if (tempC < 60) return 'green'
  if (tempC <= 80) return 'yellow'
  return 'red'
}

export function batteryCStatus(cRate: number, maxC: number): TrafficColor {
  const ratio = maxC <= 0 ? 1 : cRate / maxC
  if (ratio < 0.6) return 'green'
  if (ratio <= 0.9) return 'yellow'
  return 'red'
}

export function twrStatus(twr: number): TrafficColor {
  if (twr > 2) return 'green'
  if (twr >= 1.3) return 'yellow'
  return 'red'
}

export function hoverEfficiencyStatus(efficiencyPct: number): TrafficColor {
  if (efficiencyPct > 75) return 'green'
  if (efficiencyPct >= 55) return 'yellow'
  return 'red'
}

export function hoverThrottleStatus(throttlePct: number): TrafficColor {
  if (throttlePct < 50) return 'green'
  if (throttlePct <= 70) return 'yellow'
  return 'red'
}

export function escMarginStatus(currentA: number, escContinuousA: number): TrafficColor {
  const headroom = 1 - currentA / Math.max(escContinuousA, 1e-6)
  if (headroom > 0.3) return 'green'
  if (headroom >= 0.1) return 'yellow'
  return 'red'
}
