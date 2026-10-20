import { CheckCheck, ChevronDown, LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { LogStatus } from '../lib/types'

interface BulkActionsProps {
  disabled: boolean
  pending: boolean
  onApply: (status: LogStatus | null) => void
}

// A split button. The main part marks every habit of the day as done in one click.
// The little arrow opens a menu with the other quick choices.
export function BulkActions({ disabled, pending, onApply }: BulkActionsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const blocked = disabled || pending

  // Close the menu when you click elsewhere or press Esc
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const choose = (status: LogStatus | null) => {
    setOpen(false)
    onApply(status)
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        className="btn btn-secondary rounded-r-none border-r-0"
        disabled={blocked}
        onClick={() => choose('done')}
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
        Mark all done
      </button>
      <button
        type="button"
        className="btn btn-secondary rounded-l-none px-2"
        disabled={blocked}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More bulk actions"
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronDown className="size-4" />
      </button>

      {open && (
        <ul role="menu" className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-line bg-surface p-1 shadow-lg">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => choose('missed')}
              className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-canvas"
            >
              Mark all as missed
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => choose('skipped')}
              className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-canvas"
            >
              Mark all as skipped
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(null)}
              className="flex w-full rounded-md px-3 py-2 text-left text-sm hover:bg-canvas"
            >
              Clear all status
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}