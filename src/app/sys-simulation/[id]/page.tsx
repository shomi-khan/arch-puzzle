'use client'

/**
 * src/app/sys-simulation/[id]/page.tsx
 *
 * Builder page - where the user constructs their architecture and runs the simulation.
 *
 * WHY CLIENT COMPONENT:
 * React Flow requires browser APIs. Builder state is interactive and belongs
 * in client-side React state.
 */

import Link from 'next/link'
import { use } from 'react'
import Canvas from '@/components/simulation/Canvas'
import BuilderSidebar from '@/components/simulation/BuilderSidebar'
import ComponentPalette from '@/components/simulation/ComponentPalette'
import MobileBlock from '@/components/simulation/MobileBlock'
import ProblemHeader from '@/components/simulation/ProblemHeader'
import { ResultOverlay } from '@/components/simulation/ResultOverlay'
import { ValidationErrors } from '@/components/simulation/ValidationErrors'
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

export default function ChallengeBuilderPage({
  params,
}: ChallengeBuilderPageProps) {
  const { id } = use(params)
  const problem = getProblemById(id)

  if (!problem) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Challenge not found
          </h1>
          <Link
            href="/sys-simulation"
            className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Back to challenges
          </Link>
        </div>
      </main>
    )
  }

  if (!isUnlocked(problem)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Complete the previous challenge first
          </h1>
          <Link
            href="/sys-simulation"
            className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Back to challenges
          </Link>
        </div>
      </main>
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
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <MobileBlock />
      <div className="hidden h-screen flex-col lg:flex">
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
        <div className="flex min-h-0 flex-1">
          <ComponentPalette
            availableComponents={problem.availableComponents}
            disabled={structuralChangesDisabled}
          />
          <section className="relative flex min-w-0 flex-1 flex-col">
            {validationResult && !validationResult.valid ? (
              <div className="bg-slate-100 p-4 dark:bg-slate-900">
                <ValidationErrors errors={validationResult.errors} />
              </div>
            ) : null}
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
          </section>
          <BuilderSidebar
            simState={simState}
            initialBudget={problem.initialBudget}
          />
        </div>
      </div>
    </main>
  )
}
