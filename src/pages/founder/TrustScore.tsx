import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { useToast } from '../../components/ui/toast'
import { shortDate, dateTime } from '../../lib/format'
import { tierForScore } from '../../lib/types'
import { PageHeader, Panel, PanelHeader, Kpi } from '../../components/ui/card'
import { DataTable, type Column } from '../../components/ui/table'
import { SearchInput, Select } from '../../components/ui/field'
import { StatusPill, Tag } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { PersonCell, EmptyState } from '../../components/ui/misc'
import type { TrustScoreEvent } from '../../lib/types'
import { cn } from '../../lib/cn'

export function TrustScore() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [reason, setReason] = useState('all')

  const reasons = [...new Set(state.trustEvents.map((e) => e.reason))]

  const events = useMemo(
    () =>
      state.trustEvents
        .filter((e) => (reason === 'all' ? true : e.reason === reason))
        .filter((e) => {
          if (!query.trim()) return true
          const q = query.toLowerCase()
          const borrower = state.borrowers.find((b) => b.id === e.borrowerId)
          return borrower?.name.toLowerCase().includes(q) || e.reason.toLowerCase().includes(q)
        })
        .sort((a, b) => b.at.localeCompare(a.at)),
    [state.trustEvents, state.borrowers, reason, query],
  )

  const flagged = state.trustEvents.filter((e) => e.flagged)
  const avg = state.borrowers.reduce((s, b) => s + b.trustScore, 0) / state.borrowers.length
  const upgrades = state.trustEvents.filter((e) => e.delta > 0).length

  const columns: Column<TrustScoreEvent>[] = [
    {
      key: 'when',
      header: 'When',
      sortValue: (e) => e.at,
      render: (e) => <span className="text-ink-muted">{dateTime(e.at)}</span>,
    },
    {
      key: 'borrower',
      header: 'Borrower',
      sortValue: (e) => state.borrowers.find((b) => b.id === e.borrowerId)?.name ?? '',
      render: (e) => {
        const borrower = state.borrowers.find((b) => b.id === e.borrowerId)
        return <PersonCell name={borrower?.name ?? '—'} meta={borrower?.businessName} />
      },
    },
    {
      key: 'delta',
      hideBelow: 'xl',
      header: 'Change',
      align: 'right',
      sortValue: (e) => e.delta,
      render: (e) => (
        <span className={cn('tnum font-semibold', e.delta >= 0 ? 'text-emerald-700' : 'text-overdue')}>
          {e.delta > 0 ? '+' : ''}{e.delta}
        </span>
      ),
    },
    {
      key: 'reason',
      hideBelow: 'xl',
      header: 'Reason',
      render: (e) => <span className="text-ink">{e.reason}</span>,
    },
    {
      key: 'after',
      hideBelow: 'xl',
      header: 'Score after',
      align: 'right',
      sortValue: (e) => e.scoreAfter,
      render: (e) => (
        <span className="flex items-center justify-end gap-2">
          <span className="tnum text-ink">{e.scoreAfter}</span>
          <Tag>{tierForScore(e.scoreAfter)}</Tag>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Review',
      render: (e) =>
        e.flagged ? (
          <StatusPill tone="overdue">anomaly</StatusPill>
        ) : e.reviewed ? (
          <StatusPill tone="positive">reviewed</StatusPill>
        ) : (
          <span className="text-[12px] text-ink-subtle">automatic</span>
        ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (e) =>
        e.flagged ? (
          <Button
            size="sm"
            onClick={() => {
              dispatch({ type: 'REVIEW_TRUST_EVENT', eventId: e.id })
              toast.push({ title: 'Change reviewed', description: 'The anomaly is cleared and the event is marked reviewed.', tone: 'positive' })
            }}
          >
            Review
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="Trust score oversight"
        description="Every score change across the platform, with its reason. Anomalies are surfaced for manual review before they affect lending decisions."
      />

      <div className="grid grid-cols-2 gap-3 border-y border-line bg-surface py-1 lg:grid-cols-4">
        <Kpi label="Average score" value={String(Math.round(avg))} unit="/ 100" hint="Across all borrowers" tone="positive" />
        <Kpi label="Flagged anomalies" value={String(flagged.length)} hint="Awaiting manual review" tone="overdue" emphasis />
        <Kpi label="Events logged" value={String(state.trustEvents.length)} hint="Full audit trail" />
        <Kpi label="Positive changes" value={String(upgrades)} hint="Repayments and completed loans" tone="pool" />
      </div>

      {flagged.length > 0 ? (
        <Panel className="mt-4 border-[#efcbc5]">
          <PanelHeader
            title="Anomalies to review"
            meta="Negative changes that crossed the automatic threshold"
            action={<span className="tnum text-[12px] font-medium text-overdue">{flagged.length}</span>}
          />
          <ul className="divide-y divide-line">
            {flagged.slice(0, 4).map((e) => {
              const borrower = state.borrowers.find((b) => b.id === e.borrowerId)
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{borrower?.name} <span className="font-normal text-overdue">({e.delta})</span></p>
                    <p className="text-[12px] text-ink-muted">{e.reason} · {shortDate(e.at)}</p>
                  </div>
                  <span className="tnum text-[12.5px] text-ink-muted">score {e.scoreAfter}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      dispatch({ type: 'REVIEW_TRUST_EVENT', eventId: e.id })
                      toast.push({ title: 'Anomaly reviewed', description: 'The event is cleared and recorded.', tone: 'positive' })
                    }}
                  >
                    Mark reviewed
                  </Button>
                </li>
              )
            })}
          </ul>
        </Panel>
      ) : null}

      <div className="mt-4">
        <Panel>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <div className="w-full sm:w-[220px]">
              <Select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Filter by reason">
                <option value="all">All reasons</option>
                {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </div>
            <div className="w-full sm:ml-auto sm:w-[300px]">
              <SearchInput value={query} onChange={setQuery} placeholder="Search borrower or reason…" />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={events}
            getRowId={(e) => e.id}
            emptyState={<EmptyState title="No score changes" description="Adjust the filters or wait for the next repayment event." />}
          />
        </Panel>
      </div>

      <p className="mt-4 text-[11.5px] text-ink-subtle">
        Rules: on-time repayment +4 · full repayment +7 · missed instalment −8 · manual review ±3.
        Scores of 50 / 70 / 85 move a borrower to Trusted / Established / Elite.
      </p>
    </>
  )
}
