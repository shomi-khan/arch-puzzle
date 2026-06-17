'use client'

/**
 * src/app/sys-simulation/[id]/page.tsx
 *
 * Builder page - final wired version.
 *
 * Edge cases handled:
 * 1. Problem not found (invalid id in URL) -> show not-found UI
 * 2. Problem locked (prerequisite not solved) -> show locked UI
 * 3. Problem found and unlocked -> show full builder
 *
 * WHY CLIENT COMPONENT:
 * React Flow requires browser APIs. Simulation state runs via setInterval.
 * Progress (locked/unlocked) is read from localStorage - browser only.
 * All three requirements make this a mandatory Client Component.
 */

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Canvas from '@/components/simulation/Canvas'
import BuilderSidebar from '@/components/simulation/BuilderSidebar'
import ComponentPalette from '@/components/simulation/ComponentPalette'
import MobileBlock from '@/components/simulation/MobileBlock'
import ProblemHeader from '@/components/simulation/ProblemHeader'
import { ResultOverlay } from '@/components/simulation/ResultOverlay'
import { ValidationErrors } from '@/components/simulation/ValidationErrors'
import Button from '@/components/ui/Button'
import { useSimulation } from '@/hooks/useSimulation'
import { isUnlocked } from '@/lib/progress'
import { getProblemById } from '@/problems'

interface ChallengeBuilderPageProps {
  /** Dynamic route params from /sys-simulation/[id] */
  params: Promise<{
    /** Problem id from the URL */
    id: string
  }>
}

/**
 * ChallengeBuilderPage - resolves challenge route state and renders the builder.
 */
export default function ChallengeBuilderPage({
  params,
}: ChallengeBuilderPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const problem = getProblemById(id)

  if (!problem) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-4xl" aria-hidden="true">
          🔍
        </div>
        <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">
          Challenge not found
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          The challenge you are looking for does not exist.
        </p>
        <Button
          variant="secondary"
          icon={<ArrowLeft size={16} />}
          onClick={() => router.push('/sys-simulation')}
        >
          Back to Challenges
        </Button>
      </div>
    )
  }

  if (!isUnlocked(problem)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-4xl" aria-hidden="true">
          🔒
        </div>
        <h2 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">
          Challenge locked
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Complete{' '}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {problem.unlocksAfter}
          </span>{' '}
          first to unlock this challenge.
        </p>
        <Button
          variant="secondary"
          icon={<ArrowLeft size={16} />}
          onClick={() => router.push('/sys-simulation')}
        >
          Back to Challenges
        </Button>
      </div>
    )
  }

  return <ChallengeBuilder problem={problem} />
}

interface ChallengeBuilderProps {
  /** Challenge loaded from the problem registry */
  problem: NonNullable<ReturnType<typeof getProblemById>>
}

/**
 * ChallengeBuilder - wires simulation state into the builder layout.
 */
function ChallengeBuilder({ problem }: ChallengeBuilderProps) {
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

  const structuralChangesDisabled =
    simState.status === 'running' || simState.status === 'paused'

  return (
    <>
      <div className="block lg:hidden">
        <MobileBlock />
      </div>

      <div className="hidden h-screen flex-col overflow-hidden lg:flex">
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

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ComponentPalette
            availableComponents={problem.availableComponents}
            disabled={structuralChangesDisabled}
          />

          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
            {validationResult && !validationResult.valid ? (
              <div className="px-4 pt-3">
                <ValidationErrors errors={validationResult.errors} />
              </div>
            ) : null}

            <div className="relative flex-1">
              <Canvas
                nodes={canvasNodes}
                edges={canvas.edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                disabled={structuralChangesDisabled}
              />
              {simState.status === 'completed' && simState.result ? (
                <ResultOverlay
                  result={simState.result}
                  problem={problem}
                  onReset={handleReset}
                />
              ) : null}
            </div>
          </div>

          <BuilderSidebar
            simState={simState}
            initialBudget={problem.initialBudget}
          />
        </div>
      </div>
    </>
  )
}
