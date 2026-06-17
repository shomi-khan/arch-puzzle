/**
 * src/app/not-found.tsx
 *
 * Global 404 page for unknown application routes.
 */

import Link from 'next/link'

/**
 * NotFound - renders a simple recovery path for invalid routes.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-6 text-center">
      <div className="mb-4 text-4xl" aria-hidden="true">
        🔍
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-[var(--text-primary)]">
        Page not found
      </h1>
      <p className="mb-6 max-w-sm text-sm text-[var(--text-secondary)]">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/sys-simulation"
        className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Back to Challenges
      </Link>
    </main>
  )
}
