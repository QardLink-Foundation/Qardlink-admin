import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from './button'

export function TierProgress({
  steps,
  current,
  className,
}: {
  steps: string[]
  current: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((step, i) => {
        const reached = i <= current
        return (
          <div key={step} className="flex flex-1 flex-col gap-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full',
                reached ? 'bg-emerald-600' : 'bg-line-strong',
              )}
            />
            <span
              className={cn(
                'text-[11px] font-medium',
                i === current ? 'text-emerald-800' : reached ? 'text-ink-muted' : 'text-ink-subtle',
              )}
            >
              {step}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function SplitBar({
  lending,
  operational,
}: {
  lending: number
  operational: number
}) {
  const total = lending + operational || 1
  const lendingPct = Math.round((lending / total) * 100)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2.5 overflow-hidden rounded-full">
        <div className="bg-emerald-600" style={{ width: `${lendingPct}%` }} />
        <div className="bg-pool" style={{ width: `${100 - lendingPct}%` }} />
      </div>
      <div className="flex items-center gap-4 text-[12px]">
        <span className="inline-flex items-center gap-1.5 text-ink-muted">
          <span className="size-2 rounded-full bg-emerald-600" />
          Lending pool {lendingPct}%
        </span>
        <span className="inline-flex items-center gap-1.5 text-ink-muted">
          <span className="size-2 rounded-full bg-pool" />
          Operational {100 - lendingPct}%
        </span>
      </div>
    </div>
  )
}

export interface TimelineEntry {
  id: string
  title: string
  detail?: string
  when: string
  tone?: 'positive' | 'neutral' | 'overdue' | 'pool'
}

const timelineDot: Record<string, string> = {
  positive: 'bg-emerald-600',
  neutral: 'bg-line-strong',
  overdue: 'bg-overdue',
  pool: 'bg-pool',
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative flex flex-col gap-4 border-l border-line pl-4">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className={cn(
              'absolute top-1 -left-[21px] size-2.5 rounded-full ring-2 ring-surface',
              timelineDot[entry.tone ?? 'neutral'],
            )}
          />
          <p className="text-[13px] font-medium text-ink">{entry.title}</p>
          {entry.detail ? (
            <p className="mt-0.5 text-[12.5px] text-ink-muted">{entry.detail}</p>
          ) : null}
          <p className="tnum mt-0.5 text-[11.5px] text-ink-subtle">{entry.when}</p>
        </li>
      ))}
    </ol>
  )
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-800',
        className,
      )}
    >
      {initials}
    </span>
  )
}

export function PersonCell({
  name,
  meta,
  avatar = true,
}: {
  name: string
  meta?: string
  avatar?: boolean
}) {
  return (
    <span className="flex items-center gap-2.5">
      {avatar ? <Avatar name={name} /> : null}
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink">{name}</span>
        {meta ? <span className="block truncate text-[12px] text-ink-subtle">{meta}</span> : null}
      </span>
    </span>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex size-10 items-center justify-center rounded-full border border-line bg-canvas">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-5 text-ink-subtle"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" />
          <path d="M4 8.5 12 13m8-4.5L12 13m0 0v7" />
        </svg>
      </span>
      <div>
        <p className="font-serif text-[19px] text-ink">{title}</p>
        <p className="mt-1 max-w-[46ch] text-[13px] text-ink-muted">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string
  description: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-[#efcbc5] bg-overdue-soft px-6 py-10 text-center">
      <p className="font-serif text-[19px] text-overdue">{title}</p>
      <p className="max-w-[46ch] text-[13px] text-ink-muted">{description}</p>
      {onRetry ? (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-line', className)} />
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="tablist" className="flex items-center gap-1 border-b border-line">
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors',
              active
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className="tnum rounded-full bg-canvas px-1.5 text-[11px] text-ink-muted">
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function DefinitionList({
  items,
}: {
  items: { label: string; value: ReactNode }[]
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11.5px] text-ink-subtle">{item.label}</dt>
          <dd className="mt-0.5 text-[13px] text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
