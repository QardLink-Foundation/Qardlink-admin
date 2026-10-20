import { Link, useNavigate } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../../lib/auth'
import { useStore } from '../../lib/store'
import { useToast } from '../../components/ui/toast'
import { cohortRepayment, getReferrer, platformMetrics, poolMetrics, tierDistribution } from '../../lib/metrics'
import { money, moneyCompact, number, percent, relative, shortDate } from '../../lib/format'
import { TIERS } from '../../lib/types'
import { PageHeader, Panel, PanelHeader, SectionLabel, Kpi } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { SplitBar, TierProgress } from '../../components/ui/misc'
import { ChartTooltip } from '../../components/ui/chart'
import { StatusPill } from '../../components/ui/badge'
import { Icon } from '../../components/icons'

const TIER_COLOURS: Record<string, string> = {
  New: '#A9C2B5',
  Trusted: '#6BA38C',
  Established: '#2F8465',
  Elite: '#0B6B4F',
}

const tierColour = (tier: string) => TIER_COLOURS[tier] ?? '#0B6B4F'

export function Overview() {
  const { state, dispatch } = useStore()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const metrics = platformMetrics(state)
  const pool = poolMetrics(state)
  const tiers = tierDistribution(state)
  const cohort = cohortRepayment(state)
  const pending = state.loans.filter((l) => l.status === 'pending').slice(0, 3)
  const escalations = state.escalations
    .filter((e) => e.status !== 'resolved')
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 3)
  const partners = state.partners.filter((p) => p.status === 'active').slice(0, 3)
  const activeTierIndex = Math.max(0, TIERS.indexOf(state.borrowers[0]?.tier ?? 'New'))

  function approve(loanId: string) {
    dispatch({ type: 'APPROVE_LOAN', loanId, by: user?.name ?? 'Founder' })
    toast.push({ title: 'Loan approved', description: `${loanId} is now active and recorded in the pool.`, tone: 'positive' })
  }

  return (
    <>
      <PageHeader
        title="Admin overview"
        description={`${new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Everything that needs your attention, and the health of the pool behind it.`}
        action={
          <>
            <Button
              size="sm"
              icon={<Icon name="download" className="size-3.5" />}
              onClick={() => toast.push({ title: 'Report queued', description: 'A platform summary will be ready in your downloads.', tone: 'info' })}
            >
              Export
            </Button>
            <Button size="sm" variant="primary" icon={<Icon name="inbox" className="size-3.5" />} onClick={() => navigate('/queue')}>
              Review queue
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total pool balance" value={moneyCompact(pool.total)} hint={`${moneyCompact(pool.lending)} lending · ${moneyCompact(pool.operational)} operational`} tone="positive" delta={{ value: '4.2%', direction: 'up' }} />
        <Kpi label="Active loans" value={number(metrics.activeLoans)} hint={`${moneyCompact(metrics.outstanding)} outstanding`} />
        <Kpi label="Total disbursed" value={moneyCompact(metrics.totalDisbursed)} hint={`${number(metrics.totalBorrowers)} borrowers funded`} tone="pool" />
        <Kpi label="Repayment rate" value={percent(metrics.repaymentRate)} hint={`${metrics.overdueLoans} overdue · ${metrics.writtenOff} written off`} delta={{ value: '1.8%', direction: 'up' }} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Repayment rate by cohort"
            meta="Share of each quarterly cohort on track or fully repaid"
            action={<Link to="/analytics" className="text-[12px] font-medium text-emerald-800 hover:underline">Full analytics</Link>}
          />
          <div className="px-2 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={228}>
              <LineChart data={cohort} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E2E9E3" strokeDasharray="2 4" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8A978F' }} axisLine={false} tickLine={false} dy={6} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: '#8A978F' }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  content={
                    <ChartTooltip
                      format={(v) => `${v}%`}
                      footer={(row) =>
                        row.loans ? `${row.loans} disbursed loans in this cohort` : 'No disbursed loans yet'
                      }
                    />
                  }
                  cursor={{ stroke: '#CFDAD2' }}
                />
                <Line isAnimationActive={false} type="monotone" dataKey="rate" name="On track" stroke="#0B6B4F" strokeWidth={2} dot={{ r: 3, fill: '#0B6B4F', strokeWidth: 0 }} activeDot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Borrower trust tiers" meta={`Average score ${Math.round(metrics.avgTrust)} / 100`} />
          <div className="flex flex-col gap-3.5 px-4 py-4">
            {TIERS.map((tier) => {
              const count = tiers[tier]
              const width = Math.round((count / (state.borrowers.length || 1)) * 100)
              return (
                <div key={tier}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-ink-muted">{tier}</span>
                    <span className="tnum font-medium text-ink">{count} <span className="text-[11px] font-normal text-ink-subtle">· {width}%</span></span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: tierColour(tier) }} />
                  </div>
                </div>
              )
            })}
            <div className="mt-1 border-t border-line pt-3">
              <SectionLabel>Tier journey</SectionLabel>
              <TierProgress className="mt-2" steps={['New', 'Trusted', 'Established', 'Elite']} current={activeTierIndex} />
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Awaiting approval" meta={`${metrics.pendingApprovals} applications in the queue`} action={<Link to="/queue" className="text-[12px] font-medium text-emerald-800 hover:underline">Open queue</Link>} />
          {pending.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-ink-subtle">The queue is clear. Every application has been decided.</p>
          ) : (
            <ul className="divide-y divide-line">
              {pending.map((loan) => {
                const borrower = state.borrowers.find((b) => b.id === loan.borrowerId)
                const referrer = getReferrer(state, loan.referrerId)
                return (
                  <li key={loan.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{borrower?.name}</p>
                      <p className="truncate text-[12px] text-ink-muted">
                        {loan.purpose} · via {referrer.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tnum text-[13px] font-medium text-ink">{money(loan.amount)}</p>
                      <p className="text-[11px] text-ink-subtle">{loan.frequency} · {loan.installmentsTotal} instalments</p>
                    </div>
                    <Button size="sm" variant="primary" onClick={() => approve(loan.id)}>Approve</Button>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Escalations" meta={`${metrics.openEscalations} open`} action={<Link to="/escalations" className="text-[12px] font-medium text-emerald-800 hover:underline">All</Link>} />
          <ul className="divide-y divide-line">
            {escalations.map((esc) => {
              const borrower = state.borrowers.find((b) => b.id === esc.borrowerId)
              return (
                <li key={esc.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-medium text-ink">{borrower?.name}</p>
                    <span className="tnum shrink-0 text-[12px] font-medium text-overdue">{esc.daysOverdue}d</span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-ink-muted">
                    {money(esc.amountOverdue)} overdue · {esc.status === 'contacted' ? 'Referrer contacted' : 'Not contacted'}
                  </p>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Pool composition" meta="75 / 25 split of all inflows" action={<Link to="/pool" className="text-[12px] font-medium text-emerald-800 hover:underline">Manage</Link>} />
          <div className="flex flex-col gap-4 px-4 py-4">
            <SplitBar lending={pool.lending} operational={pool.operational} />
            <div className="grid grid-cols-3 gap-4 border-t border-line pt-3">
              <div>
                <p className="text-[11.5px] text-ink-subtle">Contributed</p>
                <p className="tnum text-[14px] font-medium text-ink">{moneyCompact(pool.contributed)}</p>
              </div>
              <div>
                <p className="text-[11.5px] text-ink-subtle">Recycled</p>
                <p className="tnum text-[14px] font-medium text-ink">{moneyCompact(pool.repaid)}</p>
              </div>
              <div>
                <p className="text-[11.5px] text-ink-subtle">Disbursed</p>
                <p className="tnum text-[14px] font-medium text-ink">{moneyCompact(pool.disbursed)}</p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Active partners" meta={`${metrics.activePartners} contributing`} action={<Link to="/partners" className="text-[12px] font-medium text-emerald-800 hover:underline">All</Link>} />
          <ul className="divide-y divide-line">
            {partners.map((partner) => (
              <li key={partner.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">{partner.org}</p>
                  <p className="text-[11.5px] text-ink-subtle">{partner.referrals} referrals · {partner.activeLoans} active</p>
                </div>
                <StatusPill tone="positive">active</StatusPill>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <p className="mt-5 text-[11.5px] text-ink-subtle">
        Last reconciled {relative(state.notifications[0]?.at ?? new Date().toISOString())} · {shortDate(new Date().toISOString())}
      </p>
    </>
  )
}
