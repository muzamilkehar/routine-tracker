import type { ComponentProps, ReactNode } from 'react'

// A selectable pill. It is a real radio/checkbox underneath, so keyboards and screen readers work.
export function Chip({ children, ...input }: { children: ReactNode } & ComponentProps<'input'>) {
  return (
    <label className="cursor-pointer">
      <input {...input} className="peer sr-only" />
      <span className="chip peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-strong peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
        {children}
      </span>
    </label>
  )
}