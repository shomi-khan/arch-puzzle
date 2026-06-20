# Step 9 — Mobile Block, Routing, Final Wiring & Polish

## Context
You are continuing to build **arch-lab** — a standalone system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Steps 1–8 are complete. The entire game is functionally built — engine, canvas, simulation loop, and result summary all exist.

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
src/app/sys-simulation/[id]/page.tsx     ← final wiring, all edge cases
src/app/sys-simulation/layout.tsx        ← verify layout wraps routes correctly
src/app/not-found.tsx                    ← global 404 page
src/components/simulation/MobileBlock.tsx ← verify implementation
next.config.ts                           ← verify Vercel config
README.md                                ← update with final live URL
```

---

## `src/app/not-found.tsx` — implement fully

```tsx
/**
 * src/app/not-found.tsx
 *
 * Global 404 page — shown when a route does not exist.
 * Terminal OS aesthetic — consistent with the rest of the game.
 */
```

```
// 404

page not found.

← back to challenges
```

- Background: `#0a0f1a`, full screen, centered
- Font: monospace
- `404` label: `text-[9px] text-[#334155] uppercase tracking-widest mb-4`
- Message: `text-sm text-[#475569]`
- Back link: `text-xs text-[#378ADD] hover:text-[#60a5fa] mt-6`

---

## `src/app/sys-simulation/layout.tsx` — verify and finalize

```tsx
/**
 * src/app/sys-simulation/layout.tsx
 *
 * Shared layout for all /sys-simulation routes.
 *
 * IMPORTANT CONSTRAINT:
 * The builder page ([id]) needs full viewport height (h-screen) with no
 * extra padding or max-width — the canvas must fill all available space.
 * The list page controls its own padding via an inner wrapper.
 *
 * Solution: this layout renders {children} directly with only the nav bar
 * above. Each page manages its own layout internally.
 */
```

### Nav bar
```
arch-lab  |  system design playground
```

```tsx
<nav className="
  sticky top-0 z-10 h-12
  bg-[#0f172a] border-b border-[#1e293b]
  flex items-center px-6
">
  <span className="text-[#378ADD] text-sm font-mono font-medium">
    arch-lab
  </span>
  <span className="text-[#1e293b] mx-3 text-xs">|</span>
  <span className="text-[#334155] text-xs font-mono">
    system design playground
  </span>
</nav>

<div className="bg-[#0a0f1a] min-h-screen">
  {children}
</div>
```

---

## `src/app/sys-simulation/[id]/page.tsx` — final wiring

### All edge cases handled

```tsx
/**
 * src/app/sys-simulation/[id]/page.tsx
 *
 * Builder page — final wired version.
 *
 * Edge cases:
 * 1. Problem not found (invalid URL id) → not-found UI
 * 2. Problem locked (prerequisite unsolved) → locked UI
 * 3. Problem found and unlocked → full builder
 *
 * WHY CLIENT COMPONENT:
 * React Flow needs browser APIs.
 * Simulation state runs via setInterval.
 * Progress is read from localStorage.
 * All three require a Client Component.
 */

'use client'

import { useRouter } from 'next/navigation'
import { getProblemById } from '@/problems'
import { isUnlocked } from '@/lib/progress'
import { useSimulation } from '@/hooks/useSimulation'
import { MobileBlock } from '@/components/simulation/MobileBlock'
import { ProblemHeader } from '@/components/simulation/ProblemHeader'
import { MetricsRow } from '@/components/simulation/MetricsRow'
import { ComponentPalette } from '@/components/simulation/ComponentPalette'
import { Canvas } from '@/components/simulation/Canvas'
import { TerminalSidebar } from '@/components/simulation/TerminalSidebar'
import { ValidationErrors } from '@/components/simulation/ValidationErrors'
import { ResultSummary } from '@/components/simulation/ResultSummary'
```

### Not-found state
```tsx
if (!problem) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 font-mono">
      <div className="text-[9px] text-[#334155] uppercase tracking-widest mb-4">
        // challenge not found
      </div>
      <p className="text-xs text-[#475569] mb-6">
        the id you requested does not exist.
      </p>
      <button
        onClick={() => router.push('/sys-simulation')}
        className="text-xs text-[#378ADD] hover:text-[#60a5fa]"
      >
        ← back to challenges
      </button>
    </div>
  )
}
```

### Locked state
```tsx
if (!isUnlocked(problem)) {
  const prereqTitle = problem.unlocksAfter ?? 'the previous challenge'
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 font-mono">
      <div className="text-[9px] text-[#334155] uppercase tracking-widest mb-4">
        // challenge locked
      </div>
      <p className="text-xs text-[#475569] mb-6">
        complete &quot;{prereqTitle}&quot; first.
      </p>
      <button
        onClick={() => router.push('/sys-simulation')}
        className="text-xs text-[#378ADD] hover:text-[#60a5fa]"
      >
        ← back to challenges
      </button>
    </div>
  )
}
```

### Full builder — final wired version
```tsx
const {
  simState,
  canvasNodes,
  validationResult,
  handleStart,
  handlePause,
  handleResume,
  handleReset,
  handleNodesChange,
  handleEdgesChange,
  canvas,
} = useSimulation(problem)

return (
  <>
    {/* mobile: show block, hide builder */}
    <div className="block lg:hidden">
      <MobileBlock />
    </div>

    {/* desktop: full builder */}
    <div className="hidden lg:flex flex-col h-screen overflow-hidden bg-[#0a0f1a]">

      {/* row 1: problem title + controls */}
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

      {/* row 2: live metrics — full width */}
      <MetricsRow
        simState={simState}
        initialBudget={problem.initialBudget}
      />

      {/* row 3: palette + canvas + terminal */}
      <div className="flex flex-1 overflow-hidden">

        {/* left: component palette */}
        <div className="w-[130px] flex-shrink-0 border-r border-[#1e293b] overflow-y-auto p-2">
          <ComponentPalette
            availableComponents={problem.availableComponents}
            disabled={simState.status === 'running' || simState.status === 'paused'}
          />
        </div>

        {/* center: canvas + validation errors */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {validationResult && !validationResult.valid && (
            <ValidationErrors errors={validationResult.errors} />
          )}
          <div className="flex-1 relative">
            <Canvas
              nodes={canvasNodes}
              edges={canvas.edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              disabled={simState.status === 'running' || simState.status === 'paused'}
            />
            {/* result overlay — rendered on top of canvas when complete */}
            {simState.status === 'completed' && simState.result && (
              <ResultSummary
                result={simState.result}
                problem={problem}
                logs={simState.logs}
                onReset={handleReset}
              />
            )}
          </div>
        </div>

        {/* right: terminal log — full height */}
        <div className="w-[220px] flex-shrink-0 border-l border-[#1e293b]">
          <TerminalSidebar
            logs={simState.logs}
            simStatus={simState.status}
          />
        </div>

      </div>
    </div>
  </>
)
```

---

## `next.config.ts` — verify

```ts
/**
 * next.config.ts
 *
 * Next.js configuration for arch-lab.
 * Deployed on Vercel — standard Next.js deployment.
 * No `output: 'export'` needed — Vercel handles SSR natively.
 */

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
}

export default nextConfig
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
- [ ] `/` redirects to `/sys-simulation`
- [ ] `/sys-simulation` loads challenge list (SSR)
- [ ] `/sys-simulation/url-shortener` loads builder (CSR)
- [ ] `/sys-simulation/flash-sale` shows locked until url-shortener solved
- [ ] `/sys-simulation/nonexistent` shows not-found UI — no crash
- [ ] Global 404 page renders for unknown routes
- [ ] Back navigation from builder returns to challenge list

### Gameplay
- [ ] Drag component from palette → appears on canvas
- [ ] Connect two nodes → directed edge with arrow
- [ ] Start with empty canvas → validation errors appear
- [ ] Start with valid architecture → simulation begins
- [ ] MetricsRow updates every second
- [ ] TerminalSidebar logs update every second
- [ ] Blinking cursor visible during running, stops when completed
- [ ] Node load bars animate — green → amber → red by load%
- [ ] Red nodes pulse (load-bar-critical animation)
- [ ] Pause → timer stops, Resume → timer continues
- [ ] Reset → all state cleared, node load bars return to idle
- [ ] Canvas structure preserved on reset
- [ ] Simulation ends at `problem.durationSeconds`
- [ ] ResultSummary overlay appears with correct score
- [ ] Score color correct — green/amber/red by score value
- [ ] Requirements checklist correct pass/fail per condition
- [ ] Full log visible in ResultSummary right panel
- [ ] XP section visible only when passed
- [ ] On pass → `markSolved` called, challenge list updates
- [ ] Try again → overlay closes, canvas resets
- [ ] Back to list → navigates to `/sys-simulation`

### Challenge list
- [ ] Terminal list pattern — monospace rows
- [ ] URL Shortener: unlocked, clickable
- [ ] Flash Sale: locked until URL Shortener solved
- [ ] Solved challenges show `✓ solved` in green
- [ ] Locked challenges dimmed, not clickable
- [ ] Footer line shows solved count + next challenge
- [ ] Blinking cursor in footer

### Mobile
- [ ] Viewport < 1024px → MobileBlock visible, canvas hidden
- [ ] Viewport ≥ 1024px → canvas visible, MobileBlock hidden
- [ ] MobileBlock: terminal style, no emoji, plain text message

### Visual consistency
- [ ] Dark background everywhere — `#0a0f1a` page, `#0f172a` panels
- [ ] Monospace font throughout — nav, labels, values, buttons, log
- [ ] No colored left border on palette items — icon only
- [ ] Canvas node borders colored by category (render-time only)
- [ ] Load bar colors transition correctly by load%
- [ ] Blinking cursor uses `cursor-blink` CSS class from globals.css

### Deployment
- [ ] `next.config.ts` has no `output: 'export'`
- [ ] Push to main → Vercel deploys successfully
- [ ] Live URL loads `/sys-simulation` without errors
- [ ] No console errors on live deployment
- [ ] SSR challenge list page indexable (check page source for challenge titles)