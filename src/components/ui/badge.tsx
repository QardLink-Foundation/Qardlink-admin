import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type Tone = 'positive' | 'pool' | 'due' | 'overdue' | 'neutral' | 'info'

const tones: Record<Tone, { chip: string; icon: ReactNode }> = {
  positive: {
    chip: 'bg-positive-soft text-emerald-800 border-emerald-200',
    icon: <path d="m4 8.5 2.5 2.5L12 5.5" />,
  },
  pool: {
    chip: 'bg-pool-soft text-pool border-[#bfe0e8]',
    icon: <path d="M8 3v10M4.5 9.5 8 13l3.5-3.5" />,
  },
  due: {
    chip: 'bg-due-soft text-due border-[#f0dcc0]',
    icon: <path d="M8 4.5V8l2.5 1.5M8 2.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />,
  },
  overdue: {
    chip: 'bg-overdue-soft text-overdue border-[#efcbc5]',
    icon: <path d="M8 5v3.5M8 11h.01M8 2.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />,
  },
  info: {
    chip: 'bg-info-soft text-info border-[#cbd6ea]',
    icon: <path d="M8 4.5v3.5M8 11h.01M8 2.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />,
  },
  neutral: {
    chip: 'bg-canvas text-ink-muted border-line-strong',
    icon: <path d="M8 3v10M4.5 6.5 8 3l3.5 3.5" />,
  },
}

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: Tone
  children: ReactNode
  className?: string
}) {
  const t = tones[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[11.5px] font-medium',
        t.chip,
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="size-3 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {t.icon}
      </svg>
      {children}
    </span>
  )
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border border-line bg-canvas px-1.5 py-[1px] text-[11px] text-ink-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function RoleChip({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[2px] text-[11px] font-medium text-emerald-800">
      <span className="size-1.5 rounded-full bg-emerald-600" />
      {role}
    </span>
  )
}
