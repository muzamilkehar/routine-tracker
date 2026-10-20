import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

interface ChangeProps {
  // The change in percentage points. `null` means "not comparable".
  value: number | null
  // Optional inline label, e.g. "vs September"
  label?: string
  // Hide the arrow icon
  plain?: boolean
}

// Signed change like "+5.2 pp" with an arrow and a colour.
export function Change({ value, label, plain = false }: ChangeProps) {
  if (value === null || value === undefined) {
    return (
      <span className="text-sm text-ink-soft">
        {label ? `${label}: no comparison` : '–'}
      </span>
    )
  }

  const isZero = Math.abs(value) < 0.05
  const isUp = value > 0

  const tone = isZero ? 'text-ink-soft' : isUp ? 'text-accent-strong' : 'text-danger'
  const Icon = isZero ? Minus : isUp ? TrendingUp : TrendingDown
  const sign = isUp && !isZero ? '+' : ''

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 text-sm font-medium tabular-nums ${tone}`}>
        {!plain && <Icon className="size-4" aria-hidden />}
        {sign}
        {value.toFixed(1)} pp
      </span>
      {label && <span className="text-sm text-ink-soft">vs {label}</span>}
    </span>
  )
}

// `Delta` is the same component; it accepts the extra `label` prop above.
export const Delta = Change