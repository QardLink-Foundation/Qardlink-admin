import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_ACCOUNTS, useAuth } from '../lib/auth'
import { Button } from '../components/ui/button'
import { Field, Input } from '../components/ui/field'
import { Icon } from '../components/icons'
import { cn } from '../lib/cn'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function signIn(emailValue: string, passwordValue: string) {
    setError(null)
    setBusy(true)
    window.setTimeout(() => {
      const result = login(emailValue, passwordValue)
      setBusy(false)
      if (!result.ok) {
        setError(result.error ?? 'Could not sign in.')
        return
      }
      const account = DEMO_ACCOUNTS.find((a) => a.email === emailValue.trim().toLowerCase())
      navigate(account?.role === 'founder' ? '/overview' : '/system', { replace: true })
    }, 260)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    signIn(email, password)
  }

  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-emerald-950 p-10 text-emerald-50 lg:flex">
        <LedgerBackdrop />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <svg viewBox="0 0 24 24" className="size-4.5 text-emerald-300" fill="none" aria-hidden>
              <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M12 11.5v9M12 11.5 4.5 8M12 11.5 19.5 8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="text-[14px] font-semibold tracking-[-0.01em]">QardLink</span>
          <span className="ml-1 rounded-full border border-emerald-400/25 px-2 py-0.5 text-[10.5px] text-emerald-200/70">
            Foundation console
          </span>
        </div>

        <div className="relative max-w-[440px]">
          <p className="font-serif text-[52px] leading-[1.04] tracking-[-0.01em] text-white">
            Trust,
            <br />
            administered.
          </p>
          <p className="mt-4 max-w-[38ch] text-[14px] leading-relaxed text-emerald-100/70">
            One console for the pool, the loans, and the people who keep them moving. Every figure
            here is reconciled against the ledger.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
            {[
              ['42', 'borrowers'],
              ['99.98%', 'uptime'],
              ['0%', 'riba'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="tnum text-[20px] font-semibold text-emerald-50">{value}</p>
                <p className="text-[11px] text-emerald-200/50">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-emerald-200/40">
          Interest-free lending, recycled through partner capital.
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-md bg-emerald-900">
              <svg viewBox="0 0 24 24" className="size-4.5 text-emerald-300" fill="none" aria-hidden>
                <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[14px] font-semibold">QardLink Foundation</span>
          </div>

          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Sign in</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Use your foundation account. Access is routed by role.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@qardlink.ng"
                required
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>
            {error ? (
              <p role="alert" className="rounded-md border border-[#efcbc5] bg-overdue-soft px-3 py-2 text-[12.5px] text-overdue">
                {error}
              </p>
            ) : null}
            <Button type="submit" variant="primary" className="mt-1 h-10 w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-7 border-t border-line pt-5">
            <p className="text-[11px] font-semibold tracking-[0.04em] text-ink-muted uppercase">
              Demo accounts
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {DEMO_ACCOUNTS.map((account) => {
                const selected = email === account.email
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => {
                      setEmail(account.email)
                      setPassword('qardlink')
                      signIn(account.email, 'qardlink')
                    }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors',
                      selected
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-line bg-surface hover:border-emerald-300',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full text-[10.5px] font-semibold',
                        account.role === 'founder'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-info-soft text-info',
                      )}
                    >
                      {account.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-ink">
                        {account.name}
                      </span>
                      <span className="block truncate text-[11px] text-ink-muted">
                        {account.role === 'founder' ? 'Founder access' : 'Developer access'} · password
                        qardlink
                      </span>
                    </span>
                    <Icon name="arrowRight" className="size-4 text-ink-subtle" />
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-[11.5px] text-ink-muted">
              Demo accounts sign in with the password <span className="font-medium text-ink-muted">qardlink</span>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function LedgerBackdrop() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]"
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
    >
      {Array.from({ length: 22 }, (_, i) => (
        <line
          key={i}
          x1="0"
          x2="600"
          y1={40 + i * 34}
          y2={40 + i * 34}
          stroke="currentColor"
          strokeWidth="1"
          className="text-emerald-300"
        />
      ))}
      <path
        d="M-40 620C120 560 180 460 250 470s120 90 200 60 120-120 210-130"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-emerald-300"
      />
      <circle cx="470" cy="220" r="130" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-300" />
    </svg>
  )
}
