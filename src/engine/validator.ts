/**
 * src/engine/validator.ts
 *
 * Architecture validation - runs before simulation starts.
 *
 * WHY THIS EXISTS:
 * The user can build any arbitrary graph on the canvas. Before we run
 * the simulation, we must verify the graph is valid - otherwise the
 * engine would produce meaningless results or crash.
 *
 * Validation checks:
 * 1. At least one node exists on the canvas
 * 2. At least one edge exists (nodes must be connected)
 * 3. No cycles exist in the graph (must be a DAG)
 * 4. There is exactly one "entry node" - a node with no incoming edges
 *    (this is where Internet traffic enters)
 * 5. Every node is reachable from the entry node
 *
 * Returns structured errors - never throws exceptions.
 */

import type { CanvasState } from '@/types'

/** A single validation error with a human-readable message */
export interface ValidationError {
  /** Short error code for programmatic handling */
  code: string
  /** Human-readable message shown to the user in the UI */
  message: string
}

/** Result of validating a canvas architecture */
export interface ValidationResult {
  /** true if the architecture is valid and simulation can start */
  valid: boolean
  /** List of errors - empty if valid */
  errors: ValidationError[]
}

/**
 * Validate a canvas architecture before running the simulation.
 * All checks run regardless - we collect all errors at once, not just the first.
 *
 * @param canvas - The current canvas state with nodes and edges
 * @returns ValidationResult with valid flag and any error messages
 */
export function validateArchitecture(canvas: CanvasState): ValidationResult {
  const errors: ValidationError[] = []

  if (canvas.nodes.length === 0) {
    errors.push({
      code: 'NO_NODES',
      message: 'Place at least one component on the canvas before starting.',
    })

    return { valid: false, errors }
  }

  if (canvas.edges.length === 0) {
    errors.push({
      code: 'NO_EDGES',
      message: 'Connect your components with arrows to define the request flow.',
    })
  }

  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  for (const node of canvas.nodes) {
    inDegree.set(node.instanceId, 0)
    adjacency.set(node.instanceId, [])
  }

  for (const edge of canvas.edges) {
    inDegree.set(edge.toInstanceId, (inDegree.get(edge.toInstanceId) ?? 0) + 1)
    adjacency.get(edge.fromInstanceId)?.push(edge.toInstanceId)
  }

  const entryNodes = canvas.nodes.filter((n) => inDegree.get(n.instanceId) === 0)

  if (entryNodes.length === 0) {
    errors.push({
      code: 'NO_ENTRY',
      message:
        'Your architecture has a cycle - every node has an incoming edge. Remove a connection to create a clear entry point.',
    })

    return { valid: false, errors }
  }

  if (entryNodes.length > 1) {
    errors.push({
      code: 'MULTIPLE_ENTRIES',
      message: `Your architecture has ${entryNodes.length} disconnected entry points. Connect all components into a single request flow pipeline.`,
    })
  }

  const queue = entryNodes.map((n) => n.instanceId)
  const processed = new Set<string>()
  const tempInDegree = new Map(inDegree)

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || processed.has(current)) continue

    processed.add(current)

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (tempInDegree.get(neighbor) ?? 0) - 1
      tempInDegree.set(neighbor, newDegree)

      if (newDegree === 0) queue.push(neighbor)
    }
  }

  if (processed.size !== canvas.nodes.length) {
    errors.push({
      code: 'CYCLE_DETECTED',
      message:
        'Your architecture contains a cycle. Request flow must be directional - no loops allowed.',
    })
  }

  if (entryNodes.length === 1) {
    const reachable = new Set<string>()
    const bfsQueue = [entryNodes[0].instanceId]

    while (bfsQueue.length > 0) {
      const current = bfsQueue.shift()
      if (!current || reachable.has(current)) continue

      reachable.add(current)

      for (const neighbor of adjacency.get(current) ?? []) {
        if (!reachable.has(neighbor)) bfsQueue.push(neighbor)
      }
    }

    const unreachable = canvas.nodes.filter((n) => !reachable.has(n.instanceId))

    if (unreachable.length > 0) {
      errors.push({
        code: 'UNREACHABLE_NODES',
        message: `${unreachable.length} component(s) are not connected to the main request flow. Connect or remove them.`,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
