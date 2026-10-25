import { useMemo, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { useStore } from '../../lib/store'
import { useToast } from '../../components/ui/toast'
import { getReferrer, tierIndex } from '../../lib/metrics'
import { money, moneyCompact, relative, shortDate } from '../../lib/format'
import { TIERS } from '../../lib/types'
import { PageHeader, Panel, SectionLabel, Kpi } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { DataTable, type Column } from '../../components/ui/table'
import { Drawer, Modal } from '../../components/ui/overlay'
import { DefinitionList, EmptyState, PersonCell, TierProgress } from '../../components/ui/misc'
import { SearchInput, Textarea } from '../../components/ui/field'
import { StatusPill, Tag } from '../../components/ui/badge'
import { Icon } from '../../components/icons'
import { Tabs } from '../../components/ui/misc'
import type { Loan } from '../../lib/types'

export function LoanQueue() {
  const { state, dispatch } = useStore()
  const { user } = useAuth()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [frequency, setFrequency] = useState<'all' | 'weekly' | 'monthly'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)

  const pending = useMemo(
    () =>
      state.loans
        .filter((l) => l.status === 'pending')
        .filter((l) => (frequency === 'all' ? true : l.frequency === frequency))
        .filter((l) => {
          if (!query.trim()) return true
          const q = query.toLowerCase()
          const borrower = state.borrowers.find((b) => b.id === l.borrowerId)
          const referrer = getReferrer(state, l.referrerId)
          return (
            l.id.toLowerCase().includes(q) ||
            l.purpose.toLowerCase().includes(q) ||
            borrower?.name.toLowerCase().includes(q) ||
            referrer.name.toLowerCase().includes(q)
          )
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state, frequency, query],
  )

  const selected = state.loans.find((l) => l.id === selectedId) ?? null
  const selectedBorrower = selected ? state.borrowers.find((b) => b.id === selected.borrowerId) : null
  const selectedReferrer = selected ? getReferrer(state, selected.referrerId) : null
  const referrerPartner = selected ? state.partners.find((p) => p.id === selected.referrerId) : null

  const totalRequested = pending.reduce((sum, l) => sum + l.amount, 0)
  const avgTrust =
    pending.reduce((sum, l) => sum + (state.borrowers.find((b) => b.id === l.borrowerId)?.trustScore ?? 0), 0) /
    (pending.length || 1)

  const columns: Column<Loan>[] = [
    {
      key: 'loan',
      header: 'Application',
      sortValue: (l) => l.id,
      render: (l) => (
        <span>
          <span className="block font-medium text-ink">{l.id}</span>
          <span className="block font-serif text-[15px] text-ink-muted">
            {money(l.amount)}
          </span>
        </span>
      ),
    },
    {
      key: 'borrower',
      header: 'Borrower',
      sortValue: (l) => state.borrowers.find((b) => b.id === l.borrowerId)?.name ?? '',
      render: (l) => {
        const borrower = state.borrowers.find((b) => b.id === l.borrowerId)
        return <PersonCell name={borrower?.name ?? '—'} meta={borrower?.businessName} />
      },
    },
    {
      key: 'referrer',
      hideBelow: 'xl',
      header: 'Referrer',
      render: (l) => {
        const referrer = getReferrer(state, l.referrerId)
        return (
          <span>
            <span className="block text-ink">{referrer.name}</span>
            <span className="block text-[11.5px] text-ink-subtle capitalize">{referrer.kind}</span>
          </span>
        )
      },
    },
    {
      key: 'tier',
      hideBelow: 'xl',
      header: 'Trust',
      sortValue: (l) => state.borrowers.find((b) => b.id === l.borrowerId)?.trustScore ?? 0,
      render: (l) => {
        const borrower = state.borrowers.find((b) => b.id === l.borrowerId)
        return (
          <span className="flex items-center gap-2">
            <span className="tnum font-medium text-ink">{borrower?.trustScore}</span>
            <Tag>{borrower?.tier}</Tag>
          </span>
        )
      },
    },
    {
      key: 'plan',
      hideBelow: 'xl',
      header: 'Repayment',
      render: (l) => (
        <span className="text-ink-muted capitalize">
          {l.frequency} · {l.installmentsTotal} × {money(Math.round(l.amount / l.installmentsTotal))}
        </span>
      ),
    },
    {
      key: 'requested',
      hideBelow: 'sm',
      header: 'Requested',
      sortValue: (l) => l.createdAt,
      render: (l) => <span className="text-ink-muted">{relative(l.createdAt)}</span>,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (l) => (
        <Button size="sm" onClick={() => setSelectedId(l.id)}>Review</Button>
      ),
    },
  ]

  function approve() {
    if (!selected) return
    dispatch({ type: 'APPROVE_LOAN', loanId: selected.id, by: user?.name ?? 'Founder' })
    toast.push({
      title: 'Loan approved',
      description: `${selected.id} for ${selectedBorrower?.name} is now active. ${money(selected.amount)} moved out of the lending pool.`,
      tone: 'positive',
    })
    setSelectedId(null)
  }

  function reject() {
    if (!selected) return
    if (note.trim().length < 8) {
      setNoteError('Add a short reason, so the borrower and referrer know what to do next.')
      return
    }
    dispatch({ type: 'REJECT_LOAN', loanId: selected.id, by: user?.name ?? 'Founder', note: note.trim() })
    toast.push({ title: 'Application declined', description: `${selected.id} was declined and the borrower has been notified.` })
    setRejectOpen(false)
    setSelectedId(null)
    setNote('')
    setNoteError(null)
  }

  return (
    <>
      <PageHeader
        title="Loan approval queue"
        description="Applications waiting on a decision. Open one for the full picture — borrower history, referrer quality, and the repayment plan."
      />

      <div className="grid grid-cols-2 gap-3 border-y border-line bg-surface py-1 sm:grid-cols-3">
        <Kpi label="In queue" value={String(state.loans.filter((l) => l.status === 'pending').length)} hint="Awaiting a decision" tone="due" emphasis />
        <Kpi label="Value requested" value={moneyCompact(totalRequested)} hint="Across the visible queue" />
        <Kpi label="Average trust score" value={String(Math.round(avgTrust))} unit="/ 100" hint="Of visible applicants" tone="positive" />
      </div>

      <div className="mt-4">
        <Panel>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <Tabs
              tabs={[
                { value: 'all', label: 'All', count: state.loans.filter((l) => l.status === 'pending').length },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              value={frequency}
              onChange={setFrequency}
            />
            <div className="ml-auto w-full sm:w-[280px]">
              <SearchInput value={query} onChange={setQuery} placeholder="Search borrower, referrer, purpose…" />
            </div>
          </div>

          <DataTable
            columns={columns}
            rows={pending}
            getRowId={(l) => l.id}
            onRowClick={(l) => setSelectedId(l.id)}
            selectedId={selectedId ?? undefined}
            emptyState={
              <EmptyState
                title="The queue is clear"
                description="Every application has been decided. New applications will appear here as borrowers submit them."
              />
            }
            mobileCard={(l) => {
              const borrower = state.borrowers.find((b) => b.id === l.borrowerId)
              const referrer = getReferrer(state, l.referrerId)
              return (
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <PersonCell name={borrower?.name ?? '—'} meta={borrower?.businessName} />
                    <span className="tnum shrink-0 text-[13px] font-medium text-ink">{money(l.amount)}</span>
                  </div>
                  <div className="mt-2.5 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11.5px] text-ink-muted">
                        {l.frequency} · {l.installmentsTotal} instalments · {TIERS[tierIndex(borrower?.tier ?? 'New')]}
                      </p>
                      <p className="truncate text-[11px] text-ink-subtle">
                        {relative(l.createdAt)} · via {referrer.name}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setSelectedId(l.id)}>
                      Review
                    </Button>
                  </div>
                </div>
              )
            }}
          />
        </Panel>
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected ? `Application ${selected.id}` : ''}
        meta={
          selected ? (
            <span className="flex items-center gap-2">
              <StatusPill tone="due">pending review</StatusPill>
              <span>Requested {shortDate(selected.createdAt)}</span>
            </span>
          ) : null
        }
        footer={
          selected ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => setRejectOpen(true)}>Decline</Button>
              <Button variant="primary" onClick={approve}>
                Approve {money(selected.amount)}
              </Button>
            </>
          ) : null
        }
      >
        {selected && selectedBorrower && selectedReferrer ? (
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-line bg-canvas/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <PersonCell name={selectedBorrower.name} meta={`${selectedBorrower.businessName} · ${selectedBorrower.location}`} />
                <Tag>{selectedBorrower.tier}</Tag>
              </div>
              <p className="mt-3 border-t border-line pt-3 text-[13px] leading-relaxed text-ink">
                “{selected.purpose}”
              </p>
            </div>

            <div>
              <SectionLabel>Requested terms</SectionLabel>
              <div className="mt-2 rounded-lg border border-line px-4 py-3">
                <p className="tnum font-serif text-[30px] leading-none text-ink">{money(selected.amount)}</p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  {selected.frequency === 'weekly' ? 'Weekly' : 'Monthly'} · {selected.installmentsTotal} instalments · {money(Math.round(selected.amount / selected.installmentsTotal))} per instalment · 0% interest
                </p>
              </div>
            </div>

            <div>
              <SectionLabel>Borrower</SectionLabel>
              <div className="mt-2">
                <DefinitionList
                  items={[
                    { label: 'Business', value: selectedBorrower.businessName },
                    { label: 'Sector', value: selectedBorrower.businessType },
                    { label: 'Monthly revenue', value: <span className="tnum">{money(selectedBorrower.monthlyRevenue)}</span> },
                    { label: 'Years operating', value: `${selectedBorrower.yearsOperating} years` },
                    { label: 'Phone', value: <span className="tnum">{selectedBorrower.phone}</span> },
                    { label: 'On platform since', value: shortDate(selectedBorrower.joinedAt) },
                  ]}
                />
              </div>
            </div>

            <div>
              <SectionLabel>Bank verification</SectionLabel>
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-positive-soft px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-emerald-900">Account name matches</p>
                  <p className="tnum mt-0.5 text-[12px] text-emerald-800/80">
                    {selectedBorrower.bankName} · {selectedBorrower.accountNumber}
                  </p>
                </div>
                <Icon name="check" className="size-4 text-emerald-700" />
              </div>
            </div>

            <div>
              <SectionLabel>Referrer</SectionLabel>
              <div className="mt-2 rounded-lg border border-line px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium text-ink">{selectedReferrer.name}</p>
                  <Tag>{selectedReferrer.kind}</Tag>
                </div>
                {referrerPartner ? (
                  <p className="mt-1 text-[12px] text-ink-muted">
                    {referrerPartner.referrals} referrals · {referrerPartner.activeLoans} active loans · rated {referrerPartner.qualityRating.toFixed(1)} / 5
                  </p>
                ) : (
                  <p className="mt-1 text-[12px] text-ink-muted">Foundation team member</p>
                )}
              </div>
            </div>

            <div>
              <SectionLabel>Trust score</SectionLabel>
              <div className="mt-2 rounded-lg border border-line px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="tnum text-[20px] font-semibold text-ink">{selectedBorrower.trustScore} / 100</span>
                  <StatusPill tone="positive">{selectedBorrower.tier}</StatusPill>
                </div>
                <TierProgress className="mt-3" steps={TIERS} current={tierIndex(selectedBorrower.tier)} />
              </div>
            </div>

            <p className="rounded-md bg-canvas px-3 py-2 text-[12px] text-ink-muted">
              Approving moves {money(selected.amount)} out of the lending pool and starts the repayment
              clock immediately.
            </p>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Decline this application?"
        description={selected ? `${selectedBorrower?.name} · ${money(selected.amount)} · ${selected.id}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Keep reviewing</Button>
            <Button variant="danger" onClick={reject}>Decline application</Button>
          </>
        }
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-ink-muted">Reason (sent to the borrower)</span>
          <Textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
              setNoteError(null)
            }}
            placeholder="e.g. Revenue records are too thin for this amount. Reapply after three months of statements."
            autoFocus
          />
          {noteError ? <span className="text-[12px] text-overdue">{noteError}</span> : null}
        </label>
        <p className="mt-3 text-[11.5px] text-ink-subtle">
          The referrer is notified automatically. This cannot be undone in the demo.
        </p>
      </Modal>
    </>
  )
}
