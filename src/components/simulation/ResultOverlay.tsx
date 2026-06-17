'use client'

/**
 * src/components/simulation/ResultOverlay.tsx
 *
 * Displayed when simulation completes - shows score and pass/fail.
 */

import Button from '@/components/ui/Button'
import type { Problem, SimulationResult } from '@/types'

interface ResultOverlayProps {
  /** The completed simulation result */
  result: SimulationResult
  /** The challenge that was just played */
  problem: Problem
  /** Called when user clicks Try Again */
  onReset: () => void
}

/**
 * ResultOverlay - renders a compact completion result modal.
 */
export function ResultOverlay({
  result,
  problem,
  onReset,
}: ResultOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-1 text-2xl font-bold text-[var(--text-primary)]">
          {result.passed ? 'Challenge Passed' : 'Not Quite'}
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          {problem.title}
        </div>
        <div className="my-4 text-4xl font-semibold text-[var(--text-primary)]">
          {result.finalScore}
          <span className="text-xl text-slate-400"> / 100</span>
        </div>
        {result.passed ? (
          <div className="mb-4 text-sm text-green-600 dark:text-green-400">
            +{result.researchXp} XP earned
          </div>
        ) : (
          <div className="mb-4 text-sm text-[var(--text-secondary)]">
            Review the bottlenecks and try again.
          </div>
        )}
        <Button variant="secondary" onClick={onReset} fullWidth>
          Try Again
        </Button>
      </div>
    </div>
  )
}
