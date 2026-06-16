/**
 * src/problems/flash-sale.ts
 *
 * Challenge: Flash Sale
 * Difficulty: Medium
 *
 * The user must survive a 10x traffic spike on a tight budget.
 * Over-engineering is penalized — cost efficiency matters here.
 */

import type { Problem } from '@/types'

export const flashSale: Problem = {
  id: 'flash-sale',
  title: 'Flash Sale',
  subtitle: 'Survive a 10x traffic spike on a tight budget.',
  difficulty: 'medium',
  description: `
    A flash sale just went live. Traffic is about to spike 10x in seconds.
    You have a limited budget — every component costs money per second.
    Build an architecture that survives the spike without overspending.
    Hint: a well-placed cache can save your database — and your budget.
  `,
  durationSeconds: 60,
  initialBudget: 1000,
  trafficPattern: [
    { atSecond: 0,  rps: 200  },
    { atSecond: 5,  rps: 1000 },
    { atSecond: 10, rps: 3000 },
    { atSecond: 20, rps: 2500 },
    { atSecond: 40, rps: 1000 },
    { atSecond: 60, rps: 300  },
  ],
  availableComponents: [
    'load-balancer',
    'api-server',
    'redis-cache',
    'sql-database',
    'nosql-database',
    'rate-limiter',
    'message-queue',
  ],
  successConditions: [
    { metric: 'availability',     operator: 'gte', value: 95,  label: 'Availability ≥ 95%' },
    { metric: 'droppedRequests',  operator: 'lte', value: 50,  label: 'Dropped requests ≤ 50' },
    { metric: 'balance',          operator: 'gte', value: 0,   label: 'Budget not exceeded' },
  ],
  scoringProfile: 'costFocused',
  unlocksAfter: 'url-shortener',
}
