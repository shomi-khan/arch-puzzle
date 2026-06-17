'use client'

/**
 * src/hooks/useSimulation.ts
 *
 * Custom React hook - owns the entire simulation game loop.
 *
 * WHY THIS EXISTS:
 * The simulation involves a setInterval that fires every second, calls the
 * engine's processTick(), applies node state updates, accumulates tick history,
 * writes log entries, deducts budget, and checks for simulation end conditions.
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
 * useSimulation - drives the entire simulation lifecycle.
 *
 * @param problem - The current challenge being played
 * @returns Handlers, state, and canvas state for the builder page
 */
export function useSimulation(problem: Problem): UseSimulationReturn {
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([])
  const [canvasEdges, setCanvasEdges] = useState<CanvasState['edges']>([])
  const [simState, setSimState] = useState<SimulationState>(() =>
    makeInitialSimState(problem),
  )
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<CanvasState>({ nodes: [], edges: [] })
  const simStateRef = useRef<SimulationState>(simState)
  const prevCacheHitRatioRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  /**
   * runTick - processes one second of simulation time.
   */
  const runTick = useCallback(() => {
    const prev = simStateRef.current
    if (prev.status !== 'running') return

    const currentSecond = prev.elapsed
    const canvas = canvasRef.current
    const tickOutput = processTick({
      second: currentSecond,
      canvas,
      problem,
      currentBalance: prev.balance,
      prevCacheHitRatio: prevCacheHitRatioRef.current,
    })

    prevCacheHitRatioRef.current = tickOutput.metrics.cacheHitRatio

    const updatedNodes = canvas.nodes.map((node) => {
      const update = tickOutput.updatedNodes.find(
        (updatedNode) => updatedNode.instanceId === node.instanceId,
      )
      if (!update) return node

      return {
        ...node,
        loadPercent: update.loadPercent,
        status: update.status,
        currentLoadRps: update.currentLoadRps,
      }
    })

    canvasRef.current = { ...canvasRef.current, nodes: updatedNodes }
    setCanvasNodes(updatedNodes)

    const newElapsed = currentSecond + 1
    const newTickHistory = [...prev.tickHistory, tickOutput.metrics]
    const newLogs = [...prev.logs, ...tickOutput.logs]
    const simulationComplete = newElapsed >= problem.durationSeconds

    if (simulationComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      const result = calculateResult(newTickHistory, problem, canvas)
      if (result.passed) markSolved(problem.id)

      const completionLog: LogEntry = {
        second: newElapsed,
        level: 'system',
        message: `Simulation complete. Final score: ${result.finalScore}/100. ${
          result.passed ? 'Challenge passed!' : 'Requirements not met.'
        }`,
      }

      const nextState: SimulationState = {
        ...prev,
        status: 'completed',
        elapsed: newElapsed,
        balance: tickOutput.metrics.balance,
        logs: [...newLogs, completionLog],
        tickHistory: newTickHistory,
        result,
      }

      simStateRef.current = nextState
      setSimState(nextState)
      return
    }

    const nextState: SimulationState = {
      ...prev,
      elapsed: newElapsed,
      balance: tickOutput.metrics.balance,
      logs: newLogs,
      tickHistory: newTickHistory,
    }

    simStateRef.current = nextState
    setSimState(nextState)
  }, [problem])

  /**
   * setSimulationState - updates React state and its mutable interval ref.
   */
  const setSimulationState = useCallback((nextState: SimulationState) => {
    simStateRef.current = nextState
    setSimState(nextState)
  }, [])

  /**
   * updateSimulationState - derives simulation state from the latest ref value.
   */
  const updateSimulationState = useCallback(
    (updater: (state: SimulationState) => SimulationState) => {
      const nextState = updater(simStateRef.current)
      setSimulationState(nextState)
    },
    [setSimulationState],
  )

  /**
   * handleStart - validates the architecture, then starts the game loop.
   */
  const handleStart = useCallback(() => {
    const canvas = canvasRef.current
    const validation = validateArchitecture(canvas)

    if (!validation.valid) {
      setValidationResult(validation)
      return
    }

    setValidationResult(null)

    const startLog: LogEntry = {
      second: 0,
      level: 'system',
      message: 'Simulation thread initialized. Traffic flowing...',
    }

    updateSimulationState((prev) => ({
      ...prev,
      status: 'running',
      logs: [...prev.logs, startLog],
    }))

    // Guard against duplicate intervals if Start is clicked twice quickly.
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(runTick, 1000)
  }, [runTick, updateSimulationState])

  /**
   * handlePause - suspends the game loop without losing state.
   */
  const handlePause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    updateSimulationState((prev) => ({
      ...prev,
      status: 'paused',
      logs: [
        ...prev.logs,
        { second: prev.elapsed, level: 'system', message: 'Simulation paused.' },
      ],
    }))
  }, [updateSimulationState])

  /**
   * handleResume - restarts the game loop from the paused state.
   */
  const handleResume = useCallback(() => {
    updateSimulationState((prev) => ({
      ...prev,
      status: 'running',
      logs: [
        ...prev.logs,
        {
          second: prev.elapsed,
          level: 'system',
          message: 'Simulation resumed.',
        },
      ],
    }))

    // Recreate the interval; runTick reads latest sim state via functional state.
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(runTick, 1000)
  }, [runTick, updateSimulationState])

  /**
   * handleReset - stops simulation and resets runtime state.
   */
  const handleReset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    prevCacheHitRatioRef.current = 0

    const resetNodes = canvasRef.current.nodes.map((node) => ({
      ...node,
      loadPercent: 0,
      currentLoadRps: 0,
      status: 'idle' as const,
    }))

    setCanvasNodes(resetNodes)
    canvasRef.current = { ...canvasRef.current, nodes: resetNodes }
    setSimulationState(makeInitialSimState(problem))
    setValidationResult(null)
  }, [problem, setSimulationState])

  /**
   * handleNodesChange - updates canvas nodes and syncs the fresh canvas ref.
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
   * handleEdgesChange - updates canvas edges and syncs the fresh canvas ref.
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

/**
 * makeInitialSimState - builds a fresh idle simulation state for a problem.
 *
 * @param problem - The current challenge
 * @returns Initial simulation state
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
