/**
 * src/components/simulation/MetricsRow.tsx
 *
 * Full-width metrics bar below ProblemHeader.
 * Shows 4 live stats: uptime, avg latency, req/s, balance.
 *
 * WHY SEPARATE FROM HEADER:
 * Header owns navigation and controls.
 * MetricsRow owns simulation feedback.
 * Keeping them separate makes each component focused and easier to update.
 *
 * In idle state, shows placeholder values.
 * Updates every tick during simulation via simState prop.
 */

import type { SimulationState } from '@/types'

interface MetricsRowProps {
  /** Full simulation state — metrics derived from tickHistory */
  simState: SimulationState
  /** Initial budget — used for balance color threshold calculation */
  initialBudget: number
}

/**
 * MetricsRow - renders 4-column metrics display with live simulation stats.
 */
export default function MetricsRow({ simState, initialBudget }: MetricsRowProps) {
  const latest = simState.tickHistory[simState.tickHistory.length - 1]

  // Uptime calculation
  const totalReqs = simState.tickHistory.reduce((s, t) => s + t.trafficRps, 0)
  const totalDropped = simState.tickHistory.reduce((s, t) => s + t.droppedRequests, 0)
  const uptime =
    totalReqs > 0
      ? ((totalReqs - totalDropped) / totalReqs * 100).toFixed(1) + '%'
      : '—'

  // Color helpers
  const uptimeColor = (): string => {
    if (uptime === '—') return '#475569'
    const percent = parseFloat(uptime)
    if (percent >= 99) return '#4ade80'
    if (percent >= 95) return '#fbbf24'
    return '#ef4444'
  }

  const latencyColor = (): string => {
    if (!latest) return '#475569'
    if (latest.avgLatencyMs <= 100) return '#4ade80'
    if (latest.avgLatencyMs <= 300) return '#fbbf24'
    return '#ef4444'
  }

  const balanceColor = (): string => {
    const ratio = simState.balance / initialBudget
    if (ratio > 0.5) return '#4ade80'
    if (ratio > 0.2) return '#fbbf24'
    return '#ef4444'
  }

  return (
    <div
      style={{
        backgroundColor: '#0a0f1a',
        borderBottom: '0.5px solid #1e293b',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
      }}
    >
      {/* Uptime */}
      <div style={{ padding: '0.75rem 1.25rem', borderRight: '1px solid #1e293b' }}>
        <div style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
          uptime
        </div>
        <div style={{ fontSize: '14px', fontFamily: 'monospace', color: uptimeColor() }}>
          {uptime}
        </div>
      </div>

      {/* Avg Latency */}
      <div style={{ padding: '0.75rem 1.25rem', borderRight: '1px solid #1e293b' }}>
        <div style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
          avg latency
        </div>
        <div style={{ fontSize: '14px', fontFamily: 'monospace', color: latencyColor() }}>
          {latest ? `${latest.avgLatencyMs}ms` : '—'}
        </div>
      </div>

      {/* Req/s */}
      <div style={{ padding: '0.75rem 1.25rem', borderRight: '1px solid #1e293b' }}>
        <div style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
          req/s
        </div>
        <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#94a3b8' }}>
          {latest ? latest.trafficRps : '0'}
        </div>
      </div>

      {/* Balance */}
      <div style={{ padding: '0.75rem 1.25rem' }}>
        <div style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
          balance
        </div>
        <div style={{ fontSize: '14px', fontFamily: 'monospace', color: balanceColor() }}>
          ${simState.balance.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
