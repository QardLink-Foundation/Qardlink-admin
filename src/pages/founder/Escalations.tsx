import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { useToast } from '../../components/ui/toast'
import { getReferrer, platformMetrics } from '../../lib/metrics'
import { money, moneyCompact, relative, shortDate } from '../../lib/format'
import { PageHeader, Panel, PanelHeader, Kpi, SectionLabel } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { StatusPill, Tag } from '../../components/ui/badge'
import { EmptyState, PersonCell, Timeline } from '../../components/ui/misc'
import { Icon } from '../../components/icons'
import { cn } from '../../lib/cn'
import type { Escalation } from '../../lib/types'

const statusLabel: Record<Escalation['status'], string> = {
  open: 'Open',
  contacted: 'Referrer contacted',
  resolved: 'Resolved',
}

const statusTone: Record<Escalation['status'], 'overdue' | 'due' | 'positive'> = {
  open: 'overdue',
  contacted: 'due',
  resolved: 'positive',
}

export function Escalations() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'active' | 'resolved'>('active')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const metrics = platformMetrics(state)

  const list = useMemo(
    () =>
      state.escalations
        .filter((e) => (tab === 'active' ? e.status !== 'resolved' : e.status === 'resolved'))
        .sort((a, b) => b.daysOverdue - a.daysOverdue),
    [state.escalations, tab],
  )

  const selected = list.find((e) => e.id === selectedId) ?? list[0] ?? null
  const borrower = selected ? state.borrowers.find((b) => b.id === selected.borrowerId) : null
  const loan = selected ? state.loans.find((l) => l.id === selected.loanId) : null
  const referrer = selected ? getReferrer(state, loan?.referrerId ?? '') : null

  return (
    <>
      <PageHeader
        title="Escalation center"
        description="Missed payments that need a human decision. The referrer is your first lever — they know the borrower and carry the relationship."
      />

      <div className="grid grid-cols-2 gap-3 border-y border-line bg-surface py-1 lg:grid-cols-4">
        <Kpi label="Open escalations" value={String(metrics.openEscalations)} hint="Across all borrowers" tone="overdue" emphasis />
        <Kpi label="Overdue value" value={moneyCompact(state.escalations.filter((e) => e.status !== 'resolved').reduce((s, e) => s + e.amountOverdue, 0))} hint="At risk in the pool" />
        <Kpi label="Referrers contacted" value={String(state.escalations.filter((e) => e.referrerContactedAt).length)} hint="Awaiting commitments" tone="due" />
        <Kpi label="Resolved" value={String(state.escalations.filter((e) => e.status === 'resolved').length)} hint="This cycle" tone="positive" />
      </div>

      <div className="mt-4 flex items-center gap-1 border-b border-line">
        {(['active', 'resolved'] as const).map((value) => (
          <button
            key={value}
            onClick={() => { setTab(value); setSelectedId(null) }}
            className={cn(
              'relative -mb-px border-b-2 px-3 py-2 text-[13px] font-medium capitalize',
              tab === value ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {value}
            <span className="tnum ml-1.5 text-[11px] text-ink-subtle">
              {value === 'active'
                ? state.escalations.filter((e) => e.status !== 'resolved').length
                : state.escalations.filter((e) => e.status === 'resolved').length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-2.5">
          {list.length === 0 ? (
            <Panel>
              <EmptyState
                title={tab === 'active' ? 'Nothing is overdue' : 'No resolved escalations'}
                description={tab === 'active' ? 'Every active loan is on schedule. Escalations appear here the moment an instalment is missed.' : 'Resolved cases will collect here as a record of how they were closed.'}
              />
            </Panel>
          ) : (
            list.map((esc) => {
              const b = state.borrowers.find((x) => x.id === esc.borrowerId)
              const active = selected?.id === esc.id
              return (
                <button
                  key={esc.id}
                  onClick={() => setSelectedId(esc.id)}
                  className={cn(
                    'rounded-lg border bg-surface px-4 py-3 text-left transition-colors',
                    active ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-line hover:border-emerald-300',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <PersonCell name={b?.name ?? esc.borrowerId} meta={`${b?.businessName} · ${esc.loanId}`} />
                    <div className="text-right">
                      <p className="tnum text-[16px] font-semibold text-overdue">{esc.daysOverdue}d</p>
                      <p className="text-[10.5px] text-ink-subtle">overdue</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
                    <StatusPill tone={statusTone[esc.status]}>{statusLabel[esc.status]}</StatusPill>
                    <span className="tnum text-[12px] text-ink-muted">{money(esc.amountOverdue)} overdue</span>
                    <span className="text-[11.5px] text-ink-subtle">Opened {relative(esc.openedAt)}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {selected && borrower ? (
          <Panel className="h-fit lg:sticky lg:top-[72px]">
            <PanelHeader title="Case detail" meta={`${selected.id} · opened ${shortDate(selected.openedAt)}`} />
            <div className="flex flex-col gap-4 px-4 py-4">
              <div className="rounded-md border border-[#efcbc5] bg-overdue-soft px-3 py-2.5">
                <p className="text-[11px] font-medium tracking-[0.04em] text-overdue uppercase">Recommended action</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{selected.recommendedAction}</p>
              </div>

              <div>
                <SectionLabel>Borrower</SectionLabel>
                <div className="mt-1.5 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-ink">{borrower.name}</p>
                    <p className="text-[12px] text-ink-muted">{borrower.businessName}</p>
                  </div>
                  <Tag>{borrower.tier} · {borrower.trustScore}</Tag>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[12px] text-ink-muted">
                  <span className="inline-flex items-center gap-1"><Icon name="phone" className="size-3.5" /> {borrower.phone}</span>
                  <span className="inline-flex items-center gap-1"><Icon name="mail" className="size-3.5" /> {borrower.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-md bg-canvas px-3 py-2.5">
                <div>
                  <p className="text-[11px] text-ink-subtle">Loan</p>
                  <p className="tnum text-[12.5px] font-medium text-ink">{selected.loanId}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-subtle">Outstanding</p>
                  <p className="tnum text-[12.5px] font-medium text-ink">{money(loan?.outstanding ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-subtle">Overdue amount</p>
                  <p className="tnum text-[12.5px] font-medium text-overdue">{money(selected.amountOverdue)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-subtle">Days overdue</p>
                  <p className="tnum text-[12.5px] font-medium text-overdue">{selected.daysOverdue}</p>
                </div>
              </div>

              <div>
                <SectionLabel>Referrer</SectionLabel>
                <p className="mt-1 text-[12.5px] text-ink">{referrer?.name}</p>
                <p className="text-[11.5px] text-ink-subtle capitalize">{referrer?.kind}</p>
                {selected.referrerContactedAt ? (
                  <p className="mt-1 text-[11.5px] text-emerald-700">Contacted {relative(selected.referrerContactedAt)}</p>
                ) : (
                  <p className="mt-1 text-[11.5px] text-due">Not contacted yet</p>
                )}
              </div>

              <div>
                <SectionLabel>Resolution log</SectionLabel>
                {selected.notes.length === 0 ? (
                  <p className="mt-1.5 text-[12px] text-ink-subtle">No notes yet. Contact the referrer to start the log.</p>
                ) : (
                  <div className="mt-2">
                    <Timeline
                      entries={selected.notes.map((n, i) => ({
                        id: String(i),
                        title: n.by,
                        detail: n.text,
                        when: relative(n.at),
                        tone: 'neutral',
                      }))}
                    />
                  </div>
                )}
              </div>

              {selected.status !== 'resolved' ? (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={selected.status === 'contacted'}
                    onClick={() => {
                      dispatch({ type: 'CONTACT_REFERRER', escalationId: selected.id, by: 'Amina Yusuf' })
                      toast.push({ title: 'Referrer contacted', description: `${referrer?.name} has been asked to reach ${borrower.name}.`, tone: 'info' })
                    }}
                  >
                    {selected.status === 'contacted' ? 'Referrer contacted' : 'Mark referrer contacted'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      dispatch({ type: 'RESOLVE_ESCALATION', escalationId: selected.id, by: 'Amina Yusuf' })
                      toast.push({ title: 'Escalation resolved', description: 'The case is closed and the resolution is logged.', tone: 'positive' })
                    }}
                  >
                    Close escalation
                  </Button>
                </div>
              ) : (
                <p className="rounded-md bg-positive-soft px-3 py-2 text-[12px] text-emerald-800">
                  This case is resolved. The log is preserved for audit.
                </p>
              )}
            </div>
          </Panel>
        ) : null}
      </div>
    </>
  )
}
