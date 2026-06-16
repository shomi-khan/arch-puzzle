/**
 * src/lib/traffic.ts
 *
 * Traffic interpolation utilities.
 *
 * WHY THIS EXISTS:
 * A traffic pattern is defined as a sparse list of { atSecond, rps } points.
 * The engine needs to know the exact rps at every single second.
 * This file provides the interpolation logic that fills in the gaps.
 *
 * Example:
 *   pattern = [{ atSecond: 0, rps: 100 }, { atSecond: 10, rps: 1000 }]
 *   getRpsAtSecond(pattern, 5) → 550  (linear interpolation midpoint)
 *
 * Pure TypeScript. No React. No side effects.
 */

import type { TrafficPattern } from '@/types'

/**
 * Get the interpolated requests-per-second value at a given simulation second.
 * Uses linear interpolation between the two nearest traffic pattern points.
 *
 * If the second is before the first point, returns the first point's rps.
 * If the second is after the last point, returns the last point's rps.
 *
 * @param pattern - The traffic pattern array (must be sorted by atSecond ascending)
 * @param second  - The current simulation second to query
 * @returns Interpolated rps value as a number
 */
export function getRpsAtSecond(pattern: TrafficPattern, second: number): number {
  if (pattern.length === 0) return 0

  // Before first point — clamp to first value
  if (second <= pattern[0].atSecond) return pattern[0].rps

  // After last point — clamp to last value
  const last = pattern[pattern.length - 1]
  if (second >= last.atSecond) return last.rps

  // Find the two surrounding points and interpolate between them
  for (let i = 0; i < pattern.length - 1; i++) {
    const from = pattern[i]
    const to = pattern[i + 1]

    if (second >= from.atSecond && second <= to.atSecond) {
      // How far between the two points are we? (0.0 to 1.0)
      const progress = (second - from.atSecond) / (to.atSecond - from.atSecond)
      // Linear interpolation: from + (to - from) * progress
      return Math.round(from.rps + (to.rps - from.rps) * progress)
    }
  }

  return last.rps
}

/**
 * Get the peak rps value across the entire traffic pattern.
 * Used in the result report to show peak traffic during the simulation.
 *
 * @param pattern - The traffic pattern array
 * @returns The highest rps value in the pattern
 */
export function getPeakRps(pattern: TrafficPattern): number {
  if (pattern.length === 0) return 0
  return Math.max(...pattern.map((p) => p.rps))
}
