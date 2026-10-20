import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Check, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '../../context/useAuth'
import { ApiError, api } from '../../lib/api'
import type { User } from '../../lib/types'
import { Field } from '../Field'
import { SettingsSection } from './SettingsSection'
import { TimezoneSelect } from './TimezoneSelect'

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be at most 60 characters'),
  timezone: z.string().min(1, 'Choose a timezone'),
})
type Values = z.infer<typeof schema>

const DEVICE_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

export function ProfileForm() {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', timezone: user?.timezone ?? 'UTC' },
  })

  const timezone = useWatch({ control, name: 'timezone' })

  const onSubmit = async (values: Values) => {
    setServerError(null)
    setSaved(false)
    const timezoneChanged = values.timezone !== user?.timezone
    try {
      const { user: updated } = await api<{ user: User }>('/users/me', { method: 'PATCH', body: values })
      updateUser(updated)
      reset({ name: updated.name, timezone: updated.timezone }) // the form is "clean" again
      setSaved(true)
      // "Today" depends on the timezone, so everything on screen must be fetched again
      if (timezoneChanged) await queryClient.invalidateQueries()
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Could not reach the server. Check your connection and try again.')
    }
  }

  return (
    <SettingsSection title="Profile" description="Your name and the timezone that decides when your day starts.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Name" autoComplete="name" error={errors.name?.message} {...register('name')} />

        <div>
          <p className="mb-1.5 text-sm font-medium">Email</p>
          <div className="flex flex-wrap items-center gap-2">
            <span>{user?.email}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user?.isEmailVerified ? 'bg-accent-soft text-accent-strong' : 'bg-warn-soft text-warn'
              }`}
            >
              {user?.isEmailVerified ? 'Verified' : 'Not verified'}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium">
            Timezone
          </label>
          <TimezoneSelect id="timezone" current={user?.timezone ?? 'UTC'} {...register('timezone')} />
          <p className="mt-1.5 text-sm text-ink-soft">
            A new day starts at midnight in this timezone. Changing it changes what counts as today.
          </p>
          {DEVICE_TIMEZONE !== timezone && (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-accent hover:underline"
              onClick={() => setValue('timezone', DEVICE_TIMEZONE, { shouldDirty: true })}
            >
              Use this device&apos;s timezone ({DEVICE_TIMEZONE})
            </button>
          )}
        </div>

        {serverError && (
          <p role="alert" className="notice">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={!isDirty || isSubmitting} className="btn btn-primary">
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            Save changes
          </button>
          {saved && !isDirty && (
            <span role="status" className="flex items-center gap-1.5 text-sm font-medium text-accent-strong">
              <Check className="size-4" aria-hidden />
              Saved
            </span>
          )}
        </div>
      </form>
    </SettingsSection>
  )
}