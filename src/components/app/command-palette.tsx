import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { platformMetrics } from '../../lib/metrics'
import type { Role } from '../../lib/auth'
import { Icon, type IconName } from '../icons'
import { cn } from '../../lib/cn'

export interface NavItem {
  to: string
  label: string
  icon: IconName
  role: Role
  badge?: number
}

export function buildNav(state: ReturnType<typeof useStore>['state']): NavItem[] {
  const m = platformMetrics(state)
  return [
    { to: '/overview', label: 'Overview', icon: 'grid', role: 'founder' },
    { to: '/queue', label: 'Loan queue', icon: 'inbox', role: 'founder', badge: m.pendingApprovals },
    { to: '/loans', label: 'All loans', icon: 'receipt', role: 'founder' },
    { to: '/pool', label: 'Pool management', icon: 'droplet', role: 'founder' },
    { to: '/partners', label: 'Partners', icon: 'handshake', role: 'founder' },
    { to: '/borrowers', label: 'Borrowers', icon: 'users', role: 'founder' },
    { to: '/escalations', label: 'Escalations', icon: 'alert', role: 'founder', badge: m.openEscalations },
    { to: '/trust', label: 'Trust scores', icon: 'shield', role: 'founder' },
    { to: '/analytics', label: 'Analytics', icon: 'chart', role: 'founder' },
    { to: '/team', label: 'Team & roles', icon: 'team', role: 'founder' },
    { to: '/notifications', label: 'Notifications', icon: 'bell', role: 'founder' },
    { to: '/system', label: 'System overview', icon: 'server', role: 'dev' },
    { to: '/users', label: 'User management', icon: 'userList', role: 'dev' },
    { to: '/logs', label: 'Notification logs', icon: 'list', role: 'dev' },
    { to: '/profile', label: 'My profile', icon: 'user', role: 'dev' },
  ]
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const items = useMemo(() => {
    const nav = buildNav(state).filter((item) => item.role === 'founder' || item.to === '/profile')
    const q = query.trim().toLowerCase()
    return q ? nav.filter((item) => item.label.toLowerCase().includes(q)) : nav
  }, [state, query])

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && items[0]) {
        navigate(items[0].to)
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [items, navigate, onClose])

  return (
    <div className="fixed inset-0 z-[70] flex justify-center p-4 pt-[14vh]">
      <div className="absolute inset-0 bg-emerald-950/30" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to a page"
        className="relative w-full max-w-[520px] overflow-hidden rounded-lg border border-line bg-surface shadow-raised"
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Icon name="search" className="size-4 text-ink-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a page…"
            className="h-11 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-ink-subtle"
          />
          <kbd className="rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] text-ink-subtle">
            esc
          </kbd>
        </div>
        <ul className="max-h-[320px] overflow-y-auto p-1.5 scrollbar-slim">
          {items.length === 0 ? (
            <li className="px-3 py-6 text-center text-[13px] text-ink-subtle">
              No page matches “{query}”.
            </li>
          ) : (
            items.map((item, index) => (
              <li key={item.to}>
                <button
                  onClick={() => {
                    navigate(item.to)
                    onClose()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px]',
                    index === 0 ? 'bg-emerald-50 text-emerald-900' : 'text-ink hover:bg-canvas',
                  )}
                >
                  <Icon name={item.icon} className="size-4 text-ink-muted" />
                  <span className="flex-1">{item.label}</span>
                  {index === 0 ? (
                    <kbd className="text-[10px] text-ink-subtle">enter</kbd>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
