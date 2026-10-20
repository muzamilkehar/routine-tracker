import { LoaderCircle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAdminUser, useDeleteUser, useUpdateUser } from '../../hooks/admin'
import { ApiError } from '../../lib/api'
import { formatTimestamp } from '../../lib/dates'
import type { AdminUserDetail } from '../../lib/types'
import { Modal } from '../Modal'
import { RoleBadge, StatusBadge } from './Badges'

interface UserDrawerProps {
  userId: string | null // null = closed
  currentUserId: string
  onClose: () => void
}

export function UserDrawer({ userId, currentUserId, onClose }: UserDrawerProps) {
  const detail = useAdminUser(userId)
  const user = detail.data?.user

  return (
    <Modal open={userId !== null} onClose={onClose} title={user?.name ?? 'User'} description={user?.email}>
      {detail.isPending ? (
        <div className="p-6">
          <LoaderCircle className="size-6 animate-spin text-ink-soft" aria-label="Loading user" />
        </div>
      ) : detail.isError ? (
        <div className="p-6">
          <p role="alert" className="notice">
            {detail.error.message}
          </p>
        </div>
      ) : (
        <UserDetail data={detail.data} isSelf={detail.data.user.id === currentUserId} onClose={onClose} />
      )}
    </Modal>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  )
}

function UserDetail({ data, isSelf, onClose }: { data: AdminUserDetail; isSelf: boolean; onClose: () => void }) {
  const { user, habitCount, logCount } = data
  const update = useUpdateUser()
  const remove = useDeleteUser()
  const [confirm, setConfirm] = useState<'role' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const busy = update.isPending || remove.isPending

  const isAdmin = user.role === 'admin'
  const isProtected = user.isSeed === true // the original admin: other admins cannot touch it
  const isActive = user.status === 'active'

  // Runs an action and shows a readable message if the server says no
  async function run(action: () => Promise<unknown>, closeAfter = false) {
    setError(null)
    try {
      await action()
      setConfirm(null)
      if (closeAfter) onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Check your connection and try again.')
    }
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
        <Fact label="Role">
          <RoleBadge role={user.role} />
        </Fact>
        <Fact label="Status">
          <StatusBadge status={user.status} />
        </Fact>
        <Fact label="Email">{user.isEmailVerified ? 'Verified' : 'Not verified'}</Fact>
        <Fact label="Timezone">{user.timezone}</Fact>
        <Fact label="Joined">{formatTimestamp(user.createdAt)}</Fact>
        <Fact label="Last login">{user.lastLoginAt ? formatTimestamp(user.lastLoginAt) : 'Never'}</Fact>
        <Fact label="Habits">{habitCount}</Fact>
        <Fact label="Check-ins">{logCount}</Fact>
      </dl>

      <section className="mt-8 space-y-4 border-t border-line pt-6">
        <h3 className="text-sm font-medium">Manage account</h3>

        {isSelf && (
          <p className="rounded-lg border border-line bg-canvas p-3 text-sm text-ink-soft">
            This is your own account. You cannot change its role or status, or delete it from here.
          </p>
        )}

          {isProtected && !isSelf && (
          <p className="rounded-lg border border-line bg-canvas p-3 text-sm text-ink-soft">
            This is the original admin account. It is protected, so it cannot be suspended, demoted or deleted by other admins.
          </p>
        )}

        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}

        <div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isSelf || isProtected || busy}
            onClick={() => void run(() => update.mutateAsync({ id: user.id, status: isActive ? 'suspended' : 'active' }))}
          >
            {isActive ? 'Suspend user' : 'Reactivate user'}
          </button>
          <p className="mt-1.5 text-sm text-ink-soft">
            {isActive ? 'Suspended users are signed out and cannot log in.' : 'Reactivating lets this person log in again.'}
          </p>
        </div>

        <div>
          {confirm === 'role' ? (
            <div className="rounded-lg border border-line bg-canvas p-4">
              <p className="text-sm font-medium">
                {isAdmin
                  ? `Remove admin access from ${user.name}?`
                  : `Give ${user.name} admin access? Admins can see every account and delete users.`}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => void run(() => update.mutateAsync({ id: user.id, role: isAdmin ? 'user' : 'admin' }))}
                >
                  {isAdmin ? 'Remove admin access' : 'Make admin'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setConfirm(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-secondary" disabled={isSelf || isProtected || busy} onClick={() => setConfirm('role')}>
              {isAdmin ? 'Remove admin access…' : 'Make admin…'}
            </button>
          )}
        </div>

        <div>
          {confirm === 'delete' ? (
            <div className="rounded-lg border border-danger/20 bg-danger-soft p-4">
              <p className="text-sm font-medium text-danger">
                Delete {user.name} and all of their habits and check-ins? This cannot be undone.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busy}
                  onClick={() => void run(() => remove.mutateAsync(user.id), true)}
                >
                  {remove.isPending && <LoaderCircle className="size-4 animate-spin" />}
                  Delete user
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setConfirm(null)}>
                  Keep user
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-quiet text-danger hover:text-danger" disabled={isSelf || isProtected || busy} onClick={() => setConfirm('delete')}>
              Delete user…
            </button>
          )}
        </div>
      </section>
    </div>
  )
}