import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  hint?: ReactNode
  progress?: number // 0 to 100; draws a thin bar under the value
}

// One headline number with a short label
export function StatCard({ label, value, hint, progress }: StatCardProps) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-ink-soft">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {progress !== undefined && (
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
      {hint && <div className="mt-2 text-sm text-ink-soft">{hint}</div>}
    </div>
  )
}