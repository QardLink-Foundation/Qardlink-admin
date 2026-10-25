import { useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { useToast } from '../../components/ui/toast'
import { relative, shortDate } from '../../lib/format'
import type { Borrower } from '../../lib/types'
import { PageHeader, Panel, Kpi } from '../../components/ui/card'
import { DataTable, type Column } from '../../components/ui/table'
import { SearchInput, Select, Textarea } from '../../components/ui/field'
import { StatusPill, Tag } from '../../components/ui/badge'
import { PersonCell, EmptyState } from '../../components/ui/misc'
import { Drawer, Modal } from '../../components/ui/overlay'
import { Button } from '../../components/ui/button'
import { Icon } from '../../components/icons'

const NOW = Date.now()

export function UserManagement() {
  const { state } = useStore()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | Borrower['status']>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [issueOpen, setIssueOpen] = useState(false)
  const [issue, setIssue] = useState('')
  const [issues, setIssues] = useState<Record<string, string>>({})

  const rows = useMemo(
    () =>
      state.borrowers
        .filter((b) => (status === 'all' ? true : b.status === status))
        .filter((b) => {
          if (!query.trim()) return true
          const q = query.toLowerCase()
          return (
            b.name.toLowerCase().includes(q) ||
            b.email.toLowerCase().includes(q) ||
            b.businessName.toLowerCase().includes(q)
          )
        }),
    [state.borrowers, status, query],
  )

  const selected = state.borrowers.find((b) => b.id === selectedId) ?? null

  const columns: Column<Borrower>[] = [
    {
      key: 'name',
      header: 'User',
      sortValue: (b) => b.name,
      render: (b) => <PersonCell name={b.name} meta={b.email} />,
    },
    {
      key: 'type',
      hideBelow: 'xl',
      header: 'Account',
      render: () => <Tag>Borrower</Tag>,
    },
    {
      key: 'location',
      hideBelow: 'xl',
      header: 'Location',
      render: (b) => <span className="text-ink-muted">{b.location}</span>,
    },
    {
      key: 'joined',
      hideBelow: 'xl',
      header: 'Registered',
      sortValue: (b) => b.joinedAt,
      render: (b) => <span className="text-ink-muted">{shortDate(b.joinedAt)}</span>,
    },
    {
      key: 'verification',
      hideBelow: 'xl',
      header: 'Verification',
      render: (b) => (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
          <Icon name="check" className={b.accountNumber ? 'size-3.5 text-emerald-700' : 'size-3.5 text-ink-subtle'} />
          Bank linked
        </span>
      ),
    },
    {
      key: 'issue',
      hideBelow: 'xl',
      header: 'Technical issue',
      render: (b) =>
        issues[b.id] ? (
          <span className="line-clamp-1 max-w-[220px] text-[12px] text-due">{issues[b.id]}</span>
        ) : (
          <span className="text-[12px] text-ink-subtle">None</span>
        ),
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
        title="User management"
        description="Registered users for support and technical triage. Financial fields are hidden for developer accounts by policy."
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-md border border-[#cbd6ea] bg-info-soft px-3.5 py-2.5">
        <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-info" />
        <p className="text-[12.5px] text-info">
          Access policy: loan amounts, pool balances and borrower financial history are not available on
          this surface. Escalate financial questions to a founder-level account.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 border-y border-line bg-surface py-1 lg:grid-cols-4">
        <Kpi label="Registered users" value={String(state.borrowers.length)} hint="All borrower accounts" />
        <Kpi label="Active" value={String(state.borrowers.filter((b) => b.status === 'active').length)} hint="No open technical issue" tone="positive" />
        <Kpi label="Flagged" value={String(state.borrowers.filter((b) => b.status === 'flagged').length + Object.keys(issues).length)} hint="Including technical flags" tone="due" emphasis />
        <Kpi label="New this week" value={String(state.borrowers.filter((b) => NOW - new Date(b.joinedAt).getTime() < 7 * 86400000).length)} hint="Registered in 7 days" tone="pool" />
      </div>

      <div className="mt-4">
        <Panel>
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <div className="w-full sm:w-[150px]">
              <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filter by status">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="flagged">Flagged</option>
                <option value="suspended">Suspended</option>
              </Select>
            </div>
            <div className="w-full sm:ml-auto sm:w-[300px]">
              <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, business…" />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(b) => b.id}
            onRowClick={(b) => setSelectedId(b.id)}
            selectedId={selectedId ?? undefined}
            emptyState={<EmptyState title="No users match" description="Clear the filters or search a different name." />}
          />
        </Panel>
      </div>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.name ?? ''}
        meta={selected ? <span className="text-ink-muted">User {selected.id} · registered {relative(selected.joinedAt)}</span> : null}
        footer={
          selected ? (
            <>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>Close</Button>
              <Button variant="primary" onClick={() => { setIssue(''); setIssueOpen(true) }}>Flag technical issue</Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="flex flex-col gap-4 text-[13px]">
            <div className="rounded-lg border border-line bg-canvas/50 p-4">
              <p className="font-medium text-ink">{selected.email}</p>
              <p className="mt-0.5 text-ink-muted">{selected.phone}</p>
              <p className="mt-2 text-[12px] text-ink-subtle">Role: borrower · Locale: en-NG</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Account status" value={selected.status} />
              <Field label="Registered" value={shortDate(selected.joinedAt)} />
              <Field label="Business type" value={selected.businessType} />
              <Field label="Location" value={selected.location} />
              <Field label="Bank linked" value="Yes" />
              <Field label="Platform ID" value={selected.id} />
            </div>
            {issues[selected.id] ? (
              <div className="rounded-md border border-[#f0dcc0] bg-due-soft px-3 py-2">
                <p className="text-[11px] font-medium tracking-[0.04em] text-due uppercase">Open technical issue</p>
                <p className="mt-1 text-[12.5px] text-ink">{issues[selected.id]}</p>
              </div>
            ) : null}
            <p className="rounded-md bg-canvas px-3 py-2 text-[12px] text-ink-muted">
              Financial data (loan amounts, repayments, trust score) is hidden on the developer surface.
            </p>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title="Flag a technical issue"
        description={selected ? `This appears on ${selected.name}'s record for the support team.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIssueOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!selected || issue.trim().length < 6) return
                setIssues((prev) => ({ ...prev, [selected.id]: issue.trim() }))
                toast.push({ title: 'Technical issue flagged', description: 'Support will follow up with the user.', tone: 'info' })
                setIssueOpen(false)
                setIssue('')
              }}
            >
              Flag issue
            </Button>
          </>
        }
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-ink-muted">What is wrong?</span>
          <Textarea value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="e.g. Bank verification fails on re-submission for this account." autoFocus />
        </label>
      </Modal>
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-ink-subtle">{label}</p>
      <p className="mt-0.5 text-[12.5px] text-ink capitalize">{value}</p>
    </div>
  )
}
