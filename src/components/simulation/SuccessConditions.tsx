'use client'

/**
 * src/components/simulation/SuccessConditions.tsx
 *
 * Displays a checklist of success conditions with pass/fail per condition.
 *
 * WHY THIS EXISTS:
 * A single score number doesn't tell the user WHY they passed or failed.
 * Showing each condition individually gives actionable feedback:
 * "You met availability but exceeded the budget."
 * This turns failure into a specific learning moment.
 */

interface SuccessConditionsProps {
  /**
   * Evaluated conditions — output of evaluateSuccessConditions()
   * from src/engine/scorer.ts
   */
  conditions: Array<{
    /** Human-readable requirement label */
    label: string
    /** Whether this condition was satisfied */
    passed: boolean
    /** The actual measured value */
    actual: number
    /** The required threshold value */
    required: number
  }>
}

/**
 * SuccessConditions - renders pass/fail feedback for each requirement.
 */
export default function SuccessConditions({
  conditions,
}: SuccessConditionsProps) {
  return (
    <div className="flex flex-col gap-1">
      {conditions.map((condition) => (
        <div
          key={condition.label}
          className="flex items-center justify-between py-1.5 border-b border-[#131b28] last:border-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={condition.passed ? 'text-[#4ade80]' : 'text-[#ef4444]'}
              aria-hidden="true"
            >
              {condition.passed ? '✓' : '✗'}
            </span>
            <span
              className={[
                'text-xs truncate',
                condition.passed ? 'text-[#4ade80]' : 'text-[#ef4444]',
              ].join(' ')}
            >
              {condition.label}
            </span>
          </div>
          <span
            className={[
              'text-[10px] shrink-0 ml-2',
              condition.passed ? 'text-[#4ade80]' : 'text-[#ef4444]',
            ].join(' ')}
          >
            {formatActual(condition)}
          </span>
        </div>
      ))}
    </div>
  )
}

function formatActual(
  condition: SuccessConditionsProps['conditions'][number],
): string {
  const label = condition.label.toLowerCase()

  if (label.includes('availability') || label.includes('error')) {
    return `${condition.actual}%`
  }
  if (label.includes('latency')) {
    return `${condition.actual}ms`
  }
  if (label.includes('budget') || label.includes('balance')) {
    if (condition.actual < 0) {
      return `-$${Math.abs(condition.actual).toLocaleString()}`
    }
    return `$${condition.actual.toLocaleString()}`
  }

  return condition.actual.toLocaleString()
}
