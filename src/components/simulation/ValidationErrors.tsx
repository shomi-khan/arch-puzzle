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
export default function ValidationErrors({ errors }: ValidationErrorsProps) {
  return (
    <div
      style={{
        margin: '0.75rem',
        padding: '0.75rem',
        borderRadius: '0.25rem',
        backgroundColor: '#1a1200',
        border: '0.5px solid #2a1f00',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          marginBottom: '0.5rem',
          fontWeight: 600,
          color: '#d97706',
        }}
      >
        // cannot start
      </div>
      <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#d97706' }}>
        {errors.map((error) => (
          <li key={error.code} style={{ marginBottom: '0.25rem', fontSize: '11px' }}>
            • {error.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
