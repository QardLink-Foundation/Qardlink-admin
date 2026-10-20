export type TrustTier = 'New' | 'Trusted' | 'Established' | 'Elite'
export type LoanStatus = 'pending' | 'active' | 'repaid' | 'overdue' | 'written_off'
export type RepaymentFrequency = 'weekly' | 'monthly'
export type CandidateStatus = 'active' | 'flagged' | 'suspended'

export interface Borrower {
  id: string
  name: string
  email: string
  phone: string
  businessName: string
  businessType: string
  location: string
  monthlyRevenue: number
  yearsOperating: number
  bankName: string
  accountNumber: string
  accountName: string
  trustScore: number
  tier: TrustTier
  referrerId: string
  joinedAt: string
  status: CandidateStatus
  flagReason?: string
}

export interface Loan {
  id: string
  borrowerId: string
  referrerId: string
  amount: number
  purpose: string
  frequency: RepaymentFrequency
  installmentsTotal: number
  installmentsPaid: number
  outstanding: number
  status: LoanStatus
  createdAt: string
  disbursedAt?: string
  deadline?: string
  approvedBy?: string
}

export interface Payment {
  id: string
  loanId: string
  borrowerId: string
  amount: number
  paidAt: string
}

export type PoolEventType =
  | 'contribution'
  | 'disbursement'
  | 'repayment'
  | 'allocation'
  | 'write_off'

export interface PoolEvent {
  id: string
  type: PoolEventType
  amount: number
  at: string
  partnerId?: string
  loanId?: string
  note: string
  lendingShare?: number
  operationalShare?: number
}

export interface Partner {
  id: string
  org: string
  rep: string
  email: string
  phone: string
  contributed: number
  referrals: number
  activeLoans: number
  referralQuota: number
  qualityRating: number
  subAccountBalance: number
  status: 'active' | 'paused' | 'suspended'
  joinedAt: string
}

export interface EscalationNote {
  at: string
  by: string
  text: string
}

export interface Escalation {
  id: string
  borrowerId: string
  loanId: string
  daysOverdue: number
  amountOverdue: number
  status: 'open' | 'contacted' | 'resolved'
  openedAt: string
  referrerContactedAt?: string
  notes: EscalationNote[]
  recommendedAction: string
}

export interface TrustScoreEvent {
  id: string
  borrowerId: string
  delta: number
  reason: string
  at: string
  scoreAfter: number
  flagged?: boolean
  reviewed?: boolean
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  accessLevel: 'founder' | 'dev'
  joinedAt: string
  status: 'active' | 'invited' | 'suspended'
  lastActive: string
}

export type NotificationChannel = 'email' | 'in_app' | 'webhook'
export type NotificationStatus = 'delivered' | 'failed' | 'queued'

export interface NotificationRecord {
  id: string
  audience: string
  title: string
  body: string
  at: string
  channel: NotificationChannel
  status: NotificationStatus
  trigger: string
  attempts: number
}

export interface WebhookEndpoint {
  id: string
  name: string
  url: string
  status: 'healthy' | 'degraded' | 'failing'
  deliveryPct: number
  lastDelivery: string
}

export interface SystemHealth {
  uptimePct: number
  errorRate: number
  p95LatencyMs: number
  queueDepth: number
  lastDeploy: string
  webhooks: WebhookEndpoint[]
}

export interface AppState {
  borrowers: Borrower[]
  loans: Loan[]
  payments: Payment[]
  poolEvents: PoolEvent[]
  partners: Partner[]
  escalations: Escalation[]
  trustEvents: TrustScoreEvent[]
  team: TeamMember[]
  notifications: NotificationRecord[]
  system: SystemHealth
  notificationTriggers: { id: string; label: string; channel: NotificationChannel; enabled: boolean }[]
}

export const TIERS: TrustTier[] = ['New', 'Trusted', 'Established', 'Elite']

export function tierForScore(score: number): TrustTier {
  if (score >= 85) return 'Elite'
  if (score >= 70) return 'Established'
  if (score >= 50) return 'Trusted'
  return 'New'
}
