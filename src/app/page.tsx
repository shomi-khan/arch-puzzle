/**
 * src/app/sys-simulation/page.tsx
 *
 * Challenge list page - entry point of the game. SSR.
 *
 * WHY SSR:
 * Challenge titles, subtitles, and difficulty are static data.
 * Rendering server-side makes them indexable by search engines.
 *
 * Progress state (solved/unlocked) lives in localStorage — browser only.
 * Passed to ChallengeList (Client Component) after hydration.
 */

import ChallengeList from '@/components/simulation/ChallengeList'
import MobileBlock from '@/components/simulation/MobileBlock'
import { problems } from '@/problems'

export const metadata = {
  title: 'arch-puzzle — system design challenges',
  description: 'Learn distributed systems by building and simulating real architectures.',
}

/**
 * SysSimulationPage - renders the desktop challenge list and mobile block.
 */
export default function SysSimulationPage() {
  return (
    <>
      <MobileBlock />
      <div className="hidden max-w-3xl mx-auto px-6 py-10 lg:block" style={{ backgroundColor: '#0a0f1a' }}>
        <ChallengeList problems={problems} />
      </div>
    </>
  )
}
