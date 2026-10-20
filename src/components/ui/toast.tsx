import { AnimatePresence, motion } from 'motion/react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'default' | 'positive' | 'overdue' | 'info'

interface ToastItem {
  id: number
  title: string
  description?: string
  tone: Tone
}

interface ToastApi {
  push: (toast: { title: string; description?: string; tone?: Tone }) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const toneStyles: Record<Tone, string> = {
  default: 'border-line',
  positive: 'border-emerald-200',
  overdue: 'border-[#efcbc5]',
  info: 'border-[#cbd6ea]',
}

const toneDot: Record<Tone, string> = {
  default: 'bg-ink-subtle',
  positive: 'bg-emerald-600',
  overdue: 'bg-overdue',
  info: 'bg-info',
}

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((toast: { title: string; description?: string; tone?: Tone }) => {
    const id = ++counter
    setItems((prev) => [...prev, { id, tone: toast.tone ?? 'default', ...toast }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 4200)
  }, [])

  const api = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[340px] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              className={cn(
                'pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-surface px-3.5 py-3 shadow-raised',
                toneStyles[item.tone],
              )}
            >
              <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', toneDot[item.tone])} />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 text-[12.5px] text-ink-muted">{item.description}</p>
                ) : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
