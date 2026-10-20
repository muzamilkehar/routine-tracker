import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { YearlyStats } from '../lib/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface YearChartProps {
  year: number
  current?: YearlyStats
  previous?: YearlyStats
}

// Completion % for each month of this year next to the same month of last year
export function YearChart({ year, current, previous }: YearChartProps) {
  const data = MONTHS.map((month, i) => ({
    month,
    thisYear: current?.months[i]?.percentage ?? null,
    lastYear: previous?.months[i]?.percentage ?? null,
  }))

  return (
    <div role="img" aria-label={`Monthly completion percentage for ${year}, compared with ${year - 1}`}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="#e2e6ed" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#5a6477', fontSize: 12 }} />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: '#5a6477', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: '#f6f7f9' }}
            formatter={(value) => (typeof value === 'number' ? `${value}%` : 'No data')}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="lastYear" name={String(year - 1)} fill="#7f8aa0" radius={[4, 4, 0, 0]} />
          <Bar dataKey="thisYear" name={String(year)} fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}