/**
 * src/components/simulation/ResultSummary.tsx
 *
 * Full-screen overlay shown when simulation completes.
 *
 * WHY AN OVERLAY (not a separate page):
 * The user's architecture remains visible behind the overlay.
 * This reinforces the connection between their decisions and outcome —
 * they can see what they built while reading their results.
 * Navigating to a separate page would break that connection.
 *
 * LAYOUT: left-right split
 * Left:  score + requirements checklist + metrics grid + action buttons
 * Right: full simulation log (continued from builder) + XP at bottom
 *
 * The log on the right is the SAME log from the builder terminal —
 * it continues the narrative, ending with the score announcement and XP.
 * This makes the result feel like a natural conclusion, not a new screen.
 */

'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { evaluateSuccessConditions } from '@/engine/scorer'
import type { LogEntry, Problem, SimulationResult } from '@/types'
import SuccessConditions from './SuccessConditions'

interface ResultSummaryProps {
  /** The completed simulation result */
  result: SimulationResult
  /** The challenge that was just played */
  problem: Problem
  /** Full log from simulation — shown in right panel */
  logs: LogEntry[]
  /** Called when user clicks reset / try again */
  onReset: () => void
}

const levelColors: Record<LogEntry['level'], string> = {
  system: '#4b5563',
  info: '#3b82f6',
  warn: '#d97706',
  critical: '#ef4444',
  success: '#4ade80',
}

const sectionHeaderClass =
  'text-[9px] text-[#334155] uppercase tracking-widest'

function formatTime(second: number): string {
  return `${String(second).padStart(2, '0')}:00`
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#4ade80'
  if (score >= 50) return '#fbbf24'
  return '#ef4444'
}

/**
 * ResultSummary - renders the completed simulation report modal overlay.
 */
export default function ResultSummary({
  result,
  problem,
  logs,
  onReset,
}: ResultSummaryProps) {
  const router = useRouter()
  const logRef = useRef<HTMLDivElement>(null)
  const conditions = evaluateSuccessConditions(result, problem)
  const scoreColor = getScoreColor(result.finalScore)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [])

  const metrics = [
    {
      label: 'peak rps',
      value: `${result.peakRps.toLocaleString()} req/s`,
    },
    {
      label: 'avg latency',
      value: `${result.avgLatencyMs}ms`,
    },
    {
      label: 'p95 latency',
      value: `${result.p95LatencyMs}ms`,
    },
    {
      label: 'availability',
      value: `${result.availability}%`,
    },
    {
      label: 'cache hit',
      value: `${(result.cacheHitRatio * 100).toFixed(0)}%`,
    },
    {
      label: 'dropped req',
      value: result.droppedRequests.toLocaleString(),
    },
    {
      label: 'infra cost',
      value: `$${result.totalInfraCost.toLocaleString()}`,
    },
    {
      label: 'final balance',
      value: `$${result.finalBalance.toLocaleString()}`,
    },
  ]

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="
          flex w-full max-w-3xl max-h-[90vh]
          bg-[#0a0f1a] border border-[#1e293b] rounded-md
          overflow-hidden shadow-2xl
        "
      >
        {/* Left panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Score section */}
          <div>
            <div className={`${sectionHeaderClass} mb-4`}>// result</div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-5xl font-medium"
                style={{ color: scoreColor }}
              >
                {result.finalScore}
              </span>
              <span className="text-xl text-[#334155]">/ 100</span>
            </div>
            <div
              className={[
                'text-xs mt-1',
                result.passed ? 'text-[#4ade80]' : 'text-[#ef4444]',
              ].join(' ')}
            >
              {result.passed
                ? '✓ challenge passed.'
                : '✗ requirements not met.'}
            </div>
          </div>

          {/* Requirements section */}
          <div>
            <div className={`${sectionHeaderClass} mt-6 mb-3`}>
              // requirements
            </div>
            <SuccessConditions conditions={conditions} />
          </div>

          {/* Metrics section */}
          <div>
            <div className={`${sectionHeaderClass} mt-6 mb-3`}>// metrics</div>
            <div className="grid grid-cols-2 gap-2">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-sm px-3 py-2"
                  style={{
                    backgroundColor: '#0f172a',
                    border: '0.5px solid #1e293b',
                  }}
                >
                  <div className="text-[9px] text-[#475569] uppercase tracking-wide mb-1">
                    {metric.label}
                  </div>
                  <div className="text-sm font-medium text-[#94a3b8]">
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-6">
            {result.passed && (
              <button
                type="button"
                onClick={() => router.push('/sys-simulation')}
                className="px-3 py-1 text-xs rounded-sm font-mono bg-[#0d2a0d] text-[#4ade80] border border-[#1a3a1a]"
              >
                ▶ next challenge
              </button>
            )}
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-1 text-xs rounded-sm font-mono bg-[#1e293b] text-[#64748b] border border-[#334155]"
            >
              ↺ try again
            </button>
            <button
              type="button"
              onClick={() => router.push('/sys-simulation')}
              className="px-3 py-1 text-xs rounded-sm font-mono bg-[#1e293b] text-[#64748b] border border-[#334155]"
            >
              ← back to list
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div
          className="w-[220px] flex-shrink-0 flex flex-col border-l border-[#1e293b]"
          style={{ backgroundColor: '#060d0a' }}
        >
          <div className="text-[9px] text-[#1a3a1a] uppercase tracking-widest px-3 py-2 border-b border-[#0d1f14] flex-shrink-0">
            // log
          </div>

          <div
            ref={logRef}
            className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed"
          >
            {logs.map((entry, idx) => (
              <div
                key={idx}
                className="whitespace-nowrap overflow-hidden text-ellipsis mb-1"
              >
                <span className="text-[#334155]">
                  [{formatTime(entry.second)}]
                </span>{' '}
                <span style={{ color: levelColors[entry.level] }}>
                  {entry.message}
                </span>
              </div>
            ))}
          </div>

          {result.passed && (
            <div className="border-t border-[#0d1f14] px-3 py-3 flex-shrink-0">
              <div className="text-[9px] text-[#1a3a1a] uppercase tracking-widest mb-2">
                // xp earned
              </div>
              <div className="text-lg font-medium text-[#378ADD]">
                +{result.researchXp}
              </div>
              <div className="text-[10px] text-[#334155]">research funds</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
