import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { ApiError, api } from '../lib/api'
import type {
  CompareAgainst,
  Comparison,
  Frequency,
  Habit,
  HabitLog,
  LogStatus,
  MonthlyStats,
  Streak,
  TimeOfDay,
  YearlyStats,
} from '../lib/types'

// ---- Query keys: the "address" of each piece of cached server data ----
const habitsKey = (includeArchived: boolean) => ['habits', includeArchived ? 'all' : 'active'] as const
const logsKey = (date: string) => ['logs', date] as const
const streaksKey = ['stats', 'streaks'] as const

// ---- Reading data ----
export function useHabits() {
  return useQuery({
    queryKey: habitsKey(false),
    queryFn: async () => (await api<{ habits: Habit[] }>('/habits')).habits,
  })
}

export function useAllHabits() {
  return useQuery({
    queryKey: habitsKey(true),
    queryFn: async () => (await api<{ habits: Habit[] }>('/habits?includeArchived=true')).habits,
  })
}

export function useLogs(date: string) {
  return useQuery({
    queryKey: logsKey(date),
    queryFn: async () => (await api<{ logs: HabitLog[] }>(`/logs?from=${date}&to=${date}`)).logs,
  })
}

// Every log between two dates (used for the month calendar)
export function useLogRange(from: string, to: string) {
  return useQuery({
    queryKey: ['logs', 'range', from, to] as const,
    queryFn: async () => (await api<{ logs: HabitLog[] }>(`/logs?from=${from}&to=${to}`)).logs,
  })
}

export function useStreaks() {
  return useQuery({
    queryKey: streaksKey,
    queryFn: async () => (await api<{ streaks: Streak[] }>('/stats/streaks')).streaks,
  })
}

// Completion numbers for a month. Without a month, the server uses the current one in the user's timezone.
export function useMonthlyStats(month?: string) {
  return useQuery({
    queryKey: ['stats', 'monthly', month ?? 'current'] as const,
    queryFn: () => api<MonthlyStats>(month ? `/stats/monthly?month=${month}` : '/stats/monthly'),
  })
}

// A month compared with the previous month, or with the same month last year
export function useComparison(month: string, against: CompareAgainst) {
  return useQuery({
    queryKey: ['stats', 'compare', month, against] as const,
    queryFn: () => api<Comparison>(`/stats/compare?month=${month}&against=${against}`),
  })
}

// Twelve months of completion numbers for one year
export function useYearlyStats(year: number) {
  return useQuery({
    queryKey: ['stats', 'yearly', year] as const,
    queryFn: () => api<YearlyStats>(`/stats/yearly?year=${year}`),
  })
}

// ---- Ticking a habit ----
// "Optimistic update": the screen changes instantly, then we confirm with the server.
// If the server says no, we put things back the way they were.
export function useSetLog(date: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitId, status }: { habitId: string; status: LogStatus | null }) => {
      if (status) {
        await api('/logs', { method: 'PUT', body: { habitId, date, status } })
        return
      }
      try {
        await api(`/logs/${habitId}/${date}`, { method: 'DELETE' })
      } catch (err) {
        // Already cleared? Then there is nothing left to do.
        if (!(err instanceof ApiError && err.status === 404)) throw err
      }
    },
    onMutate: async ({ habitId, status }) => {
      await queryClient.cancelQueries({ queryKey: logsKey(date) })
      const previous = queryClient.getQueryData<HabitLog[]>(logsKey(date))

      queryClient.setQueryData<HabitLog[]>(logsKey(date), (old = []) => {
        const others = old.filter((log) => log.habit !== habitId)
        return status ? [...others, { id: `temp-${habitId}`, user: '', habit: habitId, date, status, note: '' }] : others
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(logsKey(date), context.previous)
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: logsKey(date) }),
        queryClient.invalidateQueries({ queryKey: ['logs', 'range'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
      ]),
  })
}

// ---- Marking a whole day at once ----
// Sends one request per habit, all together. `null` clears the status.
export function useBulkSetLog(date: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ habitIds, status }: { habitIds: string[]; status: LogStatus | null }) => {
      const results = await Promise.allSettled(
        habitIds.map((habitId) =>
          status
            ? api('/logs', { method: 'PUT', body: { habitId, date, status } })
            : api(`/logs/${habitId}/${date}`, { method: 'DELETE' }).catch((err: unknown) => {
                // Already cleared? Then there is nothing left to do.
                if (!(err instanceof ApiError && err.status === 404)) throw err
              }),
        ),
      )
      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed > 0) throw new Error(`${failed} of ${habitIds.length} habits could not be updated`)
    },
    onMutate: async ({ habitIds, status }) => {
      await queryClient.cancelQueries({ queryKey: logsKey(date) })
      const previous = queryClient.getQueryData<HabitLog[]>(logsKey(date))

      queryClient.setQueryData<HabitLog[]>(logsKey(date), (old = []) => {
        const others = old.filter((log) => !habitIds.includes(log.habit))
        if (!status) return others
        return [...others, ...habitIds.map((habit) => ({ id: `temp-${habit}`, user: '', habit, date, status, note: '' }))]
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(logsKey(date), context.previous)
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: logsKey(date) }),
        queryClient.invalidateQueries({ queryKey: ['logs', 'range'] }),
        queryClient.invalidateQueries({ queryKey: ['stats'] }),
      ]),
  })
}

// ---- Managing habits ----
export interface HabitInput {
  title: string
  category?: string
  timeOfDay?: TimeOfDay
  frequency?: Frequency
  days?: number[]
  startDate?: string
}

function refreshAfterHabitChange(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['habits'] }),
    queryClient.invalidateQueries({ queryKey: ['logs'] }),
    queryClient.invalidateQueries({ queryKey: ['stats'] }),
  ])
}

export function useCreateHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: HabitInput) => api<{ habit: Habit }>('/habits', { method: 'POST', body: input }),
    onSuccess: () => refreshAfterHabitChange(queryClient),
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...changes }: Partial<HabitInput> & { id: string; isArchived?: boolean }) =>
      api<{ habit: Habit }>(`/habits/${id}`, { method: 'PATCH', body: changes }),
    onSuccess: () => refreshAfterHabitChange(queryClient),
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/habits/${id}`, { method: 'DELETE' }),
    onSuccess: () => refreshAfterHabitChange(queryClient),
  })
}