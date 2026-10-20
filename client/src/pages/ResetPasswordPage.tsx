import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { z } from 'zod'
import { AuthCard } from '../components/AuthCard'
import { Field } from '../components/Field'
import { useAuth } from '../context/useAuth'
import { ApiError, api } from '../lib/api'
import { passwordSchema } from '../lib/validation'

const schema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
type FormValues = z.infer<typeof schema>

// Shown when the link is missing its token, or the server says it is expired or already used
function BadLink({ message }: { message: string }) {
  return (
    <AuthCard title="This link will not work" subtitle={message}>
      <Link to="/forgot-password" className="btn btn-primary w-full">
        Request a new link
      </Link>
      <p className="mt-5 text-center text-sm text-ink-soft">
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthCard>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const { user, logout } = useAuth()
  const [done, setDone] = useState(false)
  const [badLink, setBadLink] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password }: FormValues) => {
    if (!token) return
    setServerError(null)
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false })
      // The server signed every device out. If this browser was still logged in, clear it too.
      if (user) await logout()
      setDone(true)
    } catch (err) {
      if (!(err instanceof ApiError)) return setServerError('Could not reach the server')
      const passwordIssue = err.details?.find((d) => d.field === 'password')
      if (passwordIssue) setError('password', { message: passwordIssue.message })
      else if (err.status === 400) setBadLink(err.message) // expired or already used
      else setServerError(err.message)
    }
  }

  if (!token) return <BadLink message="The link is incomplete. Please open the full link from your email, or request a new one." />
  if (badLink) return <BadLink message={`${badLink}. Links work once and expire after an hour.`} />

  if (done) {
    return (
      <AuthCard title="Password updated" subtitle="You can log in with your new password now">
        <p className="text-sm text-ink-soft">For your safety, you have been signed out on all your devices.</p>
        <Link to="/login" className="btn btn-primary mt-6 w-full">
          Log in
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Pick something you have not used before">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
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

        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
          Update password
        </button>
      </form>
    </AuthCard>
  )
}