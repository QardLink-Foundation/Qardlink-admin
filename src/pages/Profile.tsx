import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/ui/toast'
import { PageHeader, Panel, PanelHeader, SectionLabel } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Field, Input } from '../components/ui/field'
import { RoleChip } from '../components/ui/badge'
import { Avatar } from '../components/ui/misc'
import { cn } from '../lib/cn'
import { Icon } from '../components/icons'

const preferences = [
  { id: 'digest', label: 'Daily operational digest', detail: 'A summary of the queue and escalations each morning.' },
  { id: 'escalation', label: 'Escalation alerts', detail: 'Immediate email when a borrower goes overdue.' },
  { id: 'delivery', label: 'Delivery failures', detail: 'Technical alerts when a webhook or email fails.' },
]

export function Profile() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ digest: true, escalation: true, delivery: false })
  const [name, setName] = useState(user?.name ?? '')

  return (
    <>
      <PageHeader
        title="My profile"
        description="Your account, session and notification preferences. Role and access level are managed by the foundation."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <PanelHeader title="Account details" />
          <div className="flex flex-col gap-4 px-4 py-4">
            <div className="flex items-center gap-3 rounded-md border border-line bg-canvas/50 px-3 py-3">
              <Avatar name={user?.name ?? ''} className="size-10 text-[14px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-ink">{user?.name}</p>
                <p className="truncate text-[12px] text-ink-muted">{user?.title}</p>
              </div>
              <RoleChip role={user?.role === 'founder' ? 'Founder-level' : 'Developer'} />
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="profile-name">
                <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Email" htmlFor="profile-email" hint="Managed by the foundation">
                <Input id="profile-email" value={user?.email ?? ''} readOnly />
              </Field>
              <Field label="Access level" htmlFor="profile-access">
                <Input id="profile-access" value={user?.role === 'founder' ? 'Founder-level' : 'Developer'} readOnly />
              </Field>
              <Field label="Session" htmlFor="profile-session">
                <Input id="profile-session" value="Active · this device" readOnly />
              </Field>
            </div>

            <div className="flex items-center justify-between border-t border-line pt-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => toast.push({ title: 'Profile saved', description: 'Your details were updated.', tone: 'positive' })}
              >
                Save changes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="logout" className="size-3.5" />}
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Notification preferences" meta="Applies to your account only" />
          <ul className="divide-y divide-line">
            {preferences.map((pref) => (
              <li key={pref.id} className="flex items-start gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{pref.label}</p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{pref.detail}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={enabled[pref.id]}
                  aria-label={`${enabled[pref.id] ? 'Disable' : 'Enable'} ${pref.label}`}
                  onClick={() => setEnabled((prev) => ({ ...prev, [pref.id]: !prev[pref.id] }))}
                  className={cn(
                    'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors duration-150',
                    enabled[pref.id] ? 'bg-emerald-600' : 'bg-line-strong',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-150',
                      enabled[pref.id] ? 'translate-x-[18px]' : 'translate-x-0.5',
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-4 py-3.5">
            <SectionLabel>Security</SectionLabel>
            <p className="mt-1 text-[12px] text-ink-muted">
              Password changes and two-factor authentication are managed by the foundation administrator.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2.5"
              onClick={() => toast.push({ title: 'Request sent', description: 'A founder will approve the change.', tone: 'info' })}
            >
              Request a change
            </Button>
          </div>
        </Panel>
      </div>
    </>
  )
}
