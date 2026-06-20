'use client'

/**
 * src/components/simulation/ProblemHeader.tsx
 *
 * Top bar of the builder page.
 * Shows problem title, difficulty, elapsed timer, and simulation controls.
 * Controls are always visible — Start/Pause/Resume/Reset depending on status.
 */

import Link from 'next/link'
import type { Problem, SimulationState } from '@/types'
import Button from '@/components/ui/Button'

interface ProblemHeaderProps {
  /** The current challenge being played */
  problem: Problem
  /** Current simulation status - controls which buttons are visible */
  simStatus: SimulationState['status']
  /** Remaining budget to display */
  balance: number
  /** Elapsed simulation seconds */
  elapsed: number
  /** Called when user clicks Start */
  onStart: () => void
  /** Called when user clicks Pause */
  onPause: () => void
  /** Called when user clicks Resume */
  onResume: () => void
  /** Called when user clicks Reset */
  onReset: () => void
}

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

const difficultyColors: Record<string, { bg: string; text: string }> = {
  beginner: { bg: '#0d2a0d', text: '#4ade80' },
  easy: { bg: '#0a2a20', text: '#34d399' },
  medium: { bg: '#2a1f0d', text: '#f59e0b' },
  hard: { bg: '#2a1500', text: '#fb923c' },
  expert: { bg: '#2a0d0d', text: '#ef4444' },
}

/**
 * ProblemHeader - renders challenge context and simulation controls.
 */
export default function ProblemHeader({
  problem,
  simStatus,
  balance,
  elapsed,
  onStart,
  onPause,
  onResume,
  onReset,
}: ProblemHeaderProps) {
  const diffColors = difficultyColors[problem.difficulty]

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        backgroundColor: '#0f172a',
        borderBottom: '0.5px solid #1e293b',
        padding: '0 1rem',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}
    >
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link
          href="/sys-simulation"
          style={{
            color: '#475569',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
        >
          ← challenges
        </Link>
        <div style={{ color: '#1e293b' }}>|</div>
        <span style={{ color: '#94a3b8' }}>{problem.title}</span>
        <div
          style={{
            backgroundColor: diffColors.bg,
            color: diffColors.text,
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '10px',
            fontFamily: 'monospace',
          }}
        >
          {problem.difficulty}
        </div>
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ color: '#475569', fontFamily: 'monospace' }}>
          {formatTimer(elapsed)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {simStatus === 'idle' && (
            <Button variant="primary" onClick={onStart}>
              ▶ start
            </Button>
          )}
          {simStatus === 'running' && (
            <>
              <Button variant="secondary" onClick={onPause}>
                ⏸ pause
              </Button>
              <Button variant="ghost" onClick={onReset}>
                ↺ reset
              </Button>
            </>
          )}
          {simStatus === 'paused' && (
            <>
              <Button variant="primary" onClick={onResume}>
                ▶ resume
              </Button>
              <Button variant="ghost" onClick={onReset}>
                ↺ reset
              </Button>
            </>
          )}
          {simStatus === 'completed' && (
            <Button variant="ghost" onClick={onReset}>
              ↺ reset
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
