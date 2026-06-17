'use client'

/**
 * src/components/simulation/ChallengeCard.tsx
 *
 * Displays a single challenge as a clickable card.
 *
 * States:
 * - Unlocked: clickable, navigates to /sys-simulation/[id]
 * - Locked: not clickable, shows lock icon and prerequisite guidance
 * - Solved: shows a checkmark badge in addition to normal state
 *
 * WHY SEPARATE COMPONENT:
 * Isolates the card's visual logic from the grid layout.
 * Makes it easy to change card design without touching grid logic.
 */

import { ArrowRight, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import { getPrerequisite } from '@/problems'
import type { Problem } from '@/types'

interface ChallengeCardProps {
  /** The problem data to display */
  problem: Problem
  /** Whether this challenge is available to play */
  unlocked: boolean
  /** Whether this challenge has already been completed */
  solved: boolean
}

const difficultyBorderStyles: Record<Problem['difficulty'], string> = {
  beginner: 'border-l-4 border-l-green-400',
  easy: 'border-l-4 border-l-teal-400',
  medium: 'border-l-4 border-l-amber-400',
  hard: 'border-l-4 border-l-orange-400',
  expert: 'border-l-4 border-l-red-400',
}

export default function ChallengeCard({
  problem,
  unlocked,
  solved,
}: ChallengeCardProps) {
  const router = useRouter()
  const prerequisite = getPrerequisite(problem)

  function handleClick() {
    if (unlocked) {
      router.push(`/sys-simulation/${problem.id}`)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!unlocked}
      title={unlocked ? problem.title : 'Complete previous challenge'}
      className={[
        'relative flex min-h-48 w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left dark:border-slate-700 dark:bg-slate-800',
        difficultyBorderStyles[problem.difficulty],
        unlocked
          ? 'cursor-pointer transition-all duration-150 hover:border-blue-400 hover:shadow-md dark:hover:border-blue-500'
          : 'cursor-not-allowed opacity-60',
        solved ? 'ring-1 ring-green-400 dark:ring-green-500' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <Badge
          label={problem.difficulty}
          variant={problem.difficulty}
          className="capitalize"
        />
        {solved ? (
          <Badge label="✓ Solved" variant="success" />
        ) : unlocked ? (
          <ArrowRight className="h-4 w-4 text-[var(--text-secondary)]" />
        ) : (
          <Lock className="h-4 w-4 text-[var(--text-secondary)]" />
        )}
      </div>

      <div className="mt-6 flex-1">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          {problem.title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
          {problem.subtitle}
        </p>
      </div>

      <div className="mt-3 text-xs text-[var(--text-secondary)]">
        {unlocked ? (
          <span>
            {problem.durationSeconds}s {' · '} $
            {problem.initialBudget.toLocaleString()} budget
          </span>
        ) : (
          <span className="italic">
            Complete &quot;{prerequisite?.title ?? 'previous challenge'}&quot; to unlock
          </span>
        )}
      </div>
    </button>
  )
}
