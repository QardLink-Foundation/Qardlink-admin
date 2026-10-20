import { Suspense, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { useStore } from '../../lib/store'
import { poolMetrics, platformMetrics } from '../../lib/metrics'
import { moneyCompact, relative } from '../../lib/format'
import { cn } from '../../lib/cn'
import { Icon } from '../icons'
import { Avatar } from '../ui/misc'
import { buildNav, CommandPalette } from './command-palette'

function NotificationPopover({ onClose }: { onClose: () => void }) {
  const { state } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const items = state.notifications.slice(0, 5)
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-10 right-0 z-50 w-[340px] overflow-hidden rounded-lg border border-line bg-surface shadow-raised">
        <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
          <p className="text-[13px] font-semibold text-ink">Recent activity</p>
          <span className="tnum text-[11px] text-ink-subtle">{state.notifications.length} total</span>
        </header>
        <ul className="max-h-[340px] overflow-y-auto scrollbar-slim">
          {items.map((n) => (
            <li key={n.id} className="border-b border-line px-3.5 py-2.5 last:border-b-0 hover:bg-canvas/60">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12.5px] font-medium text-ink">{n.title}</p>
                <span className="tnum shrink-0 text-[10.5px] text-ink-subtle">{relative(n.at)}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-muted">{n.body}</p>
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            onClose()
            navigate(user?.role === 'founder' ? '/notifications' : '/logs')
          }}
          className="block w-full border-t border-line bg-canvas/50 px-3.5 py-2 text-left text-[12px] font-medium text-emerald-800 hover:bg-emerald-50"
        >
          {user?.role === 'founder' ? 'Manage notifications' : 'Open delivery logs'}
        </button>
      </div>
    </>
  )
}

export function Shell() {
  const { user, logout } = useAuth()
  const { state } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav = useMemo(
    () => buildNav(state).filter((item) => item.role === user?.role),
    [state, user?.role],
  )
  const current = nav.find((item) => location.pathname.startsWith(item.to))
  const pageLabel = current?.label ?? (location.pathname === '/profile' ? 'My profile' : 'Not found')
  const pool = poolMetrics(state)
  const metrics = platformMetrics(state)
  const unread = state.notifications.filter((n) => n.status !== 'delivered').length

  useEffect(() => {
    document.title = `${pageLabel} · QardLink Admin`
  }, [pageLabel])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-dvh bg-canvas">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col bg-emerald-950 text-emerald-100 transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-4">
          <span className="flex size-7 items-center justify-center rounded-md bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <svg viewBox="0 0 24 24" className="size-4 text-emerald-300" fill="none" aria-hidden>
              <path
                d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M12 11.5v9M12 11.5 4.5 8M12 11.5 19.5 8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-[14px] font-semibold tracking-[-0.01em] text-white">QardLink</p>
            <p className="text-[10.5px] text-emerald-200/55">Foundation console</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-slim">
          <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-[0.08em] text-emerald-200/40 uppercase">
            {user?.role === 'founder' ? 'Foundation' : 'Platform'}
          </p>
          <ul className="flex flex-col gap-0.5">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-colors',
                      isActive
                        ? 'bg-white/10 font-medium text-white'
                        : 'text-emerald-100/65 hover:bg-white/5 hover:text-emerald-50',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        name={item.icon}
                        className={cn('size-[16px]', isActive ? 'text-emerald-300' : 'text-emerald-200/50')}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="tnum rounded-full bg-emerald-400/20 px-1.5 text-[10.5px] font-medium text-emerald-200">
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          {user?.role === 'founder' ? (
            <div className="mb-2.5 rounded-md bg-white/[0.04] px-2.5 py-2">
              <p className="text-[10px] tracking-[0.05em] text-emerald-200/45 uppercase">Pool balance</p>
              <p className="tnum mt-0.5 text-[15px] font-semibold text-emerald-50">
                {moneyCompact(pool.total)}
              </p>
              <p className="text-[10.5px] text-emerald-200/50">
                {metrics.activeLoans} active loans · {metrics.activePartners} partners
              </p>
            </div>
          ) : (
            <div className="mb-2.5 rounded-md bg-white/[0.04] px-2.5 py-2">
              <p className="text-[10px] tracking-[0.05em] text-emerald-200/45 uppercase">System</p>
              <p className="mt-0.5 text-[13px] font-medium text-emerald-50">
                {state.system.uptimePct}% uptime
              </p>
              <p className="text-[10.5px] text-emerald-200/50">Queue {state.system.queueDepth} jobs</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Avatar name={user?.name ?? ''} className="bg-emerald-400/20 text-emerald-100" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[12px] font-medium text-emerald-50">{user?.name}</p>
              <p className="truncate text-[10.5px] text-emerald-200/50">{user?.title}</p>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              aria-label="Sign out"
              title="Sign out"
              className="rounded p-1.5 text-emerald-200/60 hover:bg-white/10 hover:text-white"
            >
              <Icon name="logout" className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-emerald-950/30 lg:hidden"
        />
      ) : null}

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur-sm sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="rounded p-1.5 text-ink-muted hover:bg-emerald-50 lg:hidden"
          >
            <Icon name="menu" className="size-5" />
          </button>
          <div className="hidden items-center gap-1.5 text-[12.5px] text-ink-subtle sm:flex">
            <span>{user?.role === 'founder' ? 'Foundation' : 'Platform'}</span>
            <Icon name="chevronRight" className="size-3" />
            <span className="font-medium text-ink">{pageLabel}</span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden h-8 w-[210px] items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-[12.5px] text-ink-subtle hover:border-emerald-300 md:flex"
            >
              <Icon name="search" className="size-3.5" />
              <span className="flex-1 text-left">Jump to a page</span>
              <kbd className="rounded border border-line bg-canvas px-1 py-0.5 text-[10px]">⌘K</kbd>
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Search pages"
              className="rounded p-2 text-ink-muted hover:bg-emerald-50 md:hidden"
            >
              <Icon name="search" className="size-4.5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Recent activity"
                aria-expanded={notifOpen}
                className="relative rounded p-2 text-ink-muted hover:bg-emerald-50"
              >
                <Icon name="bell" className="size-4.5" />
                {unread > 0 ? (
                  <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-overdue" />
                ) : null}
              </button>
              {notifOpen ? <NotificationPopover onClose={() => setNotifOpen(false)} /> : null}
            </div>

            <div className="ml-1 hidden items-center gap-2 border-l border-line pl-2.5 sm:flex">
              <Avatar name={user?.name ?? ''} />
              <div className="leading-tight">
                <p className="text-[12px] font-medium text-ink">{user?.name}</p>
                <p className="text-[10.5px] text-ink-subtle">
                  {user?.role === 'founder' ? 'Founder access' : 'Developer access'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
          <Suspense
            fallback={
              <div role="status" aria-live="polite" className="flex items-center justify-center py-24">
                <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-emerald-600" />
                <span className="sr-only">Loading page</span>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      {paletteOpen ? <CommandPalette onClose={() => setPaletteOpen(false)} /> : null}
    </div>
  )
}
