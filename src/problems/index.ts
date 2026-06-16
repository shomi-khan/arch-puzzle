/**
 * src/problems/index.ts
 *
 * Problem registry — the single source of truth for all challenges.
 *
 * WHY THIS EXISTS:
 * All challenge data flows through this file. Pages and engine functions
 * never import individual problem files directly — they always go through
 * this registry. This makes reordering, adding, or removing challenges
 * a one-line change.
 *
 * HOW TO ADD A NEW PROBLEM:
 * 1. Create src/problems/your-problem.ts following the Problem interface
 * 2. Import it here and add it to the `problems` array
 * 3. Set `unlocksAfter` to the id of the previous challenge
 * 4. Nothing else needs to change — the UI and engine pick it up automatically
 */

import type { Problem } from '@/types'
import { urlShortener } from './url-shortener'
import { flashSale } from './flash-sale'

/**
 * Ordered list of all challenges.
 * Position in this array = order shown on the challenge list page.
 * Earlier problems should have lower difficulty and simpler traffic patterns.
 */
export const problems: Problem[] = [
  urlShortener,
  flashSale,
]

/**
 * Find a single problem by its unique id.
 *
 * @param id - The problem's id string e.g. 'url-shortener'
 * @returns The matching Problem object, or undefined if not found
 *
 * Used by: the builder page to load challenge details from the URL param
 */
export function getProblemById(id: string): Problem | undefined {
  return problems.find((p) => p.id === id)
}

/**
 * Get the problem that must be solved before the given problem unlocks.
 *
 * @param problem - The problem to check prerequisites for
 * @returns The prerequisite Problem object, or null if no prerequisite exists
 *
 * Used by: the challenge list page to determine locked/unlocked state
 */
export function getPrerequisite(problem: Problem): Problem | null {
  if (!problem.unlocksAfter) return null
  return getProblemById(problem.unlocksAfter) ?? null
}
