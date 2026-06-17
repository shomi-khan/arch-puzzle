'use client'

/**
 * src/components/simulation/ProblemHeader.tsx
 *
 * Top bar of the builder page - shows problem context and simulation controls.
 *
 * WHY THIS EXISTS:
 * The user needs to see the problem title, difficulty, remaining budget,
 * elapsed time, and simulation controls at all times while building.
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Problem, SimulationState } from '@/types'
import Badge from '@/components/ui/Badge'
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

function balanceColor(balance: number, initialBudget: number): string {
  const ratio = balance / initialBudget
  if (ratio > 0.5) return 'text-green-600 dark:text-green-400'
  if (ratio >= 0.2) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

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
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-950">
      <Link
        href="/sys-simulation"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-[var(--text-primary)]">
          {problem.title}
        </h1>
        <Badge label={problem.difficulty} variant={problem.difficulty} />
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={`text-sm font-semibold ${balanceColor(balance, problem.initialBudget)}`}>
            ${balance.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">balance</p>
        </div>
        <div className="font-mono text-sm font-medium text-[var(--text-primary)]">
          {formatTimer(elapsed)}
        </div>
        <div className="flex items-center gap-2">
          {simStatus === 'idle' ? (
            <Button variant="primary" onClick={onStart}>
              Start
            </Button>
          ) : null}
          {simStatus === 'running' ? (
            <>
              <Button variant="secondary" onClick={onPause}>
                Pause
              </Button>
              <Button variant="ghost" onClick={onReset}>
                Reset
              </Button>
            </>
          ) : null}
          {simStatus === 'paused' ? (
            <>
              <Button variant="primary" onClick={onResume}>
                Resume
              </Button>
              <Button variant="ghost" onClick={onReset}>
                Reset
              </Button>
            </>
          ) : null}
          {simStatus === 'completed' ? (
            <Button variant="secondary" onClick={onReset}>
              Reset
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
