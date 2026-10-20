import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../../lib/store'
import { useToast } from '../../components/ui/toast'
import { dateTime, relative } from '../../lib/format'
import { PageHeader, Panel, PanelHeader, Kpi, SectionLabel } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { StatusPill, Tag } from '../../components/ui/badge'
import { ChartTooltip } from '../../components/ui/chart'
import { Icon } from '../../components/icons'

interface LogEntry {
  id: string
  level: 'error' | 'warn' | 'info'
  service: string
  message: string
  at: string
  count: number
}

const logs: LogEntry[] = [
  { id: 'e1', level: 'error', service: 'webhooks', message: 'Paystack settlement returned 502 after 30s timeout', at: new Date(Date.now() - 22 * 60000).toISOString(), count: 3 },
  { id: 'e2', level: 'warn', service: 'queue', message: 'Notification worker backlog exceeded 1,000 jobs', at: new Date(Date.now() - 95 * 60000).toISOString(), count: 1 },
  { id: 'e3', level: 'warn', service: 'sms', message: 'SMS gateway delivery receipts delayed by 4m 12s', at: new Date(Date.now() - 3.2 * 3600000).toISOString(), count: 12 },
  { id: 'e4', level: 'info', service: 'deploy', message: 'Release 2026.10.18-2 deployed to production', at: new Date(Date.now() - 38 * 3600000).toISOString(), count: 1 },
]

export function System() {
  const { state } = useStore()
  const toast = useToast()
  const [retried, setRetried] = useState<string[]>([])
  const system = state.system

  const uptime = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        day: `D${i + 1}`,
        value: 99.9 + Math.sin(i * 0.7) * 0.05 + (i === 18 ? -0.22 : 0),
      })),
    [],
  )

  return (
    <>
      <PageHeader
        title="System overview"
        description="Platform health for the engineering team. Uptime, errors, webhook delivery and queue depth — no financial data on this surface."
        action={
          <Button size="sm" icon={<Icon name="refresh" className="size-3.5" />} onClick={() => toast.push({ title: 'Metrics refreshed', description: 'Latest health snapshot loaded.', tone: 'info' })}>
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Uptime (30d)" value={`${system.uptimePct}%`} hint="Target 99.95%" tone="positive" />
        <Kpi label="Error rate" value={`${system.errorRate}%`} hint="5xx responses" tone="due" />
        <Kpi label="p95 latency" value={`${system.p95LatencyMs}ms`} hint="API responses" tone="pool" />
        <Kpi label="Queue depth" value={String(system.queueDepth)} hint="Background jobs" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Uptime" meta="Last 30 days · one dip on day 19" />
          <div className="px-2 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={uptime} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E2E9E3" strokeDasharray="2 4" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8A978F' }} axisLine={false} tickLine={false} interval={4} dy={6} />
                <YAxis domain={[99.4, 100]} tick={{ fontSize: 11, fill: '#8A978F' }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<ChartTooltip format={(v) => `${v.toFixed(2)}%`} />} cursor={{ stroke: '#CFDAD2' }} />
                <Area isAnimationActive={false} type="monotone" dataKey="value" name="Uptime" stroke="#0B6B4F" strokeWidth={1.8} fill="#0B6B4F" fillOpacity={0.06} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Environment" />
          <div className="flex flex-col gap-3 px-4 py-4 text-[12.5px]">
            <Row label="Deploy" value={relative(system.lastDeploy)} />
            <Row label="Region" value="eu-west-1" />
            <Row label="API version" value="v2.14.0" />
            <Row label="Feature flags" value="4 active" />
            <div className="border-t border-line pt-3">
              <SectionLabel>Recent incidents</SectionLabel>
              <ul className="mt-2 flex flex-col gap-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-due" />
                  <div>
                    <p className="text-ink">SMS receipts delayed</p>
                    <p className="text-[11.5px] text-ink-subtle">Degraded · 3h ago</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 rounded-full bg-emerald-600" />
                  <div>
                    <p className="text-ink">Webhook retries recovered</p>
                    <p className="text-[11.5px] text-ink-subtle">Resolved · yesterday</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Webhook delivery" meta="Endpoints and their recent success rate" />
          <ul className="divide-y divide-line">
            {system.webhooks.map((hook) => {
              const healthy = hook.status === 'healthy' || retried.includes(hook.id)
              return (
                <li key={hook.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">{hook.name}</p>
                      <p className="truncate text-[11.5px] text-ink-subtle">{hook.url}</p>
                    </div>
                    <StatusPill tone={healthy ? 'positive' : hook.status === 'degraded' ? 'due' : 'overdue'}>
                      {retried.includes(hook.id) ? 'healthy' : hook.status}
                    </StatusPill>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <div className={healthy ? 'h-full bg-emerald-600' : 'h-full bg-due'} style={{ width: `${hook.deliveryPct}%` }} />
                    </div>
                    <span className="tnum text-[11.5px] text-ink-muted">{hook.deliveryPct}%</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={healthy}
                      onClick={() => {
                        setRetried((prev) => [...prev, hook.id])
                        toast.push({ title: 'Endpoint re-synced', description: `${hook.name} is delivering again.`, tone: 'positive' })
                      }}
                    >
                      Re-sync
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-subtle">Last delivery {relative(hook.lastDelivery)}</p>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Error log" meta="Grouped by message · last 48 hours" />
          <ul className="divide-y divide-line">
            {logs.map((log) => (
              <li key={log.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <StatusPill tone={log.level === 'error' ? 'overdue' : log.level === 'warn' ? 'due' : 'neutral'}>
                    {log.level}
                  </StatusPill>
                  <Tag>{log.service}</Tag>
                  <span className="tnum ml-auto text-[11px] text-ink-subtle">{relative(log.at)}</span>
                </div>
                <p className="mt-1.5 text-[12.5px] text-ink">{log.message}</p>
                <p className="mt-0.5 text-[11px] text-ink-subtle">
                  {log.count} occurrence{log.count === 1 ? '' : 's'} · first seen {dateTime(log.at)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="tnum font-medium text-ink">{value}</span>
    </div>
  )
}
