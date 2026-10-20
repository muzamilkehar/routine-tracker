import type { ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  danger?: boolean
  children: ReactNode
}

// One titled card on the Settings page
export function SettingsSection({ title, description, danger = false, children }: SettingsSectionProps) {
  return (
    <section className={`card ${danger ? 'border-danger/30' : ''}`}>
      <div className="border-b border-line px-6 py-4">
        <h2 className={`font-semibold ${danger ? 'text-danger' : ''}`}>{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}