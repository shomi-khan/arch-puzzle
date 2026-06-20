# Step 5 — Challenge List Page (SSR)

## Context
You are continuing to build **arch-quest** — a standalone system design simulation game built with Next.js, TypeScript, and Tailwind CSS.

Steps 1–4 are complete. Types, config, shared UI components, problem data layer, progress tracking, and simulation engine all exist.

Now implement the **challenge list page** at `/sys-simulation`. This is the only SSR page in the project.

---

## General rules

- TypeScript only. No `any`.
- This page is a **React Server Component** — no `'use client'` directive.
- Progress state (solved/unlocked) is client-side only — use a Client Component island for that.
- Every component must have a top-level JSDoc comment.
- Every prop must have an inline comment.
- **Terminal OS aesthetic** — dark background always, monospace font, no light mode.
- Mobile: show `MobileBlock` component, hide everything else.

---

## Files to create or update

```
src/app/sys-simulation/page.tsx           ← SSR page (Server Component)
src/app/sys-simulation/layout.tsx         ← layout for /sys-simulation routes
src/components/simulation/MobileBlock.tsx ← implement fully
src/components/simulation/ChallengeList.tsx ← new Client Component
```

---

## `src/app/sys-simulation/layout.tsx` — implement fully

```tsx
/**
 * src/app/sys-simulation/layout.tsx
 *
 * Shared layout for all /sys-simulation routes.
 *
 * IMPORTANT:
 * The builder page ([id]) needs full viewport height with no extra padding.
 * The list page controls its own padding via an inner wrapper.
 * This layout renders children directly — only the nav bar is shared.
 */
```

### Nav bar
```
arch-quest  |  system design playground
```
- Background: `#0f172a`
- Border bottom: `0.5px solid #1e293b`
- Sticky, `z-10`
- Left: `arch-quest` in accent blue (`#378ADD`) + `system design playground` in dim text
- Right: empty for MVP
- Height: `h-12`
- Font: monospace

---

## `src/components/simulation/MobileBlock.tsx` — implement fully

```tsx
/**
 * src/components/simulation/MobileBlock.tsx
 *
 * Full-screen message shown on mobile and tablet viewports (< 1024px).
 * The simulation canvas requires drag-and-drop — impractical on touch screens.
 * Shown via: block lg:hidden on the parent.
 */
```

### Layout
```
// mobile not supported

open this on a desktop
browser for the full
experience.
```
- Background: `#0a0f1a`
- Centered: `flex flex-col items-center justify-center min-h-[60vh] text-center px-8`
- Font: monospace, muted colors
- No emoji, no icon — just terminal-style text

---

## `src/app/sys-simulation/page.tsx` — implement fully

```tsx
/**
 * src/app/sys-simulation/page.tsx
 *
 * Challenge list page — entry point of the game. SSR.
 *
 * WHY SSR:
 * Challenge titles, subtitles, and difficulty are static data.
 * Rendering server-side makes them indexable by search engines.
 *
 * Progress state (solved/unlocked) lives in localStorage — browser only.
 * Passed to ChallengeList (Client Component) after hydration.
 */
```

### Metadata
```ts
export const metadata = {
  title: 'arch-quest — system design challenges',
  description: 'Learn distributed systems by building and simulating real architectures.',
}
```

### Layout
```
// challenges

▶  url shortener       beginner   ✓ solved
▶  flash sale          medium     — unsolved
🔒 real-time chat      hard       locked
🔒 video streaming     expert     locked

2/4 solved · next: flash sale █
```

- Page padding: `max-w-3xl mx-auto px-6 py-10`
- Section header: `// challenges` in dim color, `text-xs uppercase tracking-widest`
- Pass `problems` array to `<ChallengeList problems={problems} />`
- Show `<MobileBlock />` on small screens (`block lg:hidden`)
- Show list on large screens (`hidden lg:block`)

---

## `src/components/simulation/ChallengeList.tsx` — implement fully

```tsx
/**
 * src/components/simulation/ChallengeList.tsx
 *
 * Client Component — renders the challenge list with unlock/solved state.
 *
 * WHY CLIENT COMPONENT:
 * Unlock and solved state come from localStorage — browser only.
 * On first render (SSR-safe), all challenges appear locked.
 * After hydration, useEffect reads localStorage and updates state.
 * This prevents hydration mismatch errors.
 */
```

### Props
```ts
interface ChallengeListProps {
  /** All problems passed from SSR page — never fetched client-side */
  problems: Problem[]
}
```

### Row layout
```
[prefix]  [title]                [difficulty]   [status]
```

Each row is a `grid` with columns: `20px 1fr 80px 80px`

| field | solved+unlocked | unlocked unsolved | locked |
|---|---|---|---|
| prefix | `▶` green | `▶` amber/red by difficulty | `🔒` dim |
| title | `#e2e8f0` | `#e2e8f0` | `#475569` |
| difficulty | color by level | color by level | `#334155` |
| status | `✓ solved` green | `— unsolved` dim | `locked` dim |

### Difficulty color mapping
| difficulty | color |
|---|---|
| beginner | `#4ade80` |
| easy | `#34d399` |
| medium | `#f59e0b` |
| hard | `#fb923c` |
| expert | `#ef4444` |

### Row behavior
- Unlocked row: `cursor-pointer` — on click, `router.push('/sys-simulation/' + problem.id)`
- Locked row: `opacity-40 cursor-not-allowed` — no click handler
- Hover on unlocked: `hover:bg-[#0f172a]` subtle background

### Row styling
- Each row: `grid grid-cols-[20px_1fr_80px_80px] items-center gap-4 px-3 py-3 rounded-md`
- Separator between rows: `border-b border-[#131b28]` on all but last
- Font size: `text-xs` throughout

### Footer line
After all rows:
```
{solvedCount}/{total} solved · next: {nextChallenge.title} █
```
- `█` uses `cursor-blink` CSS class from `globals.css`
- If all solved: `all challenges complete █`
- Color: `#334155` for text, `#378ADD` for cursor
- Show only after hydration (avoid SSR mismatch)

---

## Verification checklist

- [ ] `npm run dev` — `/sys-simulation` loads without errors
- [ ] `npm run build` — no TypeScript errors
- [ ] Nav bar renders with correct colors and font
- [ ] All challenge rows render with correct title, difficulty, status
- [ ] URL Shortener row is unlocked and clickable
- [ ] Flash Sale row shows as unsolved but unlocked after url-shortener solved
- [ ] Locked rows are dimmed and not clickable
- [ ] Clicking unlocked row navigates to `/sys-simulation/[id]`
- [ ] Footer line shows correct solved count and next challenge
- [ ] Blinking cursor appears in footer
- [ ] MobileBlock renders on small viewports
- [ ] List hidden on small viewports
- [ ] No hydration mismatch errors in browser console
- [ ] No `any` types
- [ ] Every component has top-level JSDoc comment