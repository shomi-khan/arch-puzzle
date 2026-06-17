/**
 * src/components/simulation/MobileBlock.tsx
 *
 * Full-screen message shown on mobile and tablet viewports.
 *
 * WHY THIS EXISTS:
 * The simulation canvas requires drag-and-drop interactions that are
 * impractical on touch screens and small viewports. Rather than showing
 * a broken experience, we show a clear message directing users to desktop.
 *
 * Visibility is controlled by Tailwind breakpoints:
 * - Visible on: block lg:hidden
 * - Hidden on: hidden lg:block, applied to the main content by the parent
 */

export default function MobileBlock() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 text-center lg:hidden">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-10 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 text-6xl" aria-hidden="true">
          🖥️
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Best on a desktop browser
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
          This simulation uses drag-and-drop interactions that require a larger
          screen. Open this page on a laptop or desktop for the full experience.
        </p>
      </div>
    </div>
  )
}
