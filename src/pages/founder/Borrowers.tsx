import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { useToast } from '../../components/ui/toast'
import { getReferrer, tierIndex } from '../../lib/metrics'
import { loanStatusLabel, loanStatusTone, money, moneyCompact, shortDate } from '../../lib/format'
import { TIERS, type Borrower, type TrustTier } from '../../lib/types'
import { PageHeader, Panel, Kpi, SectionLabel } from '../../components/ui/card'
import { DataTable, type Column } from '../../components/ui/table'
import { SearchInput, Select, Textarea } from '../../components/ui/field'
import { StatusPill, Tag } from '../../components/ui/badge'
import { Drawer, Modal } from '../../components/ui/overlay'
import { Button } from '../../components/ui/button'
import { DefinitionList, EmptyState, PersonCell, TierProgress } from '../../components/ui/misc'

export function Borrowers() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [tier, setTier] = useState<'all' | TrustTier>('all')
  const [status, setStatus] = useState<'all' | Borrower['status']>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [flagOpen, setFlagOpen] = useState(false)
  const [flagReason, setFlagReason] = useState('')

  const rows = useMemo(
    () =>
      state.borrowers
        .filter((b) => (tier === 'all' ? true : b.tier === tier))
        .filter((b) => (status === 'all' ? true : b.status === status))
        .filter((b) => {
          if (!query.trim()) return true
          const q = query.toLowerCase()
          return (
            b.name.toLowerCase().includes(q) ||
            b.businessName.toLowerCase().includes(q) ||
            b.email.toLowerCase().includes(q) ||
            b.location.toLowerCase().includes(q)
          )
        }),
    [state.borrowers, tier, status, query],
  )

  const selected = state.borrowers.find((b) => b.id === selectedId) ?? null
  const loans = selected ? state.loans.filter((l) => l.borrowerId === selected.id) : []
  const referrer = selected ? getReferrer(state, selected.referrerId) : null
  const avgTrust = state.borrowers.reduce((s, b) => s + b.trustScore, 0) / state.borrowers.length

  const columns: Column<Borrower>[] = [
    {
      key: 'name',
      header: 'Borrower',
      sortValue: (b) => b.name,
      render: (b) => <PersonCell name={b.name} meta={b.email} />,
    },
    {
      key: 'business',
      hideBelow: 'xl',
      header: 'Business',
      sortValue: (b) => b.businessName,
      render: (b) => (
        <span>
          <span className="block text-ink">{b.businessName}</span>
          <span className="block text-[11.5px] text-ink-subtle">{b.businessType} · {b.location}</span>
        </span>
      ),
    },
    {
      key: 'trust',
      header: 'Trust score',
      align: 'right',
      sortValue: (b) => b.trustScore,
      render: (b) => (
        <span className="flex items-center justify-end gap-2">
          <span className="tnum font-medium text-ink">{b.trustScore}</span>
          <Tag>{b.tier}</Tag>
        </span>
      ),
    },
    {
      key: 'loans',
      hideBelow: 'xl',
      header: 'Loans',
      align: 'right',
      render: (b) => {
        const all = state.loans.filter((l) => l.borrowerId === b.id)
        const active = all.filter((l) => l.status === 'active' || l.status === 'overdue')
        return (
          <span className="tnum text-ink-muted">
            {all.length} <span className="text-ink-subtle">({active.length} open)</span>
          </span>
        )
      },
    },
    {
      key: 'referrer',
      hideBelow: 'xl',
      header: 'Referrer',
      render: (b) => <span className="text-ink-muted">{getReferrer(state, b.referrerId).name}</span>,
    },
    {
      key: 'joined',
      hideBelow: 'xl',
      header: 'Joined',
      sortValue: (b) => b.joinedAt,
      render: (b) => <span className="text-ink-muted">{shortDate(b.joinedAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => (
        <StatusPill tone={b.status === 'active' ? 'positive' : b.status === 'flagged' ? 'due' : 'overdue'}>
          {b.status}
        </StatusPill>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Borrower management"
        description="Everyone who has registered on QardLink. Trust score, loan history, and the referrer link that brought them in."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Registered" value={String(state.borrowers.length)} hint="Borrowers on the platform" />
        <Kpi label="Active" value={String(state.borrowers.filter((b) => b.status === 'active').length)} hint="In good standing" tone="positive" />
        <Kpi label="Flagged or suspended" value={String(state.borrowers.filter((b) => b.status !== 'active').length)} hint="Needs review" tone="due" />
        <Kpi label="Average trust" value={String(Math.round(avgTrust))} unit="/ 100" hint="Across all borrowers" />
      </div>

      <div className="mt-4">
        <Panel>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <div className="w-[150px]">
              <Select value={tier} onChange={(e) => setTier(e.target.value as typeof tier)} aria-label="Filter by tier">
                <option value="all">All tiers</option>
                {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div className="w-[150px]">
              <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filter by status">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="flagged">Flagged</option>
                <option value="suspended">Suspended</option>
              </Select>
            </div>
            <div className="w-full sm:ml-auto sm:w-[300px]">
              <SearchInput value={query} onChange={setQuery} placeholder="Search name, business, location…" />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(b) => b.id}
            onRowClick={(b) => setSelectedId(b.id)}
            selectedId={selectedId ?? undefined}
            emptyState={<EmptyState title="No borrowers match" description="Try clearing the filters or searching a different name." />}
            mobileCard={(b) => (
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <PersonCell name={b.name} meta={b.businessName} />
                  <StatusPill tone={b.status === 'active' ? 'positive' : b.status === 'flagged' ? 'due' : 'overdue'}>
                    {b.status}
                  </StatusPill>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11.5px] text-ink-subtle">
                  <span className="flex items-center gap-1.5">
                    <span className="tnum font-medium text-ink">{b.trustScore}</span>
                    <Tag>{b.tier}</Tag>
                  </span>
                  <span>Joined {shortDate(b.joinedAt)}</span>
                </div>
              </div>
            )}
          />
        </Panel>
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.name ?? ''}
        meta={selected ? <span className="flex items-center gap-2"><Tag>{selected.tier}</Tag><span>Joined {shortDate(selected.joinedAt)}</span></span> : null}
        footer={
          selected ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>
              {selected.status === 'active' ? (
                <>
                  <Button variant="secondary" onClick={() => { setFlagReason(''); setFlagOpen(true) }}>Flag account</Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      dispatch({ type: 'SUSPEND_BORROWER', borrowerId: selected.id })
                      toast.push({ title: 'Borrower suspended', description: `${selected.name} can no longer apply or transact.` })
                    }}
                  >
                    Suspend
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    dispatch({ type: 'RESTORE_BORROWER', borrowerId: selected.id })
                    toast.push({ title: 'Borrower restored', description: `${selected.name} is active again.`, tone: 'positive' })
                  }}
                >
                  Restore account
                </Button>
              )}
            </>
          ) : null
        }
      >
        {selected && referrer ? (
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-line bg-canvas/50 p-4">
              <div className="flex items-center justify-between">
                <span className="tnum text-[26px] font-semibold text-ink">{selected.trustScore}<span className="text-[14px] text-ink-subtle"> / 100</span></span>
                <StatusPill tone={selected.status === 'active' ? 'positive' : selected.status === 'flagged' ? 'due' : 'overdue'}>{selected.status}</StatusPill>
              </div>
              <TierProgress className="mt-3" steps={TIERS} current={tierIndex(selected.tier)} />
              {selected.flagReason ? (
                <p className="mt-3 rounded border border-[#f0dcc0] bg-due-soft px-2.5 py-1.5 text-[12px] text-due">
                  Flag: {selected.flagReason}
                </p>
              ) : null}
            </div>

            <div>
              <SectionLabel>Business</SectionLabel>
              <div className="mt-2">
                <DefinitionList
                  items={[
                    { label: 'Business', value: selected.businessName },
                    { label: 'Sector', value: selected.businessType },
                    { label: 'Location', value: selected.location },
                    { label: 'Monthly revenue', value: <span className="tnum">{money(selected.monthlyRevenue)}</span> },
                    { label: 'Years operating', value: `${selected.yearsOperating} years` },
                    { label: 'Referrer', value: referrer.name },
                  ]}
                />
              </div>
            </div>

            <div>
              <SectionLabel>Contact and bank</SectionLabel>
              <div className="mt-2">
                <DefinitionList
                  items={[
                    { label: 'Email', value: selected.email },
                    { label: 'Phone', value: <span className="tnum">{selected.phone}</span> },
                    { label: 'Bank', value: selected.bankName },
                    { label: 'Account number', value: <span className="tnum">{selected.accountNumber}</span> },
                    { label: 'Account name', value: selected.accountName },
                    { label: 'Verification', value: <Tag>name matched</Tag> },
                  ]}
                />
              </div>
            </div>

            <div>
              <SectionLabel>Loan history</SectionLabel>
              {loans.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-ink-subtle">No loans yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-line rounded-md border border-line">
                  {loans.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div>
                        <p className="text-[12.5px] font-medium text-ink">{l.id} · {money(l.amount)}</p>
                        <p className="text-[11px] text-ink-subtle">{l.purpose}</p>
                      </div>
                      <StatusPill tone={loanStatusTone[l.status]}>{loanStatusLabel[l.status]}</StatusPill>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between rounded-md bg-canvas px-3 py-2.5 text-[12px] text-ink-muted">
              <span>Total borrowed</span>
              <span className="tnum font-medium text-ink">{moneyCompact(loans.reduce((s, l) => s + l.amount, 0))}</span>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={flagOpen}
        onClose={() => setFlagOpen(false)}
        title="Flag this borrower?"
        description="Flagging records a concern without blocking the account. Suspension is a separate action."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFlagOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!selected) return
                if (flagReason.trim().length < 6) return
                dispatch({ type: 'FLAG_BORROWER', borrowerId: selected.id, reason: flagReason.trim() })
                toast.push({ title: 'Borrower flagged', description: 'The reason is now visible on their record.' })
                setFlagOpen(false)
              }}
            >
              Flag account
            </Button>
          </>
        }
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-ink-muted">Reason</span>
          <Textarea value={flagReason} onChange={(e) => setFlagReason(e.target.value)} placeholder="e.g. Bank account name mismatch on re-verification." autoFocus />
          {flagReason.length > 0 && flagReason.trim().length < 6 ? (
            <span className="text-[12px] text-overdue">Add a little more detail (at least 6 characters).</span>
          ) : null}
        </label>
      </Modal>
    </>
  )
}
