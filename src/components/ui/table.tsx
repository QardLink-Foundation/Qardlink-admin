import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
  width?: string
  cellClassName?: string
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  selectedId?: string
  footer?: ReactNode
  dense?: boolean
  emptyState?: ReactNode
  mobileCard?: (row: T) => ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  selectedId,
  footer,
  dense = false,
  emptyState,
  mobileCard,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av === bv) return 0
      return av > bv ? factor : -factor
    })
  }, [rows, columns, sort])

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return
    setSort((prev) =>
      prev?.key === col.key
        ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col.key, dir: 'asc' },
    )
  }

  const py = dense ? 'py-2' : 'py-2.5'
  const hideClass = (col: Column<T>) =>
    col.hideBelow === 'sm'
      ? 'hidden sm:table-cell'
      : col.hideBelow === 'md'
        ? 'hidden md:table-cell'
        : col.hideBelow === 'lg'
          ? 'hidden lg:table-cell'
          : col.hideBelow === 'xl'
            ? 'hidden xl:table-cell'
            : ''

  return (
    <>
      {mobileCard ? (
        <ul className="divide-y divide-line sm:hidden">
          {sorted.length === 0 ? (
            <li className="px-4 py-8">{emptyState}</li>
          ) : (
            sorted.map((row) => (
              <li key={getRowId(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {mobileCard(row)}
              </li>
            ))
          )}
        </ul>
      ) : null}
      <div className={cn('overflow-x-auto scrollbar-slim', mobileCard && 'hidden sm:block')}>
      <table className="w-full min-w-full text-[13px] sm:min-w-[640px]">
        <thead>
          <tr className="border-b border-line-strong">
            {columns.map((col) => {
              const active = sort?.key === col.key
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'sticky top-0 z-10 bg-canvas/95 px-3 text-left text-[11px] font-semibold tracking-[0.03em] text-ink-subtle uppercase backdrop-blur-sm',
                    dense ? 'py-2' : 'py-2.5',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    hideClass(col),
                  )}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className={cn(
                        'inline-flex items-center gap-1 uppercase hover:text-ink',
                        active && 'text-emerald-700',
                      )}
                    >
                      {col.header}
                      <span aria-hidden className="text-[9px]">
                        {active ? (sort!.dir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10">
                {emptyState ?? (
                  <p className="text-center text-[13px] text-ink-subtle">Nothing here yet.</p>
                )}
              </td>
            </tr>
          ) : (
            sorted.map((row) => {
              const id = getRowId(row)
              const selected = selectedId === id
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-line last:border-b-0',
                    onRowClick && 'cursor-pointer',
                    selected ? 'bg-emerald-50/70' : 'hover:bg-emerald-50/40',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 text-ink',
                        py,
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        hideClass(col),
                        col.cellClassName,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
        {footer && sorted.length > 0 ? (
          <tfoot className="border-t border-line-strong bg-canvas/60">{footer}</tfoot>
        ) : null}
      </table>
      </div>
    </>
  )
}
