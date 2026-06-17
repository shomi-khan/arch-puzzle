/**
 * src/app/sys-simulation/[id]/loading.tsx
 *
 * Loading state for the challenge builder route while route params resolve.
 */

/**
 * ChallengeBuilderLoading - renders a lightweight route loading state.
 */
export default function ChallengeBuilderLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
      <p className="text-sm font-medium text-[var(--text-primary)]">
        Loading challenge...
      </p>
    </div>
  )
}
