import type { Role, UserStatus } from '../../lib/types'

const base = 'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium'

export function RoleBadge({ role }: { role: Role }) {
  return role === 'admin' ? (
    <span className={`${base} bg-ink text-white`}>Admin</span>
  ) : (
    <span className={`${base} border border-line bg-canvas text-ink-soft`}>User</span>
  )
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return status === 'active' ? (
    <span className={`${base} bg-accent-soft text-accent-strong`}>Active</span>
  ) : (
    <span className={`${base} bg-danger-soft text-danger`}>Suspended</span>
  )
}