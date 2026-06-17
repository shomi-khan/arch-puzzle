# sys-simulation

An interactive system design simulation game. Build distributed architectures
using drag-and-drop, then run a mathematical simulation to see how your system
performs under real traffic.

Live: [sys-simulation.vercel.app](https://sys-simulation.vercel.app/)

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
    { atSecond: 0, rps: 100 },
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
    {
      metric: 'availability',
      operator: 'gte',
      value: 99,
      label: 'Availability >= 99%',
    },
    {
      metric: 'droppedRequests',
      operator: 'lte',
      value: 0,
      label: 'Zero dropped requests',
    },
    {
      metric: 'balance',
      operator: 'gte',
      value: 0,
      label: 'Budget not exceeded',
    },
  ],
  scoringProfile: 'default',
  unlocksAfter: 'flash-sale',
}
```

2. Register it in `src/problems/index.ts`:

```ts
import { myNewChallenge } from './my-new-challenge'

export const problems: Problem[] = [
  urlShortener,
  flashSale,
  myNewChallenge,
]
```

That is it. No engine changes, no UI changes.

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

The engine, canvas, and palette pick it up automatically.

---

## How to update scoring weights

Edit `src/config/scoring.ts`. Each profile's weights must sum to 1.0.

To add a new profile:

1. Add it to `scoringProfiles` in `src/config/scoring.ts`
2. Add the key to the `ScoringProfile` type in `src/types/index.ts`
3. Reference it in a problem's `scoringProfile` field

---

## Project structure

```txt
src/
├── app/sys-simulation/     # Pages (SSR list, CSR builder)
├── components/
│   ├── ui/                 # Shared: Badge, Button, StatCard, Terminal
│   └── simulation/         # Game: Canvas, Palette, ResultOverlay, etc.
├── engine/                 # Pure TS: simulator, scorer, validator
├── hooks/                  # useSimulation game loop
├── problems/               # Challenge definitions + registry
├── config/                 # Component registry + scoring profiles
├── lib/                    # progress.ts, traffic.ts
└── types/                  # All shared TypeScript interfaces
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

- [ ] `/sys-simulation` loads challenge list
- [ ] `/sys-simulation/url-shortener` loads builder
- [ ] `/sys-simulation/flash-sale` shows locked state before `url-shortener` is solved
- [ ] `/sys-simulation/nonexistent` shows not-found UI
- [ ] Back navigation from builder returns to challenge list

### Gameplay

- [ ] Drag component from palette -> appears on canvas
- [ ] Connect two nodes -> directed edge with arrow appears
- [ ] Click Start with empty canvas -> validation errors appear
- [ ] Click Start with valid architecture -> simulation begins
- [ ] Terminal logs update every second
- [ ] Sidebar stats update every second
- [ ] Node load bars animate correctly
- [ ] Pause -> timer stops, Resume -> timer continues
- [ ] Reset -> all state cleared, canvas structure preserved
- [ ] Simulation ends at `problem.durationSeconds`
- [ ] ResultOverlay appears with correct score and metrics
- [ ] Success conditions show correct pass/fail per condition
- [ ] On pass -> challenge marked solved in localStorage
- [ ] After passing `url-shortener` -> `flash-sale` unlocks on list page

### Mobile

- [ ] On viewport < 1024px -> MobileBlock visible, canvas hidden
- [ ] On viewport >= 1024px -> canvas visible, MobileBlock hidden

### Dark/light

- [ ] All pages render correctly in system dark mode
- [ ] All pages render correctly in system light mode
- [ ] Terminal always stays dark regardless of system theme

### Deployment

- [ ] `next.config.ts` has no `output: 'export'`
- [ ] Push to main branch -> Vercel deploys successfully
- [ ] Live URL loads `/sys-simulation` without errors
- [ ] No console errors on live deployment
