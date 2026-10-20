import { zodResolver } from '@hookform/resolvers/zod'
import { Check, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '../../context/useAuth'
import { ApiError, api } from '../../lib/api'
import type { Session } from '../../lib/types'
import { Field } from '../Field'
import { SettingsSection } from './SettingsSection'

// The new-password rules mirror the backend, so people get instant feedback
const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .max(72, 'At most 72 characters')
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/\d/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
type Values = z.infer<typeof schema>

export function PasswordForm() {
  const { applySession } = useAuth()
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ currentPassword, newPassword }: Values) => {
    setServerError(null)
    setDone(false)
    try {
      // The server signs out every other device and gives THIS one a fresh session
      const session = await api<Session>('/users/me/password', { method: 'PATCH', body: { currentPassword, newPassword } })
      applySession(session)
      reset()
      setDone(true)
    } catch (err) {
      if (err instanceof ApiError && err.message === 'Current password is incorrect') {
        setError('currentPassword', { message: 'That is not your current password' })
      } else if (err instanceof ApiError) {
        err.details?.forEach((d) => {
          if (d.field === 'newPassword') setError('newPassword', { message: d.message })
        })
        if (!err.details?.length) setServerError(err.message)
      } else {
        setServerError('Could not reach the server. Check your connection and try again.')
      }
    }
  }

  return (
    <SettingsSection title="Password" description="Changing it signs you out on your other devices.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Field
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {serverError && (
          <p role="alert" className="notice">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            Update password
          </button>
          {done && (
            <span role="status" className="flex items-center gap-1.5 text-sm font-medium text-accent-strong">
              <Check className="size-4" aria-hidden />
              Password updated
            </span>
          )}
        </div>
      </form>
    </SettingsSection>
  )
}