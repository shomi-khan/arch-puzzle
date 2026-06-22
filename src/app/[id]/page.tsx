'use client'

/**
 * src/app/sys-simulation/[id]/page.tsx
 *
 * Builder page — where the user constructs their architecture and runs simulation.
 *
 * WHY CLIENT COMPONENT:
 * React Flow requires browser APIs (drag events, pointer events, ResizeObserver).
 * Simulation state runs via setInterval — server cannot run this.
 * Progress (locked/unlocked) is read from localStorage — browser only.
 */

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProblemById, getPrerequisite } from '@/problems'
import { isUnlocked } from '@/lib/progress'
import MobileBlock from '@/components/simulation/MobileBlock'
import Button from '@/components/ui/Button'

interface BuilderPageProps {
  /** Challenge ID from URL param (Promise in Next.js 16+) */
  params: Promise<{ id: string }>
}

type PageState = 'loading' | 'not-found' | 'locked' | 'ready'

/**
 * BuilderPage - main challenge builder and simulation runner.
 * Uses conditional rendering to only load the builder (with useSimulation hook)
 * after authentication checks pass.
 */
export default function BuilderPage({ params }: BuilderPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [prerequisiteTitle, setPrerequisiteTitle] = useState<string>('')

  // Check unlock status on mount
  useEffect(() => {
    const foundProblem = getProblemById(id)
    if (!foundProblem) {
      setPageState('not-found')
      return
    }

    if (!isUnlocked(foundProblem)) {
      const prerequisite = getPrerequisite(foundProblem)
      setPrerequisiteTitle(prerequisite?.title || 'Unknown')
      setPageState('locked')
      return
    }

    setPageState('ready')
  }, [id])

  // Not found state
  if (pageState === 'not-found') {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: '#0a0f1a' }}
      >
        <div className="max-w-md">
          <h2
            className="font-mono text-xs uppercase tracking-widest mb-6"
            style={{ color: '#334155' }}
          >
            // challenge not found
          </h2>
          <p
            className="text-sm mb-8 leading-relaxed"
            style={{ color: '#475569' }}
          >
            the id you requested does not exist.
          </p>
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
          >
            ← back to challenges
          </Button>
        </div>
      </div>
    )
  }

  // Locked state
  if (pageState === 'locked') {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: '#0a0f1a' }}
      >
        <div className="max-w-md">
          <h2
            className="font-mono text-xs uppercase tracking-widest mb-6"
            style={{ color: '#334155' }}
          >
            // challenge locked
          </h2>
          <p
            className="text-sm mb-8 leading-relaxed"
            style={{ color: '#475569' }}
          >
            complete &quot;<span style={{ color: '#94a3b8' }}>
              {prerequisiteTitle}
            </span>&quot; first.
          </p>
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
          >
            ← back to challenges
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (pageState === 'loading') {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#0a0f1a' }}
      >
        <div
          className="font-mono text-xs"
          style={{ color: '#475569' }}
        >
          loading...
        </div>
      </div>
    )
  }

  // Ready state - render builder with hook
  return <ChallengeBuilder problemId={id} />
}

// ── Separate component that uses the hook ────────────────────────────────────

import { useSimulation } from '@/hooks/useSimulation'
import Canvas from '@/components/simulation/Canvas'
import ComponentPalette from '@/components/simulation/ComponentPalette'
import ProblemHeader from '@/components/simulation/ProblemHeader'
import MetricsRow from '@/components/simulation/MetricsRow'
import TerminalSidebar from '@/components/simulation/TerminalSidebar'
import ValidationErrors from '@/components/simulation/ValidationErrors'
import ResultSummary from '@/components/simulation/ResultSummary'

interface ChallengeBuilderProps {
  problemId: string
}

/**
 * ChallengeBuilder — nested component that loads the hook only after
 * authentication checks pass. This prevents calling hooks with null data.
 */
function ChallengeBuilder({ problemId }: ChallengeBuilderProps) {
  const problem = getProblemById(problemId)

  if (!problem) {
    return null // Safety check, though shouldn't happen if parent validates
  }

  const {
    simState,
    canvasNodes,
    validationResult,
    handleStart,
    handlePause,
    handleResume,
    handleReset,
    handleNodesChange,
    handleEdgesChange,
    canvas,
  } = useSimulation(problem)

  return (
    <>
      {/* Mobile block */}
      <div className="block lg:hidden">
        <MobileBlock />
      </div>

      {/* Full builder — desktop only */}
      <div
        className="hidden lg:flex flex-col h-screen overflow-hidden"
        style={{ backgroundColor: '#0a0f1a' }}
      >
        {/* Top bar: title + controls */}
        <ProblemHeader
          problem={problem}
          simStatus={simState.status}
          balance={simState.balance}
          elapsed={simState.elapsed}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onReset={handleReset}
        />

        {/* Metrics row: full width below header */}
        <MetricsRow simState={simState} initialBudget={problem.initialBudget} />

        {/* problem description — shown in idle state only */}
        {simState.status === 'idle' && (
          <div className="
            px-4 py-2
            border-b border-[#1e293b]
            bg-[#0a0f1a]
            font-mono text-[10px] text-[#475569]
            whitespace-pre-line leading-relaxed
          ">
            {problem.description.trim()}
          </div>
        )}

        {/* Main area: palette + canvas + terminal */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: component palette */}
          <div
            className="w-[130px] flex-shrink-0 overflow-y-auto p-2"
            style={{ borderRight: '1px solid #131b28', backgroundColor: '#0a0f1a' }}
          >
            <ComponentPalette
              availableComponents={problem.availableComponents}
              disabled={
                simState.status === 'running' || simState.status === 'paused'
              }
            />
          </div>

          {/* Center: canvas + validation errors */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {validationResult && !validationResult.valid && (
              <ValidationErrors errors={validationResult.errors} />
            )}
            <div className="flex-1 relative">
              <Canvas
                nodes={canvasNodes}
                edges={canvas.edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                disabled={
                  simState.status === 'running' ||
                  simState.status === 'paused'
                }
              />
              {/* Result overlay when simulation completes */}
              {simState.status === 'completed' && simState.result && (
                <ResultSummary
                  result={simState.result}
                  problem={problem}
                  logs={simState.logs}
                  onReset={handleReset}
                />
              )}
            </div>
          </div>

          {/* Right: terminal log — full height */}
          <div
            className="w-[220px] flex-shrink-0"
            style={{ borderLeft: '1px solid #131b28' }}
          >
            <TerminalSidebar
              logs={simState.logs}
              simStatus={simState.status}
            />
          </div>
        </div>
      </div>
    </>
  )
}
