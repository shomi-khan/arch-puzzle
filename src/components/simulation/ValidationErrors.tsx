'use client'

/**
 * src/components/simulation/ValidationErrors.tsx
 *
 * Displays architecture validation errors above the canvas.
 */

import type { ValidationError } from '@/engine/validator'

interface ValidationErrorsProps {
  /** List of validation errors to display */
  errors: ValidationError[]
}

/**
 * ValidationErrors - renders pre-simulation architecture errors.
 */
export function ValidationErrors({ errors }: ValidationErrorsProps) {
  return (
    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-900/20">
      <div className="mb-2 font-medium text-amber-800 dark:text-amber-300">
        Cannot start simulation
      </div>
      <ul className="space-y-1">
        {errors.map((error) => (
          <li key={error.code} className="text-amber-700 dark:text-amber-400">
            {error.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
