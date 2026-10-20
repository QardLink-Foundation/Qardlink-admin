import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../components/ui/toast'
import { getReferrer } from '../../lib/metrics'
import { cn } from '../../lib/cn'
import { loanStatusLabel, loanStatusTone, money, moneyCompact, percent, shortDate, daysUntil } from '../../lib/format'
import type { Loan, LoanStatus } from '../../lib/types'
import { PageHeader, Panel, Kpi } from '../../components/ui/card'
import { DataTable, type Column } from '../../components/ui/table'
import { SearchInput, Select } from '../../components/ui/field'
import { StatusPill } from '../../components/ui/badge'
import { Drawer } from '../../components/ui/overlay'
import { Button } from '../../components/ui/button'
import { DefinitionList, EmptyState, PersonCell, Timeline, TierProgress } from '../../components/ui/misc'
import { tierIndex } from '../../lib/metrics'
import { TIERS } from '../../lib/types'
import { Icon } from '../../components/icons'

const statusOptions: Array<{ value: 'all' | LoanStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'repaid', label: 'Repaid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'written_off', label: 'Written off' },
]

export function Loans() {
  const { state, dispatch } = useStore()
  const { user } = useAuth()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | LoanStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = useMemo(() => {
    return state.loans
      .filter((l) => (status === 'all' ? true : l.status === status))
      .filter((l) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        const borrower = state.borrowers.find((b) => b.id === l.borrowerId)
        const referrer = getReferrer(state, l.referrerId)
        return (
          l.id.toLowerCase().includes(q) ||
          borrower?.name.toLowerCase().includes(q) ||
          borrower?.businessName.toLowerCase().includes(q) ||
          referrer.name.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [state, query, status])

  const selected = state.loans.find((l) => l.id === selectedId) ?? null
  const borrower = selected ? state.borrowers.find((b) => b.id === selected.borrowerId) : null
  const payments = selected ? state.payments.filter((p) => p.loanId === selected.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt)) : []
  const referrer = selected ? getReferrer(state, selected.referrerId) : null
  const totals = {
    amount: rows.reduce((s, l) => s + l.amount, 0),
    outstanding: rows.reduce((s, l) => s + l.outstanding, 0),
  }
  const active = state.loans.filter((l) => l.status === 'active')
  const overdue = state.loans.filter((l) => l.status === 'overdue')

  const columns: Column<Loan>[] = [
    {
      key: 'id',
      header: 'Loan',
      sortValue: (l) => l.id,
      render: (l) => (
        <span>
          <span className="block font-medium text-ink">{l.id}</span>
          <span className="block text-[11.5px] text-ink-subtle">{l.purpose}</span>
        </span>
      ),
    },
    {
      key: 'borrower',
      header: 'Borrower',
      sortValue: (l) => state.borrowers.find((b) => b.id === l.borrowerId)?.name ?? '',
      render: (l) => {
        const b = state.borrowers.find((x) => x.id === l.borrowerId)
        return <PersonCell name={b?.name ?? '—'} meta={b?.businessName} />
      },
    },
    {
      key: 'referrer',
      hideBelow: 'xl',
      header: 'Referrer',
      render: (l) => <span className="text-ink-muted">{getReferrer(state, l.referrerId).name}</span>,
    },
    {
      key: 'amount',
      hideBelow: 'sm',
      header: 'Amount',
      align: 'right',
      sortValue: (l) => l.amount,
      render: (l) => <span className="tnum font-medium text-ink">{money(l.amount)}</span>,
    },
    {
      key: 'outstanding',
      hideBelow: 'xl',
      header: 'Outstanding',
      align: 'right',
      sortValue: (l) => l.outstanding,
      render: (l) => (
        <span className={l.outstanding > 0 ? 'tnum text-ink' : 'tnum text-ink-subtle'}>
          {money(l.outstanding)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (l) => l.status,
      render: (l) => <StatusPill tone={loanStatusTone[l.status]}>{loanStatusLabel[l.status]}</StatusPill>,
    },
    {
      key: 'deadline',
      hideBelow: 'xl',
      header: 'Deadline',
      sortValue: (l) => l.deadline ?? '',
      render: (l) => {
        if (!l.deadline) return <span className="text-ink-subtle">—</span>
        const days = daysUntil(l.deadline)
        return (
          <span className="text-ink-muted">
            {shortDate(l.deadline)}
            {l.status === 'active' && days <= 14 ? (
              <span className={cn('ml-1.5 text-[11px] font-medium', days < 0 ? 'text-overdue' : 'text-due')}>
                {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
              </span>
            ) : null}
          </span>
        )
      },
    },
  ]

  function recordPayment() {
    if (!selected) return
    dispatch({ type: 'RECORD_PAYMENT', loanId: selected.id, by: user?.name ?? 'Founder' })
    toast.push({
      title: 'Repayment recorded',
      description: `${money(Math.round(selected.amount / selected.installmentsTotal))} received for ${selected.id}. Trust score updated.`,
      tone: 'positive',
    })
  }

  return (
    <>
      <PageHeader
        title="All loans"
        description="Every loan ever issued, from application to write-off. Figures are interest-free — the ledger records principal only."
        action={
          <Button size="sm" icon={<Icon name="download" className="size-3.5" />} onClick={() => toast.push({ title: 'Ledger exported', description: `${rows.length} rows prepared as CSV.`, tone: 'info' })}>
            Export ledger
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total lent" value={moneyCompact(state.loans.filter((l) => l.status !== 'pending').reduce((s, l) => s + l.amount, 0))} hint={`${state.loans.filter((l) => l.status !== 'pending').length} disbursed`} />
        <Kpi label="Outstanding" value={moneyCompact(active.reduce((s, l) => s + l.outstanding, 0))} hint={`${active.length} active loans`} tone="pool" />
        <Kpi label="Overdue" value={String(overdue.length)} hint={moneyCompact(overdue.reduce((s, l) => s + l.outstanding, 0))} tone="overdue" />
        <Kpi label="Fully repaid" value={String(state.loans.filter((l) => l.status === 'repaid').length)} hint={`${percent((state.loans.filter((l) => l.status === 'repaid').length / (state.loans.filter((l) => l.status !== 'pending').length || 1)) * 100)} of disbursed loans`} tone="positive" />
      </div>

      <div className="mt-4">
        <Panel>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <div className="w-[180px]">
              <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filter by status">
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:ml-auto sm:w-[300px]">
              <SearchInput value={query} onChange={setQuery} placeholder="Search loan, borrower, business…" />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(l) => l.id}
            onRowClick={(l) => setSelectedId(l.id)}
            selectedId={selectedId ?? undefined}
            emptyState={<EmptyState title="No loans match" description="Try a different status or clear the search to see the full ledger." />}
            mobileCard={(l) => {
              const borrower = state.borrowers.find((b) => b.id === l.borrowerId)
              return (
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <PersonCell name={borrower?.name ?? '—'} meta={borrower?.businessName} />
                    <StatusPill tone={loanStatusTone[l.status]}>{loanStatusLabel[l.status]}</StatusPill>
                  </div>
                  <p className="mt-2 truncate text-[11.5px] text-ink-muted">{l.purpose}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="tnum text-[13px] font-medium text-ink">{money(l.amount)}</span>
                    <span className="text-[11.5px] text-ink-subtle">
                      {l.status === 'pending' ? `Applied ${shortDate(l.createdAt)}` : l.deadline ? shortDate(l.deadline) : `${money(l.outstanding)} outstanding`}
                    </span>
                  </div>
                </div>
              )
            }}
            footer={
              <tr>
                <td className="px-3 py-2.5 text-[12px] font-medium text-ink-muted" colSpan={3}>
                  {rows.length} loans
                </td>
                <td className="tnum px-3 py-2.5 text-right text-[12px] font-semibold text-ink">{money(totals.amount)}</td>
                <td className="tnum px-3 py-2.5 text-right text-[12px] font-semibold text-ink">{money(totals.outstanding)}</td>
                <td colSpan={2} />
              </tr>
            }
          />
        </Panel>
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected ? `Loan ${selected.id}` : ''}
        meta={selected ? <StatusPill tone={loanStatusTone[selected.status]}>{loanStatusLabel[selected.status]}</StatusPill> : null}
        footer={
          selected && (selected.status === 'active' || selected.status === 'overdue') ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>
              <Button variant="primary" onClick={recordPayment}>
                Record repayment
              </Button>
            </>
          ) : null
        }
      >
        {selected && borrower && referrer ? (
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-line bg-canvas/50 p-4">
              <PersonCell name={borrower.name} meta={`${borrower.businessName} · ${borrower.location}`} />
              <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
                <div>
                  <p className="text-[11.5px] text-ink-subtle">Principal</p>
                  <p className="tnum font-serif text-[28px] leading-none text-ink">{money(selected.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11.5px] text-ink-subtle">Outstanding</p>
                  <p className="tnum text-[16px] font-semibold text-ink">{money(selected.outstanding)}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.04em] text-ink-subtle uppercase">Terms</p>
              <div className="mt-2">
                <DefinitionList
                  items={[
                    { label: 'Repayment', value: `${selected.frequency === 'weekly' ? 'Weekly' : 'Monthly'} · ${selected.installmentsTotal} instalments` },
                    { label: 'Instalment', value: <span className="tnum">{money(Math.round(selected.amount / selected.installmentsTotal))}</span> },
                    { label: 'Paid', value: `${selected.installmentsPaid} of ${selected.installmentsTotal}` },
                    { label: 'Interest', value: '0% — qard hasan' },
                    { label: 'Disbursed', value: selected.disbursedAt ? shortDate(selected.disbursedAt) : '—' },
                    { label: 'Deadline', value: selected.deadline ? shortDate(selected.deadline) : '—' },
                    { label: 'Referrer', value: referrer.name },
                    { label: 'Approved by', value: selected.approvedBy ?? '—' },
                  ]}
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.04em] text-ink-subtle uppercase">Purpose</p>
              <p className="mt-1.5 rounded-md border border-line px-3 py-2 text-[13px] leading-relaxed text-ink">
                “{selected.purpose}”
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.04em] text-ink-subtle uppercase">Borrower trust</p>
              <div className="mt-2 rounded-md border border-line px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="tnum text-[18px] font-semibold text-ink">{borrower.trustScore} / 100</span>
                  <StatusPill tone="positive">{borrower.tier}</StatusPill>
                </div>
                <TierProgress className="mt-3" steps={TIERS} current={tierIndex(borrower.tier)} />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.04em] text-ink-subtle uppercase">Repayment log</p>
              {payments.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-ink-subtle">No repayments recorded yet.</p>
              ) : (
                <div className="mt-2">
                  <Timeline
                    entries={payments.slice(0, 6).map((p) => ({
                      id: p.id,
                      title: `${money(p.amount)} received`,
                      detail: `Instalment ${selected.installmentsPaid - payments.indexOf(p)}`,
                      when: shortDate(p.paidAt),
                      tone: 'positive',
                    }))}
                  />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Drawer>
    </>
  )
}
