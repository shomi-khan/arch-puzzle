/**
 * src/engine/scorer.ts
 *
 * Score calculation - aggregates all tick metrics into a final SimulationResult.
 *
 * WHY THIS EXISTS:
 * The simulation produces one TickMetrics per second. At the end, we need
 * to aggregate those into a single performance report and weighted score.
 *
 * All functions are pure - they take data in and return data out.
 * No side effects. No randomness. Same input always produces same output.
 */

import type { CanvasState, Problem, SimulationResult, TickMetrics } from '@/types'
import { scoringProfiles, PASS_THRESHOLD, XP_MULTIPLIER } from '@/config/scoring'
import { calculateTotalCost } from './simulator'

/**
 * Calculate the 95th percentile value from an array of numbers.
 * P95 latency means 95% of samples completed faster than this value.
 *
 * @param values - Array of numeric values, such as latency samples
 * @returns The 95th percentile value, or 0 if array is empty
 */
function percentile95(values: number[]): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil(sorted.length * 0.95) - 1

  return sorted[Math.max(0, index)]
}

/**
 * Normalize a raw metric value to a 0-100 score.
 *
 * @param value - Raw metric value
 * @param best - The value that maps to score 100
 * @param worst - The value that maps to score 0
 * @returns Normalized score from 0 to 100, clamped
 */
function normalize(value: number, best: number, worst: number): number {
  if (best === worst) return 100

  // Linear interpolation lets all metrics be weighted on one common scale,
  // then clamps outliers so a single extreme metric cannot exceed 0-100.
  const score = ((value - worst) / (best - worst)) * 100
  return Math.max(0, Math.min(100, score))
}

/**
 * Aggregate all tick metrics and produce the final simulation result.
 *
 * @param ticks - All TickMetrics produced during the simulation
 * @param problem - The challenge definition
 * @param canvas - The user's final canvas state
 * @returns Complete SimulationResult including score, XP, and pass/fail
 */
export function calculateResult(
  ticks: TickMetrics[],
  problem: Problem,
  canvas: CanvasState,
): SimulationResult {
  if (ticks.length === 0) {
    throw new Error('calculateResult: ticks array is empty - simulation produced no data')
  }

  const totalRequests = ticks.reduce((sum, t) => sum + t.trafficRps, 0)
  const totalDropped = ticks.reduce((sum, t) => sum + t.droppedRequests, 0)
  const latencies = ticks.map((t) => t.avgLatencyMs)
  const avgLatencyMs = Math.round(
    latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length,
  )
  const p95LatencyMs = percentile95(latencies)
  const peakRps = Math.max(...ticks.map((t) => t.trafficRps))
  const avgCacheHitRatio = ticks.reduce((sum, t) => sum + t.cacheHitRatio, 0) / ticks.length
  const avgErrorRate = ticks.reduce((sum, t) => sum + t.errorRate, 0) / ticks.length
  const finalBalance = ticks[ticks.length - 1].balance
  const totalInfraCost = calculateTotalCost(canvas, ticks.length)

  // Availability rewards served requests over total demand, which aligns with
  // how users experience dropped requests during overload.
  const availability =
    totalRequests > 0 ? ((totalRequests - totalDropped) / totalRequests) * 100 : 100

  const availabilityScore = normalize(availability, 100, 90)
  const latencyScore = normalize(avgLatencyMs, 50, 500)
  const budgetSpent = totalInfraCost / problem.initialBudget
  const costScore = normalize(budgetSpent, 0.5, 1.0)
  const errorScore = normalize(avgErrorRate, 0, 0.1)

  const weights = scoringProfiles[problem.scoringProfile] ?? scoringProfiles.default
  const finalScore = Math.round(
    availabilityScore * weights.availability +
      latencyScore * weights.latency +
      costScore * weights.costEfficiency +
      errorScore * weights.errorRate,
  )

  const passed = finalScore >= PASS_THRESHOLD
  const researchXp = passed ? Math.round(finalScore * XP_MULTIPLIER) : 0

  return {
    challengeId: problem.id,
    durationSeconds: ticks.length,
    peakRps,
    avgLatencyMs,
    p95LatencyMs,
    availability: Math.round(availability * 10) / 10,
    errorRate: Math.round(avgErrorRate * 1000) / 1000,
    cacheHitRatio: Math.round(avgCacheHitRatio * 100) / 100,
    droppedRequests: totalDropped,
    totalInfraCost,
    finalBalance: Math.round(finalBalance),
    finalScore,
    passed,
    researchXp,
  }
}

/**
 * Evaluate all success conditions against a completed simulation result.
 *
 * @param result - The completed simulation result
 * @param problem - The challenge definition containing success conditions
 * @returns Array of condition results with pass/fail and numeric values
 */
export function evaluateSuccessConditions(
  result: SimulationResult,
  problem: Problem,
): Array<{ label: string; passed: boolean; actual: number; required: number }> {
  return problem.successConditions.map((condition) => {
    const actual: Record<string, number> = {
      availability: result.availability,
      avgLatency: result.avgLatencyMs,
      errorRate: result.errorRate * 100,
      droppedRequests: result.droppedRequests,
      balance: result.finalBalance,
    }

    const actualValue = actual[condition.metric] ?? 0
    const passed =
      condition.operator === 'gte'
        ? actualValue >= condition.value
        : actualValue <= condition.value

    return {
      label: condition.label,
      passed,
      actual: actualValue,
      required: condition.value,
    }
  })
}
