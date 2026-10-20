import { ChevronRight } from 'lucide-react'
import { formatTimestamp } from '../../lib/dates'
import type { User } from '../../lib/types'
import { RoleBadge, StatusBadge } from './Badges'

interface UserTableProps {
  users: User[]
  currentUserId: string
  dimmed?: boolean // true while the next page is loading
  onSelect: (user: User) => void
}

const GRID =
  'grid grid-cols-[minmax(0,1fr)_1.25rem] items-center gap-x-4 px-4 md:grid-cols-[minmax(0,1.6fr)_5.5rem_6.5rem_7.5rem_7.5rem_1.25rem]'

export function UserTable({ users, currentUserId, dimmed = false, onSelect }: UserTableProps) {
  return (
    <div className={`transition-opacity ${dimmed ? 'opacity-60' : ''}`}>
      <div className={`${GRID} hidden border-b border-line py-2.5 text-xs font-medium text-ink-soft md:grid`}>
        <span>User</span>
        <span>Role</span>
        <span>Status</span>
        <span>Joined</span>
        <span>Last login</span>
        <span />
      </div>
      <ul className="divide-y divide-line">
        {users.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              onClick={() => onSelect(user)}
              aria-label={`Manage ${user.name}`}
              className={`${GRID} w-full py-3 text-left transition-colors hover:bg-canvas`}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">{user.name}</span>
                  {user.id === currentUserId && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-strong">You</span>
                  )}
                </span>
                <span className="block truncate text-sm text-ink-soft">{user.email}</span>
                <span className="mt-1.5 flex gap-2 md:hidden">
                  <RoleBadge role={user.role} />
                  <StatusBadge status={user.status} />
                </span>
              </span>
              <span className="hidden md:block">
                <RoleBadge role={user.role} />
              </span>
              <span className="hidden md:block">
                <StatusBadge status={user.status} />
              </span>
              <span className="hidden text-sm text-ink-soft tabular-nums md:block">{formatTimestamp(user.createdAt)}</span>
              <span className="hidden text-sm text-ink-soft tabular-nums md:block">
                {user.lastLoginAt ? formatTimestamp(user.lastLoginAt) : 'Never'}
              </span>
              <ChevronRight className="size-5 text-ink-soft" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}