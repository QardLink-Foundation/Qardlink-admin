import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStore } from '../../lib/store'
import { useToast } from '../../components/ui/toast'
import { cohortRepayment, partnerPerformance, platformMetrics, poolMetrics, tierDistribution } from '../../lib/metrics'
import { moneyCompact, percent } from '../../lib/format'
import { TIERS } from '../../lib/types'
import { PageHeader, Panel, PanelHeader, Kpi } from '../../components/ui/card'
import { ChartTooltip } from '../../components/ui/chart'
import { Button } from '../../components/ui/button'
import { Select } from '../../components/ui/field'
import { Icon } from '../../components/icons'

const tierColors: Record<string, string> = {
  New: '#CFDAD2',
  Trusted: '#74B7A3',
  Established: '#1F8266',
  Elite: '#083D2E',
}

export function Analytics() {
  const { state } = useStore()
  const toast = useToast()
  const [reportWindow, setReportWindow] = useState('6')
  const metrics = platformMetrics(state)
  const pool = poolMetrics(state)
  const tiers = tierDistribution(state)
  const cohort = cohortRepayment(state, Number(reportWindow))
  const partners = useMemo(() => partnerPerformance(state).slice(0, 6), [state])

  const tierData = TIERS.map((tier) => ({ name: tier, value: tiers[tier] }))
  const recovery = (pool.repaid / (pool.disbursed || 1)) * 100
  const avgTicket = metrics.totalDisbursed / (state.loans.filter((l) => l.status !== 'pending').length || 1)

  return (
    <>
      <PageHeader
        title="Analytics & reports"
        description="How capital recycles, which cohorts repay, and which partners bring durable borrowers."
        action={
          <>
            <div className="w-[150px]">
              <Select value={reportWindow} onChange={(e) => setReportWindow(e.target.value)} aria-label="Reporting window">
                <option value="4">Last 4 quarters</option>
                <option value="6">Last 6 quarters</option>
                <option value="8">Last 8 quarters</option>
              </Select>
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={<Icon name="download" className="size-3.5" />}
              onClick={() => toast.push({ title: 'Report queued', description: 'Analytics summary is being prepared.', tone: 'info' })}
            >
              Export
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Repayment rate" value={percent(metrics.repaymentRate)} hint="Closed loans fully repaid" tone="positive" delta={{ value: '1.8%', direction: 'up' }} />
        <Kpi label="Repayment recovery" value={percent(recovery, 0)} hint="Repayments vs capital disbursed" tone="pool" />
        <Kpi label="Average ticket" value={moneyCompact(avgTicket)} hint="Per disbursed loan" />
        <Kpi label="Written off" value={moneyCompact(pool.writtenOff)} hint={`${metrics.writtenOff} loans`} tone="overdue" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Cohort repayment rate" meta="Share of each quarterly cohort on track or fully repaid" />
          <div className="px-2 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={250}>
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
          <PanelHeader title="Borrower tiers" meta={`${state.borrowers.length} borrowers`} />
          <div className="relative flex items-center justify-center px-4 py-2">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={tierData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={86}
                  paddingAngle={2}
                  stroke="none"
                >
                  {tierData.map((entry) => (
                    <Cell key={entry.name} fill={tierColors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip format={(v) => `${v} borrowers`} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="tnum text-[22px] font-semibold text-ink">{Math.round(metrics.avgTrust)}</p>
              <p className="text-[10.5px] text-ink-subtle">avg score</p>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-4 pb-4">
            {tierData.map((tier) => (
              <li key={tier.name} className="flex items-center gap-1.5 text-[12px]">
                <span className="size-2 rounded-full" style={{ background: tierColors[tier.name] }} />
                <span className="text-ink-muted">{tier.name}</span>
                <span className="tnum ml-auto text-ink">{tier.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Partner performance" meta="On-time repayment among referred loans" />
          <div className="px-2 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={partners} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="#E2E9E3" strokeDasharray="2 4" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#8A978F' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="org" width={130} tick={{ fontSize: 11, fill: '#5C6B62' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip format={(v) => `${v}%`} />} cursor={{ fill: '#0B6B4F', fillOpacity: 0.04 }} />
                <Bar isAnimationActive={false} dataKey="onTimeRate" name="On-time rate" fill="#0B6B4F" radius={[0, 2, 2, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Partner contribution" meta="Capital committed to the pool" />
          <div className="px-2 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={partners} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="#E2E9E3" strokeDasharray="2 4" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8A978F' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${Math.round(v / 1_000_000)}m`} />
                <YAxis type="category" dataKey="org" width={130} tick={{ fontSize: 11, fill: '#5C6B62' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip format={(v) => moneyCompact(v)} />} cursor={{ fill: '#0E7490', fillOpacity: 0.05 }} />
                <Bar isAnimationActive={false} dataKey="contributed" name="Contributed" fill="#0E7490" radius={[0, 2, 2, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelHeader title="Cohort detail" meta="Loans issued per quarter and how they resolved" />
        <div className="grid grid-cols-2 gap-4 px-4 py-4 sm:grid-cols-3 lg:grid-cols-6">
          {cohort.map((entry) => (
            <div key={entry.month} className="rounded-md border border-line px-3 py-2.5">
              <p className="text-[11px] text-ink-subtle">{entry.month}</p>
              <p className="tnum mt-0.5 text-[18px] font-semibold text-ink">{entry.rate === null ? '—' : `${entry.rate}%`}</p>
              <p className="text-[11px] text-ink-muted">{entry.loans} loans</p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}
