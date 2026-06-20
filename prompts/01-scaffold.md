# Step 1 — Project Scaffold & Folder Structure

## Context
You are building **arch-puzzle** — a standalone system design simulation game.
Users learn distributed systems by dragging infrastructure components onto a canvas, building architectures, and running a mathematical simulation to observe system behavior.

Deployed on **Vercel** as a standalone Next.js application.

## Task
Create all project config files, folders, and placeholder files with proper comments. Do not implement any logic yet — only structure, types, config skeletons, and project setup files.

The project must be ready to run with `npm i && npm run dev` — no CLI scaffolding commands needed.

---

## Project config files — create all of these first

### `package.json`
```json
{
  "name": "arch-puzzle",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.3.3",
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
    "eslint-config-next": "15.3.3",
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
 * Next.js configuration for arch-puzzle.
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

### `.gitignore`
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js build output
.next/
out/

# Production build
build/
dist/

# Environment variables — never commit these
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
*.swo
```

### `src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/*
 * globals.css
 *
 * Global styles for arch-puzzle.
 * Terminal OS aesthetic — dark background always, no light mode.
 * All color tokens defined here as CSS variables.
 */

:root {
  --bg-page:       #0a0f1a;
  --bg-panel:      #0f172a;
  --bg-canvas:     #060b14;
  --bg-log:        #060d0a;
  --border:        #1e293b;
  --border-subtle: #131b28;
  --text-primary:  #e2e8f0;
  --text-secondary:#94a3b8;
  --text-muted:    #475569;
  --text-dim:      #334155;
  --accent-blue:   #378ADD;
  --accent-green:  #4ade80;
  --accent-amber:  #fbbf24;
  --accent-red:    #ef4444;
}

html, body {
  background-color: var(--bg-page);
  color: var(--text-primary);
  font-family: var(--font-geist-mono), ui-monospace, monospace;
}

/* Blinking cursor for terminal log */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.cursor-blink {
  display: inline-block;
  animation: blink 1s step-end infinite;
  color: var(--accent-blue);
}

/* Load bar pulse for critical state */
@keyframes pulse-critical {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.load-bar-critical {
  animation: pulse-critical 1s ease-in-out infinite;
}
```

### `src/app/layout.tsx`
```tsx
/**
 * src/app/layout.tsx
 *
 * Root layout for arch-puzzle.
 * Applies monospace font globally — terminal OS aesthetic.
 */

import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'arch-puzzle',
  description: 'Learn distributed systems by building and simulating real architectures.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased`}>
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
│   │   ├── Button.tsx
│   │   ├── StatCard.tsx
│   │   └── Terminal.tsx
│   └── simulation/                         # Game-specific components
│       ├── Canvas.tsx
│       ├── ComponentPalette.tsx
│       ├── ResultSummary.tsx
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
 * Central type definitions for arch-puzzle.
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
  operator: 'gte' | 'lte'
  value: number
  label: string
}

/**
 * Named scoring weight profile.
 * Weights must sum to 1.0.
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
 * Used to derive border color at render time — never stored as a color value.
 */
export type ComponentCategory =
  | 'network'    // Load Balancer — blue
  | 'compute'    // API Server — green
  | 'cache'      // Redis — red
  | 'database'   // SQL, NoSQL — purple
  | 'cdn'        // CDN — amber
  | 'queue'      // Message Queue — orange
  | 'security'   // Rate Limiter — pink

/**
 * Definition of a draggable infrastructure component.
 * Lives in src/config/components.ts registry.
 */
export interface ComponentDefinition {
  type: string
  label: string
  icon: string                    // lucide-react icon name
  category: ComponentCategory
  purchaseCost: number
  runtimeCostPerSecond: number
  capacityRps: number
  baseLatencyMs: number
  description: string
}

/**
 * A node placed on the canvas by the user.
 */
export interface CanvasNode {
  instanceId: string
  type: string
  position: { x: number; y: number }
  currentLoadRps: number
  loadPercent: number             // 0–100
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
  errorRate: number
  cacheHitRatio: number
  balance: number
  nodeStates: Record<string, { loadPercent: number; status: CanvasNode['status'] }>
}

/**
 * Aggregated result after the simulation completes.
 */
export interface SimulationResult {
  challengeId: string
  durationSeconds: number
  peakRps: number
  avgLatencyMs: number
  p95LatencyMs: number
  availability: number
  errorRate: number
  cacheHitRatio: number
  droppedRequests: number
  totalInfraCost: number
  finalBalance: number
  finalScore: number
  passed: boolean
  researchXp: number
}

/**
 * A single challenge / problem definition.
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
  availableComponents: string[]
  successConditions: SuccessCondition[]
  scoringProfile: ScoringProfile
  unlocksAfter: string | null
}

/**
 * Simulation runtime state managed by React.
 */
export interface SimulationState {
  status: 'idle' | 'running' | 'paused' | 'completed'
  elapsed: number
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
 * HOW TO ADD A NEW PROFILE:
 * 1. Add a new key to `scoringProfiles`
 * 2. Add the key to the `ScoringProfile` type in src/types/index.ts
 * 3. Reference it in a Problem's `scoringProfile` field
 *
 * CONSTRAINT: weights in each profile must sum to 1.0
 */

import type { ScoringWeights } from '@/types'

export const scoringProfiles: Record<string, ScoringWeights> = {
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
  },
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
 * HOW TO ADD A NEW COMPONENT:
 * 1. Add a new entry to the `componentRegistry` array below
 * 2. Add the icon to the iconMap in ComponentPalette.tsx
 * 3. The engine, canvas, and palette pick it up automatically
 *
 * NOTE: No color values are stored here.
 * Border color is derived from `category` at render time only.
 * See ARCHITECTURAL.md §7 for the category → color mapping.
 */

import type { ComponentDefinition } from '@/types'

export const componentRegistry: ComponentDefinition[] = [
  {
    type: 'load-balancer',
    label: 'load balancer',
    icon: 'Network',
    category: 'network',
    purchaseCost: 300,
    runtimeCostPerSecond: 2,
    capacityRps: 5000,
    baseLatencyMs: 2,
    description: 'Distributes incoming traffic evenly across backend servers.',
  },
  {
    type: 'api-server',
    label: 'api server',
    icon: 'Server',
    category: 'compute',
    purchaseCost: 200,
    runtimeCostPerSecond: 3,
    capacityRps: 800,
    baseLatencyMs: 10,
    description: 'Handles business logic. Multiple instances increase throughput.',
  },
  {
    type: 'redis-cache',
    label: 'redis cache',
    icon: 'Zap',
    category: 'cache',
    purchaseCost: 400,
    runtimeCostPerSecond: 2,
    capacityRps: 10000,
    baseLatencyMs: 1,
    description: 'In-memory cache. Reduces database load via high cache hit ratio.',
  },
  {
    type: 'sql-database',
    label: 'sql database',
    icon: 'Database',
    category: 'database',
    purchaseCost: 500,
    runtimeCostPerSecond: 4,
    capacityRps: 400,
    baseLatencyMs: 20,
    description: 'Relational database. High consistency, limited write throughput.',
  },
  {
    type: 'nosql-database',
    label: 'nosql database',
    icon: 'DatabaseZap',
    category: 'database',
    purchaseCost: 500,
    runtimeCostPerSecond: 4,
    capacityRps: 800,
    baseLatencyMs: 15,
    description: 'Document store. Higher throughput than SQL, eventual consistency.',
  },
  {
    type: 'cdn',
    label: 'cdn',
    icon: 'Globe',
    category: 'cdn',
    purchaseCost: 500,
    runtimeCostPerSecond: 3,
    capacityRps: 50000,
    baseLatencyMs: 5,
    description: 'Serves static assets from edge nodes. Dramatically reduces origin load.',
  },
  {
    type: 'message-queue',
    label: 'msg queue',
    icon: 'MessageSquare',
    category: 'queue',
    purchaseCost: 350,
    runtimeCostPerSecond: 2,
    capacityRps: 3000,
    baseLatencyMs: 5,
    description: 'Decouples producers from consumers. Absorbs traffic spikes gracefully.',
  },
  {
    type: 'rate-limiter',
    label: 'rate limiter',
    icon: 'Shield',
    category: 'security',
    purchaseCost: 150,
    runtimeCostPerSecond: 1,
    capacityRps: 10000,
    baseLatencyMs: 1,
    description: 'Throttles abusive clients. Protects downstream services from overload.',
  },
]

/**
 * Helper: look up a component definition by its type string.
 *
 * @param type - Component type string e.g. 'load-balancer'
 * @returns ComponentDefinition or undefined if not found
 */
export function getComponentByType(type: string): ComponentDefinition | undefined {
  return componentRegistry.find((c) => c.type === type)
}

/**
 * Derive the canvas node border color from a component's category.
 * Color is never stored — always computed at render time.
 *
 * @param category - ComponentCategory value
 * @returns Hex color string for the node border
 */
export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    network:  '#378ADD',
    compute:  '#4ade80',
    cache:    '#f87171',
    database: '#a78bfa',
    cdn:      '#fbbf24',
    queue:    '#fb923c',
    security: '#f472b6',
  }
  return map[category] ?? '#334155'
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
 * Implemented in Step 4.
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
 * Weights injected from src/config/scoring.ts — never hardcoded here.
 * Implemented in Step 4.
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
 * Implemented in Step 4.
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
  title: 'url shortener',
  subtitle: 'handle 100m users with a read-heavy traffic spike.',
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
    { metric: 'availability',    operator: 'gte', value: 99,  label: 'availability ≥ 99%' },
    { metric: 'avgLatency',      operator: 'lte', value: 100, label: 'avg latency ≤ 100ms' },
    { metric: 'droppedRequests', operator: 'lte', value: 0,   label: 'zero dropped requests' },
    { metric: 'balance',         operator: 'gte', value: 0,   label: 'budget not exceeded' },
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
  title: 'flash sale',
  subtitle: 'survive a 10x traffic spike on a tight budget.',
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
    { metric: 'availability',    operator: 'gte', value: 95, label: 'availability ≥ 95%' },
    { metric: 'droppedRequests', operator: 'lte', value: 50, label: 'dropped requests ≤ 50' },
    { metric: 'balance',         operator: 'gte', value: 0,  label: 'budget not exceeded' },
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

`src/components/ui/Button.tsx` — Shared button with variants
`src/components/ui/StatCard.tsx` — Displays a single metric (label + value)
`src/components/ui/Terminal.tsx` — Scrolling log terminal UI
`src/components/simulation/Canvas.tsx` — React Flow drag-and-drop canvas
`src/components/simulation/ComponentPalette.tsx` — Sidebar with draggable components
`src/components/simulation/ResultSummary.tsx` — Post-simulation result display
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
- [ ] `npm run dev` starts without errors and opens on `http://localhost:3000`
- [ ] Root `/` redirects to `/sys-simulation`
- [ ] `npm run build` completes without type errors
- [ ] `.gitignore` present — `node_modules/` and `.next/` excluded
- [ ] All files exist at the paths listed above
- [ ] No `any` types anywhere
- [ ] Every file has a top-level comment
- [ ] `src/types/index.ts` exports all interfaces listed above
- [ ] `getCategoryColor()` returns correct hex for each category
