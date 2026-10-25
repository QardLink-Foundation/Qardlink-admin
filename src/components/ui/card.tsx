import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Panel({
  children,
  className,
  as: As = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div'
}) {
  return (
    <As
      className={cn(
        'rounded-lg border border-line bg-surface',
        className,
      )}
    >
      {children}
    </As>
  )
}

export function PanelHeader({
  title,
  meta,
  action,
  className,
}: {
  title: ReactNode
  meta?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex items-center justify-between gap-3 border-b border-line px-4 py-3',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {meta ? <p className="mt-0.5 text-[12px] text-ink-muted">{meta}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </header>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-line bg-surface p-4', className)}>
      {children}
    </div>
  )
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[11px] font-semibold tracking-[0.04em] text-ink-subtle uppercase', className)}>
      {children}
    </p>
  )
}

export function PageHeader({
  title,
  description,
  action,
  finding,
}: {
  title: string
  description?: string
  action?: ReactNode
  finding?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col items-start gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-[70ch] text-[13px] text-ink-muted">{description}</p>
        ) : null}
        {finding ? <p className="mt-2 text-[13px] font-medium text-emerald-800">{finding}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2 max-sm:w-full">{action}</div> : null}
    </div>
  )
}

export function Kpi({
  label,
  value,
  unit,
  delta,
  tone = 'neutral',
  hint,
  emphasis = false,
  className,
}: {
  label: string
  value: ReactNode
  unit?: string
  delta?: { value: string; direction: 'up' | 'down' }
  tone?: 'neutral' | 'positive' | 'pool' | 'due' | 'overdue'
  hint?: string
  emphasis?: boolean
  className?: string
}) {
  const accent: Record<string, string> = {
    neutral: 'text-ink',
    positive: 'text-emerald-700',
    pool: 'text-pool',
    due: 'text-due',
    overdue: 'text-overdue',
  }
  return (
    <div className={cn('flex min-w-0 flex-col gap-1 border-l border-line px-3 py-2 first:border-l-0', className)}>
      <SectionLabel>{label}</SectionLabel>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('tnum leading-none font-semibold tracking-[-0.025em]', emphasis ? 'text-[32px]' : 'text-[24px]', accent[tone])}>
          {value}
        </span>
        {unit ? <span className="text-[12px] text-ink-subtle">{unit}</span> : null}
        {delta ? (
          <span
            className={cn(
              'tnum ml-1 text-[11.5px] font-medium',
              delta.direction === 'up' ? 'text-emerald-700' : 'text-overdue',
            )}
          >
            {delta.direction === 'up' ? '▲' : '▼'} {delta.value}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-[12px] text-ink-subtle">{hint}</p> : null}
    </div>
  )
}
