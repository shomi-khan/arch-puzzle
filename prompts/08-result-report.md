````markdown
# Step 8 — Result Report Page

## Context
You are continuing to build **sys-simulation** — a system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Steps 1–7 are complete. Types, config, shared UI, problem data, engine, challenge list, canvas builder, and simulation runner all exist.

Now implement the **result report** — the full post-simulation screen that replaces the placeholder `ResultOverlay` from Step 7.

---

## General rules

- TypeScript only. No `any`.
- Client Component — `'use client'` at top.
- Every component must have a top-level JSDoc comment.
- Every prop must have an inline comment.
- Dark/light via `prefers-color-scheme` — no toggle.

---

## Files to create or update

```
src/components/simulation/ResultOverlay.tsx     ← replace Step 7 placeholder, full implementation
src/components/simulation/ReportCard.tsx        ← implement fully
src/components/simulation/SuccessConditions.tsx ← new component
```

---

## `src/components/simulation/ResultOverlay.tsx` — replace placeholder, implement fully

```tsx
/**
 * src/components/simulation/ResultOverlay.tsx
 *
 * Full-screen overlay shown when simulation completes.
 *
 * WHY AN OVERLAY (not a separate page):
 * The user's architecture is still visible behind the overlay — they can
 * see what they built while reading their results. This reinforces the
 * connection between their decisions and the outcome. Navigating to a
 * separate page would break that connection.
 *
 * LAYOUT:
 * - Dark blurred backdrop covers the canvas
 * - Centered modal card with scrollable content
 * - Score + verdict at top (immediate emotional response)
 * - Metric grid below (detailed breakdown)
 * - Success conditions checklist (pass/fail per requirement)
 * - Action buttons at bottom (Try Again / Back to Challenges)
 */
```

### Props
```ts
interface ResultOverlayProps {
  /** The completed simulation result containing all metrics and final score */
  result: SimulationResult
  /** The challenge that was just played — needed for success condition evaluation */
  problem: Problem
  /** Called when user clicks Try Again — resets simulation, closes overlay */
  onReset: () => void
}
```

### Layout structure
```
┌─────────────────────────────────────────┐
│  backdrop: bg-black/60 backdrop-blur-sm │
│  ┌───────────────────────────────────┐  │
│  │  [✅ or ❌]                       │  │
│  │  Challenge Passed! / Not Quite    │  │
│  │                                   │  │
│  │  82 / 100                         │  │
│  │  +410 XP earned    (if passed)    │  │
│  │                                   │  │
│  │  ── Metrics ───────────────────   │  │
│  │  [ReportCard grid]                │  │
│  │                                   │  │
│  │  ── Requirements ──────────────   │  │
│  │  [SuccessConditions list]         │  │
│  │                                   │  │
│  │  [Try Again]  [Back to Challenges]│  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Score display rules
- Score color:
  - >= 70 (passed): `text-green-500 dark:text-green-400`
  - 50–69: `text-amber-500 dark:text-amber-400`
  - < 50: `text-red-500 dark:text-red-400`
- Modal max width: `max-w-lg w-full`
- Modal max height: `max-h-[90vh] overflow-y-auto`
- Modal background: `bg-white dark:bg-slate-800`
- Modal border: `border border-slate-200 dark:border-slate-700`
- Modal padding: `p-8 rounded-2xl shadow-2xl`

### Evaluate success conditions
Use `evaluateSuccessConditions(result, problem)` from `src/engine/scorer.ts`
and pass the output to `<SuccessConditions />`.

### Action buttons
- **Try Again** — `variant="secondary"`, calls `onReset`
- **Back to Challenges** — `variant="ghost"`, uses `next/navigation` router to push `/sys-simulation`
- Layout: `flex gap-3 mt-6`

---

## `src/components/simulation/ReportCard.tsx` — implement fully

```tsx
/**
 * src/components/simulation/ReportCard.tsx
 *
 * Displays the post-simulation metric grid inside ResultOverlay.
 *
 * WHY THIS EXISTS:
 * The result report has 8 metrics to display. Extracting them into a
 * dedicated component keeps ResultOverlay focused on layout and flow,
 * not on metric formatting logic.
 *
 * Each metric is displayed as a labeled card with a value and
 * an optional status color (healthy/warning/critical/neutral).
 */
```

### Props
```ts
interface ReportCardProps {
  /** The completed simulation result to display metrics from */
  result: SimulationResult
  /** Initial budget — used to calculate cost efficiency display */
  initialBudget: number
}
```

### Metrics to display (2-column grid)

| Label | Value | Status logic |
|---|---|---|
| Peak RPS | `{result.peakRps.toLocaleString()} req/s` | neutral |
| Avg Latency | `{result.avgLatencyMs}ms` | healthy ≤100ms, warning ≤300ms, critical >300ms |
| P95 Latency | `{result.p95LatencyMs}ms` | healthy ≤200ms, warning ≤500ms, critical >500ms |
| Availability | `{result.availability}%` | healthy ≥99%, warning ≥95%, critical <95% |
| Cache Hit Ratio | `{(result.cacheHitRatio * 100).toFixed(0)}%` | healthy ≥70%, warning ≥40%, critical <40% |
| Dropped Requests | `{result.droppedRequests.toLocaleString()}` | healthy =0, warning ≤50, critical >50 |
| Infra Cost | `$${result.totalInfraCost.toLocaleString()}` | neutral |
| Final Balance | `$${result.finalBalance.toLocaleString()}` | healthy >0, critical ≤0 |

### Layout
- Grid: `grid grid-cols-2 gap-3`
- Each cell: use `<StatCard>` from `src/components/ui/StatCard.tsx`
- Section header above grid: `text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3`

---

## `src/components/simulation/SuccessConditions.tsx` — implement fully

```tsx
/**
 * src/components/simulation/SuccessConditions.tsx
 *
 * Displays a checklist of success conditions and whether each was met.
 *
 * WHY THIS EXISTS:
 * The user needs to know exactly why they passed or failed — not just
 * a single score. Showing each condition individually gives actionable
 * feedback: "You met availability but dropped too many requests."
 * This turns failure into a learning moment, not just a number.
 */
```

### Props
```ts
interface SuccessConditionsProps {
  /**
   * Evaluated conditions — output of evaluateSuccessConditions()
   * from src/engine/scorer.ts
   */
  conditions: Array<{
    /** Human-readable requirement label e.g. "Availability ≥ 99%" */
    label: string
    /** Whether this condition was satisfied */
    passed: boolean
    /** The actual measured value */
    actual: number
    /** The required threshold value */
    required: number
  }>
}
```

### Item layout
```
✅  Availability ≥ 99%          actual: 99.8%
❌  Zero dropped requests        actual: 143
✅  Budget not exceeded          actual: $340 remaining
```

- Passed: `text-green-600 dark:text-green-400` + ✅ icon
- Failed: `text-red-600 dark:text-red-400` + ❌ icon
- Layout per item: `flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0`
- Label: `text-sm font-medium`
- Actual value: `text-xs text-slate-500 dark:text-slate-400 ml-auto`
- Section header: same style as ReportCard section header

---

## Verification checklist

- [ ] `npm run dev` — no TypeScript errors
- [ ] `npm run build` — passes cleanly
- [ ] ResultOverlay appears automatically when simulation completes
- [ ] Score color is green when passed, amber when 50–69, red when < 50
- [ ] All 8 metric cards render with correct values
- [ ] StatCard status colors are correct per metric thresholds
- [ ] All success conditions render with correct pass/fail state
- [ ] "Try Again" resets simulation and closes overlay
- [ ] "Back to Challenges" navigates to `/sys-simulation`
- [ ] If challenge passed — solved state persists (challenge list shows checkmark)
- [ ] Overlay is scrollable on smaller desktop screens
- [ ] No `any` types anywhere
- [ ] Every component has a top-level JSDoc comment
- [ ] Every prop has an inline comment
````