import { useId, type ComponentProps } from 'react'

type FieldProps = ComponentProps<'input'> & {
  label: string
  error?: string
}

// A label + input + error message. In React 19, `ref` is a normal prop,
// so react-hook-form's register() can be spread straight onto it.
export function Field({ label, error, id, ...props }: FieldProps) {
  // The label must point at its input. If no id or name was given, make a unique one.
  const generatedId = useId()
  const inputId = id ?? props.name ?? generatedId

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input id={inputId} aria-invalid={error ? true : undefined} {...props} className={`input ${error ? 'border-danger' : ''}`} />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  )
}