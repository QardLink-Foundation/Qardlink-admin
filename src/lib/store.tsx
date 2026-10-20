import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { buildSeedState } from './seed'
import type { AppState, Loan, NotificationRecord } from './types'
import { tierForScore } from './types'

type Action =
  | { type: 'APPROVE_LOAN'; loanId: string; by: string }
  | { type: 'REJECT_LOAN'; loanId: string; by: string; note: string }
  | { type: 'RECORD_PAYMENT'; loanId: string; by: string }
  | { type: 'FLAG_BORROWER'; borrowerId: string; reason: string }
  | { type: 'SUSPEND_BORROWER'; borrowerId: string }
  | { type: 'RESTORE_BORROWER'; borrowerId: string }
  | { type: 'SET_PARTNER_STATUS'; partnerId: string; status: 'active' | 'suspended' | 'paused' }
  | {
      type: 'ONBOARD_PARTNER'
      org: string
      rep: string
      email: string
      contributed: number
      quota: number
    }
  | { type: 'ADD_MEMBER'; name: string; email: string; role: string; accessLevel: 'founder' | 'dev' }
  | { type: 'REMOVE_MEMBER'; memberId: string }
  | { type: 'CONTACT_REFERRER'; escalationId: string; by: string }
  | { type: 'RESOLVE_ESCALATION'; escalationId: string; by: string }
  | { type: 'REVIEW_TRUST_EVENT'; eventId: string }
  | { type: 'TOGGLE_TRIGGER'; triggerId: string }
  | { type: 'RETRY_NOTIFICATION'; notificationId: string }

function notify(state: AppState, record: Omit<NotificationRecord, 'id'>): NotificationRecord[] {
  return [{ ...record, id: `NTF-${Math.floor(Math.random() * 9000 + 1000)}` }, ...state.notifications]
}

function applyPayment(loan: Loan, state: AppState): AppState {
  const paid = Math.min(loan.installmentsPaid + 1, loan.installmentsTotal)
  const complete = paid >= loan.installmentsTotal
  const amount = Math.round(loan.amount / loan.installmentsTotal)
  const outstanding = complete ? 0 : Math.max(0, loan.outstanding - amount)
  const now = new Date().toISOString()
  const updated: Loan = {
    ...loan,
    installmentsPaid: paid,
    outstanding,
    status: complete ? 'repaid' : loan.status === 'overdue' ? 'active' : loan.status,
  }
  const borrower = state.borrowers.find((b) => b.id === loan.borrowerId)!
  const delta = complete ? 7 : 4
  const score = Math.min(100, borrower.trustScore + delta)

  return {
    ...state,
    loans: state.loans.map((l) => (l.id === loan.id ? updated : l)),
    borrowers: state.borrowers.map((b) =>
      b.id === borrower.id ? { ...b, trustScore: score, tier: tierForScore(score) } : b,
    ),
    payments: [
      {
        id: `PMT-${loan.id}-${paid}`,
        loanId: loan.id,
        borrowerId: borrower.id,
        amount,
        paidAt: now,
      },
      ...state.payments,
    ],
    poolEvents: [
      {
        id: `PE-${Math.floor(Math.random() * 9000 + 1000)}`,
        type: 'repayment',
        amount,
        at: now,
        loanId: loan.id,
        note: `Repayment received — ${loan.id}`,
        lendingShare: amount * 0.75,
        operationalShare: amount * 0.25,
      },
      ...state.poolEvents,
    ],
    trustEvents: [
      {
        id: `TS-${Math.floor(Math.random() * 9000 + 1000)}`,
        borrowerId: borrower.id,
        delta,
        reason: complete ? 'Loan fully repaid' : 'Repayment received on time',
        at: now,
        scoreAfter: score,
      },
      ...state.trustEvents,
    ],
    escalations: state.escalations.map((e) =>
      e.loanId === loan.id && complete ? { ...e, status: 'resolved' } : e,
    ),
    notifications: notify(state, {
      audience: borrower.name,
      title: 'Payment received',
      body: `We received ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)}. Your trust score is now ${score}.`,
      at: now,
      channel: 'in_app',
      status: 'delivered',
      trigger: 'payment.received',
      attempts: 1,
    }),
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'APPROVE_LOAN': {
      const loan = state.loans.find((l) => l.id === action.loanId)
      if (!loan) return state
      const now = new Date()
      const deadline = new Date(
        now.getTime() + loan.installmentsTotal * (loan.frequency === 'weekly' ? 7 : 30) * 86_400_000,
      ).toISOString()
      const borrower = state.borrowers.find((b) => b.id === loan.borrowerId)
      return {
        ...state,
        loans: state.loans.map((l) =>
          l.id === loan.id
            ? {
                ...l,
                status: 'active',
                approvedBy: action.by,
                disbursedAt: now.toISOString(),
                deadline,
              }
            : l,
        ),
        poolEvents: [
          {
            id: `PE-${Math.floor(Math.random() * 9000 + 1000)}`,
            type: 'disbursement',
            amount: loan.amount,
            at: now.toISOString(),
            loanId: loan.id,
            note: `Loan disbursed — ${loan.id}`,
          },
          ...state.poolEvents,
        ],
        notifications: notify(state, {
          audience: borrower?.name ?? loan.borrowerId,
          title: 'Loan approved',
          body: `Loan ${loan.id} was approved and disbursed. Repayment begins on the next cycle.`,
          at: now.toISOString(),
          channel: 'email',
          status: 'delivered',
          trigger: 'loan.approved',
          attempts: 1,
        }),
      }
    }
    case 'REJECT_LOAN': {
      const loan = state.loans.find((l) => l.id === action.loanId)
      if (!loan) return state
      const borrower = state.borrowers.find((b) => b.id === loan.borrowerId)
      return {
        ...state,
        loans: state.loans.filter((l) => l.id !== loan.id),
        notifications: notify(state, {
          audience: borrower?.name ?? loan.borrowerId,
          title: 'Application not approved',
          body: action.note || 'The committee could not approve this application at this time.',
          at: new Date().toISOString(),
          channel: 'email',
          status: 'delivered',
          trigger: 'loan.rejected',
          attempts: 1,
        }),
      }
    }
    case 'RECORD_PAYMENT': {
      const loan = state.loans.find((l) => l.id === action.loanId)
      if (!loan) return state
      return applyPayment(loan, state)
    }
    case 'FLAG_BORROWER':
      return {
        ...state,
        borrowers: state.borrowers.map((b) =>
          b.id === action.borrowerId ? { ...b, status: 'flagged', flagReason: action.reason } : b,
        ),
      }
    case 'SUSPEND_BORROWER':
      return {
        ...state,
        borrowers: state.borrowers.map((b) =>
          b.id === action.borrowerId ? { ...b, status: 'suspended' } : b,
        ),
      }
    case 'RESTORE_BORROWER':
      return {
        ...state,
        borrowers: state.borrowers.map((b) =>
          b.id === action.borrowerId ? { ...b, status: 'active', flagReason: undefined } : b,
        ),
      }
    case 'ONBOARD_PARTNER': {
      const id = `p${state.partners.length + 1}-${Date.now()}`
      const now = new Date().toISOString()
      return {
        ...state,
        partners: [
          ...state.partners,
          {
            id,
            org: action.org,
            rep: action.rep,
            email: action.email,
            phone: '—',
            contributed: action.contributed,
            referrals: 0,
            activeLoans: 0,
            referralQuota: action.quota,
            qualityRating: 0,
            subAccountBalance: action.contributed * 0.25,
            status: 'active',
            joinedAt: now,
          },
        ],
        poolEvents: [
          {
            id: `PE-${Math.floor(Math.random() * 9000 + 1000)}`,
            type: 'contribution',
            amount: action.contributed,
            at: now,
            partnerId: id,
            note: `Onboarding contribution — ${action.org}`,
            lendingShare: action.contributed * 0.75,
            operationalShare: action.contributed * 0.25,
          },
          ...state.poolEvents,
        ],
      }
    }
    case 'SET_PARTNER_STATUS':
      return {
        ...state,
        partners: state.partners.map((p) =>
          p.id === action.partnerId ? { ...p, status: action.status } : p,
        ),
      }
    case 'ADD_MEMBER':
      return {
        ...state,
        team: [
          ...state.team,
          {
            id: `t${state.team.length + 1}-${Date.now()}`,
            name: action.name,
            email: action.email,
            role: action.role,
            accessLevel: action.accessLevel,
            joinedAt: new Date().toISOString(),
            status: 'invited',
            lastActive: new Date().toISOString(),
          },
        ],
      }
    case 'REMOVE_MEMBER':
      return { ...state, team: state.team.filter((m) => m.id !== action.memberId) }
    case 'CONTACT_REFERRER':
      return {
        ...state,
        escalations: state.escalations.map((e) =>
          e.id === action.escalationId
            ? {
                ...e,
                status: 'contacted',
                referrerContactedAt: new Date().toISOString(),
                notes: [
                  ...e.notes,
                  {
                    at: new Date().toISOString(),
                    by: action.by,
                    text: 'Referrer contacted by phone. Awaiting a repayment commitment.',
                  },
                ],
              }
            : e,
        ),
      }
    case 'RESOLVE_ESCALATION':
      return {
        ...state,
        escalations: state.escalations.map((e) =>
          e.id === action.escalationId
            ? {
                ...e,
                status: 'resolved',
                notes: [
                  ...e.notes,
                  {
                    at: new Date().toISOString(),
                    by: action.by,
                    text: 'Repayment arrangement agreed. Escalation closed.',
                  },
                ],
              }
            : e,
        ),
      }
    case 'REVIEW_TRUST_EVENT':
      return {
        ...state,
        trustEvents: state.trustEvents.map((e) =>
          e.id === action.eventId ? { ...e, reviewed: true, flagged: false } : e,
        ),
      }
    case 'TOGGLE_TRIGGER':
      return {
        ...state,
        notificationTriggers: state.notificationTriggers.map((t) =>
          t.id === action.triggerId ? { ...t, enabled: !t.enabled } : t,
        ),
      }
    case 'RETRY_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.notificationId
            ? { ...n, status: 'delivered', attempts: n.attempts + 1 }
            : n,
        ),
      }
    default:
      return state
  }
}

interface StoreValue {
  state: AppState
  dispatch: Dispatch<Action>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildSeedState)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
