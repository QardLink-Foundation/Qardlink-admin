import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function NotFound() {
  const { user } = useAuth()
  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center">
      <p className="text-[11px] font-semibold tracking-[0.06em] text-ink-subtle uppercase">404</p>
      <h1 className="mt-2 font-serif text-[40px] leading-none text-ink">This page is not in the ledger.</h1>
      <p className="mt-3 max-w-[46ch] text-[13px] text-ink-muted">
        The address does not match anything in the console. Check the link, or jump back to the page you
        were working in.
      </p>
      <Link
        to={user?.role === 'dev' ? '/system' : '/overview'}
        className="mt-5 inline-flex h-9 items-center rounded-md bg-emerald-600 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-emerald-700"
      >
        Back to {user?.role === 'dev' ? 'system overview' : 'overview'}
      </Link>
    </div>
  )
}
