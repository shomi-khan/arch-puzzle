/**
 * src/components/simulation/ResultSummary.tsx
 *
 * Wrapper component for result display that matches Step 6 spec.
 * Uses the existing ResultOverlay implementation.
 */

'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { evaluateSuccessConditions } from '@/engine/scorer'
import type { LogEntry, Problem, SimulationResult } from '@/types'
import ReportCard from './ReportCard'
import SuccessConditions from './SuccessConditions'

interface ResultSummaryProps {
  /** The completed simulation result containing all metrics and final score */
  result: SimulationResult
  /** The challenge that was just played - needed for success condition evaluation */
  problem: Problem
  /** Simulation logs for detailed review */
  logs: LogEntry[]
  /** Called when user clicks Try Again - resets simulation, closes overlay */
  onReset: () => void
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
  const conditions = evaluateSuccessConditions(result, problem)
  const scoreClass =
    result.finalScore >= 70
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-h-[80vh] max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className={`text-5xl font-bold ${scoreClass}`}>
            {result.finalScore}
          </div>
          <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
            {result.passed ? 'Challenge Passed! 🎉' : 'Requirements Not Met'}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-6">
          <ReportCard result={result} initialBudget={problem.initialBudget} />
        </div>

        {/* Success Conditions */}
        <div className="mb-6">
          <h3 className="mb-3 font-semibold text-[var(--text-primary)]">
            Requirements
          </h3>
          <SuccessConditions conditions={conditions} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="primary" onClick={onReset}>
            Try Again
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/sys-simulation')}
          >
            Back to Challenges
          </Button>
        </div>
      </div>
    </div>
  )
}
