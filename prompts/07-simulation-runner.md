````markdown
# Step 7 — Simulation Runner (Game Loop, State Management)

## Context
You are continuing to build **sys-simulation** — a system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Steps 1–6 are complete. Types, config, shared UI, problem data, engine, challenge list page, and canvas builder all exist.

Now wire up the **simulation runner** — the game loop that drives everything. This step connects the engine (`processTick`) to React state, making the canvas come alive during simulation.

---

## General rules

- TypeScript only. No `any`.
- Game loop runs via `setInterval` — must be properly cleaned up on unmount and reset.
- All engine calls are pure — pass current state in, apply returned updates to React state.
- Every function must have a JSDoc comment.
- Complex state transitions must have inline comments explaining why.
- No new UI components in this step — only logic wired into existing components.

---

## Files to create or update

```
src/hooks/useSimulation.ts                        ← new: custom hook — entire game loop lives here
src/app/sys-simulation/[id]/page.tsx              ← update: wire hook into page
src/components/simulation/Canvas.tsx              ← update: apply node state updates from engine
src/components/simulation/BuilderSidebar.tsx      ← update: live data flows in
src/components/simulation/ProblemHeader.tsx       ← update: controls call hook handlers
```

---

## `src/hooks/useSimulation.ts` — implement fully

```ts
/**
 * src/hooks/useSimulation.ts
 *
 * Custom React hook — owns the entire simulation game loop.
 *
 * WHY THIS EXISTS:
 * The simulation involves a setInterval that fires every second, calls the
 * engine's processTick(), applies node state updates, accumulates tick history,
 * writes log entries, deducts budget, and checks for simulation end conditions.
 *
 * Keeping all of this in a custom hook achieves two things:
 * 1. The builder page component stays clean — it just calls useSimulation()
 *    and gets back handlers and state.
 * 2. The game loop logic is testable and portable — it has no JSX dependencies.
 *
 * STATE MACHINE:
 * idle → running → paused → running → completed
 *                         ↘ reset →  idle
 *
 * STALE CLOSURE STRATEGY:
 * setInterval captures variables at the time the interval is created.
 * If we read canvasNodes/canvasEdges directly inside runTick, we get stale
 * values — the canvas state frozen at the moment Start was clicked.
 *
 * Fix: canvas state is mirrored into a ref (canvasRef) that is always kept
 * in sync with React state. runTick reads from the ref, not from state,
 * so it always sees the latest canvas — even though in practice the canvas
 * cannot change during simulation (blocked by handlers).
 *
 * SimulationState is read via functional setState(prev => ...) — this always
 * gives the latest value regardless of when the interval was created.
 *
 * IMPORTANT:
 * - setInterval must be cleared on pause, reset, completion, and unmount.
 * - Canvas structural changes (add/remove nodes) are blocked while running.
 * - On reset, all simulation state returns to initial values.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import type { Problem, SimulationState, CanvasState, CanvasNode, LogEntry } from '@/types'
import { processTick } from '@/engine/simulator'
import { calculateResult } from '@/engine/scorer'
import { validateArchitecture, type ValidationResult } from '@/engine/validator'
import { markSolved } from '@/lib/progress'

/** Everything the builder page needs from the simulation hook */
export interface UseSimulationReturn {
  /** Full simulation state — drives sidebar, header, and result display */
  simState: SimulationState
  /** Current canvas nodes — updated every tick with load state from engine */
  canvasNodes: CanvasNode[]
  /** Validation errors — set when user tries to start with invalid architecture */
  validationResult: ValidationResult | null
  /** Start the simulation — validates first, then begins game loop */
  handleStart: () => void
  /** Pause the running simulation */
  handlePause: () => void
  /** Resume a paused simulation */
  handleResume: () => void
  /** Reset everything back to initial state */
  handleReset: () => void
  /** Update canvas nodes (called by Canvas on drag/drop) — blocked during simulation */
  handleNodesChange: (nodes: CanvasNode[]) => void
  /** Update canvas edges (called by Canvas on connect) — blocked during simulation */
  handleEdgesChange: (edges: CanvasState['edges']) => void
  /** Full canvas state — passed to Canvas component */
  canvas: CanvasState
}

/**
 * useSimulation — drives the entire simulation lifecycle.
 *
 * @param problem - The current challenge being played
 * @returns Handlers, state, and canvas state for the builder page
 */
export function useSimulation(problem: Problem): UseSimulationReturn {
  // ── Canvas state ───────────────────────────────────────────────────────────
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([])
  const [canvasEdges, setCanvasEdges] = useState<CanvasState['edges']>([])

  // ── Simulation state ───────────────────────────────────────────────────────
  const [simState, setSimState] = useState<SimulationState>(() => makeInitialSimState(problem))

  // ── Validation errors ──────────────────────────────────────────────────────
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  // ── Refs ───────────────────────────────────────────────────────────────────

  /**
   * intervalRef holds the setInterval id so we can clear it from anywhere.
   * Using a ref (not state) prevents the interval id from triggering re-renders.
   */
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /**
   * canvasRef mirrors canvas state so runTick always reads fresh values.
   *
   * WHY THIS IS NECESSARY:
   * setInterval creates a closure over variables at the time it is called.
   * If runTick read canvasNodes/canvasEdges from the closure, it would see
   * the values from when the interval was created — never updated values.
   *
   * By keeping canvasRef in sync with every state change, runTick can
   * read canvasRef.current and always get the current canvas — no stale data.
   *
   * In practice, canvas is blocked from changing during simulation, but
   * using a ref is still the correct pattern and avoids subtle bugs.
   */
  const canvasRef = useRef<CanvasState>({ nodes: [], edges: [] })

  /**
   * prevCacheHitRatioRef tracks the cache hit ratio from the previous tick.
   * Used by the engine to avoid emitting the same log message every second.
   */
  const prevCacheHitRatioRef = useRef<number>(0)

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Always clear interval when component unmounts — prevents memory leaks
      // and state updates on unmounted components
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // ── Clear validation errors when canvas changes ────────────────────────────
  useEffect(() => {
    if (validationResult) setValidationResult(null)
  }, [canvasNodes, canvasEdges])

  // ── Core tick handler ──────────────────────────────────────────────────────

  /**
   * runTick — processes one second of simulation time.
   *
   * Called by setInterval every 1000ms while simulation is running.
   *
   * WHY WE READ FROM canvasRef NOT canvasNodes:
   * setInterval captures runTick at creation time. If runTick referenced
   * canvasNodes directly, it would see the stale value from when the interval
   * started — never any updates made after that point.
   * canvasRef.current is a mutable object — always returns the latest value.
   *
   * WHY WE USE functional setState FOR simState:
   * Same stale closure problem. setState(prev => ...) always receives the
   * latest state as `prev`, regardless of when the interval was created.
   */
  const runTick = useCallback(() => {
    setSimState((prev) => {
      // Safety check — should not tick if not running
      if (prev.status !== 'running') return prev

      const currentSecond = prev.elapsed

      // Read canvas from ref — always fresh, never stale
      const canvas = canvasRef.current

      // ── Call the pure engine function ──────────────────────────────────────
      const tickOutput = processTick({
        second: currentSecond,
        canvas,
        problem,
        currentBalance: prev.balance,
        prevCacheHitRatio: prevCacheHitRatioRef.current,
      })

      // Update cache hit ratio ref for next tick
      prevCacheHitRatioRef.current = tickOutput.metrics.cacheHitRatio

      // ── Apply node state updates from engine to canvas ─────────────────────
      setCanvasNodes((prevNodes) =>
        prevNodes.map((node) => {
          const update = tickOutput.updatedNodes.find(
            (u) => u.instanceId === node.instanceId,
          )
          if (!update) return node
          return {
            ...node,
            loadPercent: update.loadPercent,
            status: update.status,
            currentLoadRps: update.currentLoadRps,
          }
        }),
      )

      const newElapsed = currentSecond + 1
      const newTickHistory = [...prev.tickHistory, tickOutput.metrics]
      const newLogs = [...prev.logs, ...tickOutput.logs]

      // ── Check if simulation has completed ──────────────────────────────────
      const simulationComplete = newElapsed >= problem.durationSeconds

      if (simulationComplete) {
        // Stop the interval — simulation is done
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        // Calculate final result using all tick history
        const result = calculateResult(newTickHistory, problem, canvas)

        // If the user passed, mark this problem as solved in localStorage
        if (result.passed) {
          markSolved(problem.id)
        }

        const completionLog: LogEntry = {
          second: newElapsed,
          level: 'system',
          message: `Simulation complete. Final score: ${result.finalScore}/100. ${result.passed ? '✓ Challenge passed!' : '✗ Requirements not met.'}`,
        }

        return {
          ...prev,
          status: 'completed',
          elapsed: newElapsed,
          balance: tickOutput.metrics.balance,
          logs: [...newLogs, completionLog],
          tickHistory: newTickHistory,
          result,
        }
      }

      // ── Simulation still running — return updated state ────────────────────
      return {
        ...prev,
        elapsed: newElapsed,
        balance: tickOutput.metrics.balance,
        logs: newLogs,
        tickHistory: newTickHistory,
      }
    })
  }, [problem])
  // NOTE: canvasNodes and canvasEdges are intentionally NOT in the dependency
  // array — runTick reads canvas from canvasRef.current instead to avoid
  // recreating the interval callback on every canvas change.

  // ── Control handlers ───────────────────────────────────────────────────────

  /**
   * handleStart — validates architecture, then begins the game loop.
   * Shows validation errors if the canvas is not ready.
   */
  const handleStart = useCallback(() => {
    const canvas = canvasRef.current

    // Validate before starting — never run simulation on invalid architecture
    const validation = validateArchitecture(canvas)
    if (!validation.valid) {
      setValidationResult(validation)
      return
    }

    // Clear any previous validation errors
    setValidationResult(null)

    const startLog: LogEntry = {
      second: 0,
      level: 'system',
      message: 'Simulation thread initialized. Traffic flowing...',
    }

    setSimState((prev) => ({
      ...prev,
      status: 'running',
      logs: [...prev.logs, startLog],
    }))

    // Start the game loop — fires runTick every 1000ms
    intervalRef.current = setInterval(runTick, 1000)
  }, [runTick])

  /**
   * handlePause — suspends the game loop without losing state.
   * The interval is cleared but elapsed time and tick history are preserved.
   */
  const handlePause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setSimState((prev) => ({
      ...prev,
      status: 'paused',
      logs: [
        ...prev.logs,
        { second: prev.elapsed, level: 'system', message: 'Simulation paused.' },
      ],
    }))
  }, [])

  /**
   * handleResume — restarts the game loop from where it was paused.
   * Does NOT reset elapsed time or tick history.
   */
  const handleResume = useCallback(() => {
    setSimState((prev) => ({
      ...prev,
      status: 'running',
      logs: [
        ...prev.logs,
        { second: prev.elapsed, level: 'system', message: 'Simulation resumed.' },
      ],
    }))
    // Restart the interval — runTick picks up from current elapsed via prev.elapsed
    intervalRef.current = setInterval(runTick, 1000)
  }, [runTick])

  /**
   * handleReset — stops simulation and returns everything to initial state.
   * Canvas structure (nodes + edges) is preserved — user keeps their architecture.
   * Node load states are reset to idle.
   */
  const handleReset = useCallback(() => {
    // Stop the interval first — always do this before touching state
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Reset cache hit ratio tracking
    prevCacheHitRatioRef.current = 0

    // Reset node visual state to idle — preserve positions and connections
    setCanvasNodes((prev) =>
      prev.map((node) => ({
        ...node,
        loadPercent: 0,
        currentLoadRps: 0,
        status: 'idle' as const,
      })),
    )

    // Sync canvasRef nodes to match reset node states
    canvasRef.current = {
      ...canvasRef.current,
      nodes: canvasRef.current.nodes.map((node) => ({
        ...node,
        loadPercent: 0,
        currentLoadRps: 0,
        status: 'idle' as const,
      })),
    }

    // Reset simulation state to initial
    setSimState(makeInitialSimState(problem))
    setValidationResult(null)
  }, [problem])

  // ── Canvas change handlers ─────────────────────────────────────────────────

  /**
   * handleNodesChange — updates canvas node list and syncs canvasRef.
   * Blocked during simulation to prevent structural changes mid-run.
   *
   * WHY WE SYNC canvasRef HERE:
   * Every time canvas state changes, we mirror it into canvasRef so that
   * runTick always has access to the latest canvas without stale closure issues.
   */
  const handleNodesChange = useCallback(
    (nodes: CanvasNode[]) => {
      // Block structural changes while simulation is active
      if (simState.status === 'running' || simState.status === 'paused') return
      setCanvasNodes(nodes)
      // Keep ref in sync — runTick reads from here
      canvasRef.current = { ...canvasRef.current, nodes }
    },
    [simState.status],
  )

  /**
   * handleEdgesChange — updates canvas edge list and syncs canvasRef.
   * Blocked during simulation to prevent structural changes mid-run.
   */
  const handleEdgesChange = useCallback(
    (edges: CanvasState['edges']) => {
      // Block structural changes while simulation is active
      if (simState.status === 'running' || simState.status === 'paused') return
      setCanvasEdges(edges)
      // Keep ref in sync — runTick reads from here
      canvasRef.current = { ...canvasRef.current, edges }
    },
    [simState.status],
  )

  return {
    simState,
    canvasNodes,
    validationResult,
    handleStart,
    handlePause,
    handleResume,
    handleReset,
    handleNodesChange,
    handleEdgesChange,
    canvas: { nodes: canvasNodes, edges: canvasEdges },
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Build the initial SimulationState for a given problem.
 * Extracted to a function so it can be used both on mount and on reset.
 *
 * @param problem - The current challenge
 * @returns Fresh SimulationState with idle status and initial budget
 */
function makeInitialSimState(problem: Problem): SimulationState {
  return {
    status: 'idle',
    elapsed: 0,
    balance: problem.initialBudget,
    logs: [
      {
        second: 0,
        level: 'system',
        message: 'Initialization complete. Build your architecture and press Start.',
      },
    ],
    tickHistory: [],
    result: null,
  }
}
```

---

## `src/app/sys-simulation/[id]/page.tsx` — update

Wire `useSimulation` into the page. Replace manual state with hook output:

```tsx
/**
 * Replace existing canvas state and simulation state with the hook.
 * The hook owns all state — the page just connects props to components.
 */

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

// Pass to ProblemHeader:
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

// Pass to Canvas:
<Canvas
  nodes={canvasNodes}
  edges={canvas.edges}
  onNodesChange={handleNodesChange}
  onEdgesChange={handleEdgesChange}
  disabled={simState.status === 'running' || simState.status === 'paused'}
/>

// Pass to BuilderSidebar:
<BuilderSidebar
  simState={simState}
  initialBudget={problem.initialBudget}
/>

// Show validation errors above canvas if present:
{validationResult && !validationResult.valid && (
  <ValidationErrors errors={validationResult.errors} />
)}

// Show result overlay when completed:
{simState.status === 'completed' && simState.result && (
  <ResultOverlay
    result={simState.result}
    problem={problem}
    onReset={handleReset}
  />
)}
```

---

## `src/components/simulation/ResultOverlay.tsx` — create (placeholder for Step 8)

```tsx
/**
 * src/components/simulation/ResultOverlay.tsx
 *
 * Displayed when simulation completes — shows score and pass/fail.
 * Full implementation in Step 8. This placeholder exists so the game
 * loop can be tested end-to-end without waiting for Step 8.
 */

'use client'

import type { SimulationResult, Problem } from '@/types'
import { Button } from '@/components/ui/Button'

interface ResultOverlayProps {
  /** The completed simulation result */
  result: SimulationResult
  /** The challenge that was just played */
  problem: Problem
  /** Called when user clicks Try Again */
  onReset: () => void
}

export function ResultOverlay({ result, onReset }: ResultOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="text-5xl mb-4">{result.passed ? '✅' : '❌'}</div>
        <div className="text-2xl font-bold mb-1">
          {result.passed ? 'Challenge Passed!' : 'Not Quite'}
        </div>
        <div className="text-4xl font-semibold my-4">
          {result.finalScore}
          <span className="text-slate-400 text-xl"> / 100</span>
        </div>
        {result.passed && (
          <div className="text-sm text-green-600 dark:text-green-400 mb-4">
            +{result.researchXp} XP earned
          </div>
        )}
        <Button variant="secondary" onClick={onReset} fullWidth>
          Try Again
        </Button>
      </div>
    </div>
  )
}
```

---

## `src/components/simulation/ValidationErrors.tsx` — create

```tsx
/**
 * src/components/simulation/ValidationErrors.tsx
 *
 * Displays architecture validation errors above the canvas.
 * Shown when user tries to start simulation with an invalid architecture.
 * Automatically dismissed when canvas changes (handled by useSimulation).
 */

'use client'

import type { ValidationError } from '@/engine/validator'

interface ValidationErrorsProps {
  /** List of validation errors to display */
  errors: ValidationError[]
}

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-sm mb-3">
      <div className="font-medium text-amber-800 dark:text-amber-300 mb-2">
        ⚠️ Cannot start simulation
      </div>
      <ul className="space-y-1">
        {errors.map((error) => (
          <li key={error.code} className="text-amber-700 dark:text-amber-400">
            • {error.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Verification checklist

- [ ] `npm run dev` — no TypeScript errors
- [ ] `npm run build` — passes cleanly
- [ ] Dragging components + connecting them, then clicking Start begins simulation
- [ ] Terminal logs appear every second during simulation
- [ ] StatCards in sidebar update every second (uptime, latency, req/s, balance)
- [ ] Node load bars animate during simulation
- [ ] Pause stops the timer and interval
- [ ] Resume continues from where it paused
- [ ] Reset clears all simulation state, node load bars return to idle
- [ ] Canvas drag-and-drop is blocked while simulation is running
- [ ] Simulation ends automatically at `problem.durationSeconds`
- [ ] On completion: ResultOverlay appears with score and pass/fail
- [ ] On pass: `markSolved` is called — challenge list shows it as solved after navigation
- [ ] Clicking Try Again in ResultOverlay resets and returns to builder
- [ ] Validation errors show when Start is clicked with empty canvas
- [ ] Validation errors disappear when canvas is modified
- [ ] No memory leaks — interval is cleared on unmount (verify by navigating away mid-simulation)
- [ ] No `any` types anywhere
- [ ] Every function has a JSDoc comment
- [ ] State transitions have inline comments explaining the reasoning
````