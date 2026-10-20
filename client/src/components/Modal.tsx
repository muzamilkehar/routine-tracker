import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}

// A side drawer built on the browser's own <dialog> element:
// it gives us the dimmed backdrop, focus handling and the Esc key for free.
export function Modal({ open, onClose, title, description, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose} // fires for Esc and for dialog.close()
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose() // a click on the dimmed backdrop
      }}
      aria-labelledby="modal-title"
      className="my-0 ml-auto mr-0 h-dvh max-h-none w-full max-w-md overflow-hidden border-l border-line bg-surface p-0 text-ink backdrop:bg-ink/40"
    >
      {/* Children only exist while open, so every form starts fresh */}
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div>
              <h2 id="modal-title" className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
            </div>
            <button type="button" onClick={onClose} className="btn btn-quiet -mr-2 size-9 px-0" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </div>
      )}
    </dialog>
  )
}