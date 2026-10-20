import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { IconButton } from './button'

function useDismissable(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const focusTarget = ref.current?.querySelector<HTMLElement>(
      '[data-autofocus], button, [href], input, select, textarea',
    )
    focusTarget?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  return ref
}

const CloseIcon = (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    className="size-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export function Drawer({
  open,
  onClose,
  title,
  meta,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  meta?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const ref = useDismissable(open, onClose)
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-emerald-950/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: 32, opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }}
            className="relative flex h-full w-full max-w-[520px] flex-col border-l border-line bg-surface"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
                {meta ? <div className="mt-1 text-[12.5px] text-ink-muted">{meta}</div> : null}
              </div>
              <IconButton label="Close panel" onClick={onClose} data-autofocus>
                {CloseIcon}
              </IconButton>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-slim">{children}</div>
            {footer ? (
              <footer className="flex items-center justify-end gap-2 border-t border-line bg-canvas/50 px-5 py-3">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md'
}) {
  const ref = useDismissable(open, onClose)
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-emerald-950/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 16, opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.995 }}
            transition={{ type: 'spring', stiffness: 480, damping: 40, mass: 0.8 }}
            className={cn(
              'relative w-full rounded-lg border border-line bg-surface shadow-raised',
              size === 'sm' ? 'max-w-[420px]' : 'max-w-[560px]',
            )}
          >
            <header className="border-b border-line px-5 py-4">
              <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
              {description ? (
                <p className="mt-1 text-[12.5px] text-ink-muted">{description}</p>
              ) : null}
            </header>
            {children ? <div className="px-5 py-4">{children}</div> : null}
            {footer ? (
              <footer className="flex items-center justify-end gap-2 border-t border-line bg-canvas/50 px-5 py-3">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
