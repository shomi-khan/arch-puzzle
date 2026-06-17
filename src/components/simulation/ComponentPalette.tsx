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
      className={`w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        Components
      </h2>
      <div className="space-y-3">
        {components.map((component) => {
          const Icon = iconMap[component.type]

          return (
            <div
              key={component.type}
              draggable={!disabled}
              onDragStart={(event) => handleDragStart(event, component.type)}
              className={`select-none rounded-lg border border-l-4 border-slate-200 bg-white p-3 transition-shadow hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 ${categoryBorderStyles[component.category]} ${
                disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-500 dark:text-slate-300">
                  {Icon ? <Icon size={18} /> : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {component.label}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    ${component.purchaseCost.toLocaleString()} · $
                    {component.runtimeCostPerSecond}/s
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
