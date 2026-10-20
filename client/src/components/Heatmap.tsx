import { eachDay, formatDayMonth, mondayIndex, monthRange } from '../lib/dates'

export interface DaySummary {
  scheduled: number
  done: number
}

interface HeatmapProps {
  month: string
  today: string
  summaries: Map<string, DaySummary> // days in the future or without data are simply missing
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SWATCHES = ['bg-line', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-accent']

// 0 = nothing done ... 4 = everything done
function levelOf({ scheduled, done }: DaySummary) {
  if (done === 0) return 0
  const ratio = done / scheduled
  if (ratio >= 1) return 4
  if (ratio > 2 / 3) return 3
  if (ratio > 1 / 3) return 2
  return 1
}

const CELL_STYLE = ['bg-line text-ink', 'bg-heat-1 text-ink', 'bg-heat-2 text-ink', 'bg-heat-3 text-ink', 'bg-accent text-white']

// A month calendar where each day is shaded by how many of its habits you completed
export function Heatmap({ month, today, summaries }: HeatmapProps) {
  const { start, end } = monthRange(month)
  const blanks = mondayIndex(start)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-ink-soft">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1.5" role="list" aria-label="Daily completion">
        {Array.from({ length: blanks }, (_, i) => (
          <div key={`blank-${i}`} aria-hidden />
        ))}

        {eachDay(start, end).map((date) => {
          const summary = summaries.get(date)
          const dayNumber = Number(date.slice(8))
          const label = !summary
            ? `${formatDayMonth(date)}: ${date > today ? 'upcoming' : 'nothing scheduled'}`
            : summary.scheduled === 0
              ? `${formatDayMonth(date)}: nothing scheduled`
              : `${formatDayMonth(date)}: ${summary.done} of ${summary.scheduled} done`
          const style = summary && summary.scheduled > 0 ? CELL_STYLE[levelOf(summary)] : 'bg-canvas text-ink-soft'

          return (
            <div
              key={date}
              role="listitem"
              aria-label={label}
              title={label}
              className={`grid aspect-square place-items-center rounded-lg text-sm font-medium tabular-nums ${style} ${
                date === today ? 'ring-2 ring-ink ring-offset-2' : ''
              }`}
            >
              {dayNumber}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-ink-soft">
        <span>Less</span>
        {SWATCHES.map((swatch) => (
          <span key={swatch} className={`size-3.5 rounded ${swatch}`} aria-hidden />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}