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
  stickyHeader?: boolean
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
  stickyHeader = true,
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
      <ul className="divide-y divide-line sm:hidden">
          {sorted.length === 0 ? (
            <li className="px-4 py-8">{emptyState}</li>
          ) : (
            sorted.map((row) => (
              <li key={getRowId(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {mobileCard ? mobileCard(row) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3.5">
                    {columns.map((col) => (
                      <div key={col.key} className="min-w-0">
                        {col.header ? <p className="mb-0.5 text-[10.5px] font-medium text-ink-subtle">{col.header}</p> : null}
                        <div className="min-w-0 text-[12.5px]">{col.render(row)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      <div className="hidden overflow-x-auto scrollbar-slim sm:block">
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
                    stickyHeader
                      ? 'sticky top-14 z-10 bg-surface px-3 text-left text-[12px] font-medium text-ink-muted'
                      : 'bg-surface px-3 text-left text-[12px] font-medium text-ink-muted',
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
                        'inline-flex items-center gap-1 hover:text-ink',
                        active && 'text-emerald-800',
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
