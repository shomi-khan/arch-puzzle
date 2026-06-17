'use client'

/**
 * src/components/simulation/BuilderSidebar.tsx
 *
 * Right sidebar - shows live simulation metrics and the terminal log.
 *
 * WHY THIS EXISTS:
 * During simulation, the user needs real-time feedback: uptime, latency,
 * req/s, and budget. The terminal log provides a narrative of events.
 */

import type { SimulationState } from '@/types'
import StatCard from '@/components/ui/StatCard'
import Terminal from '@/components/ui/Terminal'

interface BuilderSidebarProps {
  /** Current simulation state - drives all displayed values */
  simState: SimulationState
  /** Initial budget - used to determine balance color thresholds */
  initialBudget: number
}

type StatStatus = 'healthy' | 'warning' | 'critical' | 'neutral'

function balanceStatus(balance: number, initialBudget: number): StatStatus {
  const ratio = balance / initialBudget
  if (ratio > 0.5) return 'healthy'
  if (ratio > 0.2) return 'warning'
  return 'critical'
}

function uptimeStatus(uptime: number | null): StatStatus {
  if (uptime === null) return 'neutral'
  if (uptime >= 99) return 'healthy'
  if (uptime >= 95) return 'warning'
  return 'critical'
}

function latencyStatus(latency: number | null): StatStatus {
  if (latency === null) return 'neutral'
  if (latency <= 100) return 'healthy'
  if (latency <= 300) return 'warning'
  return 'critical'
}

export default function BuilderSidebar({
  simState,
  initialBudget,
}: BuilderSidebarProps) {
  const latest = simState.tickHistory[simState.tickHistory.length - 1]
  const totalReqs = simState.tickHistory.reduce(
    (sum, tick) => sum + tick.trafficRps,
    0,
  )
  const totalDropped = simState.tickHistory.reduce(
    (sum, tick) => sum + tick.droppedRequests,
    0,
  )
  const uptime =
    totalReqs > 0 ? ((totalReqs - totalDropped) / totalReqs) * 100 : null
  const latency = latest?.avgLatencyMs ?? null

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <StatCard
        label="Uptime"
        value={uptime === null ? '—' : `${uptime.toFixed(1)}%`}
        status={uptimeStatus(uptime)}
      />
      <StatCard
        label="Avg Latency"
        value={latency === null ? '—' : `${Math.round(latency)}ms`}
        status={latencyStatus(latency)}
      />
      <StatCard
        label="Req/s"
        value={(latest?.trafficRps ?? 0).toLocaleString()}
        status="neutral"
      />
      <StatCard
        label="Balance"
        value={`$${simState.balance.toLocaleString()}`}
        status={balanceStatus(simState.balance, initialBudget)}
      />
      <div className="min-h-0 flex-1">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Terminal
        </p>
        <Terminal logs={simState.logs} heightClass="h-full min-h-64" />
      </div>
    </aside>
  )
}
