import { ChevronLeft, ChevronRight, LoaderCircle, Search } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { TopHabits } from '../components/admin/TopHabits'
import { UserDrawer } from '../components/admin/UserDrawer'
import { UserTable } from '../components/admin/UserTable'
import { useAuth } from '../context/useAuth'
import { PAGE_SIZE, useAdminStats, useAdminUsers } from '../hooks/admin'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { Role, UserStatus } from '../lib/types'

const number = (n: number) => n.toLocaleString('en-US')

export default function AdminPage() {
  const { user: me } = useAuth()
  const stats = useAdminStats()

  // Filters. The page goes back to 1 whenever a filter changes.
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim(), 300) // search once you pause typing
  const [role, setRole] = useState<Role | ''>('')
  const [status, setStatus] = useState<UserStatus | ''>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const users = useAdminUsers({ page, search, role, status })
  const pagination = users.data?.pagination

  // After deleting the last user on the last page, step back to a page that exists
  if (pagination && page > Math.max(pagination.pages, 1)) setPage(Math.max(pagination.pages, 1))

  const from = pagination && pagination.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0
  const to = pagination ? Math.min(page * PAGE_SIZE, pagination.total) : 0
  const s = stats.data

  return (
    <div className="space-y-6">
      <PageHeader title="Admin" description="System overview and user management." />

      {stats.isPending ? (
        <LoaderCircle className="size-6 animate-spin text-ink-soft" aria-label="Loading statistics" />
      ) : stats.isError ? (
        <div className="notice">
          <p>We could not load the system statistics.</p>
          <button type="button" className="mt-2 font-medium underline" onClick={() => void stats.refetch()}>
            Try again
          </button>
        </div>
      ) : (
        s && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total users" value={number(s.totalUsers)} hint="Registered accounts" />
            <StatCard label="New in 30 days" value={number(s.newUsersLast30Days)} hint="Accounts created this past month" />
            <StatCard
              label="Active in 7 days"
              value={number(s.activeUsersLast7Days)}
              hint={s.totalUsers > 0 ? `${Math.round((s.activeUsersLast7Days / s.totalUsers) * 100)}% of all users` : 'No users yet'}
            />
            <StatCard label="Suspended" value={number(s.suspendedUsers)} hint="Cannot log in" />
            <StatCard
              label="Habits created"
              value={number(s.totalHabits)}
              hint={s.totalUsers > 0 ? `${(s.totalHabits / s.totalUsers).toFixed(1)} per user on average` : 'Across all users'}
            />
            <StatCard label="Check-ins logged" value={number(s.totalLogs)} hint="Done, missed and skipped" />
          </div>
        )
      )}

      <section className="card">
        <div className="space-y-4 border-b border-line px-4 py-4">
          <div>
            <h2 className="font-semibold">Users</h2>
            <p className="text-sm text-ink-soft">Select a person to see their details or manage their account.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by name or email"
                aria-label="Search users"
                className="input pl-9"
              />
            </div>
            <select
              aria-label="Filter by role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as Role | '')
                setPage(1)
              }}
              className="input sm:w-40"
            >
              <option value="">All roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as UserStatus | '')
                setPage(1)
              }}
              className="input sm:w-40"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {users.isPending ? (
          <div className="p-6">
            <LoaderCircle className="size-6 animate-spin text-ink-soft" aria-label="Loading users" />
          </div>
        ) : users.isError ? (
          <div className="p-4">
            <div className="notice">
              <p>We could not load the users.</p>
              <button type="button" className="mt-2 font-medium underline" onClick={() => void users.refetch()}>
                Try again
              </button>
            </div>
          </div>
        ) : users.data.users.length === 0 ? (
          <p className="px-4 py-12 text-center text-ink-soft">No users match your search.</p>
        ) : (
          <UserTable
            users={users.data.users}
            currentUserId={me?.id ?? ''}
            dimmed={users.isPlaceholderData}
            onSelect={(user) => setSelectedId(user.id)}
          />
        )}

        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-sm text-ink-soft tabular-nums">
              Showing {from}–{to} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary size-9 px-0"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="text-sm tabular-nums">
                Page {page} of {Math.max(pagination.pages, 1)}
              </span>
              <button
                type="button"
                className="btn btn-secondary size-9 px-0"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.pages}
                aria-label="Next page"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold">Most tracked habits</h2>
          <p className="text-sm text-ink-soft">The habits people create most often, across all users.</p>
        </div>
        {s ? <TopHabits habits={s.topHabits} /> : <p className="px-5 py-10 text-center text-ink-soft">Loading…</p>}
      </section>

      <UserDrawer userId={selectedId} currentUserId={me?.id ?? ''} onClose={() => setSelectedId(null)} />
    </div>
  )
}