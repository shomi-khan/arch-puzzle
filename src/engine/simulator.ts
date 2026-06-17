/**
 * src/engine/simulator.ts
 *
 * Core simulation game loop - processes one tick (1 second) at a time.
 *
 * WHY THIS EXISTS:
 * This is the mathematical heart of the game. It takes the user's architecture
 * (a DAG of infrastructure components) and simulates real traffic flowing
 * through it - calculating load, latency, dropped requests, cache behavior,
 * and budget consumption for each second of the simulation.
 *
 * IMPORTANT:
 * - Pure TypeScript. No React. No DOM.
 * - All functions are pure - deterministic, no side effects.
 * - React calls processTick() every second via setInterval and stores results in state.
 */

import type { CanvasState, CanvasNode, TickMetrics, LogEntry, Problem } from '@/types'
import { getComponentByType } from '@/config/components'
import { getRpsAtSecond } from '@/lib/traffic'

/** Topologically sorted node with its computed traffic load for this tick */
interface NodeWithLoad {
  node: CanvasNode
  incomingRps: number
  outgoingRps: number
  droppedRps: number
  latencyMs: number
  loadPercent: number
  cacheHitRps: number
}

/**
 * Sort canvas nodes in topological order, from entry node to leaf nodes.
 * This determines the order in which traffic flows through the architecture.
 *
 * @param canvas - Validated canvas state
 * @returns Nodes sorted from entry to leaf in request flow order
 */
function topologicalSort(canvas: CanvasState): CanvasNode[] {
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()
  const nodeMap = new Map<string, CanvasNode>()

  for (const node of canvas.nodes) {
    inDegree.set(node.instanceId, 0)
    adjacency.set(node.instanceId, [])
    nodeMap.set(node.instanceId, node)
  }

  for (const edge of canvas.edges) {
    inDegree.set(edge.toInstanceId, (inDegree.get(edge.toInstanceId) ?? 0) + 1)
    adjacency.get(edge.fromInstanceId)?.push(edge.toInstanceId)
  }

  const queue = canvas.nodes
    .filter((n) => inDegree.get(n.instanceId) === 0)
    .map((n) => n.instanceId)

  const sorted: CanvasNode[] = []

  while (queue.length > 0) {
    const current = queue.shift()
    const node = current ? nodeMap.get(current) : undefined
    if (!current || !node) continue

    sorted.push(node)

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1
      inDegree.set(neighbor, newDegree)

      if (newDegree === 0) queue.push(neighbor)
    }
  }

  return sorted
}

/**
 * Calculate the effective latency of a node given its current load.
 *
 * @param baseLatencyMs - The component's normal latency at healthy load
 * @param loadPercent - Current load as a 0-100 value
 * @returns Effective latency in milliseconds
 */
function calculateEffectiveLatency(baseLatencyMs: number, loadPercent: number): number {
  const loadFraction = loadPercent / 100

  if (loadFraction <= 0.8) {
    return baseLatencyMs
  }

  // Real systems queue sharply near saturation, so the penalty curves upward
  // after 80% load instead of increasing in a flat linear line.
  const overloadFactor = ((loadFraction - 0.8) / 0.2) ** 2
  return Math.round(baseLatencyMs * (1 + overloadFactor * 8))
}

/**
 * Determine the visual status of a node based on its load percentage.
 *
 * @param loadPercent - Current load as a 0-100 value
 * @returns Status string used to color-code the node in the UI
 */
function getNodeStatus(loadPercent: number): CanvasNode['status'] {
  if (loadPercent === 0) return 'idle'
  if (loadPercent <= 60) return 'healthy'
  if (loadPercent <= 89) return 'warning'
  return 'overloaded'
}

const DEFAULT_CACHE_HIT_RATIO = 0.7
const CACHE_COMPONENT_TYPES = new Set(['redis-cache'])

/**
 * Create a log entry for the terminal UI.
 *
 * @param second - Current simulation second
 * @param level - Severity level
 * @param message - Human-readable event description
 * @returns Log entry for the current tick
 */
function makeLog(
  second: number,
  level: LogEntry['level'],
  message: string,
): LogEntry {
  return { second, level, message }
}

/** Input required to process a single simulation tick */
export interface TickInput {
  /** Current simulation second, 0-indexed */
  second: number
  /** The user's canvas architecture */
  canvas: CanvasState
  /** The current challenge definition */
  problem: Problem
  /** Remaining budget at the start of this tick */
  currentBalance: number
  /** Previous tick's cache hit ratio */
  prevCacheHitRatio: number
}

/** Output produced by processing a single tick */
export interface TickOutput {
  /** Metrics snapshot for this second */
  metrics: TickMetrics
  /** Log entries generated this second */
  logs: LogEntry[]
  /** Updated node states to apply to canvas in React state */
  updatedNodes: Array<{
    instanceId: string
    loadPercent: number
    status: CanvasNode['status']
    currentLoadRps: number
  }>
}

/**
 * Process a single 1-second simulation tick.
 *
 * @param input - Current tick context including second, canvas, problem, and balance
 * @returns TickOutput containing metrics, logs, and node state updates
 */
export function processTick(input: TickInput): TickOutput {
  const { second, canvas, problem, currentBalance } = input
  const logs: LogEntry[] = []
  const currentRps = getRpsAtSecond(problem.trafficPattern, second)
  const sortedNodes = topologicalSort(canvas)

  const adjacency = new Map<string, string[]>()
  for (const node of canvas.nodes) {
    adjacency.set(node.instanceId, [])
  }

  for (const edge of canvas.edges) {
    adjacency.get(edge.fromInstanceId)?.push(edge.toInstanceId)
  }

  const incomingTraffic = new Map<string, number>()
  if (sortedNodes.length > 0) {
    incomingTraffic.set(sortedNodes[0].instanceId, currentRps)
  }

  const nodeResults: NodeWithLoad[] = []
  let totalDroppedRps = 0
  let totalCacheHitRps = 0
  let totalLatencyMs = 0
  let pathLength = 0

  for (const node of sortedNodes) {
    const componentDef = getComponentByType(node.type)
    if (!componentDef) continue

    const incomingRps = incomingTraffic.get(node.instanceId) ?? 0
    const capacity = componentDef.capacityRps

    // Load is capped for display stability while dropped traffic still uses
    // the uncapped incoming rps against component capacity.
    const loadPercent = Math.min(200, Math.round((incomingRps / capacity) * 100))
    const droppedRps = Math.max(0, incomingRps - capacity)
    totalDroppedRps += droppedRps

    const processedRps = incomingRps - droppedRps
    let cacheHitRps = 0
    let outgoingRps = processedRps

    if (CACHE_COMPONENT_TYPES.has(node.type)) {
      cacheHitRps = Math.round(processedRps * DEFAULT_CACHE_HIT_RATIO)
      // Cache hits are terminal responses, so only misses continue downstream.
      outgoingRps = processedRps - cacheHitRps
      totalCacheHitRps += cacheHitRps
    }

    const latencyMs = calculateEffectiveLatency(componentDef.basLatencyMs, loadPercent)
    totalLatencyMs += latencyMs
    pathLength++

    const neighbors = adjacency.get(node.instanceId) ?? []
    if (neighbors.length > 0 && outgoingRps > 0) {
      // Even fan-out keeps the model deterministic and gives load balancers
      // simple equal distribution behavior.
      const rpsPerNeighbor = Math.round(outgoingRps / neighbors.length)

      for (const neighborId of neighbors) {
        incomingTraffic.set(
          neighborId,
          (incomingTraffic.get(neighborId) ?? 0) + rpsPerNeighbor,
        )
      }
    }

    nodeResults.push({
      node,
      incomingRps,
      outgoingRps,
      droppedRps,
      latencyMs,
      loadPercent,
      cacheHitRps,
    })

    if (loadPercent >= 90) {
      logs.push(
        makeLog(
          second,
          'critical',
          `${componentDef.label} is critically overloaded at ${loadPercent}% capacity. Dropping ${droppedRps} req/s.`,
        ),
      )
    } else if (loadPercent >= 70) {
      logs.push(
        makeLog(
          second,
          'warn',
          `${componentDef.label} under high load: ${loadPercent}% capacity.`,
        ),
      )
    }
  }

  const runtimeCostThisTick = canvas.nodes.reduce((sum, node) => {
    const def = getComponentByType(node.type)
    return sum + (def?.runtimeCostPerSecond ?? 0)
  }, 0)

  const newBalance = currentBalance - runtimeCostThisTick

  if (newBalance <= 0) {
    logs.push(
      makeLog(
        second,
        'critical',
        'Budget exhausted. Infrastructure costs are unsustainable.',
      ),
    )
  } else if (newBalance < problem.initialBudget * 0.2) {
    logs.push(
      makeLog(
        second,
        'warn',
        `Budget running low: $${Math.round(newBalance)} remaining.`,
      ),
    )
  }

  const avgLatencyMs = pathLength > 0 ? Math.round(totalLatencyMs / pathLength) : 0
  const cacheHitRatio = currentRps > 0 ? totalCacheHitRps / currentRps : 0
  const errorRate = currentRps > 0 ? totalDroppedRps / currentRps : 0

  if (cacheHitRatio > 0.6 && input.prevCacheHitRatio <= 0.6) {
    logs.push(
      makeLog(
        second,
        'info',
        `Cache hit ratio stabilized at ${Math.round(
          cacheHitRatio * 100,
        )}%. Database load decreasing.`,
      ),
    )
  }

  const updatedNodes = nodeResults.map((r) => ({
    instanceId: r.node.instanceId,
    loadPercent: r.loadPercent,
    status: getNodeStatus(r.loadPercent),
    currentLoadRps: r.incomingRps,
  }))

  const nodeStates: TickMetrics['nodeStates'] = {}
  for (const r of nodeResults) {
    nodeStates[r.node.instanceId] = {
      loadPercent: r.loadPercent,
      status: getNodeStatus(r.loadPercent),
    }
  }

  const metrics: TickMetrics = {
    second,
    trafficRps: currentRps,
    droppedRequests: totalDroppedRps,
    avgLatencyMs,
    errorRate,
    cacheHitRatio,
    balance: newBalance,
    nodeStates,
  }

  return { metrics, logs, updatedNodes }
}

/**
 * Calculate total infrastructure cost spent so far in the simulation.
 *
 * @param canvas - Current canvas state
 * @param elapsedSeconds - How many seconds the simulation has run
 * @returns Total cost spent, including purchase costs and runtime costs
 */
export function calculateTotalCost(
  canvas: CanvasState,
  elapsedSeconds: number,
): number {
  return canvas.nodes.reduce((sum, node) => {
    const def = getComponentByType(node.type)
    if (!def) return sum

    return sum + def.purchaseCost + def.runtimeCostPerSecond * elapsedSeconds
  }, 0)
}
