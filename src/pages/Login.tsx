import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { DEMO_ACCOUNTS, useAuth } from '../lib/auth'
import { Button } from '../components/ui/button'
import { Field, Input } from '../components/ui/field'
import { Icon } from '../components/icons'
import { cn } from '../lib/cn'

type ErrorField = 'email' | 'password'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorField, setErrorField] = useState<ErrorField | null>(null)
  const [busy, setBusy] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  function clearError() {
    if (error) setError(null)
    if (errorField !== null) setErrorField(null)
  }

  function signIn(emailValue: string, passwordValue: string) {
    if (busy) return
    clearError()
    setBusy(true)
    timerRef.current = window.setTimeout(() => {
      const result = login(emailValue, passwordValue)
      setBusy(false)
      if (!result.ok) {
        setError(result.error ?? 'Could not sign in.')
        setErrorField('email')
        return
      }
      const account = DEMO_ACCOUNTS.find((a) => a.email === emailValue.trim().toLowerCase())
      navigate(account?.role === 'founder' ? '/overview' : '/system', { replace: true })
    }, 260)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!email.trim()) {
      setError('Enter your email address.')
      setErrorField('email')
      return
    }
    if (!password) {
      setError('Enter your password.')
      setErrorField('password')
      return
    }
    signIn(email, password)
  }

  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-emerald-900 p-10 text-emerald-50 lg:flex">
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <svg viewBox="0 0 24 24" className="size-4.5 text-emerald-300" fill="none" aria-hidden>
              <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M12 11.5v9M12 11.5 4.5 8M12 11.5 19.5 8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="text-[14px] font-semibold tracking-[-0.01em]">QardLink</span>
          <span className="ml-1 rounded-full border border-emerald-400/25 px-2 py-0.5 text-[11px] text-emerald-200/80">
            Foundation console
          </span>
        </div>

        <div className="relative flex w-full max-w-[660px] flex-col justify-center py-12">
          <p className="font-serif text-[52px] leading-[1.04] tracking-[-0.01em] text-white">
            Trust,
            <br />
            administered.
          </p>
          <p className="mt-4 max-w-[42ch] text-[14px] leading-relaxed text-emerald-100/80">
            Interest-free lending, recycled through partner capital and returned to the people who
            need it.
          </p>
          <PoolFlowIllustration prefersReducedMotion={prefersReducedMotion} />
        </div>

        <p className="relative text-[11px] text-emerald-200/70">
          A transparent cycle of support.
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

          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">Sign in to QardLink</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Use your foundation account, or continue with a demo account below.
          </p>

          <form onSubmit={onSubmit} aria-busy={busy} className="mt-6 flex flex-col gap-4" noValidate>
            <Field label="Email" htmlFor="email" error={errorField === 'email' ? (error ?? undefined) : undefined} errorId="login-email-error">
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearError()
                }}
                aria-invalid={errorField === 'email' || undefined}
                aria-describedby="login-email-error"
                placeholder="you@qardlink.ng"
                className="h-10"
              />
            </Field>
            <Field label="Password" htmlFor="password" error={errorField === 'password' ? (error ?? undefined) : undefined} errorId="login-password-error">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearError()
                }}
                aria-invalid={errorField === 'password' || undefined}
                className="h-10"
              />
            </Field>
            <motion.div
              whileTap={busy ? undefined : { scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            >
              <Button
                type="submit"
                variant="primary"
                className="h-10 w-full active:scale-100"
                disabled={busy}
              >
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </motion.div>
          </form>

          <div className="mt-7 border-t border-line pt-5">
            <p className="text-[11px] font-semibold tracking-[0.04em] text-ink-muted uppercase">
              Demo accounts
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {DEMO_ACCOUNTS.map((account) => {
                const selected = email.trim().toLowerCase() === account.email
                return (
                  <motion.button
                    key={account.id}
                    type="button"
                    disabled={busy}
                    whileTap={busy || prefersReducedMotion ? undefined : { scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                    onClick={() => {
                      setEmail(account.email)
                      setPassword('qardlink')
                      signIn(account.email, 'qardlink')
                    }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors',
                      'disabled:pointer-events-none disabled:opacity-60',
                      selected
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-line bg-surface hover:border-emerald-300',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
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
                      <span className="block truncate text-[13px] font-medium text-ink">
                        Sign in as {account.name}
                      </span>
                      <span className="block truncate text-[11px] text-ink-muted">
                        {account.role === 'founder'
                          ? 'Founder · routes to Overview'
                          : 'Developer · routes to System'}
                      </span>
                    </span>
                    <Icon name="arrowRight" className="size-4 text-ink-subtle" />
                  </motion.button>
                )
              })}
            </div>
            <p className="mt-3 text-[12px] text-ink-muted">
              Both demo accounts use the password <span className="font-medium text-ink">qardlink</span>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function PoolFlowIllustration({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  return (
    <svg
      className="mt-7 w-full max-w-[660px] overflow-visible"
      viewBox="0 0 720 330"
      role="img"
      aria-label="Partner contributions are split between lending and operations, while repayments return to the lending pool."
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M220 132H300" strokeOpacity=".24" strokeWidth="2" />
        <path d="M300 132C352 132 348 84 410 84H420" strokeOpacity=".24" strokeWidth="2" />
        <path d="M300 132C352 132 348 196 410 196H420" strokeOpacity=".24" strokeWidth="2" />
        <path d="M655 84H676V136C676 148 667 154 655 154H548C539 154 536 145 536 130" stroke="#A7D2C4" strokeOpacity=".3" strokeWidth="1.75" />
        <path d="M220 132H300" stroke="#74B7A3" strokeWidth="2" />
        <motion.path
          d="M300 132C352 132 348 84 410 84H420"
          stroke="#74B7A3"
          strokeWidth="2"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: 'easeOut' }}
        />
        <motion.path
          d="M300 132C352 132 348 196 410 196H420"
          stroke="#74B7A3"
          strokeWidth="2"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.16, ease: 'easeOut' }}
        />
        <motion.path
          d="M655 84H676V136C676 148 667 154 655 154H548C539 154 536 145 536 130"
          stroke="#A7D2C4"
          strokeWidth="1.75"
          strokeOpacity=".72"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 0.72 }}
          transition={{ duration: prefersReducedMotion ? 0 : 1.1, delay: prefersReducedMotion ? 0 : 0.45, ease: 'easeOut' }}
        />
      </g>

      <path d="m530 138 6-10 6 10" fill="none" stroke="#A7D2C4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      <g fontFamily="var(--font-sans)" fill="#EAF4F0">
        <rect x="40" y="90" width="180" height="84" rx="8" fill="#0A4535" stroke="#74B7A3" strokeOpacity=".42" />
        <text x="58" y="119" fontSize="11" fill="#A7D2C4">PARTNER CAPITAL</text>
        <text x="58" y="146" fontSize="16" fontWeight="600">Contributions</text>

        <rect x="420" y="45" width="235" height="78" rx="8" fill="#0A4535" stroke="#74B7A3" strokeOpacity=".42" />
        <text x="440" y="73" fontSize="11" fill="#A7D2C4">LENDING POOL</text>
        <text x="440" y="101" fontSize="23" fontWeight="600">75%</text>
        <text x="514" y="100" fontSize="12" fill="#D3E8E0">Qard hasan loans</text>

        <rect x="420" y="157" width="235" height="78" rx="8" fill="#0A4535" stroke="#74B7A3" strokeOpacity=".42" />
        <text x="440" y="185" fontSize="11" fill="#A7D2C4">OPERATIONAL POOL</text>
        <text x="440" y="213" fontSize="23" fontWeight="600">25%</text>
        <text x="514" y="212" fontSize="12" fill="#D3E8E0">Operating share</text>

        <text x="420" y="300" fontSize="11" fill="#A7D2C4">Repayments return to the lending pool</text>
      </g>
    </svg>
  )
}
