export type Role = 'user' | 'admin'
export type UserStatus = 'active' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  status: UserStatus
  timezone: string
  isEmailVerified: boolean
  isSeed?: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface Session {
  user: User
  accessToken: string
}

// ---------- Habits ----------
export type LogStatus = 'done' | 'missed' | 'skipped'
export type TimeOfDay = 'anytime' | 'morning' | 'afternoon' | 'evening' | 'night'
export type Frequency = 'daily' | 'custom'

export interface Habit {
  id: string
  user: string
  title: string
  category: string
  timeOfDay: TimeOfDay
  frequency: Frequency
  days: number[] // 0 = Sunday ... 6 = Saturday (only used when frequency is 'custom')
  startDate: string // YYYY-MM-DD
  endDate: string | null
  isArchived: boolean
}

export interface HabitLog {
  id: string
  user: string
  habit: string
  date: string // YYYY-MM-DD
  status: LogStatus
  note: string
}

// ---------- Stats ----------
export interface Streak {
  habitId: string
  title: string
  current: number
  longest: number
}

export interface PeriodStats {
  scheduled: number
  done: number
  missed: number
  skipped: number
  percentage: number | null // null when nothing was scheduled
  activeDays: number
}

export interface MonthlyStats {
  month: string
  overall: PeriodStats
  habits: {
    habitId: string
    title: string
    category: string
    scheduled: number
    done: number
    missed: number
    skipped: number
    percentage: number | null
  }[]
}

// ---------- Comparisons & yearly (new) ----------
export type CompareAgainst = 'previous-month' | 'previous-year'

export interface HabitPeriodStats {
  habitId: string
  title: string
  category: string
  scheduled: number
  done: number
  missed: number
  skipped: number
  percentage: number | null
}

export interface ComparisonHabit {
  habitId: string
  title: string
  current: number | null
  previous: number | null
  change: number | null // percentage points
  done: number // check-ins done in the selected month
  missed: number
  skipped: number // days skipped in the selected month
}

export interface Comparison {
  month: string
  comparedWith: string
  against: CompareAgainst
  overallChange: number | null // percentage points
  current: { overall: PeriodStats; habits: HabitPeriodStats[] }
  previous: { overall: PeriodStats; habits: HabitPeriodStats[] }
  habits: ComparisonHabit[]
}



export interface YearlyStats {
  year: number
  overall: PeriodStats
  months: (PeriodStats & { month: string })[]
}

// 3. Add these at the very end of the file
export interface AdminStats {
  totalUsers: number
  newUsersLast30Days: number
  activeUsersLast7Days: number
  suspendedUsers: number
  totalHabits: number
  totalLogs: number
  topHabits: { title: string; count: number }[]
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface AdminUserList {
  users: User[]
  pagination: Pagination
}

export interface AdminUserDetail {
  user: User
  habitCount: number
  logCount: number
}