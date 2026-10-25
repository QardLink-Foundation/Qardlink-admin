import { useState } from 'react'
import { useStore } from '../../lib/store'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../components/ui/toast'
import { relative, shortDate } from '../../lib/format'
import type { TeamMember } from '../../lib/types'
import { PageHeader, Panel, PanelHeader, Kpi, SectionLabel } from '../../components/ui/card'
import { DataTable, type Column } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Field, Input, Select } from '../../components/ui/field'
import { RoleChip, StatusPill } from '../../components/ui/badge'
import { Modal } from '../../components/ui/overlay'
import { PersonCell } from '../../components/ui/misc'
import { Icon } from '../../components/icons'

const permissions = [
  ['Pool balances and financial ledger', true, false],
  ['Loan approvals and disbursement', true, false],
  ['Partner commercial terms', true, false],
  ['Borrower financial history', true, false],
  ['Escalation triage', true, false],
  ['Trust score ledger', true, false],
  ['Team and role management', true, false],
  ['System health and webhooks', true, true],
  ['User records (no financials)', true, true],
  ['Notification delivery logs', true, true],
  ['Own profile and settings', true, true],
] as const

export function Team() {
  const { state, dispatch } = useStore()
  const { user } = useAuth()
  const toast = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: '', accessLevel: 'dev' })
  const [error, setError] = useState<string | null>(null)

  const columns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: 'Member',
      sortValue: (m) => m.name,
      render: (m) => <PersonCell name={m.name} meta={m.email} />,
    },
    {
      key: 'role',
      hideBelow: 'xl',
      header: 'Role',
      sortValue: (m) => m.role,
      render: (m) => <span className="text-ink">{m.role}</span>,
    },
    {
      key: 'access',
      header: 'Access',
      sortValue: (m) => m.accessLevel,
      render: (m) => <RoleChip role={m.accessLevel === 'founder' ? 'Founder-level' : 'Developer'} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <StatusPill tone={m.status === 'active' ? 'positive' : m.status === 'invited' ? 'due' : 'overdue'}>
          {m.status}
        </StatusPill>
      ),
    },
    {
      key: 'lastActive',
      hideBelow: 'xl',
      header: 'Last active',
      sortValue: (m) => m.lastActive,
      render: (m) => <span className="text-ink-muted">{relative(m.lastActive)}</span>,
    },
    {
      key: 'joined',
      hideBelow: 'xl',
      header: 'Joined',
      sortValue: (m) => m.joinedAt,
      render: (m) => <span className="text-ink-muted">{shortDate(m.joinedAt)}</span>,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (m) => (
        <Button
          size="sm"
          variant="ghost"
          disabled={m.email === user?.email}
          onClick={(e) => {
            e.stopPropagation()
            setRemoveTarget(m)
          }}
        >
          Remove
        </Button>
      ),
    },
  ]

  function add() {
    if (form.name.trim().length < 3) return setError('Enter the member’s full name.')
    if (!form.email.includes('@')) return setError('Enter a valid work email.')
    if (!form.role.trim()) return setError('Give the member a role, e.g. Support Engineer.')
    dispatch({
      type: 'ADD_MEMBER',
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role.trim(),
      accessLevel: form.accessLevel as 'founder' | 'dev',
    })
    toast.push({
      title: 'Invitation sent',
      description: `${form.name.trim()} was invited with ${form.accessLevel === 'founder' ? 'founder' : 'developer'} access.`,
      tone: 'positive',
    })
    setAddOpen(false)
    setForm({ name: '', email: '', role: '', accessLevel: 'dev' })
    setError(null)
  }

  return (
    <>
      <PageHeader
        title="Team & roles"
        description="Who can sign in, and what each access level unlocks. Access is enforced by the console, not convention."
        action={
          <Button variant="primary" size="sm" icon={<Icon name="plus" className="size-3.5" />} onClick={() => setAddOpen(true)}>
            Add member
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 border-y border-line bg-surface py-1 lg:grid-cols-4">
        <Kpi label="Team members" value={String(state.team.length)} hint="Foundation accounts" />
        <Kpi label="Founder-level" value={String(state.team.filter((m) => m.accessLevel === 'founder').length)} hint="Full financial access" tone="positive" />
        <Kpi label="Developer" value={String(state.team.filter((m) => m.accessLevel === 'dev').length)} hint="Scoped operational access" tone="pool" />
        <Kpi label="Pending invites" value={String(state.team.filter((m) => m.status === 'invited').length)} hint="Not yet signed in" tone="due" emphasis />
      </div>

      <div className="mt-4">
        <Panel>
          <PanelHeader title="Members" meta={`${state.team.length} accounts · you are signed in as ${user?.name}`} />
          <DataTable columns={columns} rows={state.team} getRowId={(m) => m.id} />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <PanelHeader title="Access matrix" meta="What each role can reach inside the console" />
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-line-strong bg-canvas/60">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.03em] text-ink-subtle uppercase">Capability</th>
                <th className="w-[110px] px-3 py-2.5 text-center text-[11px] font-semibold tracking-[0.03em] text-ink-subtle uppercase">Founder</th>
                <th className="w-[110px] px-3 py-2.5 text-center text-[11px] font-semibold tracking-[0.03em] text-ink-subtle uppercase">Developer</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(([label, founder, dev]) => (
                <tr key={label} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-2.5 text-ink">{label}</td>
                  <td className="px-3 py-2.5 text-center">
                    {founder ? <Icon name="check" className="mx-auto size-4 text-emerald-700" /> : <span className="text-ink-subtle">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {dev ? <Icon name="check" className="mx-auto size-4 text-emerald-700" /> : <span className="text-ink-subtle">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel>
          <PanelHeader title="How access works" />
          <div className="flex flex-col gap-4 px-4 py-4 text-[12.5px] text-ink-muted">
            <div>
              <SectionLabel>Founder-level</SectionLabel>
              <p className="mt-1 leading-relaxed">
                Sees every pool balance, loan amount, partner term and borrower financial. Can approve
                loans, suspend accounts, and change the team.
              </p>
            </div>
            <div className="border-t border-line pt-4">
              <SectionLabel>Developer</SectionLabel>
              <p className="mt-1 leading-relaxed">
                Keeps the platform running. Sees uptime, errors, webhooks, queues and user records —
                but no money. Deep links to financial pages are redirected.
              </p>
            </div>
            <p className="rounded-md bg-canvas px-3 py-2 text-[12px]">
              Demo note: sign in as <span className="font-medium text-ink">chinedu@qardlink.ng</span> to
              see the developer surface.
            </p>
          </div>
        </Panel>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a team member"
        description="They receive an email invitation and set their own password."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={add}>Send invitation</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Full name" htmlFor="member-name">
              <Input id="member-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Halima Bello" />
            </Field>
          </div>
          <Field label="Work email" htmlFor="member-email">
            <Input id="member-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@qardlink.ng" />
          </Field>
          <Field label="Role" htmlFor="member-role">
            <Input id="member-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Support Engineer" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Access level" htmlFor="member-access" hint={form.accessLevel === 'founder' ? 'Full access to financial data and approvals.' : 'Operational access only — no financial data.'}>
              <Select id="member-access" value={form.accessLevel} onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}>
                <option value="dev">Developer</option>
                <option value="founder">Founder-level</option>
              </Select>
            </Field>
          </div>
        </div>
        {error ? <p role="alert" className="mt-3 text-[12px] text-overdue">{error}</p> : null}
      </Modal>

      <Modal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove this member?"
        description={removeTarget ? `${removeTarget.name} will lose access immediately. Historical actions stay in the audit trail.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!removeTarget) return
                dispatch({ type: 'REMOVE_MEMBER', memberId: removeTarget.id })
                toast.push({ title: 'Member removed', description: `${removeTarget.name} no longer has console access.` })
                setRemoveTarget(null)
              }}
            >
              Remove member
            </Button>
          </>
        }
      />
    </>
  )
}
