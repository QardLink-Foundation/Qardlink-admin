import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { useToast } from '../../components/ui/toast'
import { partnerPerformance } from '../../lib/metrics'
import { money, moneyCompact, percent, shortDate } from '../../lib/format'
import type { Partner } from '../../lib/types'
import { PageHeader, Panel, Kpi, SectionLabel } from '../../components/ui/card'
import { DataTable, type Column } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { SearchInput, Field, Input } from '../../components/ui/field'
import { StatusPill, Tag } from '../../components/ui/badge'
import { Drawer, Modal } from '../../components/ui/overlay'
import { DefinitionList, EmptyState, PersonCell } from '../../components/ui/misc'
import { Icon } from '../../components/icons'
import { cn } from '../../lib/cn'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="tnum text-[12.5px] font-medium text-ink">{rating.toFixed(1)}</span>
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={cn('size-1.5 rounded-full', n <= Math.round(rating) ? 'bg-emerald-600' : 'bg-line-strong')}
          />
        ))}
      </span>
    </span>
  )
}

export function Partners() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [onboardOpen, setOnboardOpen] = useState(false)
  const [form, setForm] = useState({ org: '', rep: '', email: '', contributed: '', quota: '12' })
  const [formError, setFormError] = useState<string | null>(null)

  const rows = useMemo(() => {
    const list = partnerPerformance(state)
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter(
      (p) => p.org.toLowerCase().includes(q) || p.rep.toLowerCase().includes(q),
    )
  }, [state, query])

  const selected = state.partners.find((p) => p.id === selectedId) ?? null
  const selectedPerf = state.partners.find((p) => p.id === selectedId)
    ? partnerPerformance(state).find((p) => p.id === selectedId)
    : null
  const contributions = selected
    ? state.poolEvents.filter((e) => e.partnerId === selected.id).sort((a, b) => b.at.localeCompare(a.at))
    : []

  const totalReferrals = Math.max(1, state.partners.reduce((s, p) => s + p.referrals, 0))

  const columns: Column<Partner & { loans: number; onTimeRate: number }>[] = [
    {
      key: 'org',
      header: 'Partner organisation',
      sortValue: (p) => p.org,
      render: (p) => <PersonCell name={p.org} meta={p.rep} avatar={false} />,
    },
    {
      key: 'contributed',
      hideBelow: 'xl',
      header: 'Contributed',
      align: 'right',
      sortValue: (p) => p.contributed,
      render: (p) => <span className="tnum font-medium text-ink">{money(p.contributed)}</span>,
    },
    {
      key: 'referrals',
      header: 'Referrals',
      sortValue: (p) => p.referrals,
      render: (p) => (
        <span>
          <span className="tnum text-ink">
            {p.referrals}{' '}
            <span className="text-[11px] font-normal text-ink-subtle">
              · {Math.round((p.referrals / totalReferrals) * 100)}%
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'loans',
      hideBelow: 'xl',
      header: 'Active loans',
      align: 'right',
      sortValue: (p) => p.loans,
      render: (p) => <span className="tnum text-ink">{p.loans}</span>,
    },
    {
      key: 'quality',
      hideBelow: 'xl',
      header: 'Referral quality',
      sortValue: (p) => p.qualityRating,
      render: (p) => <Stars rating={p.qualityRating} />,
    },
    {
      key: 'onTime',
      hideBelow: 'xl',
      header: 'On-time',
      align: 'right',
      render: (p) => <span className="tnum text-ink-muted">{p.loans === 0 ? '—' : percent(p.onTimeRate, 0)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <StatusPill tone={p.status === 'active' ? 'positive' : p.status === 'paused' ? 'due' : 'overdue'}>
          {p.status}
        </StatusPill>
      ),
    },
  ]

  function onboard() {
    const contributed = Number(form.contributed.replace(/[^0-9]/g, ''))
    if (form.org.trim().length < 3) return setFormError('Enter the partner organisation name.')
    if (!form.rep.trim()) return setFormError('Enter the authorised representative.')
    if (!form.email.includes('@')) return setFormError('Enter a valid contact email.')
    if (!contributed || contributed < 100_000) return setFormError('Contribution must be at least ₦100,000.')
    dispatch({
      type: 'ONBOARD_PARTNER',
      org: form.org.trim(),
      rep: form.rep.trim(),
      email: form.email.trim(),
      contributed,
      quota: Math.max(1, Number(form.quota) || 12),
    })
    toast.push({
      title: 'Partner onboarded',
      description: `${form.org.trim()} contributed ${money(contributed)} to the pool.`,
      tone: 'positive',
    })
    setOnboardOpen(false)
    setForm({ org: '', rep: '', email: '', contributed: '', quota: '12' })
    setFormError(null)
  }

  return (
    <>
      <PageHeader
        title="Partner management"
        description="The organisations that capitalise the pool and refer borrowers. Contribution history, referral quality, and account state live here."
        action={
          <Button variant="primary" size="sm" icon={<Icon name="plus" className="size-3.5" />} onClick={() => setOnboardOpen(true)}>
            Onboard partner
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Active partners" value={String(state.partners.filter((p) => p.status === 'active').length)} hint={`${state.partners.length} total`} tone="positive" />
        <Kpi label="Total contributed" value={moneyCompact(state.partners.reduce((s, p) => s + p.contributed, 0))} hint="Across all partners" />
        <Kpi label="Referrals" value={String(state.partners.reduce((s, p) => s + p.referrals, 0))} hint="Borrowers introduced" />
        <Kpi label="Average quality" value={(state.partners.reduce((s, p) => s + p.qualityRating, 0) / state.partners.length).toFixed(1)} unit="/ 5" hint="Referral quality rating" tone="pool" />
      </div>

      <div className="mt-4">
        <Panel>
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="text-[12.5px] text-ink-muted">{rows.length} partner organisations</p>
            <div className="w-full sm:w-[280px]">
              <SearchInput value={query} onChange={setQuery} placeholder="Search partner or representative…" />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(p) => p.id}
            onRowClick={(p) => setSelectedId(p.id)}
            selectedId={selectedId ?? undefined}
            emptyState={<EmptyState title="No partners match" description="Try another name, or onboard a new partner organisation." />}
            mobileCard={(p) => (
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <PersonCell name={p.org} meta={p.rep} avatar={false} />
                  <StatusPill tone={p.status === 'active' ? 'positive' : p.status === 'paused' ? 'due' : 'overdue'}>
                    {p.status}
                  </StatusPill>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11.5px] text-ink-subtle">
                  <span className="tnum font-medium text-ink">{moneyCompact(p.contributed)} contributed</span>
                  <span>{p.referrals} referrals · {p.loans} active</span>
                </div>
              </div>
            )}
          />
        </Panel>
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.org ?? ''}
        meta={selected ? <span className="flex items-center gap-2"><StatusPill tone={selected.status === 'active' ? 'positive' : 'overdue'}>{selected.status}</StatusPill><span>Joined {shortDate(selected.joinedAt)}</span></span> : null}
        footer={
          selected ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>
              {selected.status === 'active' ? (
                <Button
                  variant="danger"
                  onClick={() => {
                    dispatch({ type: 'SET_PARTNER_STATUS', partnerId: selected.id, status: 'suspended' })
                    toast.push({ title: 'Partner suspended', description: `${selected.org} can no longer refer or contribute.` })
                  }}
                >
                  Suspend partner
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    dispatch({ type: 'SET_PARTNER_STATUS', partnerId: selected.id, status: 'active' })
                    toast.push({ title: 'Partner restored', description: `${selected.org} is active again.`, tone: 'positive' })
                  }}
                >
                  Restore partner
                </Button>
              )}
            </>
          ) : null
        }
      >
        {selected && selectedPerf ? (
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-line bg-canvas/50 p-4">
              <p className="text-[13px] font-medium text-ink">{selected.rep}</p>
              <p className="text-[12px] text-ink-muted">{selected.email} · {selected.phone}</p>
              <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
                <div>
                  <p className="text-[11px] text-ink-subtle">Contributed</p>
                  <p className="tnum text-[14px] font-medium text-ink">{moneyCompact(selected.contributed)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-subtle">Referrals</p>
                  <p className="tnum text-[14px] font-medium text-ink">{selected.referrals}</p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-subtle">On-time</p>
                  <p className="tnum text-[14px] font-medium text-ink">{selectedPerf.loans === 0 ? '—' : percent(selectedPerf.onTimeRate, 0)}</p>
                </div>
              </div>
            </div>

            <div>
              <SectionLabel>Account</SectionLabel>
              <div className="mt-2">
                <DefinitionList
                  items={[
                    { label: 'Referral quota', value: `${selected.referrals} of ${selected.referralQuota} used` },
                    { label: 'Active loans', value: String(selectedPerf.loans) },
                    { label: 'Overdue loans', value: <span className={selectedPerf.overdue > 0 ? 'text-overdue' : ''}>{selectedPerf.overdue}</span> },
                    { label: 'Quality rating', value: <Stars rating={selected.qualityRating} /> },
                    { label: 'Sub-account', value: <span className="tnum">{money(selected.subAccountBalance)}</span> },
                    { label: 'Status', value: <Tag>{selected.status}</Tag> },
                  ]}
                />
              </div>
            </div>

            <div>
              <SectionLabel>Contribution history</SectionLabel>
              <ul className="mt-2 divide-y divide-line rounded-md border border-line">
                {contributions.length === 0 ? (
                  <li className="px-3 py-4 text-[12.5px] text-ink-subtle">No contributions recorded.</li>
                ) : (
                  contributions.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div>
                        <p className="text-[12.5px] text-ink">{c.note}</p>
                        <p className="text-[11px] text-ink-subtle">{shortDate(c.at)} · 75 / 25 split</p>
                      </div>
                      <span className="tnum text-[12.5px] font-medium text-ink">{money(c.amount)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <p className="rounded-md bg-canvas px-3 py-2 text-[12px] text-ink-muted">
              Suspending a partner stops new referrals and contributions but preserves their existing
              borrowers and sub-account.
            </p>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={onboardOpen}
        onClose={() => setOnboardOpen(false)}
        title="Onboard a partner"
        description="The contribution is split 75 / 25 into the lending and operational pools."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOnboardOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={onboard}>Create partner account</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Organisation name" htmlFor="org">
              <Input id="org" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} placeholder="e.g. Ihsan Cooperative" />
            </Field>
          </div>
          <Field label="Representative" htmlFor="rep">
            <Input id="rep" value={form.rep} onChange={(e) => setForm({ ...form, rep: e.target.value })} placeholder="Full name" />
          </Field>
          <Field label="Contact email" htmlFor="pemail">
            <Input id="pemail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@org.ng" />
          </Field>
          <Field label="Opening contribution (₦)" htmlFor="contributed">
            <Input id="contributed" inputMode="numeric" value={form.contributed} onChange={(e) => setForm({ ...form, contributed: e.target.value })} placeholder="5,000,000" />
          </Field>
          <Field label="Referral quota" htmlFor="quota">
            <Input id="quota" inputMode="numeric" value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} />
          </Field>
        </div>
        {formError ? <p role="alert" className="mt-3 text-[12px] text-overdue">{formError}</p> : null}
      </Modal>
    </>
  )
}
