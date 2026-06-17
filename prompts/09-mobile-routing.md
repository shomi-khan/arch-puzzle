````markdown
# Step 9 — Mobile Block, Routing, Final Wiring & Polish

## Context
You are continuing to build **sys-simulation** — a system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Steps 1–8 are complete. The entire game is functionally built — engine, canvas, simulation loop, and result report all exist.

This is the final step. Wire everything together, ensure routing works end-to-end, fix any remaining loose ends, and make the project production-ready for Vercel deployment.

---

## General rules

- TypeScript only. No `any`.
- Every component must have a top-level JSDoc comment.
- No new game logic — this step is wiring, polish, and correctness only.
- After this step, `npm run build` must pass with zero errors and zero warnings.

---

## Files to create or update

```
src/app/sys-simulation/[id]/page.tsx     ← final wiring, loading + not-found states
src/app/sys-simulation/layout.tsx        ← verify layout wraps all routes correctly
src/app/not-found.tsx                    ← optional: global 404 page
src/components/simulation/MobileBlock.tsx ← verify implementation from Step 5
next.config.ts                           ← verify Vercel deployment config
README.md                                ← document how to add new problems
```

---

## `src/app/sys-simulation/[id]/page.tsx` — final wiring

### Handle all edge cases

```tsx
/**
 * src/app/sys-simulation/[id]/page.tsx
 *
 * Builder page — final wired version.
 *
 * Edge cases handled:
 * 1. Problem not found (invalid id in URL) → show not-found UI
 * 2. Problem locked (prerequisite not solved) → show locked UI
 * 3. Problem found and unlocked → show full builder
 *
 * WHY CLIENT COMPONENT:
 * React Flow requires browser APIs. Simulation state runs via setInterval.
 * Progress (locked/unlocked) is read from localStorage — browser only.
 * All three requirements make this a mandatory Client Component.
 */

'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { getProblemById } from '@/problems'
import { isUnlocked } from '@/lib/progress'
import { useSimulation } from '@/hooks/useSimulation'
import { MobileBlock } from '@/components/simulation/MobileBlock'
import { ProblemHeader } from '@/components/simulation/ProblemHeader'
import { ComponentPalette } from '@/components/simulation/ComponentPalette'
import { Canvas } from '@/components/simulation/Canvas'
import { BuilderSidebar } from '@/components/simulation/BuilderSidebar'
import { ValidationErrors } from '@/components/simulation/ValidationErrors'
import { ResultOverlay } from '@/components/simulation/ResultOverlay'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
```

### Not-found state
```tsx
// If problem id does not exist in registry
if (!problem) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-4xl mb-4">🔍</div>
      <h2 className="text-xl font-semibold mb-2">Challenge not found</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        The challenge you are looking for does not exist.
      </p>
      <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => router.push('/sys-simulation')}>
        Back to Challenges
      </Button>
    </div>
  )
}
```

### Locked state
```tsx
// If problem exists but prerequisite is not solved
if (!isUnlocked(problem)) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="text-4xl mb-4">🔒</div>
      <h2 className="text-xl font-semibold mb-2">Challenge locked</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Complete <span className="font-medium text-slate-700 dark:text-slate-300">
          {problem.unlocksAfter}
        </span> first to unlock this challenge.
      </p>
      <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => router.push('/sys-simulation')}>
        Back to Challenges
      </Button>
    </div>
  )
}
```

### Full builder layout — final wired version
```tsx
return (
  <>
    {/* Mobile block — visible only on small screens */}
    <div className="block lg:hidden">
      <MobileBlock />
    </div>

    {/* Full builder — visible only on large screens */}
    <div className="hidden lg:flex flex-col h-screen overflow-hidden">

      {/* Top bar: problem title, controls, budget, timer */}
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

      {/* Main builder area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: component palette */}
        <div className="w-44 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-3">
          <ComponentPalette
            availableComponents={problem.availableComponents}
            disabled={simState.status === 'running' || simState.status === 'paused'}
          />
        </div>

        {/* Center: canvas + validation errors */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {validationResult && !validationResult.valid && (
            <div className="px-4 pt-3">
              <ValidationErrors errors={validationResult.errors} />
            </div>
          )}
          <div className="flex-1 relative">
            <Canvas
              nodes={canvasNodes}
              edges={canvas.edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              disabled={simState.status === 'running' || simState.status === 'paused'}
            />
            {/* Result overlay — rendered on top of canvas */}
            {simState.status === 'completed' && simState.result && (
              <ResultOverlay
                result={simState.result}
                problem={problem}
                onReset={handleReset}
              />
            )}
          </div>
        </div>

        {/* Right: live stats + terminal */}
        <div className="w-56 flex-shrink-0 border-l border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <BuilderSidebar
            simState={simState}
            initialBudget={problem.initialBudget}
          />
        </div>

      </div>
    </div>
  </>
)
```

---

## `src/app/sys-simulation/layout.tsx` — verify and finalize

Ensure the layout:
- Does NOT add extra padding/max-width for the builder route (`[id]`) — the builder needs full viewport height
- DOES add padding/max-width for the list page only
- Uses `children` prop correctly with no extra wrappers that break `h-screen`

```tsx
/**
 * src/app/sys-simulation/layout.tsx
 *
 * Shared layout for all /sys-simulation routes.
 *
 * IMPORTANT CONSTRAINT:
 * The builder page ([id]) needs full viewport height (h-screen) with no
 * extra padding or max-width wrappers — the canvas must fill available space.
 * The list page needs centered content with max-width and padding.
 *
 * Solution: apply max-width/padding only to the list page via its own
 * wrapper div inside page.tsx. The layout renders children directly
 * with only the nav bar above.
 */
```

Layout structure:
```tsx
<div className="min-h-screen bg-slate-50 dark:bg-slate-900">
  {/* Sticky top nav */}
  <nav className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
    <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
      <div>
        <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
          sys-simulation
        </span>
        <span className="ml-2 text-xs text-slate-400 hidden sm:inline">
          system design playground
        </span>
      </div>
    </div>
  </nav>
  {/* Page content — no wrapper, no padding — each page controls its own layout */}
  {children}
</div>
```

---

## `next.config.ts` — verify for Vercel deployment

```ts
/**
 * next.config.ts
 *
 * Next.js configuration for sys-simulation.
 *
 * Deployed on Vercel — standard Next.js deployment.
 * No `output: 'export'` needed — Vercel handles SSR natively.
 *
 * devIndicators disabled — keeps the UI clean during development.
 */

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
}

export default nextConfig
```

---

## `README.md` — implement fully

```markdown
# sys-simulation

An interactive system design simulation game. Build distributed architectures
using drag-and-drop, then run a mathematical simulation to see how your system
performs under real traffic.

Live: [your-vercel-url]

---

## How to run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/sys-simulation](http://localhost:3000/sys-simulation)

---

## How to add a new challenge

1. Create a new file in `src/problems/`:

```ts
// src/problems/my-new-challenge.ts
import type { Problem } from '@/types'

export const myNewChallenge: Problem = {
  id: 'my-new-challenge',
  title: 'My New Challenge',
  subtitle: 'One-line description shown on the card.',
  difficulty: 'medium',
  description: `
    Explain the scenario here. What is the user building?
    What constraints exist? Give a hint about the solution direction.
  `,
  durationSeconds: 60,
  initialBudget: 1200,
  trafficPattern: [
    { atSecond: 0,  rps: 100 },
    { atSecond: 30, rps: 500 },
    { atSecond: 60, rps: 100 },
  ],
  availableComponents: [
    'load-balancer',
    'api-server',
    'redis-cache',
    'sql-database',
  ],
  successConditions: [
    { metric: 'availability',    operator: 'gte', value: 99,  label: 'Availability ≥ 99%' },
    { metric: 'droppedRequests', operator: 'lte', value: 0,   label: 'Zero dropped requests' },
    { metric: 'balance',         operator: 'gte', value: 0,   label: 'Budget not exceeded' },
  ],
  scoringProfile: 'default',
  unlocksAfter: 'flash-sale', // id of the previous challenge
}
```

2. Register it in `src/problems/index.ts`:

```ts
import { myNewChallenge } from './my-new-challenge'

export const problems: Problem[] = [
  urlShortener,
  flashSale,
  myNewChallenge, // add here — order controls display order
]
```

That's it. No engine changes, no UI changes.

---

## How to add a new infrastructure component

1. Add an entry to `src/config/components.ts`:

```ts
{
  type: 'my-component',
  label: 'My Component',
  icon: 'LucideIconName',
  category: 'compute',
  purchaseCost: 300,
  runtimeCostPerSecond: 2,
  capacityRps: 1000,
  basLatencyMs: 5,
  description: 'What does this component do?',
}
```

2. Add the icon to the `iconMap` in `src/components/simulation/ComponentPalette.tsx`.

That's it. The engine, canvas, and palette pick it up automatically.

---

## How to update scoring weights

Edit `src/config/scoring.ts`. Each profile's weights must sum to 1.0.

To add a new profile:
1. Add it to `scoringProfiles` in `src/config/scoring.ts`
2. Add the key to the `ScoringProfile` type in `src/types/index.ts`
3. Reference it in a problem's `scoringProfile` field

---

## Project structure

```
src/
├── app/sys-simulation/     # Pages (SSR list, CSR builder)
├── components/
│   ├── ui/                 # Shared: Badge, Button, StatCard, Terminal
│   └── simulation/         # Game: Canvas, Palette, ResultOverlay, etc.
├── engine/                 # Pure TS: simulator, scorer, validator
├── hooks/                  # useSimulation — game loop
├── problems/               # Challenge definitions + registry
├── config/                 # Component registry + scoring profiles
├── lib/                    # progress.ts, traffic.ts
└── types/                  # All shared TypeScript interfaces
```
```

---

## Final pre-deployment checklist

### TypeScript
- [ ] `npm run build` passes with zero errors
- [ ] Zero `any` types across the entire codebase
- [ ] Every exported function has a JSDoc comment
- [ ] Every component has a top-level JSDoc comment
- [ ] Every prop interface has inline comments

### Routing
- [ ] `/sys-simulation` loads challenge list (SSR)
- [ ] `/sys-simulation/url-shortener` loads builder (CSR)
- [ ] `/sys-simulation/flash-sale` shows locked state before url-shortener is solved
- [ ] `/sys-simulation/nonexistent` shows not-found UI (no crash)
- [ ] Back navigation from builder returns to challenge list

### Gameplay
- [ ] Drag component from palette → appears on canvas
- [ ] Connect two nodes → directed edge with arrow appears
- [ ] Click Start with empty canvas → validation errors appear
- [ ] Click Start with valid architecture → simulation begins
- [ ] Terminal logs update every second
- [ ] Sidebar stats update every second
- [ ] Node load bars animate correctly
- [ ] Pause → timer stops, Resume → timer continues
- [ ] Reset → all state cleared, canvas structure preserved
- [ ] Simulation ends at `problem.durationSeconds`
- [ ] ResultOverlay appears with correct score and metrics
- [ ] Success conditions show correct pass/fail per condition
- [ ] On pass → challenge marked solved in localStorage
- [ ] After passing url-shortener → flash-sale unlocks on list page

### Mobile
- [ ] On viewport < 1024px → MobileBlock visible, canvas hidden
- [ ] On viewport ≥ 1024px → canvas visible, MobileBlock hidden

### Dark/light
- [ ] All pages render correctly in system dark mode
- [ ] All pages render correctly in system light mode
- [ ] Terminal always stays dark regardless of system theme

### Deployment
- [ ] `next.config.ts` has no `output: 'export'`
- [ ] Push to main branch → Vercel deploys successfully
- [ ] Live URL loads `/sys-simulation` without errors
- [ ] No console errors on live deployment
````