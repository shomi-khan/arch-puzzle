'use client'

/**
 * src/components/simulation/ChallengeGrid.tsx
 *
 * Client Component - renders the challenge card grid with unlock state.
 *
 * WHY CLIENT COMPONENT:
 * Unlock state is derived from localStorage via src/lib/progress.ts.
 * localStorage is only available in the browser, so this component must
 * be a Client Component. The Server Component page passes problem data
 * down as props - no data fetching happens here.
 *
 * On first render, all challenges appear locked as an SSR-safe default.
 * After hydration, useEffect reads localStorage and updates unlock state.
 */

import { useEffect, useState } from 'react'
import type { Problem } from '@/types'
import { getSolvedIds } from '@/lib/progress'
import ChallengeCard from './ChallengeCard'

interface ChallengeGridProps {
  /** All problems passed down from the SSR page - never fetched client-side */
  problems: Problem[]
}

export default function ChallengeGrid({ problems }: ChallengeGridProps) {
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSolvedIds(getSolvedIds())
    setHydrated(true)
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {problems.map((problem) => {
        const unlocked =
          hydrated &&
          (problem.unlocksAfter === null || solvedIds.has(problem.unlocksAfter))
        const solved = hydrated && solvedIds.has(problem.id)

        return (
          <ChallengeCard
            key={problem.id}
            problem={problem}
            unlocked={unlocked}
            solved={solved}
          />
        )
      })}
    </div>
  )
}
