/**
 * src/app/sys-simulation/page.tsx
 *
 * Challenge list page - entry point of the game.
 *
 * WHY SSR:
 * Challenge titles, subtitles, and descriptions are static data.
 * Rendering them server-side makes them indexable by search engines,
 * which helps with discoverability as a portfolio piece.
 *
 * Progress state is stored in localStorage, which only exists in the browser.
 * So we render the challenge grid structure on the server, and hydrate unlock
 * state on the client via the ChallengeGrid Client Component.
 */

import ChallengeGrid from '@/components/simulation/ChallengeGrid'
import MobileBlock from '@/components/simulation/MobileBlock'
import { problems } from '@/problems'

export const metadata = {
  title: 'System Design Challenges - sys-simulation',
  description: 'Learn distributed systems by building and simulating real architectures.',
}

/**
 * SysSimulationPage - renders the desktop challenge list and mobile block.
 */
export default function SysSimulationPage() {
  return (
    <>
      <MobileBlock />
      <div className="mx-auto hidden max-w-6xl px-6 py-8 lg:block">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            System Design Challenges
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Build. Simulate. Learn.
          </p>
        </header>
        <ChallengeGrid problems={problems} />
      </div>
    </>
  )
}
