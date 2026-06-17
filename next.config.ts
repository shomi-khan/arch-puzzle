/**
 * next.config.ts
 *
 * Next.js configuration for sys-simulation.
 * Deployed on Vercel - standard Next.js deployment.
 * No `output: 'export'` needed - Vercel handles SSR natively.
 */

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
}

export default nextConfig
