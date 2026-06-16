/**
 * src/types/index.ts
 *
 * Central type definitions for the sys-simulation game.
 * All interfaces, enums, and type aliases live here.
 * No logic. No imports from other src files.
 */

/** Difficulty levels for challenges, ordered from easiest to hardest */
export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'

/**
 * A single point in a traffic pattern timeline.
 * The engine interpolates between points to get rps at any given second.
 */
export interface TrafficPoint {
  atSecond: number  // time in seconds from simulation start
  rps: number       // requests per second at this point
}

/** Traffic pattern is a timeline of rps values across the simulation duration */
export type TrafficPattern = TrafficPoint[]

/**
 * A success condition that must be met for the challenge to be passed.
 * The engine evaluates all conditions at the end of the simulation.
 */
export interface SuccessCondition {
  metric: 'availability' | 'avgLatency' | 'errorRate' | 'droppedRequests' | 'balance'
  operator: 'gte' | 'lte'   // gte = greater than or equal, lte = less than or equal
  value: number
  label: string              // Human-readable description shown in UI
}

/**
 * Named scoring weight profile.
 * Weights must sum to 1.0.
 * Different challenges can reference different profiles.
 */
export interface ScoringWeights {
  availability: number
  latency: number
  costEfficiency: number
  errorRate: number
}

/** Reference to a named scoring profile defined in src/config/scoring.ts */
export type ScoringProfile = 'default' | 'costFocused' | 'latencyFocused'

/**
 * Category of an infrastructure component.
 * Used for color-coding borders in the canvas UI.
 */
export type ComponentCategory =
  | 'network'     // Load Balancer, DNS — blue
  | 'compute'     // API Server, Worker — green
  | 'cache'       // Redis — red
  | 'database'    // SQL, NoSQL — purple
  | 'cdn'         // CDN — amber
  | 'queue'       // Message Queue — orange
  | 'security'    // Rate Limiter — pink

/**
 * Definition of a draggable infrastructure component.
 * Lives in src/config/components.ts registry.
 */
export interface ComponentDefinition {
  type: string                    // unique string id e.g. 'load-balancer'
  label: string                   // display name e.g. 'Load Balancer'
  icon: string                    // lucide-react icon name
  category: ComponentCategory
  purchaseCost: number            // one-time cost when placed on canvas
  runtimeCostPerSecond: number    // deducted from balance every tick
  capacityRps: number             // max requests per second this component handles
  basLatencyMs: number            // latency added to request path in ms
  description: string             // tooltip / info text shown in UI
}

/**
 * A node placed on the canvas by the user.
 * Extends ComponentDefinition with position and runtime state.
 */
export interface CanvasNode {
  instanceId: string              // unique id for this placed instance
  type: string                    // references ComponentDefinition.type
  position: { x: number; y: number }
  // Runtime state — updated every tick by the engine
  currentLoadRps: number
  loadPercent: number             // 0-100
  status: 'idle' | 'healthy' | 'warning' | 'overloaded'
}

/**
 * A directed edge connecting two canvas nodes.
 * Represents traffic flow direction.
 */
export interface CanvasEdge {
  id: string
  fromInstanceId: string
  toInstanceId: string
}

/** Full state of the user's canvas at any point in time */
export interface CanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/**
 * A single log entry written by the engine during simulation.
 * Displayed in the terminal UI component.
 */
export interface LogEntry {
  second: number
  level: 'system' | 'info' | 'warn' | 'critical' | 'success'
  message: string
}

/**
 * Snapshot of system metrics at a single tick.
 * The engine produces one of these per second.
 */
export interface TickMetrics {
  second: number
  trafficRps: number
  droppedRequests: number
  avgLatencyMs: number
  errorRate: number               // 0.0 to 1.0
  cacheHitRatio: number           // 0.0 to 1.0
  balance: number
  nodeStates: Record<string, { loadPercent: number; status: CanvasNode['status'] }>
}

/**
 * Aggregated result after the simulation completes.
 * Used to render the result report page.
 */
export interface SimulationResult {
  challengeId: string
  durationSeconds: number
  peakRps: number
  avgLatencyMs: number
  p95LatencyMs: number
  availability: number            // 0-100
  errorRate: number               // 0.0 to 1.0
  cacheHitRatio: number
  droppedRequests: number
  totalInfraCost: number
  finalBalance: number
  finalScore: number              // 0-100 weighted score
  passed: boolean
  researchXp: number              // earned XP based on score
}

/**
 * A single challenge / problem definition.
 * Stored in src/problems/*.ts and registered in src/problems/index.ts
 */
export interface Problem {
  /** Unique string identifier — used in URLs e.g. /sys-simulation/url-shortener */
  id: string

  /** Display title shown on challenge card and builder page */
  title: string

  /** One-line subtitle shown on challenge card */
  subtitle: string

  /** Difficulty level — controls badge color and unlock order */
  difficulty: Difficulty

  /** Full description shown on builder page — explains the scenario and hints */
  description: string

  /** How long the simulation runs in seconds */
  durationSeconds: number

  /** Starting budget in dollars — components consume this during simulation */
  initialBudget: number

  /**
   * Timeline of traffic values across the simulation duration.
   * Engine interpolates between points to get rps at any given second.
   */
  trafficPattern: TrafficPattern

  /**
   * Which component types the user is allowed to place on the canvas.
   * References ComponentDefinition.type values from src/config/components.ts.
   * Restricting available components is part of the challenge design.
   */
  availableComponents: string[]

  /**
   * Conditions that must ALL be true at simulation end for the challenge to be passed.
   * Evaluated by the engine after the final tick.
   */
  successConditions: SuccessCondition[]

  /**
   * References a named weight profile in src/config/scoring.ts.
   * Controls how the final score is calculated for this challenge.
   */
  scoringProfile: ScoringProfile

  /**
   * ID of the problem that must be solved before this one unlocks.
   * null = always unlocked (first challenge in the sequence).
   */
  unlocksAfter: string | null
}

/**
 * Simulation runtime state managed by React (zustand or useState).
 * Passed down to engine functions each tick.
 */
export interface SimulationState {
  status: 'idle' | 'running' | 'paused' | 'completed'
  elapsed: number                 // seconds since start
  balance: number
  logs: LogEntry[]
  tickHistory: TickMetrics[]
  result: SimulationResult | null
}
