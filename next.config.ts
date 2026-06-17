/**
 * next.config.ts
 *
 * Next.js configuration for sys-simulation.
 *
 * Deployed on Vercel - standard Next.js deployment.
 * No `output: 'export'` needed - Vercel handles SSR natively.
 *
 * devIndicators disabled - keeps the UI clean during development.
 */

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
}

export default nextConfig
