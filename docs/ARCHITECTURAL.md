# Architectural Constraints

## 1. Data-Driven Problem Layer

- All challenges must be defined as **TypeScript files** inside `src/problems/`.
- Each problem file exports a single object conforming to the `Problem` interface.
- A central `src/problems/index.ts` file acts as the **registry** — it imports and exports all problems as an ordered array.
- To add a new problem: create a new TS file, import it in `index.ts`. Nothing else changes.

### Problem schema (required fields):
```ts
interface Problem {
  id: string
  title: string
  subtitle: string
  difficulty: Difficulty
  description: string
  durationSeconds: number
  initialBudget: number
  trafficPattern: TrafficPattern
  availableComponents: ComponentType[]
  successConditions: SuccessCondition[]
  scoringProfile: ScoringProfile
  unlocksAfter: string | null  // id of prerequisite problem, null = always unlocked
}
```

### TrafficPattern schema:
```ts
interface TrafficPoint {
  atSecond: number  // time in seconds from simulation start
  rps: number       // requests per second at this point
}

type TrafficPattern = TrafficPoint[]
// Engine interpolates between points linearly to get rps at any given second
```

## 2. Configurable Scoring Engine

- Scoring weights must live in a **single config file**: `src/config/scoring.ts`.
- No weight values are hardcoded inside engine logic.
- Multiple **named weight profiles** are supported (e.g. `default`, `costFocused`, `latencyFocused`).
- Each challenge references a profile by name via `scoringProfile`.

### Scoring config structure:
```ts
// src/config/scoring.ts
export const scoringProfiles = {
  default: {
    availability: 0.35,
    latency: 0.25,
    costEfficiency: 0.20,
    errorRate: 0.20,
  },
  costFocused: {
    availability: 0.25,
    latency: 0.20,
    costEfficiency: 0.40,
    errorRate: 0.15,
  }
}
```

## 3. Simulation Engine Separation

- The simulation engine must live entirely in `src/engine/`.
- Engine functions must be **pure TypeScript** — no React imports, no DOM access.
- Engine exports: `processTick()`, `calculateResult()`, `validateArchitecture()`.
- React components consume engine output via state — they never call DOM APIs directly.

## 4. Component Registry

- All draggable infrastructure components (Load Balancer, Redis, etc.) must be defined in `src/config/components.ts`.
- Each component entry contains: id, label, icon (lucide-react name), category, purchaseCost, runtimeCostPerSecond, capacityRps, baseLatencyMs, description.
- Adding a new component type requires only adding an entry here — no engine changes.
- **No color is stored per component.** Color is derived from `category` at render time only.

## 5. Folder Structure

```
src/
├── app/
│   ├── sys-simulation/
│   │   ├── page.tsx               # SSR — challenge list
│   │   └── [id]/
│   │       └── page.tsx           # CSR — builder + simulation
├── components/
│   ├── ui/                        # Shared: Button, StatCard, Terminal
│   └── simulation/                # Game-specific: Canvas, Palette, ResultSummary, MobileBlock
├── engine/
│   ├── simulator.ts               # Core game loop logic
│   ├── scorer.ts                  # Score calculation (pure functions)
│   └── validator.ts               # Architecture validation (DAG checks)
├── hooks/
│   └── useSimulation.ts           # Game loop hook — owns all simulation state
├── problems/
│   ├── index.ts                   # Registry — ordered export
│   ├── url-shortener.ts
│   └── flash-sale.ts
├── config/
│   ├── scoring.ts                 # Weight profiles
│   └── components.ts              # Component registry
├── lib/
│   ├── progress.ts                # localStorage progress tracking
│   └── traffic.ts                 # Traffic interpolation utilities
└── types/
    └── index.ts                   # All shared TypeScript interfaces
```

## 6. Routing

- Base route: `/sys-simulation` → challenge list (SSR)
- Challenge route: `/sys-simulation/[id]` → builder page (CSR, `'use client'`)
- Root `/` redirects to `/sys-simulation`
- No other routes needed for MVP.

## 7. Styling & Visual Design

- **Tailwind CSS** only. No CSS modules, no styled-components.
- **Dark background always** — no `prefers-color-scheme`, no light mode toggle.
- Base colors defined in `globals.css`:
  - Page background: `#0a0f1a`
  - Panel background: `#0f172a`
  - Canvas background: `#060b14`
  - Log background: `#060d0a`
  - Border: `#1e293b`
- **Monospace font** everywhere — nav, labels, values, buttons, log.
- Component category → canvas node border color (render-time only, not stored):
  - `network` → blue (`#378ADD`)
  - `compute` → green (`#4ade80`)
  - `cache` → red (`#f87171`)
  - `database` → purple (`#a78bfa`)
  - `cdn` → amber (`#fbbf24`)
  - `queue` → orange (`#fb923c`)
  - `security` → pink (`#f472b6`)
- **Palette items use icon only** — no colored left border. Icon color: `#64748b`.
- Load bar color transitions by load percentage:
  - 0–60%: `#4ade80` (green)
  - 61–89%: `#fbbf24` (amber)
  - 90%+: `#ef4444` (red) + pulse animation

## 8. Git & Deployment

- This project is a **standalone git repository** — no monorepo, no submodules.
- Deployed to **Vercel**. Standard Next.js deployment — no `output: 'export'` needed.
- All simulation rendering is client-side — no Node.js server required at runtime for gameplay.
- SSR is used only for the challenge list page (for SEO).