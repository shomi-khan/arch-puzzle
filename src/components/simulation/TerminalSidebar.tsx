'use client'

/**
 * src/components/simulation/TerminalSidebar.tsx
 *
 * Right sidebar — terminal log only, full height.
 *
 * WHY LOG ONLY (no stats):
 * Stats are in MetricsRow above the canvas — always visible.
 * This sidebar is dedicated entirely to the log narrative,
 * giving it maximum height and readability.
 *
 * The log tells the story of the simulation second by second —
 * cache hits, overloads, budget warnings, completion.
 * More log height = more context = better learning.
 */

import { useEffect, useRef } from 'react'
import type { LogEntry, SimulationState } from '@/types'

interface TerminalSidebarProps {
  /** Log entries produced by the engine — appended every tick */
  logs: LogEntry[]
  /** Simulation status — controls blinking cursor visibility */
  simStatus: SimulationState['status']
}

const levelColors: Record<LogEntry['level'], string> = {
  system: '#4b5563',
  info: '#3b82f6',
  warn: '#d97706',
  critical: '#ef4444',
  success: '#4ade80',
}

/**
 * TerminalSidebar - renders autoscrolling log with status-based cursor.
 */
export default function TerminalSidebar({
  logs,
  simStatus,
}: TerminalSidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new log entries
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#060d0a',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: '9px',
          color: '#1a3a1a',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '0.75rem',
          borderBottom: '1px solid #0d1f14',
          flexShrink: 0,
        }}
      >
        // log
      </div>

      {/* Log area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: '1.75',
          color: '#4b5563',
        }}
      >
        {logs.map((entry, idx) => (
          <div
            key={idx}
            style={{
              color: levelColors[entry.level],
              marginBottom: '0.25rem',
            }}
          >
            [{String(entry.second).padStart(2, '0')}:00] {entry.message}
          </div>
        ))}

        {/* Blinking cursor when running */}
        {simStatus === 'running' && (
          <div className="cursor-blink" style={{ color: '#378ADD' }}>
            █
          </div>
        )}
      </div>
    </div>
  )
}
