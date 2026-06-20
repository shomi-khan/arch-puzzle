# Step 8 — Result Summary

## Context
You are continuing to build **arch-lab** — a standalone system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Steps 1–7 are complete. Types, config, shared UI, problem data, engine, challenge list, canvas builder, and simulation runner all exist.

Now implement the **result summary** — the full post-simulation screen that overlays the canvas when simulation completes.

---

## General rules

- TypeScript only. No `any`.
- Client Component — `'use client'` at top.
- **Terminal OS aesthetic** — dark always, monospace everywhere.
- Every component must have a top-level JSDoc comment.
- Every prop must have an inline comment.

---

## Files to create or update

```
src/components/simulation/ResultSummary.tsx      ← replace placeholder, full implementation
src/components/simulation/SuccessConditions.tsx  ← new component
```

---

## Layout overview

```
┌─────────────────────────────────────────────────────────┐
│  backdrop: bg-black/70 backdrop-blur-sm                 │
│  ┌──────────────────────────┬──────────────────────┐    │
│  │  LEFT                    │  RIGHT               │    │
│  │                          │                      │    │
│  │  // result               │  // simulation log   │    │
│  │  82 / 100                │  [full log stream]   │    │
│  │  ✓ passed                │                      │    │
│  │                          │                      │    │
│  │  // requirements         │                      │    │
│  │  [checklist]             │                      │    │
│  │                          │  ── xp earned ──     │    │
│  │  // metrics              │  +410 research funds │    │
│  │  [2-col grid]            │                      │    │
│  │                          │                      │    │
│  │  [▶ next] [↺ retry]      │                      │    │
│  └──────────────────────────┴──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## `src/components/simulation/ResultSummary.tsx` — implement fully

```tsx
/**
 * src/components/simulation/ResultSummary.tsx
 *
 * Full-screen overlay shown when simulation completes.
 *
 * WHY AN OVERLAY (not a separate page):
 * The user's architecture remains visible behind the overlay.
 * This reinforces the connection between their decisions and outcome —
 * they can see what they built while reading their results.
 * Navigating to a separate page would break that connection.
 *
 * LAYOUT: left-right split
 * Left:  score + requirements checklist + metrics grid + action buttons
 * Right: full simulation log (continued from builder) + XP at bottom
 *
 * The log on the right is the SAME log from the builder terminal —
 * it continues the narrative, ending with the score announcement and XP.
 * This makes the result feel like a natural conclusion, not a new screen.
 */
```

### Props
```ts
interface ResultSummaryProps {
  /** The completed simulation result */
  result: SimulationResult
  /** The challenge that was just played */
  problem: Problem
  /** Full log from simulation — shown in right panel */
  logs: LogEntry[]
  /** Called when user clicks reset / try again */
  onReset: () => void
}
```

### Outer overlay
```tsx
<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
  <div className="
    flex w-full max-w-3xl max-h-[90vh]
    bg-[#0a0f1a] border border-[#1e293b] rounded-md
    overflow-hidden shadow-2xl
  ">
    {/* left panel */}
    {/* right panel */}
  </div>
</div>
```

---

### Left panel

Width: `flex-1`, padding: `p-6`, overflow: `overflow-y-auto`

#### Score section
```
// result

82 / 100
✓ challenge passed.
```

- Header: `// result` — `text-[9px] text-[#334155] uppercase tracking-widest mb-4`
- Score number: `text-5xl font-medium`
- Score color:
  - `finalScore >= 70` → `#4ade80`
  - `finalScore >= 50` → `#fbbf24`
  - `finalScore < 50`  → `#ef4444`
- `/ 100` → `text-xl text-[#334155]`
- Verdict line:
  - Passed: `✓ challenge passed.` → `text-xs text-[#4ade80] mt-1`
  - Failed: `✗ requirements not met.` → `text-xs text-[#ef4444] mt-1`

---

#### Requirements section
```
// requirements

✓  availability ≥ 99%          99.8%
✓  zero dropped requests        12
✗  budget not exceeded          -$140
```

- Header: `// requirements` — same style as score header, `mt-6 mb-3`
- Use `<SuccessConditions />` component (see below)

---

#### Metrics section
```
// metrics

peak rps      avg latency    p95 latency    availability
3,000         44ms           91ms           99.8%

cache hit     dropped req    infra cost     final balance
76%           12             $660           $340
```

- Header: `// metrics` — same style, `mt-6 mb-3`
- Grid: `grid grid-cols-2 gap-2`
- Each cell:
```
  label
  value
```
  - Background: `#0f172a`
  - Border: `0.5px solid #1e293b`
  - Border radius: `rounded-sm`
  - Padding: `px-3 py-2`
  - Label: `text-[9px] text-[#475569] uppercase tracking-wide mb-1`
  - Value: `text-sm font-medium text-[#94a3b8]`

Metrics to display:

| label | value | format |
|---|---|---|
| peak rps | `result.peakRps` | `{n.toLocaleString()} req/s` |
| avg latency | `result.avgLatencyMs` | `{n}ms` |
| p95 latency | `result.p95LatencyMs` | `{n}ms` |
| availability | `result.availability` | `{n}%` |
| cache hit | `result.cacheHitRatio` | `{(n*100).toFixed(0)}%` |
| dropped req | `result.droppedRequests` | `{n.toLocaleString()}` |
| infra cost | `result.totalInfraCost` | `$${n.toLocaleString()}` |
| final balance | `result.finalBalance` | `$${n.toLocaleString()}` |

---

#### Action buttons
```
[▶ next challenge]  [↺ try again]  [← back to list]
```

- Layout: `flex gap-2 mt-6`
- **Next challenge** (only if passed):
  - Style: `bg-[#0d2a0d] text-[#4ade80] border border-[#1a3a1a]`
  - Action: `router.push('/sys-simulation')` — list page, user picks next
- **Try again**:
  - Style: `bg-[#1e293b] text-[#64748b] border border-[#334155]`
  - Action: `onReset()`
- **Back to list**:
  - Style: ghost, same as try again
  - Action: `router.push('/sys-simulation')`
- Size: `px-3 py-1 text-xs rounded-sm font-mono`

---

### Right panel

Width: `w-[220px]`, flex-shrink-0, `flex flex-col`, background: `#060d0a`, border-left: `border-l border-[#1e293b]`

#### Log area
```
// log
──────────────
[00:00] ⚙ init complete.
[00:05] ℹ cache hit 78%.
[00:12] ✕ api overloaded.
[01:00] ✓ score: 82/100.
[01:00] ℹ +410 xp earned.
```

- Header: `// log` — `text-[9px] text-[#1a3a1a] uppercase tracking-widest px-3 py-2 border-b border-[#0d1f14] flex-shrink-0`
- Log area: `flex-1 overflow-y-auto px-3 py-2`
- Font: monospace, `text-[11px]`, `leading-relaxed`
- Same level → color mapping as TerminalSidebar
- Auto-scroll to bottom on mount: `useEffect` + `useRef`
- **No blinking cursor** — simulation is complete

#### XP section (bottom of right panel)
```
// xp earned
+410 research funds
```

- Only shown when `result.passed === true`
- Border top: `border-t border-[#0d1f14]`
- Padding: `px-3 py-3 flex-shrink-0`
- Header: `// xp earned` — `text-[9px] text-[#1a3a1a] uppercase tracking-widest mb-2`
- Value: `text-lg font-medium text-[#378ADD]` — `+{result.researchXp}`
- Label: `text-[10px] text-[#334155]` — `research funds`

---

## `src/components/simulation/SuccessConditions.tsx` — implement fully

```tsx
/**
 * src/components/simulation/SuccessConditions.tsx
 *
 * Displays a checklist of success conditions with pass/fail per condition.
 *
 * WHY THIS EXISTS:
 * A single score number doesn't tell the user WHY they passed or failed.
 * Showing each condition individually gives actionable feedback:
 * "You met availability but exceeded the budget."
 * This turns failure into a specific learning moment.
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
    /** Human-readable requirement label */
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
✓  availability ≥ 99%          99.8%
✗  budget not exceeded          -$140
```

- Container: `flex flex-col gap-1`
- Each row: `flex items-center justify-between py-1.5 border-b border-[#131b28] last:border-0`
- Left: icon + label
  - Passed: `✓` `text-[#4ade80]` + label `text-xs text-[#4ade80]`
  - Failed: `✗` `text-[#ef4444]` + label `text-xs text-[#ef4444]`
- Right: actual value
  - Passed: `text-[10px] text-[#4ade80]`
  - Failed: `text-[10px] text-[#ef4444]`

---

## Verification checklist

- [ ] `npm run dev` — no TypeScript errors
- [ ] `npm run build` — passes cleanly
- [ ] ResultSummary appears automatically when simulation completes
- [ ] Overlay covers canvas with dark blur backdrop
- [ ] Score color: green ≥70, amber ≥50, red <50
- [ ] Verdict line correct — passed or failed
- [ ] All 8 metric cells render with correct values
- [ ] Requirements checklist — correct pass/fail per condition
- [ ] Full simulation log visible in right panel
- [ ] Log auto-scrolls to bottom on mount
- [ ] No blinking cursor in result log
- [ ] XP section visible only when passed
- [ ] "Next challenge" button visible only when passed
- [ ] "Try again" calls onReset — overlay closes, canvas resets
- [ ] "Back to list" navigates to `/sys-simulation`
- [ ] After passing — challenge list shows solved state
- [ ] No `any` types
- [ ] Every component has top-level JSDoc comment
- [ ] Every prop has inline comment