# Step 6 — Canvas Builder Page (Drag-and-Drop, CSR)

## Context
You are continuing to build **arch-puzzle** — a standalone system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Steps 1–5 are complete. Types, config, shared UI, problem data, engine, and challenge list page all exist.

Now implement the **builder page** at `/sys-simulation/[id]`. This is a fully client-side rendered page where the user drags infrastructure components onto a canvas, connects them, and prepares to run the simulation.

---

## General rules

- TypeScript only. No `any`.
- `'use client'` at the top of the page file.
- React Flow handles all drag-and-drop and edge connection logic.
- No simulation logic in this step — just the canvas, palette, and static sidebar.
- Simulation runner is wired in Step 7.
- Every component must have a top-level JSDoc comment.
- Every prop must have an inline comment.
- **Terminal OS aesthetic** — dark always, monospace everywhere.
- Mobile: show `MobileBlock`, hide canvas.

---

## Files to create or update

```
src/app/sys-simulation/[id]/page.tsx              ← CSR builder page
src/components/simulation/Canvas.tsx              ← React Flow canvas
src/components/simulation/ComponentPalette.tsx    ← icon-only palette sidebar
src/components/simulation/MetricsRow.tsx          ← new: top metrics bar
src/components/simulation/TerminalSidebar.tsx     ← new: right sidebar (log only)
src/components/simulation/ProblemHeader.tsx       ← top bar with controls
```

---

## Layout overview

```
┌─────────────────────────────────────────────────────────────┐
│  ProblemHeader                                              │
│  ← challenges · flash sale [medium] · 00:23 · [▶][⏸][↺]  │
├─────────────────────────────────────────────────────────────┤
│  MetricsRow                                                 │
│  uptime · avg latency · req/s · balance  (full width row)   │
├───────────────┬─────────────────────────┬───────────────────┤
│ Component     │                         │                   │
│ Palette       │   React Flow Canvas     │  TerminalSidebar  │
│ (icon only)   │                         │  (log full height)│
│ 130px         │   flex-1                │  220px            │
└───────────────┴─────────────────────────┴───────────────────┘
```

---

## `src/app/sys-simulation/[id]/page.tsx` — implement fully

```tsx
/**
 * src/app/sys-simulation/[id]/page.tsx
 *
 * Builder page — where the user constructs their architecture and runs simulation.
 *
 * WHY CLIENT COMPONENT:
 * React Flow requires browser APIs (drag events, pointer events, ResizeObserver).
 * Simulation state runs via setInterval — server cannot run this.
 * Progress (locked/unlocked) is read from localStorage — browser only.
 */
```

### Edge cases to handle

- Problem not found → centered message + back button
- Problem locked → centered message + back button
- Problem found + unlocked → full builder

### Not-found state
```
// challenge not found

the id you requested does not exist.

← back to challenges
```

### Locked state
```
// challenge locked

complete "{prerequisite title}" first.

← back to challenges
```

Both states:
- Background `#0a0f1a`, centered, monospace, dim colors
- Back button: ghost style, monospace

### Full builder structure

```tsx
<>
  {/* mobile block */}
  <div className="block lg:hidden"><MobileBlock /></div>

  {/* full builder — desktop only */}
  <div className="hidden lg:flex flex-col h-screen overflow-hidden bg-[#0a0f1a]">

    {/* top bar: title + controls */}
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

    {/* metrics row: full width below header */}
    <MetricsRow
      simState={simState}
      initialBudget={problem.initialBudget}
    />

    {/* main area: palette + canvas + terminal */}
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
          {/* result overlay when simulation completes */}
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
```

---

## `src/components/simulation/ProblemHeader.tsx` — implement fully

```tsx
/**
 * src/components/simulation/ProblemHeader.tsx
 *
 * Top bar of the builder page.
 * Shows problem title, difficulty, elapsed timer, and simulation controls.
 * Controls are always visible — Start/Pause/Resume/Reset depending on status.
 */
```

### Props
```ts
interface ProblemHeaderProps {
  /** The current challenge being played */
  problem: Problem
  /** Current simulation status — controls which buttons are shown */
  simStatus: SimulationState['status']
  /** Remaining budget — not shown here, shown in MetricsRow */
  balance: number
  /** Elapsed simulation seconds — shown as MM:SS */
  elapsed: number
  /** Called when user clicks Start */
  onStart: () => void
  /** Called when user clicks Pause */
  onPause: () => void
  /** Called when user clicks Resume */
  onResume: () => void
  /** Called when user clicks Reset */
  onReset: () => void
}
```

### Layout
```
← challenges  |  flash sale  [medium]  |  00:23  |  [▶ start] [⏸ pause] [↺ reset]
```

- Background: `#0f172a`
- Border bottom: `0.5px solid #1e293b`
- Height: `h-12`
- Font: monospace, `text-xs`
- Padding: `px-4`
- Layout: `flex items-center justify-between`

### Left section
- `←` link → `/sys-simulation`, color `#475569`, hover `#94a3b8`
- Separator `|` in `#1e293b`
- `problem.title` in `#94a3b8`, lowercase
- Difficulty badge: background + text by difficulty level

### Difficulty badge colors
| difficulty | bg | text |
|---|---|---|
| beginner | `#0d2a0d` | `#4ade80` |
| easy | `#0a2a20` | `#34d399` |
| medium | `#2a1f0d` | `#f59e0b` |
| hard | `#2a1500` | `#fb923c` |
| expert | `#2a0d0d` | `#ef4444` |

### Right section
- Timer: `MM:SS` format, color `#475569`
- Buttons — visibility by status:

| status | buttons |
|---|---|
| idle | `▶ start` (primary only) |
| running | `⏸ pause` + `↺ reset` |
| paused | `▶ resume` (primary) + `↺ reset` |
| completed | `↺ reset` only |

### Button styles
- Primary: `bg-[#0d2a0d] text-[#4ade80] border border-[#1a3a1a]`
- Ghost: `bg-[#1e293b] text-[#64748b] border border-[#334155]`
- Size: `px-3 py-1 text-xs rounded-sm font-mono`
- Hover primary: `hover:bg-[#122e12]`
- Hover ghost: `hover:bg-[#263244] hover:text-[#94a3b8]`

---

## `src/components/simulation/MetricsRow.tsx` — implement fully

```tsx
/**
 * src/components/simulation/MetricsRow.tsx
 *
 * Full-width metrics bar below ProblemHeader.
 * Shows 4 live stats: uptime, avg latency, req/s, balance.
 *
 * WHY SEPARATE FROM HEADER:
 * Header owns navigation and controls.
 * MetricsRow owns simulation feedback.
 * Keeping them separate makes each component focused and easier to update.
 *
 * In idle state, shows placeholder values.
 * Updates every tick during simulation via simState prop.
 */
```

### Props
```ts
interface MetricsRowProps {
  /** Full simulation state — metrics derived from tickHistory */
  simState: SimulationState
  /** Initial budget — used for balance color threshold calculation */
  initialBudget: number
}
```

### Layout
```
uptime        avg latency      req/s          balance
—             —                0              $1,200
```

- Background: `#0a0f1a`
- Border bottom: `0.5px solid #1e293b`
- Grid: `grid grid-cols-4`
- Each cell: `px-5 py-2 border-r border-[#1e293b] last:border-r-0`
- Label: `text-[9px] text-[#475569] uppercase tracking-widest mb-1`
- Value: `text-sm font-medium font-mono`

### Idle values
| metric | idle value | color |
|---|---|---|
| uptime | `—` | `#475569` |
| avg latency | `—` | `#475569` |
| req/s | `0` | `#475569` |
| balance | `$${initialBudget.toLocaleString()}` | `#4ade80` |

### Live value derivation
```ts
const latest = simState.tickHistory[simState.tickHistory.length - 1]

// uptime
const totalReqs = simState.tickHistory.reduce((s, t) => s + t.trafficRps, 0)
const totalDropped = simState.tickHistory.reduce((s, t) => s + t.droppedRequests, 0)
const uptime = totalReqs > 0
  ? ((totalReqs - totalDropped) / totalReqs * 100).toFixed(1) + '%'
  : '—'

// color thresholds
// uptime:  ≥99% → #4ade80, ≥95% → #fbbf24, <95% → #ef4444
// latency: ≤100ms → #4ade80, ≤300ms → #fbbf24, >300ms → #ef4444
// req/s:   neutral → #94a3b8
// balance: >50% initial → #4ade80, >20% → #fbbf24, ≤20% → #ef4444
```

---

## `src/components/simulation/TerminalSidebar.tsx` — implement fully

```tsx
/**
 * src/components/simulation/TerminalSidebar.tsx
 *
 * Right sidebar — terminal log only, full height.
 *
 * WHY LOG ONLY (no stats):
 * Stats are in MetricsRow above the canvas — always visible.
 * This sidebar is dedicated entirely to the log narrative,
 * giving it maximum height and readability.
 *
 * The log tells the story of the simulation second by second —
 * cache hits, overloads, budget warnings, completion.
 * More log height = more context = better learning.
 */
```

### Props
```ts
interface TerminalSidebarProps {
  /** Log entries produced by the engine — appended every tick */
  logs: LogEntry[]
  /** Simulation status — controls blinking cursor visibility */
  simStatus: SimulationState['status']
}
```

### Layout
```
// log
──────────────────
[00:00] ⚙ init complete.
[00:03] ℹ cache hit 78%.
[00:08] ⚠ db pool 88%.
[00:12] ✕ api server 95%.
[00:18] ✓ stable.
[00:23] █   ← blink when running
```

- Background: `#060d0a`
- Full height: `h-full flex flex-col`
- Header: `// log` — `text-[9px] text-[#1a3a1a] uppercase tracking-widest px-3 py-2 border-b border-[#0d1f14] flex-shrink-0`
- Log area: `flex-1 overflow-y-auto px-3 py-2`
- Auto-scroll to bottom on new entries: `useEffect` + `useRef` on log container
- Font: monospace, `text-[11px]`, `leading-relaxed`

### Log entry format
```
[MM:SS] {message}
```

| level | color |
|---|---|
| system | `#4b5563` |
| info | `#3b82f6` |
| warn | `#d97706` |
| critical | `#ef4444` |
| success | `#4ade80` |

### Blinking cursor
```tsx
{simStatus === 'running' && (
  <span className="cursor-blink text-[#378ADD]">█</span>
)}
```
- Show only when `running`
- Remove when `paused`, `completed`, or `idle`

---

## `src/components/simulation/ComponentPalette.tsx` — implement fully

```tsx
/**
 * src/components/simulation/ComponentPalette.tsx
 *
 * Left sidebar — displays draggable infrastructure components.
 *
 * ICON-ONLY DESIGN:
 * Components are distinguished by their lucide-react icon only.
 * No colored left border. Keeps the palette visually clean
 * and consistent with the terminal aesthetic.
 *
 * HOW DRAG-AND-DROP WORKS:
 * Each item sets drag data via event.dataTransfer.setData('componentType', type).
 * Canvas reads this in its onDrop handler and creates a new node.
 */
```

### Props
```ts
interface ComponentPaletteProps {
  /** Component type strings available for this challenge */
  availableComponents: string[]
  /** Disabled during simulation — no dragging allowed */
  disabled: boolean
}
```

### Item layout
```
[icon]  load balancer
        $300 · 2/s
```

- Icon: lucide-react, `size={13}`, color `#64748b`
- Label: `text-[11px] text-[#94a3b8]` lowercase
- Cost: `text-[10px] text-[#475569]`
- Background: `#1e293b`
- Border: `0.5px solid #334155 rounded-sm`
- Hover: `hover:border-[#475569] hover:bg-[#263244]`
- Padding: `p-2 gap-2`
- Disabled: `opacity-50 pointer-events-none`

### Section header
```
// components
```
`text-[9px] text-[#334155] uppercase tracking-widest mb-2`

### Icon map
```ts
import {
  Network, Server, Zap, Database, DatabaseZap,
  Globe, MessageSquare, Shield
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  'load-balancer':  Network,
  'api-server':     Server,
  'redis-cache':    Zap,
  'sql-database':   Database,
  'nosql-database': DatabaseZap,
  'cdn':            Globe,
  'message-queue':  MessageSquare,
  'rate-limiter':   Shield,
}
```

---

## `src/components/simulation/Canvas.tsx` — implement fully

```tsx
/**
 * src/components/simulation/Canvas.tsx
 *
 * React Flow canvas — the drag-and-drop architecture builder.
 *
 * CRITICAL — nodeTypes must be at MODULE LEVEL (outside component):
 * Defining nodeTypes inside the component causes React Flow to
 * reinitialize the canvas on every render (error #002).
 * Always define nodeTypes and edgeTypes outside the component function.
 *
 * HOW NODES ARE ADDED:
 * 1. User drags from ComponentPalette — sets dataTransfer componentType
 * 2. onDrop fires — reads componentType, creates CanvasNode at drop position
 * 3. Parent state updates — React Flow renders new node immediately
 *
 * LOAD BAR COLOR TRANSITIONS:
 * green (0–60%) → amber (61–89%) → red (90%+, with pulse animation)
 * Color is computed at render time from loadPercent — never stored.
 */
```

### Props
```ts
interface CanvasProps {
  /** Current canvas nodes — managed by parent (useSimulation hook) */
  nodes: CanvasNode[]
  /** Current canvas edges — managed by parent */
  edges: CanvasEdge[]
  /** Called when user drops a new component or moves an existing node */
  onNodesChange: (nodes: CanvasNode[]) => void
  /** Called when user connects two nodes */
  onEdgesChange: (edges: CanvasEdge[]) => void
  /** Blocks structural changes during simulation */
  disabled: boolean
}
```

### SimulationNode — custom node (MODULE LEVEL)

```ts
// Defined outside Canvas component — stable reference, no re-initialization
const nodeTypes = { simulationNode: SimulationNode }
```

Node visual:
```
┌──────────────────────────┐  ← border: 1.5px solid getCategoryColor(category)
│  [icon 13px]  api server │  ← icon + label text-[11px] lowercase
│  ████░░  62% · warning   │  ← load bar + status text (hidden when idle)
└──────────────────────────┘
```

Load bar color function:
```ts
function getLoadBarColor(loadPercent: number): string {
  if (loadPercent <= 60) return '#4ade80'
  if (loadPercent <= 89) return '#fbbf24'
  return '#ef4444'
}
```

Load bar:
- Container: `h-1 bg-[#1e293b] rounded-full mt-2`
- Fill: `h-1 rounded-full transition-all duration-500`
- Critical: add `load-bar-critical` class (pulse from `globals.css`)
- Hidden when `status === 'idle'`

Node styling:
- Background: `#0f172a`
- Border: `1.5px solid {getCategoryColor(category)}`
- Border radius: `rounded-md`
- Min width: `120px`
- Padding: `px-3 py-2`
- Font: monospace

### Canvas container
- Background: `#060b14`
- `<Background />`: variant dots, color `#1e293b`, gap 20
- `<Controls />`: show, dark styled
- No `<MiniMap />` — too noisy for terminal aesthetic

### Edge styling
```ts
const defaultEdgeOptions = {
  style: { stroke: '#334155', strokeWidth: 1 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
}
```

### onDrop handler
```ts
const onDrop = useCallback((event: React.DragEvent) => {
  event.preventDefault()
  const componentType = event.dataTransfer.getData('componentType')
  if (!componentType) return

  const bounds = reactFlowWrapper.current?.getBoundingClientRect()
  if (!bounds) return

  const position = reactFlowInstance.screenToFlowPosition({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  })

  const newNode: CanvasNode = {
    instanceId: `${componentType}-${Date.now()}`,
    type: componentType,
    position,
    currentLoadRps: 0,
    loadPercent: 0,
    status: 'idle',
  }

  onNodesChange([...nodes, newNode])
}, [nodes, onNodesChange, reactFlowInstance])
```

---

## `src/components/simulation/ValidationErrors.tsx` — create

```tsx
/**
 * src/components/simulation/ValidationErrors.tsx
 *
 * Displays architecture validation errors above the canvas.
 * Shown when user clicks Start with an invalid architecture.
 * Dismissed automatically when canvas changes.
 */
```

Style:
```
// cannot start

• connect your components with arrows to define the request flow.
• place at least one component on the canvas.
```
- Background: `#1a1200`
- Border: `0.5px solid #2a1f00`
- Color: `#d97706`
- Font: monospace, `text-xs`
- Padding: `p-3 mx-3 mt-2 rounded-sm`

---

## Verification checklist

- [ ] `npm run dev` — `/sys-simulation/url-shortener` loads without errors
- [ ] `npm run build` — no TypeScript errors
- [ ] ProblemHeader: title, difficulty badge, timer, correct buttons per status
- [ ] MetricsRow: 4 columns, placeholder values in idle state
- [ ] Palette: icon + label + cost, no colored border
- [ ] Dragging from palette → node appears on canvas at drop position
- [ ] Node shows icon + label, load bar hidden when idle
- [ ] Connecting two nodes → directed edge with arrow
- [ ] Delete node (select + backspace) → removed
- [ ] `nodeTypes` at module level — no React Flow warning #002
- [ ] TerminalSidebar: full height, log entries render with correct colors
- [ ] Blinking cursor in terminal when running (Step 7 will trigger this)
- [ ] ValidationErrors appear when Start clicked on empty canvas (Step 7)
- [ ] MobileBlock on small screens, builder hidden
- [ ] No `any` types
- [ ] Every component has top-level JSDoc comment