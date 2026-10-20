import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate, type Location } from 'react-router'
import { z } from 'zod'
import { AuthCard } from '../components/AuthCard'
import { Field } from '../components/Field'
import { useAuth } from '../context/useAuth'
import { ApiError } from '../lib/api'

// The schema is the single source of truth: it validates AND creates the TypeScript type
const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await login(values.email, values.password)
      // Send the user back to the page they originally wanted
      const from = (location.state as { from?: Location } | null)?.from?.pathname
      navigate(from ?? '/', { replace: true })
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Could not reach the server')
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to track your routine">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="-mt-1 flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        {serverError && (
          <p role="alert" className="notice">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
          Log in
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        New here?{' '}
        <Link to="/register" className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  )
}