import { lazy, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth, type Role } from './lib/auth'
import { StoreProvider } from './lib/store'
import { ToastProvider } from './components/ui/toast'
import { Shell } from './components/app/shell'
import { Login } from './pages/Login'
import { Button } from './components/ui/button'

const Overview = lazy(() => import('./pages/founder/Overview').then((m) => ({ default: m.Overview })))
const LoanQueue = lazy(() => import('./pages/founder/LoanQueue').then((m) => ({ default: m.LoanQueue })))
const Loans = lazy(() => import('./pages/founder/Loans').then((m) => ({ default: m.Loans })))
const Pool = lazy(() => import('./pages/founder/Pool').then((m) => ({ default: m.Pool })))
const Partners = lazy(() => import('./pages/founder/Partners').then((m) => ({ default: m.Partners })))
const Borrowers = lazy(() => import('./pages/founder/Borrowers').then((m) => ({ default: m.Borrowers })))
const Escalations = lazy(() => import('./pages/founder/Escalations').then((m) => ({ default: m.Escalations })))
const Team = lazy(() => import('./pages/founder/Team').then((m) => ({ default: m.Team })))
const TrustScore = lazy(() => import('./pages/founder/TrustScore').then((m) => ({ default: m.TrustScore })))
const Analytics = lazy(() => import('./pages/founder/Analytics').then((m) => ({ default: m.Analytics })))
const NotificationsAdmin = lazy(() =>
  import('./pages/founder/NotificationsAdmin').then((m) => ({ default: m.NotificationsAdmin })),
)
const System = lazy(() => import('./pages/dev/System').then((m) => ({ default: m.System })))
const UserManagement = lazy(() =>
  import('./pages/dev/UserManagement').then((m) => ({ default: m.UserManagement })),
)
const NotificationLogs = lazy(() =>
  import('./pages/dev/NotificationLogs').then((m) => ({ default: m.NotificationLogs })),
)
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

function Protected({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={user.role === 'founder' ? '/overview' : '/system'} replace />
  return <>{children}</>
}

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'founder' ? '/overview' : '/system'} replace />
}

function Denied() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-surface p-8">
      <p className="font-serif text-[24px] text-ink">That page is outside your access.</p>
      <p className="max-w-[52ch] text-[13px] text-ink-muted">
        Developer accounts can view platform health and user records, but not pool balances, loan
        amounts, or partner commercial terms.
      </p>
      <Button onClick={() => window.history.back()}>Go back</Button>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <ToastProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <Protected>
                  <Shell />
                </Protected>
              }
            >
              <Route index element={<HomeRedirect />} />
              <Route path="overview" element={<RequireRole role="founder"><Overview /></RequireRole>} />
              <Route path="queue" element={<RequireRole role="founder"><LoanQueue /></RequireRole>} />
              <Route path="loans" element={<RequireRole role="founder"><Loans /></RequireRole>} />
              <Route path="pool" element={<RequireRole role="founder"><Pool /></RequireRole>} />
              <Route path="partners" element={<RequireRole role="founder"><Partners /></RequireRole>} />
              <Route path="borrowers" element={<RequireRole role="founder"><Borrowers /></RequireRole>} />
              <Route path="escalations" element={<RequireRole role="founder"><Escalations /></RequireRole>} />
              <Route path="trust" element={<RequireRole role="founder"><TrustScore /></RequireRole>} />
              <Route path="analytics" element={<RequireRole role="founder"><Analytics /></RequireRole>} />
              <Route path="team" element={<RequireRole role="founder"><Team /></RequireRole>} />
              <Route path="notifications" element={<RequireRole role="founder"><NotificationsAdmin /></RequireRole>} />
              <Route path="system" element={<RequireRole role="dev"><System /></RequireRole>} />
              <Route path="users" element={<RequireRole role="dev"><UserManagement /></RequireRole>} />
              <Route path="logs" element={<RequireRole role="dev"><NotificationLogs /></RequireRole>} />
              <Route path="profile" element={<Profile />} />
              <Route path="denied" element={<Denied />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </BrowserRouter>
        </ToastProvider>
      </StoreProvider>
    </AuthProvider>
  )
}
