import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { useToast } from '../../components/ui/toast'
import { notificationsByChannel } from '../../lib/metrics'
import { dateTime, relative } from '../../lib/format'
import type { NotificationRecord } from '../../lib/types'
import { PageHeader, Panel, Kpi } from '../../components/ui/card'
import { DataTable, type Column } from '../../components/ui/table'
import { SearchInput, Select } from '../../components/ui/field'
import { StatusPill, Tag } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Tabs, EmptyState } from '../../components/ui/misc'
import { cn } from '../../lib/cn'

const channelLabel = { email: 'Email', in_app: 'In-platform', webhook: 'Webhook' } as const
const statusTone = { delivered: 'positive', failed: 'overdue', queued: 'due' } as const

export function NotificationsAdmin() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'log' | 'triggers'>('log')
  const [query, setQuery] = useState('')
  const [channel, setChannel] = useState<'all' | NotificationRecord['channel']>('all')
  const counts = notificationsByChannel(state)

  const rows = useMemo(
    () =>
      state.notifications
        .filter((n) => (channel === 'all' ? true : n.channel === channel))
        .filter((n) => {
          if (!query.trim()) return true
          const q = query.toLowerCase()
          return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || n.audience.toLowerCase().includes(q)
        })
        .sort((a, b) => b.at.localeCompare(a.at)),
    [state.notifications, channel, query],
  )

  const columns: Column<NotificationRecord>[] = [
    {
      key: 'when',
      header: 'Sent',
      sortValue: (n) => n.at,
      render: (n) => (
        <span title={dateTime(n.at)} className="text-ink-muted">{relative(n.at)}</span>
      ),
    },
    {
      key: 'title',
      header: 'Notification',
      sortValue: (n) => n.title,
      render: (n) => (
        <span className="block max-w-[380px]">
          <span className="block font-medium text-ink">{n.title}</span>
          <span className="block truncate text-[11.5px] text-ink-subtle">{n.body}</span>
        </span>
      ),
    },
    {
      key: 'audience',
      hideBelow: 'xl',
      header: 'Audience',
      render: (n) => <span className="text-ink-muted">{n.audience}</span>,
    },
    {
      key: 'channel',
      hideBelow: 'xl',
      header: 'Channel',
      render: (n) => <Tag>{channelLabel[n.channel]}</Tag>,
    },
    {
      key: 'status',
      header: 'Delivery',
      sortValue: (n) => n.status,
      render: (n) => <StatusPill tone={statusTone[n.status]}>{n.status}</StatusPill>,
    },
    {
      key: 'attempts',
      hideBelow: 'xl',
      header: 'Attempts',
      align: 'right',
      render: (n) => <span className="tnum text-ink-muted">{n.attempts}</span>,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (n) =>
        n.status === 'failed' ? (
          <Button
            size="sm"
            onClick={() => {
              dispatch({ type: 'RETRY_NOTIFICATION', notificationId: n.id })
              toast.push({ title: 'Retry delivered', description: `${n.title} was re-sent successfully.`, tone: 'positive' })
            }}
          >
            Retry
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="Notifications management"
        description="The system-wide notification log, and the triggers that produce it. Delivery failures surface here first."
      />

      <div className="grid grid-cols-2 gap-3 border-y border-line bg-surface py-1 lg:grid-cols-4">
        <Kpi label="Delivered" value={String(state.notifications.filter((n) => n.status === 'delivered').length)} hint="Across all channels" tone="positive" />
        <Kpi label="Failed" value={String(state.notifications.filter((n) => n.status === 'failed').length)} hint="Need a retry" tone="overdue" emphasis />
        <Kpi label="Queued" value={String(state.notifications.filter((n) => n.status === 'queued').length)} hint="Awaiting send" tone="due" />
        <Kpi label="Email / in-app / hook" value={`${counts.email}/${counts.in_app}/${counts.webhook}`} hint="Channel volume" tone="pool" />
      </div>

      <div className="mt-4">
        <Panel>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <Tabs
              tabs={[
                { value: 'log', label: 'Delivery log', count: state.notifications.length },
                { value: 'triggers', label: 'Triggers', count: state.notificationTriggers.length },
              ]}
              value={tab}
              onChange={setTab}
            />
            {tab === 'log' ? (
              <div className="ml-auto flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row">
                <div className="w-full sm:w-[150px]">
                  <Select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} aria-label="Filter by channel">
                    <option value="all">All channels</option>
                    <option value="email">Email</option>
                    <option value="in_app">In-platform</option>
                    <option value="webhook">Webhook</option>
                  </Select>
                </div>
                <div className="w-full flex-1 sm:w-[250px]">
                  <SearchInput value={query} onChange={setQuery} placeholder="Search notifications…" />
                </div>
              </div>
            ) : null}
          </div>

          {tab === 'log' ? (
            <DataTable
              columns={columns}
              rows={rows}
              getRowId={(n) => n.id}
              dense
              emptyState={<EmptyState title="No notifications match" description="Clear the filters to see the full delivery log." />}
            />
          ) : (
            <ul className="divide-y divide-line">
              {state.notificationTriggers.map((trigger) => (
                <li key={trigger.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{trigger.label}</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-subtle">
                      Sends via {channelLabel[trigger.channel]} · trigger id {trigger.id}
                    </p>
                  </div>
                  <Tag>{channelLabel[trigger.channel]}</Tag>
                  <button
                    role="switch"
                    aria-checked={trigger.enabled}
                    aria-label={`${trigger.enabled ? 'Disable' : 'Enable'} ${trigger.label}`}
                    onClick={() => {
                      dispatch({ type: 'TOGGLE_TRIGGER', triggerId: trigger.id })
                      toast.push({
                        title: trigger.enabled ? 'Trigger disabled' : 'Trigger enabled',
                        description: trigger.label,
                        tone: trigger.enabled ? 'default' : 'positive',
                      })
                    }}
                    className={cn(
                      'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150',
                      trigger.enabled ? 'bg-emerald-600' : 'bg-line-strong',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-150',
                        trigger.enabled ? 'translate-x-[18px]' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="mt-4 text-[11.5px] text-ink-subtle">
        Notification bodies are written for borrowers, not engineers: plain language, one action each.
        Delivery attempts are capped at three before a failure is raised.
      </p>
    </>
  )
}
