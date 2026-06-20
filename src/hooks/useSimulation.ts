'use client'

/**
 * src/hooks/useSimulation.ts
 *
 * Custom React hook — owns the entire simulation game loop.
 *
 * WHY THIS EXISTS:
 * The simulation involves a setInterval that fires every second, calls
 * processTick(), applies node state updates, accumulates tick history,
 * writes log entries, deducts budget, and checks for end conditions.
 *
 * Keeping all of this in a custom hook achieves two things:
 * 1. The builder page stays clean — just calls useSimulation() and
 *    gets back handlers and state.
 * 2. Game loop logic is portable — no JSX dependencies.
 *
 * STATE MACHINE:
 * idle → running → paused → running → completed
 *                         ↘ reset →  idle
 *
 * STALE CLOSURE STRATEGY:
 * setInterval captures variables at creation time — stale closure problem.
 * Canvas state is mirrored into canvasRef (always kept in sync).
 * runTick reads from canvasRef.current — always fresh, never stale.
 * SimulationState is read via functional setState(prev => ...) — always latest.
 *
 * IMPORTANT:
 * - setInterval must be cleared on pause, reset, completion, and unmount.
 * - Canvas structural changes blocked while running or paused.
 * - On reset, all simulation state returns to initial values.
 * - Canvas structure (nodes positions + edges) preserved on reset.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { processTick } from '@/engine/simulator'
import { calculateResult } from '@/engine/scorer'
import {
  validateArchitecture,
  type ValidationResult,
} from '@/engine/validator'
import { markSolved } from '@/lib/progress'
import type {
  CanvasNode,
  CanvasState,
  LogEntry,
  Problem,
  SimulationState,
} from '@/types'

/** Everything the builder page needs from the simulation hook */
export interface UseSimulationReturn {
  /** Full simulation state - drives sidebar, header, and result display */
  simState: SimulationState
  /** Current canvas nodes - updated every tick with load state from engine */
  canvasNodes: CanvasNode[]
  /** Validation errors from the most recent start attempt */
  validationResult: ValidationResult | null
  /** Start the simulation after validating the architecture */
  handleStart: () => void
  /** Pause the running simulation */
  handlePause: () => void
  /** Resume a paused simulation */
  handleResume: () => void
  /** Reset simulation state and node runtime state */
  handleReset: () => void
  /** Update canvas nodes from the React Flow canvas */
  handleNodesChange: (nodes: CanvasNode[]) => void
  /** Update canvas edges from the React Flow canvas */
  handleEdgesChange: (edges: CanvasState['edges']) => void
  /** Full canvas state passed to the React Flow canvas */
  canvas: CanvasState
}

/**
 * useSimulation — drives the entire simulation lifecycle.
 *
 * @param problem - The current challenge being played
 * @returns Handlers, state, and canvas state for the builder page
 */
export function useSimulation(problem: Problem): UseSimulationReturn {
  // ── Canvas state ────────────────────────────────────────────────────────────
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([])
  const [canvasEdges, setCanvasEdges] = useState<CanvasState['edges']>([])

  // ── Simulation state ────────────────────────────────────────────────────────
  const [simState, setSimState] = useState<SimulationState>(() =>
    makeInitialSimState(problem),
  )

  // ── Validation errors ───────────────────────────────────────────────────────
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null)

  // ── Refs ────────────────────────────────────────────────────────────────────

  /**
   * intervalRef — holds setInterval id so we can clear it from anywhere.
   * Ref (not state) so clearing the interval never triggers a re-render.
   */
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /**
   * canvasRef — mirrors canvas state so runTick always reads fresh values.
   *
   * WHY THIS IS NECESSARY:
   * setInterval creates a closure over variables at creation time.
   * If runTick read canvasNodes directly, it would see the stale value
   * from when the interval was created — never any updates.
   * canvasRef.current is mutable — always returns the latest value.
   */
  const canvasRef = useRef<CanvasState>({ nodes: [], edges: [] })

  /**
   * prevCacheHitRatioRef — tracks cache hit ratio from previous tick.
   * Used by the engine to avoid emitting the same log message every second.
   */
  const prevCacheHitRatioRef = useRef<number>(0)

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Clear interval on unmount — prevents memory leaks and
      // state updates on unmounted components
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // ── Core tick handler ───────────────────────────────────────────────────────

  /**
   * runTick — processes one second of simulation time.
   *
   * Called by setInterval every 1000ms while simulation is running.
   *
   * WHY canvasRef NOT canvasNodes:
   * setInterval captures runTick at creation. If runTick referenced
   * canvasNodes directly, it would always see the value from when
   * the interval started — stale closure.
   * canvasRef.current is always the latest canvas — no staleness.
   *
   * WHY functional setState FOR simState:
   * setState(prev => ...) always receives the latest state as prev,
   * regardless of when the interval was created.
   */
  const runTick = useCallback(() => {
    setSimState((prev) => {
      // Safety check — should not tick if not running
      if (prev.status !== 'running') return prev

      const currentSecond = prev.elapsed

      // Read canvas from ref — always fresh, never stale
      const canvas = canvasRef.current

      // ── Call the pure engine function ────────────────────────────────────
      const tickOutput = processTick({
        second: currentSecond,
        canvas,
        problem,
        currentBalance: prev.balance,
        prevCacheHitRatio: prevCacheHitRatioRef.current,
      })

      // Update cache hit ratio ref for next tick
      prevCacheHitRatioRef.current = tickOutput.metrics.cacheHitRatio

      // ── Apply node state updates from engine to canvas ───────────────────
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

      // ── Check simulation completion ──────────────────────────────────────
      const simulationComplete = newElapsed >= problem.durationSeconds

      if (simulationComplete) {
        // Stop the interval — simulation is done
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        // Calculate final result using all tick history
        const result = calculateResult(newTickHistory, problem, canvas)

        // Mark as solved in localStorage if passed
        if (result.passed) {
          markSolved(problem.id)
        }

        const completionLog: LogEntry = {
          second: newElapsed,
          level: result.passed ? 'success' : 'critical',
          message: `simulation complete. score: ${result.finalScore}/100. ${result.passed ? '✓ challenge passed.' : '✗ requirements not met.'}`,
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

      // ── Simulation still running ─────────────────────────────────────────
      return {
        ...prev,
        elapsed: newElapsed,
        balance: tickOutput.metrics.balance,
        logs: newLogs,
        tickHistory: newTickHistory,
      }
    })
  }, [problem])
  // NOTE: canvasNodes/canvasEdges intentionally NOT in deps —
  // runTick reads from canvasRef.current instead to avoid stale closure.

  // ── Control handlers ────────────────────────────────────────────────────────

  /**
   * handleStart — validates architecture, then begins the game loop.
   */
  const handleStart = useCallback(() => {
    const canvas = canvasRef.current

    // Validate before starting — never run on invalid architecture
    const validation = validateArchitecture(canvas)
    if (!validation.valid) {
      setValidationResult(validation)
      return
    }

    setValidationResult(null)

    const startLog: LogEntry = {
      second: 0,
      level: 'system',
      message: 'simulation thread initialized. traffic flowing...',
    }

    setSimState((prev) => ({
      ...prev,
      status: 'running',
      logs: [...prev.logs, startLog],
    }))

    // Start the game loop
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(runTick, 1000)
  }, [runTick])

  /**
   * handlePause — suspends the game loop without losing state.
   * Elapsed time and tick history are preserved.
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
        { second: prev.elapsed, level: 'system', message: 'simulation paused.' },
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
        { second: prev.elapsed, level: 'system', message: 'simulation resumed.' },
      ],
    }))
    // Restart interval — runTick picks up from current elapsed via prev.elapsed
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(runTick, 1000)
  }, [runTick])

  /**
   * handleReset — stops simulation and returns to initial state.
   * Canvas structure (node positions + edges) is preserved.
   * Node load states reset to idle.
   */
  const handleReset = useCallback(() => {
    // Stop interval first — always before touching state
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Reset cache hit ratio tracking
    prevCacheHitRatioRef.current = 0

    // Reset node visual state to idle — preserve positions and connections
    const resetNodes = canvasRef.current.nodes.map((node) => ({
      ...node,
      loadPercent: 0,
      currentLoadRps: 0,
      status: 'idle' as const,
    }))

    setCanvasNodes(resetNodes)

    // Sync canvasRef nodes to match reset state
    canvasRef.current = {
      ...canvasRef.current,
      nodes: resetNodes,
    }

    setSimState(makeInitialSimState(problem))
    setValidationResult(null)
  }, [problem])

  // ── Canvas change handlers ──────────────────────────────────────────────────

  /**
   * handleNodesChange — updates canvas node list and syncs canvasRef.
   * Blocked during simulation to prevent structural changes mid-run.
   *
   * WHY SYNC canvasRef:
   * Every canvas state change is mirrored to canvasRef so runTick
   * always has access to the latest canvas — stale closure prevention.
   */
  const handleNodesChange = useCallback(
    (nodes: CanvasNode[]) => {
      if (simState.status === 'running' || simState.status === 'paused') return
      setCanvasNodes(nodes)
      canvasRef.current = { ...canvasRef.current, nodes }
      setValidationResult(null)
    },
    [simState.status],
  )

  /**
   * handleEdgesChange — updates canvas edge list and syncs canvasRef.
   * Blocked during simulation to prevent structural changes mid-run.
   */
  const handleEdgesChange = useCallback(
    (edges: CanvasState['edges']) => {
      if (simState.status === 'running' || simState.status === 'paused') return
      setCanvasEdges(edges)
      canvasRef.current = { ...canvasRef.current, edges }
      setValidationResult(null)
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * makeInitialSimState — build the initial SimulationState for a given problem.
 * Extracted so it can be used on both mount and reset.
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
        message: 'initialization complete. build your architecture and press start.',
      },
    ],
    tickHistory: [],
    result: null,
  }
}
