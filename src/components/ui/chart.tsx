import type { ReactNode } from 'react'

export function ChartTooltip({
  active,
  payload,
  label,
  format,
  footer,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }>
  label?: string | number
  format?: (value: number, name: string) => ReactNode
  footer?: (row: Record<string, unknown>) => ReactNode
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line bg-surface px-2.5 py-2 shadow-raised">
      {label !== undefined ? (
        <p className="mb-1 text-[11px] font-medium text-ink-subtle">{label}</p>
      ) : null}
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-3 text-[12px]">
            <span className="flex items-center gap-1.5 text-ink-muted">
              <span className="size-2 rounded-full" style={{ background: entry.color }} />
              {entry.name}
            </span>
            <span className="tnum ml-auto font-medium text-ink">
              {format && typeof entry.value === 'number'
                ? format(entry.value, entry.name ?? '')
                : entry.value}
            </span>
          </div>
        ))}
      </div>
      {footer && payload[0]?.payload ? (
        <p className="mt-1 border-t border-line pt-1 text-[10.5px] text-ink-subtle">
          {footer(payload[0].payload)}
        </p>
      ) : null}
    </div>
  )
}
