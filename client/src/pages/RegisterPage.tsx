import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { AuthCard } from '../components/AuthCard'
import { Field } from '../components/Field'
import { useAuth } from '../context/useAuth'
import { ApiError } from '../lib/api'
import { passwordSchema } from '../lib/validation'

// These rules mirror the backend validator, so users get instant feedback
const schema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().trim().email('Enter a valid email'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const { register: signUp } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ name, email, password }: FormValues) => {
    setServerError(null)
    try {
      await signUp({ name, email, password })
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        // Show backend validation messages next to the matching field
        err.details?.forEach((d) => {
          if (d.field === 'name' || d.field === 'email' || d.field === 'password') {
            setError(d.field, { message: d.message })
          }
        })
        setServerError(err.details?.length ? null : err.message)
      } else {
        setServerError('Could not reach the server')
      }
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Start tracking your daily routine">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Field
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {serverError && <p className="notice">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full"
        >
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
          Create account
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  )
}