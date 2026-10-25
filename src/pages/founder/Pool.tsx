import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../../lib/store'
import { monthlyPoolFlow, poolMetrics } from '../../lib/metrics'
import { money, moneyCompact, percent, shortDate } from '../../lib/format'
import type { PoolEvent, PoolEventType } from '../../lib/types'
import { PageHeader, Panel, PanelHeader, Kpi, SectionLabel } from '../../components/ui/card'
import { DataTable, type Column } from '../../components/ui/table'
import { Select } from '../../components/ui/field'
import { StatusPill } from '../../components/ui/badge'
import { ChartTooltip } from '../../components/ui/chart'
import { SplitBar } from '../../components/ui/misc'

const typeLabel: Record<PoolEventType, string> = {
  contribution: 'Contribution',
  disbursement: 'Disbursement',
  repayment: 'Repayment',
  allocation: 'Allocation',
  write_off: 'Write-off',
}

const typeTone: Record<PoolEventType, 'positive' | 'pool' | 'due' | 'overdue' | 'neutral'> = {
  contribution: 'positive',
  disbursement: 'pool',
  repayment: 'positive',
  allocation: 'neutral',
  write_off: 'overdue',
}

export function Pool() {
  const { state } = useStore()
  const pool = poolMetrics(state)
  const flow = monthlyPoolFlow(state)
  const [type, setType] = useState<'all' | PoolEventType>('all')
  const [partner, setPartner] = useState('all')

  const events = useMemo(
    () =>
      state.poolEvents
        .filter((e) => (type === 'all' ? true : e.type === type))
        .filter((e) => (partner === 'all' ? true : e.partnerId === partner))
        .sort((a, b) => b.at.localeCompare(a.at)),
    [state.poolEvents, type, partner],
  )

  const partners = state.partners

  const columns: Column<PoolEvent>[] = [
    {
      key: 'date',
      header: 'Date',
      sortValue: (e) => e.at,
      render: (e) => <span className="text-ink-muted">{shortDate(e.at)}</span>,
    },
    {
      key: 'type',
      header: 'Entry',
      sortValue: (e) => e.type,
      render: (e) => <StatusPill tone={typeTone[e.type]}>{typeLabel[e.type]}</StatusPill>,
    },
    {
      key: 'note',
      hideBelow: 'sm',
      header: 'Description',
      render: (e) => <span className="text-ink">{e.note}</span>,
    },
    {
      key: 'partner',
      hideBelow: 'xl',
      header: 'Partner',
      render: (e) => (
        <span className="text-ink-muted">
          {e.partnerId ? (partners.find((p) => p.id === e.partnerId)?.org ?? '—') : '—'}
        </span>
      ),
    },
    {
      key: 'split',
      hideBelow: 'xl',
      header: 'Split',
      align: 'right',
      render: (e) =>
        e.lendingShare ? (
          <span className="tnum text-[12px] text-ink-muted">75 / 25</span>
        ) : (
          <span className="text-ink-subtle">—</span>
        ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortValue: (e) => e.amount,
      render: (e) => (
        <span className={e.type === 'disbursement' || e.type === 'write_off' ? 'tnum text-overdue' : 'tnum font-medium text-ink'}>
          {e.type === 'disbursement' || e.type === 'write_off' ? '−' : '+'}
          {money(e.amount)}
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Pool management"
        description="The lending and operational pools, every movement in and out, and how the 75 / 25 split is applied."
        finding={`${moneyCompact(pool.lending)} is available in the lending pool; ${moneyCompact(pool.operational)} is held for operations.`}
      />

      <div className="grid grid-cols-2 gap-3 border-y border-line bg-surface py-1 lg:grid-cols-4">
        <Kpi label="Total balance" value={moneyCompact(pool.total)} hint="Lending + operational" tone="positive" emphasis />
        <Kpi label="Lending pool" value={moneyCompact(pool.lending)} hint="Capital available to lend" />
        <Kpi label="Operational pool" value={moneyCompact(pool.operational)} hint="25% of every inflow" tone="pool" />
        <Kpi label="Recycled capital" value={moneyCompact(pool.repaid)} hint={`${percent((pool.repaid / (pool.contributed || 1)) * 100)} of contributions`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Inflows and outflows" meta="Last six months, in naira" />
          <div className="px-2 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={flow} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="#E2E9E3" strokeDasharray="2 4" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8A978F' }} axisLine={false} tickLine={false} dy={6} />
                <YAxis tick={{ fontSize: 11, fill: '#8A978F' }} axisLine={false} tickLine={false} width={54} tickFormatter={(v) => moneyCompact(v)} />
                <Tooltip content={<ChartTooltip format={(v) => money(v)} />} cursor={{ fill: '#0B6B4F', fillOpacity: 0.04 }} />
                <Bar isAnimationActive={false} dataKey="contributions" name="Contributions" fill="#0B6B4F" radius={[2, 2, 0, 0]} maxBarSize={18} />
                <Bar isAnimationActive={false} dataKey="repayments" name="Repayments" fill="#0E7490" radius={[2, 2, 0, 0]} maxBarSize={18} />
                <Bar isAnimationActive={false} dataKey="disbursements" name="Disbursements" fill="#B45309" radius={[2, 2, 0, 0]} maxBarSize={18} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="The 75 / 25 split" meta="Current balance · 75/25 applied to every inflow" />
          <div className="flex flex-col gap-4 px-4 py-4">
            <SplitBar lending={pool.lending} operational={pool.operational} />
            <div className="flex flex-col gap-2.5 border-t border-line pt-3">
              <Row label="Contributed by partners" value={money(pool.contributed)} />
              <Row label="Recycled from repayments" value={money(pool.repaid)} />
              <Row label="Disbursed to borrowers" value={`− ${money(pool.disbursed)}`} />
              <Row label="Written off" value={`− ${money(pool.writtenOff)}`} />
              <div className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="text-[12.5px] font-medium text-ink">Reconciled balance</span>
                <span className="tnum text-[13px] font-semibold text-emerald-800">{money(pool.total)}</span>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel>
          <PanelHeader title="Ledger" meta={`${events.length} entries`} />
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <div className="w-full sm:w-[170px]">
              <Select value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label="Filter entry type">
                <option value="all">All entries</option>
                {Object.entries(typeLabel).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value={partner} onChange={(e) => setPartner(e.target.value)} aria-label="Filter by partner">
                <option value="all">All partners</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.org}</option>
                ))}
              </Select>
            </div>
          </div>
          <DataTable columns={columns} rows={events} getRowId={(e) => e.id} dense stickyHeader={false} />
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelHeader title="Partner sub-accounts" meta="Each partner's 25% operational share is tracked separately" />
        <DataTable
          columns={[
            { key: 'org', header: 'Partner', render: (p) => <span className="font-medium text-ink">{p.org}</span> },
            { key: 'contributed', header: 'Contributed', align: 'right', sortValue: (p) => p.contributed, render: (p) => <span className="tnum">{money(p.contributed)}</span> },
            { key: 'sub', header: 'Sub-account', align: 'right', sortValue: (p) => p.subAccountBalance, render: (p) => <span className="tnum">{money(p.subAccountBalance)}</span> },
            { key: 'share', header: 'Share of pool', align: 'right', render: (p) => <span className="tnum text-ink-muted">{percent((p.contributed / (pool.contributed || 1)) * 100)}</span> },
            { key: 'status', header: 'Status', render: (p) => <StatusPill tone={p.status === 'active' ? 'positive' : p.status === 'paused' ? 'due' : 'overdue'}>{p.status}</StatusPill> },
          ]}
          rows={partners}
          getRowId={(p) => p.id}
          stickyHeader={false}
        />
        <div className="px-4 py-3">
          <SectionLabel>Reconciliation</SectionLabel>
          <p className="mt-1 text-[12px] text-ink-muted">
            Sub-account balances sum to {money(partners.reduce((s, p) => s + p.subAccountBalance, 0))}. The operational
            pool is {money(pool.operational)}; the difference is undistributed operating reserve.
          </p>
        </div>
      </Panel>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12.5px]">
      <span className="text-ink-muted">{label}</span>
      <span className="tnum text-ink">{value}</span>
    </div>
  )
}
