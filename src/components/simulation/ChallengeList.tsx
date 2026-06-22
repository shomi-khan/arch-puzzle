'use client'

/**
 * src/components/simulation/ChallengeList.tsx
 *
 * Client Component — renders the challenge list with unlock/solved state.
 *
 * WHY CLIENT COMPONENT:
 * Unlock and solved state come from localStorage — browser only.
 * On first render (SSR-safe), all challenges appear locked.
 * After hydration, useEffect reads localStorage and updates state.
 * This prevents hydration mismatch errors.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Problem } from '@/types'
import { getSolvedIds, isUnlocked } from '@/lib/progress'

interface ChallengeListProps {
  /** All problems passed from SSR page — never fetched client-side */
  problems: Problem[]
}

const difficultyColors: Record<string, string> = {
  beginner: '#4ade80',
  easy: '#34d399',
  medium: '#f59e0b',
  hard: '#fb923c',
  expert: '#ef4444',
}

export default function ChallengeList({ problems }: ChallengeListProps) {
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setSolvedIds(getSolvedIds())
    setHydrated(true)
  }, [])

  const solvedCount = hydrated
    ? problems.filter((p) => solvedIds.has(p.id)).length
    : 0

  // Find next unsolved challenge
  const nextChallenge = problems.find(
    (p) => !solvedIds.has(p.id) && hydrated && isUnlocked(p),
  )

  return (
    <div className="text-left">
      <div>
        {problems.map((problem, index) => {
          const solved = hydrated && solvedIds.has(problem.id)
          const unlocked = hydrated && isUnlocked(problem)

          const handleClick = () => {
            if (unlocked) {
              router.push(`/${problem.id}`)
            }
          }

          return (
            <div
              key={problem.id}
              onClick={handleClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && unlocked) handleClick()
              }}
              role="button"
              tabIndex={unlocked ? 0 : -1}
              style={{
                display: 'grid',
                gridTemplateColumns: '20px 1fr 80px 80px',
                alignItems: 'start',
                gap: '1rem',
                padding: '0.75rem 0.75rem',
                borderRadius: '0.375rem',
                cursor: unlocked ? 'pointer' : 'not-allowed',
                opacity: unlocked ? 1 : 0.4,
                borderBottom:
                  index < problems.length - 1 ? '1px solid #131b28' : 'none',
                backgroundColor: unlocked ? 'transparent' : 'transparent',
                transition: 'background-color 0.15s',
              }}
              className={unlocked ? 'hover:bg-[#0f172a]' : ''}
            >
              {/* Prefix */}
              <div
                style={{
                  fontSize: '14px',
                  color: solved ? '#4ade80' : unlocked ? '#f59e0b' : '#475569',
                  fontFamily: 'monospace',
                }}
              >
                {solved ? '✓' : unlocked ? '▶' : '🔒'}
              </div>

              {/* Title + subtitle */}
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    color: unlocked ? '#e2e8f0' : '#475569',
                    fontFamily: 'monospace',
                  }}
                >
                  {problem.title.toLowerCase()}
                </div>
                <div className="mt-0.5 text-[10px]" style={{ color: '#334155', fontFamily: 'monospace' }}>
                  {problem.subtitle.toLowerCase()}
                </div>
              </div>

              {/* Difficulty */}
              <div
                style={{
                  fontSize: '11px',
                  color: unlocked
                    ? difficultyColors[problem.difficulty]
                    : '#334155',
                  fontFamily: 'monospace',
                }}
              >
                {problem.difficulty.toLowerCase()}
              </div>

              {/* Status */}
              <div
                style={{
                  fontSize: '11px',
                  color: solved ? '#4ade80' : '#475569',
                  fontFamily: 'monospace',
                  textAlign: 'right',
                }}
              >
                {solved ? '✓ solved' : unlocked ? '— unsolved' : 'locked'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {hydrated && (
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid #131b28',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#334155',
          }}
        >
          {solvedCount}/{problems.length} solved
          {nextChallenge && ` · next: ${nextChallenge.title.toLowerCase()}`}
          <span
            className="cursor-blink"
            style={{ color: '#378ADD', marginLeft: '0.25rem' }}
          >
            █
          </span>
        </div>
      )}
    </div>
  )
}
