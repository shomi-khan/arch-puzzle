# Architectural Constraints

## 1. Data-Driven Problem Layer

- All challenges must be defined as **JSON files** inside `src/problems/`.
- Each problem file exports a single object conforming to the `Problem` interface.
- A central `src/problems/index.ts` file acts as the **registry** — it imports and exports all problems as an ordered array.
- To add a new problem: create a new JSON/TS file, import it in `index.ts`. Nothing else changes.

### Problem schema (required fields):
```ts
interface Problem {
  id: string
  title: string
  subtitle: string
  difficulty: 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'
  description: string
  durationSeconds: number
  initialBudget: number
  trafficPattern: TrafficPattern
  availableComponents: ComponentType[]
  successConditions: SuccessCondition[]
  scoringProfile: ScoringProfile  // references a named weight config
}
```

## 2. Configurable Scoring Engine

- Scoring weights must live in a **single config file**: `src/config/scoring.ts`.
- No weight values are hardcoded inside engine logic.
- Multiple **named weight profiles** are supported (e.g. `default`, `cost-focused`, `latency-focused`).
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
- Engine exports: `runTick()`, `calculateScore()`, `validateArchitecture()`.
- React components consume engine output via state — they never call DOM APIs directly.

## 4. Component Registry

- All draggable infrastructure components (Load Balancer, Redis, etc.) must be defined in `src/config/components.ts`.
- Each component entry contains: id, label, icon, borderColor, purchaseCost, runtimeCostPerSecond, capacity, latencyMs.
- Adding a new component type requires only adding an entry here — no engine changes.

## 5. Folder Structure

```
src/
├── app/
│   ├── sys-simulation/
│   │   ├── page.tsx               # SSR — challenge list
│   │   └── [id]/
│   │       └── page.tsx           # CSR — builder + simulation
├── components/
│   ├── ui/                        # Shared: Button, Badge, StatCard, Terminal
│   └── simulation/                # Game-specific: Canvas, Palette, ReportCard
├── engine/
│   ├── simulator.ts               # Core game loop logic
│   ├── scorer.ts                  # Score calculation (pure functions)
│   └── validator.ts               # Architecture validation (DAG checks)
├── problems/
│   ├── index.ts                   # Registry — ordered export
│   ├── url-shortener.ts
│   └── flash-sale.ts
├── config/
│   ├── scoring.ts                 # Weight profiles
│   └── components.ts              # Component registry
└── types/
    └── index.ts                   # All shared TypeScript interfaces
```

## 6. Routing

- Base route: `/sys-simulation` → challenge list (SSR)
- Challenge route: `/sys-simulation/[id]` → builder page (CSR, `'use client'`)
- No other routes needed for MVP.

## 7. Styling

- **Tailwind CSS** only. No CSS modules, no styled-components.
- Dark/light mode via `prefers-color-scheme` media query. No toggle, no `next-themes`.
- Color usage follows component category:
  - Load Balancer → blue border
  - API/App Server → green border
  - Cache (Redis) → red border
  - Database → purple border
  - CDN → amber border
  - Queue → orange border
  - Rate Limiter → pink border

## 8. Git & Deployment

- This project lives in its own **git repository**.
- It is embedded in the portfolio via **git submodule**.
- Deployed to **GitHub Pages** as a static export (`output: 'export'` in `next.config.ts`).
- All rendering is static or client-side — no Node.js server required at runtime.