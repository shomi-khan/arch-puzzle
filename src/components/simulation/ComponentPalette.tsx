'use client'

/**
 * src/components/simulation/ComponentPalette.tsx
 *
 * Left sidebar - displays draggable infrastructure components.
 *
 * WHY THIS EXISTS:
 * The palette is the user's toolbox. It shows only the components available
 * for the current challenge. Restricting available components is part of
 * challenge design.
 */

import type { ComponentType, DragEvent } from 'react'
import {
  Database,
  DatabaseZap,
  Globe,
  MessageSquare,
  Network,
  Server,
  Shield,
  Zap,
} from 'lucide-react'
import { componentRegistry } from '@/config/components'
import type { ComponentCategory } from '@/types'

interface ComponentPaletteProps {
  /** Component type strings available for this challenge */
  availableComponents: string[]
  /** Whether simulation is running - palette is disabled during simulation */
  disabled: boolean
}

const categoryBorderStyles: Record<ComponentCategory, string> = {
  network: 'border-l-blue-400',
  compute: 'border-l-green-400',
  cache: 'border-l-red-400',
  database: 'border-l-purple-400',
  cdn: 'border-l-amber-400',
  queue: 'border-l-orange-400',
  security: 'border-l-pink-400',
}

const iconMap: Record<string, ComponentType<{ size?: number }>> = {
  'load-balancer': Network,
  'api-server': Server,
  'redis-cache': Zap,
  'sql-database': Database,
  'nosql-database': DatabaseZap,
  cdn: Globe,
  'message-queue': MessageSquare,
  'rate-limiter': Shield,
}

/**
 * ComponentPalette - renders the available draggable infrastructure components.
 */
export default function ComponentPalette({
  availableComponents,
  disabled,
}: ComponentPaletteProps) {
  const components = componentRegistry.filter((component) =>
    availableComponents.includes(component.type),
  )

  function handleDragStart(
    event: DragEvent<HTMLDivElement>,
    componentType: string,
  ) {
    event.dataTransfer.setData('componentType', componentType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: '9px',
          color: '#334155',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.5rem',
        }}
      >
        // components
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {components.map((component) => {
          const Icon = iconMap[component.type]

          return (
            <div
              key={component.type}
              draggable={!disabled}
              onDragStart={(event) => handleDragStart(event, component.type)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                backgroundColor: '#1e293b',
                border: '0.5px solid #334155',
                cursor: disabled ? 'not-allowed' : 'grab',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = '#475569'
                  e.currentTarget.style.backgroundColor = '#263244'
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = '#334155'
                  e.currentTarget.style.backgroundColor = '#1e293b'
                }
              }}
            >
              {Icon && (
                <div style={{ color: '#64748b', marginTop: '2px', flexShrink: 0 }}>
                  <Icon size={13} />
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    textTransform: 'lowercase',
                    margin: 0,
                  }}
                >
                  {component.label}
                </p>
                <p
                  style={{
                    fontSize: '10px',
                    color: '#475569',
                    margin: '2px 0 0 0',
                  }}
                >
                  ${component.purchaseCost.toLocaleString()} · ${component.runtimeCostPerSecond}/s
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
