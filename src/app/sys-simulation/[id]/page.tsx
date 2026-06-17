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
import { use, useMemo, useState } from 'react'
import Canvas from '@/components/simulation/Canvas'
import BuilderSidebar from '@/components/simulation/BuilderSidebar'
import ComponentPalette from '@/components/simulation/ComponentPalette'
import MobileBlock from '@/components/simulation/MobileBlock'
import ProblemHeader from '@/components/simulation/ProblemHeader'
import { validateArchitecture } from '@/engine/validator'
import { isUnlocked } from '@/lib/progress'
import { getProblemById } from '@/problems'
import type { CanvasEdge, CanvasNode, SimulationState } from '@/types'

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
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  const [edges, setEdges] = useState<CanvasEdge[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const initialSimState = useMemo<SimulationState>(
    () => ({
      status: 'idle',
      elapsed: 0,
      balance: problem?.initialBudget ?? 0,
      logs: [
        {
          second: 0,
          level: 'system',
          message:
            'Initialization complete. Build your architecture and press Start.',
        },
      ],
      tickHistory: [],
      result: null,
    }),
    [problem?.initialBudget],
  )
  const [simState, setSimState] = useState<SimulationState>(initialSimState)

  function resetSimulation() {
    setSimState(initialSimState)
    setValidationErrors([])
  }

  function updateNodes(nextNodes: CanvasNode[]) {
    setNodes(nextNodes)
    setValidationErrors([])
  }

  function updateEdges(nextEdges: CanvasEdge[]) {
    setEdges(nextEdges)
    setValidationErrors([])
  }

  function startSimulation() {
    const result = validateArchitecture({ nodes, edges })

    if (!result.valid) {
      setValidationErrors(result.errors.map((error) => error.message))
      return
    }

    setValidationErrors([])
    setSimState((current) => ({ ...current, status: 'running' }))
  }

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

  const structuralChangesDisabled = simState.status === 'running'

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <MobileBlock />
      <div className="hidden h-screen flex-col lg:flex">
        <ProblemHeader
          problem={problem}
          simStatus={simState.status}
          balance={simState.balance}
          elapsed={simState.elapsed}
          onStart={startSimulation}
          onPause={() =>
            setSimState((current) => ({ ...current, status: 'paused' }))
          }
          onResume={() =>
            setSimState((current) => ({ ...current, status: 'running' }))
          }
          onReset={resetSimulation}
        />
        <div className="flex min-h-0 flex-1">
          <ComponentPalette
            availableComponents={problem.availableComponents}
            disabled={structuralChangesDisabled}
          />
          <section className="flex min-w-0 flex-1 flex-col">
            {validationErrors.length > 0 ? (
              <div className="bg-slate-100 p-4 dark:bg-slate-900">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100">
                  <p className="font-semibold">Cannot start simulation</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {validationErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
            <Canvas
              nodes={nodes}
              edges={edges}
              onNodesChange={updateNodes}
              onEdgesChange={updateEdges}
              disabled={structuralChangesDisabled}
            />
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
