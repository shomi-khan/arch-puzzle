import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'sys-simulation',
  description: 'Learn distributed systems by building and simulating real architectures.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0f1a' }}>
          <nav
            className="sticky top-0 z-10 flex h-12 items-center px-6 font-mono"
            style={{ backgroundColor: '#0f172a', borderBottom: '0.5px solid #1e293b' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#378ADD' }}>
              arch-puzzle
            </span>
            <span className="ml-2 text-xs" style={{ color: '#475569' }}>
              system design playground
            </span>
          </nav>
          {children}
        </div>
      </body>
    </html>
  )
}
