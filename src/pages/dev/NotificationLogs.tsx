import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { useToast } from '../../components/ui/toast'
import { dateTime, relative } from '../../lib/format'
import type { NotificationRecord } from '../../lib/types'
import { PageHeader, Panel, Kpi } from '../../components/ui/card'
import { DataTable, type Column } from '../../components/ui/table'
import { SearchInput, Select } from '../../components/ui/field'
import { StatusPill, Tag } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { EmptyState } from '../../components/ui/misc'
import { Icon } from '../../components/icons'

const HEARTBEAT = new Date(Date.now() - 42_000).toISOString()

const errorText: Record<string, string> = {
  'webhook.retry': 'Endpoint returned 502 Bad Gateway after 30s. Retry 2 of 3 scheduled.',
  'system.queue_alert': 'Handled — queue drained below threshold within 5 minutes.',
}

export function NotificationLogs() {
  const { state } = useStore()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [channel, setChannel] = useState<'all' | NotificationRecord['channel']>('all')

  const rows = useMemo(
    () =>
      state.notifications
        .filter((n) => (channel === 'all' ? true : n.channel === channel))
        .filter((n) => {
          if (!query.trim()) return true
          const q = query.toLowerCase()
          return n.trigger.toLowerCase().includes(q) || n.title.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)
        })
        .sort((a, b) => b.at.localeCompare(a.at)),
    [state.notifications, channel, query],
  )

  function replay(n: NotificationRecord) {
    toast.push({ title: 'Redelivery queued', description: `Event ${n.id} will retry in 30 seconds.`, tone: 'info' })
  }

  const columns: Column<NotificationRecord>[] = [
    {
      key: 'id',
      header: 'Event',
      sortValue: (n) => n.id,
      render: (n) => (
        <span>
          <span className="block font-mono text-[11.5px] text-ink">{n.id}</span>
          <span className="block font-mono text-[10.5px] text-ink-subtle">{n.trigger}</span>
        </span>
      ),
    },
    {
      key: 'when',
      header: 'Timestamp',
      sortValue: (n) => n.at,
      render: (n) => <span className="tnum text-ink-muted">{dateTime(n.at)}</span>,
    },
    {
      key: 'channel',
      hideBelow: 'xl',
      header: 'Transport',
      render: (n) => <Tag>{n.channel}</Tag>,
    },
    {
      key: 'status',
      header: 'Result',
      sortValue: (n) => n.status,
      render: (n) => (
        <StatusPill tone={n.status === 'delivered' ? 'positive' : n.status === 'failed' ? 'overdue' : 'due'}>
          {n.status}
        </StatusPill>
      ),
    },
    {
      key: 'attempts',
      hideBelow: 'xl',
      header: 'Attempts',
      align: 'right',
      render: (n) => <span className="tnum text-ink-muted">{n.attempts} / 3</span>,
    },
    {
      key: 'detail',
      hideBelow: 'xl',
      header: 'Detail',
      render: (n) => (
        <span className="block max-w-[360px] truncate font-mono text-[11px] text-ink-muted" title={errorText[n.trigger] ?? n.body}>
          {n.status === 'failed' ? (errorText[n.trigger] ?? 'Delivery failed.') : n.body}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (n) =>
        n.status === 'failed' ? (
          <Button size="sm" onClick={() => replay(n)}>
            Replay
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="Notification logs"
        description="Technical delivery records for emails, in-platform messages and webhooks. Raw trigger ids and failure detail for debugging."
        action={
          <Button size="sm" icon={<Icon name="download" className="size-3.5" />} onClick={() => toast.push({ title: 'Log exported', description: `${rows.length} delivery records prepared.`, tone: 'info' })}>
            Export log
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Events (24h)" value={String(state.notifications.length)} hint="All transports" />
        <Kpi label="Delivered" value={String(state.notifications.filter((n) => n.status === 'delivered').length)} hint="Successful deliveries" tone="positive" />
        <Kpi label="Failed" value={String(state.notifications.filter((n) => n.status === 'failed').length)} hint="Within retry budget" tone="overdue" />
        <Kpi label="Queued" value={String(state.notifications.filter((n) => n.status === 'queued').length)} hint="Waiting on worker" tone="due" />
      </div>

      <div className="mt-4">
        <Panel>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <div className="w-[150px]">
              <Select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} aria-label="Filter by transport">
                <option value="all">All transports</option>
                <option value="email">email</option>
                <option value="in_app">in_app</option>
                <option value="webhook">webhook</option>
              </Select>
            </div>
            <div className="w-full sm:ml-auto sm:w-[300px]">
              <SearchInput value={query} onChange={setQuery} placeholder="Search trigger, event id…" />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(n) => n.id}
            dense
            emptyState={<EmptyState title="No delivery records" description="Try another transport or clear the search." />}
            mobileCard={(n) => (
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11.5px] text-ink">{n.id}</p>
                  <p className="truncate font-mono text-[10.5px] text-ink-subtle">{n.trigger}</p>
                  <p className="tnum mt-1 text-[11px] text-ink-subtle">
                    {dateTime(n.at)} · {n.attempts}/3 attempts
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusPill tone={n.status === 'delivered' ? 'positive' : n.status === 'failed' ? 'overdue' : 'due'}>
                    {n.status}
                  </StatusPill>
                  {n.status === 'failed' ? (
                    <Button size="sm" onClick={() => replay(n)}>
                      Replay
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          />
        </Panel>
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11.5px] text-ink-subtle">
        <Icon name="clock" className="size-3.5" />
        Retention: 30 days. Last worker heartbeat {relative(HEARTBEAT)}.
      </div>
    </>
  )
}
