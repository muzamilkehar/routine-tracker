import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { AuthCard } from '../components/AuthCard'
import { Field } from '../components/Field'
import { ApiError, api } from '../lib/api'

const schema = z.object({ email: z.string().trim().email('Enter a valid email') })
type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }: FormValues) => {
    setServerError(null)
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email }, auth: false })
      setSentTo(email)
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Could not reach the server')
    }
  }

  // The server answers the same way whether or not the email exists, so we never reveal who has an account.
  // Our wording follows the same rule: "if there is an account", never "we found your account".
  if (sentTo) {
    return (
      <AuthCard title="Check your email" subtitle="Your reset link is on its way">
        <p className="text-sm text-ink-soft">
          If an account exists for <strong className="text-ink">{sentTo}</strong>, we have sent a link to reset the password.
          It works for one hour. Check your spam folder if you do not see it.
        </p>
        <button type="button" className="btn btn-secondary mt-6 w-full" onClick={() => setSentTo(null)}>
          Use a different email
        </button>
        <p className="mt-5 text-center text-sm text-ink-soft">
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Back to log in
          </Link>
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your email and we will send you a reset link">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />

        {serverError && (
          <p role="alert" className="notice">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
          Send reset link
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  )
}