import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Role = 'founder' | 'dev'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  title: string
}

interface Account extends SessionUser {
  password: string
}

export const DEMO_ACCOUNTS: Account[] = [
  {
    id: 't1',
    name: 'Amina Yusuf',
    email: 'amina@qardlink.ng',
    password: 'qardlink',
    role: 'founder',
    title: 'Founder & Executive Director',
  },
  {
    id: 't3',
    name: 'Chinedu Okeke',
    email: 'chinedu@qardlink.ng',
    password: 'qardlink',
    role: 'dev',
    title: 'Platform Engineer',
  },
]

const STORAGE_KEY = 'qardlink.session'

function readSession(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

interface AuthValue {
  user: SessionUser | null
  login: (email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readSession)

  const value = useMemo<AuthValue>(
    () => ({
      user,
      login(email, password) {
        const account = DEMO_ACCOUNTS.find(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
        )
        if (!account || account.password !== password) {
          return { ok: false, error: 'That email and password do not match an account.' }
        }
        const session: SessionUser = {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role,
          title: account.title,
        }
        setUser(session)
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
        return { ok: true }
      },
      logout() {
        setUser(null)
        sessionStorage.removeItem(STORAGE_KEY)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
