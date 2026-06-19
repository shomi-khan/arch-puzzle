# Non-Functional Requirements (NFR)

## 1. Maintainability

- Codebase must be **modular**. Every concern lives in its own file/folder.
- UI components must be **shared and reusable** across pages. No duplicated components.
- Adding a new UI element should not require touching existing components.

## 2. Usability

- **Desktop-first** experience. The simulation canvas requires a large screen.
- On **mobile and tablet** viewports (< 1024px), display a full-screen message:
  > "This experience is best on a desktop browser."
- No canvas or game controls should render on small screens.

## 3. Type Safety

- The entire codebase must use **TypeScript**.
- No `any` types. All props, state, engine outputs, and config must be fully typed.
- Shared types must live in a central `src/types/index.ts` file.

## 4. Performance

- **Simulation runs client-side only.** No server calls during gameplay.
- The simulation game loop must run on a **1-second interval** using `setInterval`.
- Canvas rendering must not block the UI thread. State updates must be batched where possible.

## 5. SEO

- The **challenge list page** must use **Server-Side Rendering (SSR)** so search engines can index challenge titles, descriptions, and difficulty levels.
- All other pages (builder, report) are **Client-Side Rendered (CSR)** — they do not need SEO.

## 6. Portability

- The game must be a **fully standalone Next.js application**.
- No external dependencies on other projects, codebases, or monorepos.
- It must be possible to clone the repo, run `npm i && npm run dev`, and have the game running immediately.

## 7. Scalability (Content)

- Adding new challenges must require **zero code changes**. Only a new data file.
- Updating challenge order, title, or difficulty must be possible by editing a single config file.

## 8. Reliability

- The simulation must produce **deterministic results** for the same architecture input.
- Score calculation must be **pure functions** — no side effects, no randomness.

## 9. Code Readability

- Every file must have a **top-level comment** explaining what it does and why it exists.
- Every function must have a **JSDoc comment** explaining parameters, return value, and side effects.
- Complex logic (simulation math, DAG traversal, score calculation) must have **inline comments** explaining the reasoning, not just the mechanics.
- Comments should explain **why**, not just **what**.

## 10. Progressive Unlock System

- A challenge is **locked** until its prerequisite challenge is solved.
- Solved state persists in **localStorage** — no backend needed.
- The first challenge is always unlocked (`unlocksAfter: null`).

## 11. Visual Design

- The UI must follow a **Terminal OS aesthetic** — dark background always, monospace font throughout, no light mode.
- Background: `#0a0f1a` (page), `#0f172a` (panels), `#060b14` (canvas).
- Font: monospace everywhere — labels, values, logs, buttons.
- **No color-based component distinction** in the palette. Components are distinguished by their lucide-react icon only.
- **Load bar color** must reflect node status dynamically:
  - 0–60% load → green (`#4ade80`)
  - 61–89% load → amber (`#fbbf24`)
  - 90%+ load → red (`#ef4444`), with a pulse animation
- **Blinking cursor** (`█`) must appear at the end of the terminal log while simulation is running. Stops blinking when simulation completes.
- The challenge list page uses a **terminal list pattern** — single column, monospace rows, status on the right.
- The result summary page uses a **left-right split**:
  - Left: score (large), requirements checklist, metric grid, action buttons
  - Right: full simulation log (continued from builder) + XP earned at bottom