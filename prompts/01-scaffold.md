````markdown
# Step 1 — Project Scaffold & Folder Structure

## Context
You are building a system design simulation game called **sys-simulation**.
It is a standalone Next.js application deployed on Vercel.
Users learn distributed systems by dragging infrastructure components onto a canvas, building architectures, and running a mathematical simulation to observe system behavior.

## Task
Create all project config files, folders, and placeholder files with proper comments. Do not implement any logic yet — only structure, types, config skeletons, and project setup files.

The project must be ready to run with `npm i && npm run dev` — no CLI scaffolding commands needed.

---

## Project config files — create all of these first

### `package.json`
```json
{
  "name": "sys-simulation",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "reactflow": "^11.11.4",
    "lucide-react": "^0.469.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.1.0",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "typescript": "^5"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `next.config.ts`
```ts
/**
 * next.config.ts
 *
 * Next.js configuration for sys-simulation.
 * Deployed on Vercel — standard Next.js deployment.
 * No `output: 'export'` needed — Vercel handles SSR natively.
 */

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
}

export default nextConfig
```

### `tailwind.config.ts`
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

### `postcss.config.mjs`
```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

export default config
```

### `.eslintrc.json`
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

### `src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Dark/light mode via system preference — no toggle needed */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --border: #334155;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --border: #e2e8f0;
    --text-primary: #0f172a;
    --text-secondary: #64748b;
  }
}
```

### `src/app/layout.tsx`
```tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'sys-simulation',
  description: 'Learn distributed systems by building and simulating real architectures.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

### `src/app/page.tsx`
```tsx
/**
 * src/app/page.tsx
 *
 * Root page — redirects to /sys-simulation.
 * Keeps the root URL clean and forwards visitors to the game.
 */

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/sys-simulation')
}
```

---

## Folder structure to create inside `src/`

```
src/
├── app/
│   ├── sys-simulation/
│   │   ├── page.tsx                        # SSR — Challenge list page
│   │   └── [id]/
│   │       └── page.tsx                    # CSR — Builder + simulation page
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                                 # Shared, reusable UI primitives
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── StatCard.tsx
│   │   └── Terminal.tsx
│   └── simulation/                         # Game-specific components
│       ├── Canvas.tsx
│       ├── ComponentPalette.tsx
│       ├── ReportCard.tsx
│       └── MobileBlock.tsx
├── engine/
│   ├── simulator.ts                        # Core game loop — pure TS, no React
│   ├── scorer.ts                           # Score calculation — pure functions
│   └── validator.ts                        # DAG validation logic
├── hooks/
│   └── useSimulation.ts                    # Game loop hook
├── problems/
│   ├── index.ts                            # Problem registry — ordered export
│   ├── url-shortener.ts                    # Problem 1
│   └── flash-sale.ts                       # Problem 2
├── config/
│   ├── scoring.ts                          # Scoring weight profiles
│   └── components.ts                       # Infrastructure component registry
├── lib/
│   ├── progress.ts                         # localStorage progress tracking
│   └── traffic.ts                          # Traffic interpolation utilities
└── types/
    └── index.ts                            # All shared TypeScript interfaces
```

---

## `src/types/index.ts` — implement fully

```ts
/**
 * src/types/index.ts
 *
 * Central type definitions for the sys-simulation game.
 * All interfaces, enums, and type aliases live here.
 * No logic. No imports from other src files.
 */

/** Difficulty levels for challenges, ordered from easiest to hardest */
export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'

/**
 * A single point in a traffic pattern timeline.
 * The engine interpolates between points to get rps at any given second.
 */
export interface TrafficPoint {
  atSecond: number  // time in seconds from simulation start
  rps: number       // requests per second at this point
}

/** Traffic pattern is a timeline of rps values across the simulation duration */
export type TrafficPattern = TrafficPoint[]

/**
 * A success condition that must be met for the challenge to be passed.
 * The engine evaluates all conditions at the end of the simulation.
 */
export interface SuccessCondition {
  metric: 'availability' | 'avgLatency' | 'errorRate' | 'droppedRequests' | 'balance'
  operator: 'gte' | 'lte'   // gte = greater than or equal, lte = less than or equal
  value: number
  label: string              // Human-readable description shown in UI
}

/**
 * Named scoring weight profile.
 * Weights must sum to 1.0.
 * Different challenges can reference different profiles.
 */
export interface ScoringWeights {
  availability: number
  latency: number
  costEfficiency: number
  errorRate: number
}

/** Reference to a named scoring profile defined in src/config/scoring.ts */
export type ScoringProfile = 'default' | 'costFocused' | 'latencyFocused'

/**
 * Category of an infrastructure component.
 * Used for color-coding borders in the canvas UI.
 */
export type ComponentCategory =
  | 'network'     // Load Balancer, DNS — blue
  | 'compute'     // API Server, Worker — green
  | 'cache'       // Redis — red
  | 'database'    // SQL, NoSQL — purple
  | 'cdn'         // CDN — amber
  | 'queue'       // Message Queue — orange
  | 'security'    // Rate Limiter — pink

/**
 * Definition of a draggable infrastructure component.
 * Lives in src/config/components.ts registry.
 */
export interface ComponentDefinition {
  type: string                    // unique string id e.g. 'load-balancer'
  label: string                   // display name e.g. 'Load Balancer'
  icon: string                    // lucide-react icon name
  category: ComponentCategory
  purchaseCost: number            // one-time cost when placed on canvas
  runtimeCostPerSecond: number    // deducted from balance every tick
  capacityRps: number             // max requests per second this component handles
  basLatencyMs: number            // latency added to request path in ms
  description: string             // tooltip / info text shown in UI
}

/**
 * A node placed on the canvas by the user.
 * Extends ComponentDefinition with position and runtime state.
 */
export interface CanvasNode {
  instanceId: string              // unique id for this placed instance
  type: string                    // references ComponentDefinition.type
  position: { x: number; y: number }
  // Runtime state — updated every tick by the engine
  currentLoadRps: number
  loadPercent: number             // 0-100
  status: 'idle' | 'healthy' | 'warning' | 'overloaded'
}

/**
 * A directed edge connecting two canvas nodes.
 * Represents traffic flow direction.
 */
export interface CanvasEdge {
  id: string
  fromInstanceId: string
  toInstanceId: string
}

/** Full state of the user's canvas at any point in time */
export interface CanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

/**
 * A single log entry written by the engine during simulation.
 * Displayed in the terminal UI component.
 */
export interface LogEntry {
  second: number
  level: 'system' | 'info' | 'warn' | 'critical' | 'success'
  message: string
}

/**
 * Snapshot of system metrics at a single tick.
 * The engine produces one of these per second.
 */
export interface TickMetrics {
  second: number
  trafficRps: number
  droppedRequests: number
  avgLatencyMs: number
  errorRate: number               // 0.0 to 1.0
  cacheHitRatio: number           // 0.0 to 1.0
  balance: number
  nodeStates: Record<string, { loadPercent: number; status: CanvasNode['status'] }>
}

/**
 * Aggregated result after the simulation completes.
 * Used to render the result report page.
 */
export interface SimulationResult {
  challengeId: string
  durationSeconds: number
  peakRps: number
  avgLatencyMs: number
  p95LatencyMs: number
  availability: number            // 0-100
  errorRate: number               // 0.0 to 1.0
  cacheHitRatio: number
  droppedRequests: number
  totalInfraCost: number
  finalBalance: number
  finalScore: number              // 0-100 weighted score
  passed: boolean
  researchXp: number              // earned XP based on score
}

/**
 * A single challenge / problem definition.
 * Stored in src/problems/*.ts and registered in src/problems/index.ts
 */
export interface Problem {
  id: string
  title: string
  subtitle: string
  difficulty: Difficulty
  description: string
  durationSeconds: number
  initialBudget: number
  trafficPattern: TrafficPattern
  availableComponents: string[]   // list of ComponentDefinition.type values
  successConditions: SuccessCondition[]
  scoringProfile: ScoringProfile
  /**
   * ID of the problem that must be solved before this one unlocks.
   * null = always unlocked (first challenge in the sequence).
   */
  unlocksAfter: string | null
}

/**
 * Simulation runtime state managed by React.
 * Passed down to engine functions each tick.
 */
export interface SimulationState {
  status: 'idle' | 'running' | 'paused' | 'completed'
  elapsed: number                 // seconds since start
  balance: number
  logs: LogEntry[]
  tickHistory: TickMetrics[]
  result: SimulationResult | null
}
```

---

## `src/config/scoring.ts` — implement fully

```ts
/**
 * src/config/scoring.ts
 *
 * Scoring weight profiles for the simulation engine.
 *
 * WHY THIS EXISTS:
 * Different challenges emphasize different tradeoffs.
 * A cost-optimization challenge should reward budget efficiency more than latency.
 * A high-availability challenge should penalize dropped requests heavily.
 *
 * HOW TO ADD A NEW PROFILE:
 * 1. Add a new key to `scoringProfiles`
 * 2. Add the key to the `ScoringProfile` type in src/types/index.ts
 * 3. Reference it in a Problem's `scoringProfile` field
 *
 * CONSTRAINT: weights in each profile must sum to 1.0
 */

import type { ScoringWeights } from '@/types'

export const scoringProfiles: Record<string, ScoringWeights> = {
  /**
   * Default profile — balanced across all metrics.
   * Used for general-purpose challenges.
   */
  default: {
    availability: 0.35,
    latency: 0.25,
    costEfficiency: 0.20,
    errorRate: 0.20,
  },

  /**
   * Cost-focused profile — rewards architectures that stay within budget.
   * Used for challenges where over-engineering is penalized.
   */
  costFocused: {
    availability: 0.25,
    latency: 0.20,
    costEfficiency: 0.40,
    errorRate: 0.15,
  },

  /**
   * Latency-focused profile — rewards low-latency architectures.
   * Used for real-time system challenges (e.g. chat, gaming).
   */
  latencyFocused: {
    availability: 0.30,
    latency: 0.40,
    costEfficiency: 0.10,
    errorRate: 0.20,
  },
}

/** Pass threshold — score must be at or above this to mark a challenge as solved */
export const PASS_THRESHOLD = 70

/** XP reward formula multiplier — finalScore * XP_MULTIPLIER = researchXp earned */
export const XP_MULTIPLIER = 5
```

---

## `src/config/components.ts` — implement fully

```ts
/**
 * src/config/components.ts
 *
 * Registry of all draggable infrastructure components available in the game.
 *
 * WHY THIS EXISTS:
 * Components are data, not code. Adding a new component type (e.g. Kafka, Shard Router)
 * should never require touching engine logic. Just add an entry here.
 *
 * HOW TO ADD A NEW COMPONENT:
 * 1. Add a new entry to the `componentRegistry` array below
 * 2. Add the icon to the iconMap in ComponentPalette.tsx
 * 3. The engine, canvas, and palette will automatically pick it up
 *
 * Icon names reference lucide-react icon identifiers.
 * Border colors are mapped by category in the Canvas component.
 */

import type { ComponentDefinition } from '@/types'

export const componentRegistry: ComponentDefinition[] = [
  {
    type: 'load-balancer',
    label: 'Load Balancer',
    icon: 'Network',
    category: 'network',
    purchaseCost: 300,
    runtimeCostPerSecond: 2,
    capacityRps: 5000,
    basLatencyMs: 2,
    description: 'Distributes incoming traffic evenly across backend servers.',
  },
  {
    type: 'api-server',
    label: 'API Server',
    icon: 'Server',
    category: 'compute',
    purchaseCost: 200,
    runtimeCostPerSecond: 3,
    capacityRps: 800,
    basLatencyMs: 10,
    description: 'Handles business logic. Multiple instances increase throughput.',
  },
  {
    type: 'redis-cache',
    label: 'Redis Cache',
    icon: 'Zap',
    category: 'cache',
    purchaseCost: 400,
    runtimeCostPerSecond: 2,
    capacityRps: 10000,
    basLatencyMs: 1,
    description: 'In-memory cache. Reduces database load via high cache hit ratio.',
  },
  {
    type: 'sql-database',
    label: 'SQL Database',
    icon: 'Database',
    category: 'database',
    purchaseCost: 500,
    runtimeCostPerSecond: 4,
    capacityRps: 400,
    basLatencyMs: 20,
    description: 'Relational database. High consistency, limited write throughput.',
  },
  {
    type: 'nosql-database',
    label: 'NoSQL Database',
    icon: 'DatabaseZap',
    category: 'database',
    purchaseCost: 500,
    runtimeCostPerSecond: 4,
    capacityRps: 800,
    basLatencyMs: 15,
    description: 'Document store. Higher throughput than SQL, eventual consistency.',
  },
  {
    type: 'cdn',
    label: 'CDN',
    icon: 'Globe',
    category: 'cdn',
    purchaseCost: 500,
    runtimeCostPerSecond: 3,
    capacityRps: 50000,
    basLatencyMs: 5,
    description: 'Serves static assets from edge nodes. Dramatically reduces origin load.',
  },
  {
    type: 'message-queue',
    label: 'Message Queue',
    icon: 'MessageSquare',
    category: 'queue',
    purchaseCost: 350,
    runtimeCostPerSecond: 2,
    capacityRps: 3000,
    basLatencyMs: 5,
    description: 'Decouples producers from consumers. Absorbs traffic spikes gracefully.',
  },
  {
    type: 'rate-limiter',
    label: 'Rate Limiter',
    icon: 'Shield',
    category: 'security',
    purchaseCost: 150,
    runtimeCostPerSecond: 1,
    capacityRps: 10000,
    basLatencyMs: 1,
    description: 'Throttles abusive clients. Protects downstream services from overload.',
  },
]

/**
 * Helper: look up a component definition by its type string.
 * Returns undefined if not found — caller must handle this case.
 *
 * @param type - The component type string e.g. 'load-balancer'
 * @returns ComponentDefinition or undefined
 */
export function getComponentByType(type: string): ComponentDefinition | undefined {
  return componentRegistry.find((c) => c.type === type)
}
```

---

## Placeholder files — create with top-level comments only

### `src/engine/simulator.ts`
```ts
/**
 * src/engine/simulator.ts
 *
 * Core simulation game loop.
 * Pure TypeScript only. No React imports. No DOM access.
 * React components call these functions and store results in state.
 */
export {}
```

### `src/engine/scorer.ts`
```ts
/**
 * src/engine/scorer.ts
 *
 * Score calculation functions.
 * All functions are pure — same input always produces same output.
 * Weights are injected from src/config/scoring.ts — never hardcoded here.
 */
export {}
```

### `src/engine/validator.ts`
```ts
/**
 * src/engine/validator.ts
 *
 * Architecture validation — runs before simulation starts.
 * Validates the user's canvas forms a valid DAG with a proper request flow.
 * Returns structured validation errors, never throws exceptions.
 */
export {}
```

### `src/hooks/useSimulation.ts`
```ts
/**
 * src/hooks/useSimulation.ts
 *
 * Custom React hook — owns the entire simulation game loop.
 * The builder page calls this hook and gets back handlers and state.
 * Implemented in Step 7.
 */
export {}
```

### `src/problems/index.ts`
```ts
/**
 * src/problems/index.ts
 *
 * Problem registry — the single source of truth for all challenges.
 *
 * HOW TO ADD A NEW PROBLEM:
 * 1. Create a new file in src/problems/
 * 2. Import it here and add it to the `problems` array
 * 3. Order in this array = order shown on the challenge list page
 */

import type { Problem } from '@/types'
import { urlShortener } from './url-shortener'
import { flashSale } from './flash-sale'

export const problems: Problem[] = [
  urlShortener,
  flashSale,
]

export function getProblemById(id: string): Problem | undefined {
  return problems.find((p) => p.id === id)
}

export function getPrerequisite(problem: Problem): Problem | null {
  if (!problem.unlocksAfter) return null
  return getProblemById(problem.unlocksAfter) ?? null
}
```

### `src/problems/url-shortener.ts`
```ts
/**
 * src/problems/url-shortener.ts
 *
 * Challenge: URL Shortener
 * Difficulty: Beginner
 */

import type { Problem } from '@/types'

export const urlShortener: Problem = {
  id: 'url-shortener',
  title: 'URL Shortener',
  subtitle: 'Handle 100M users with a read-heavy traffic spike.',
  difficulty: 'beginner',
  description: `
    A viral link is being shared across social media.
    Your URL shortener must handle a sudden spike to 2,000 req/s
    without dropping requests or exceeding your budget.
    Hint: most traffic is reads — caching will help significantly.
  `,
  durationSeconds: 45,
  initialBudget: 1200,
  trafficPattern: [
    { atSecond: 0,  rps: 100  },
    { atSecond: 10, rps: 500  },
    { atSecond: 20, rps: 2000 },
    { atSecond: 35, rps: 800  },
    { atSecond: 45, rps: 200  },
  ],
  availableComponents: [
    'load-balancer',
    'api-server',
    'redis-cache',
    'sql-database',
    'rate-limiter',
  ],
  successConditions: [
    { metric: 'availability',    operator: 'gte', value: 99,  label: 'Availability ≥ 99%' },
    { metric: 'avgLatency',      operator: 'lte', value: 100, label: 'Avg latency ≤ 100ms' },
    { metric: 'droppedRequests', operator: 'lte', value: 0,   label: 'Zero dropped requests' },
    { metric: 'balance',         operator: 'gte', value: 0,   label: 'Budget not exceeded' },
  ],
  scoringProfile: 'default',
  unlocksAfter: null,
}
```

### `src/problems/flash-sale.ts`
```ts
/**
 * src/problems/flash-sale.ts
 *
 * Challenge: Flash Sale
 * Difficulty: Medium
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
    { metric: 'availability',    operator: 'gte', value: 95, label: 'Availability ≥ 95%' },
    { metric: 'droppedRequests', operator: 'lte', value: 50, label: 'Dropped requests ≤ 50' },
    { metric: 'balance',         operator: 'gte', value: 0,  label: 'Budget not exceeded' },
  ],
  scoringProfile: 'costFocused',
  unlocksAfter: 'url-shortener',
}
```

### `src/lib/progress.ts`
```ts
/**
 * src/lib/progress.ts
 *
 * Player progress tracking — stores which challenges have been solved.
 * All localStorage access is isolated here.
 * Implemented in Step 3.
 */
export {}
```

### `src/lib/traffic.ts`
```ts
/**
 * src/lib/traffic.ts
 *
 * Traffic interpolation utilities.
 * Implemented in Step 3.
 */
export {}
```

### Remaining placeholder files — create with top-level comment only

`src/components/ui/Badge.tsx` — Shared badge component for difficulty labels
`src/components/ui/Button.tsx` — Shared button with variants
`src/components/ui/StatCard.tsx` — Displays a single metric (label + value)
`src/components/ui/Terminal.tsx` — Scrolling log terminal UI
`src/components/simulation/Canvas.tsx` — React Flow drag-and-drop canvas
`src/components/simulation/ComponentPalette.tsx` — Sidebar with draggable components
`src/components/simulation/ReportCard.tsx` — Post-simulation result display
`src/components/simulation/MobileBlock.tsx` — Full-screen mobile warning
`src/app/sys-simulation/page.tsx` — SSR challenge list page
`src/app/sys-simulation/[id]/page.tsx` — CSR builder + simulation page

Each placeholder must have:
1. A top-level JSDoc comment explaining what the file does and why it exists
2. `export default function` or `export {}` so TypeScript does not complain
3. No actual implementation

---

## Verification checklist

- [ ] `npm i` completes without errors
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without type errors
- [ ] All files exist at the paths listed above
- [ ] Root `/` redirects to `/sys-simulation`
- [ ] No `any` types anywhere
- [ ] Every file has a top-level comment
- [ ] `src/types/index.ts` exports all interfaces listed above
````