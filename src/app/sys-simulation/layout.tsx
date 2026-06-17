/**
 * src/app/sys-simulation/layout.tsx
 *
 * Shared layout for all /sys-simulation routes.
 *
 * IMPORTANT CONSTRAINT:
 * The builder page ([id]) needs full viewport height (h-screen) with no
 * extra padding or max-width wrappers - the canvas must fill available space.
 * The list page needs centered content with max-width and padding.
 *
 * Solution: apply max-width/padding only to the list page via its own
 * wrapper div inside page.tsx. The layout renders children directly
 * with only the nav bar above.
 */

import type { ReactNode } from 'react'

interface SysSimulationLayoutProps {
  /** Route content rendered under the shared sys-simulation nav */
  children: ReactNode
}

/**
 * SysSimulationLayout - renders shared navigation without constraining pages.
 */
export default function SysSimulationLayout({
  children,
}: SysSimulationLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
              sys-simulation
            </span>
            <span className="ml-2 hidden text-xs text-slate-400 sm:inline">
              system design playground
            </span>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
