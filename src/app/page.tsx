/**
 * src/app/page.tsx
 *
 * Root page - redirects to /sys-simulation.
 * Keeps the root URL clean and forwards visitors to the game.
 */

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/sys-simulation')
}
