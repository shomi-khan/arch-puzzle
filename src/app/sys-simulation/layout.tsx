/**
 * src/app/sys-simulation/layout.tsx
 *
 * Layout wrapper for all /sys-simulation routes.
 *
 * WHY THIS EXISTS:
 * Provides consistent page padding, max-width, and the top navigation bar
 * shared between the challenge list page and the builder page.
 * Keeping layout here avoids duplicating it in every page.
 */

export default function SysSimulationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-mono text-base font-semibold text-[var(--text-primary)]">
              sys-simulation
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              system design playground
            </p>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
