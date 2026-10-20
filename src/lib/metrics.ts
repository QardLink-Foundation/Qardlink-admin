import type { AppState, TrustTier } from './types'
import { TIERS } from './types'

export function getReferrer(state: AppState, id: string): { name: string; kind: 'partner' | 'team' } {
  const partner = state.partners.find((p) => p.id === id)
  if (partner) return { name: partner.org, kind: 'partner' }
  const member = state.team.find((t) => t.id === id)
  if (member) return { name: member.name, kind: 'team' }
  return { name: 'Unassigned', kind: 'team' }
}

export function poolMetrics(state: AppState) {
  const inflowLending = state.poolEvents
    .filter((e) => e.lendingShare)
    .reduce((sum, e) => sum + (e.lendingShare ?? 0), 0)
  const inflowOperational = state.poolEvents
    .filter((e) => e.operationalShare)
    .reduce((sum, e) => sum + (e.operationalShare ?? 0), 0)
  const disbursed = state.poolEvents
    .filter((e) => e.type === 'disbursement')
    .reduce((sum, e) => sum + e.amount, 0)
  const writtenOff = state.poolEvents
    .filter((e) => e.type === 'write_off')
    .reduce((sum, e) => sum + e.amount, 0)
  const contributed = state.poolEvents
    .filter((e) => e.type === 'contribution')
    .reduce((sum, e) => sum + e.amount, 0)
  const repaid = state.poolEvents
    .filter((e) => e.type === 'repayment')
    .reduce((sum, e) => sum + e.amount, 0)
  const lending = inflowLending - disbursed - writtenOff
  const operational = inflowOperational
  return {
    lending,
    operational,
    total: lending + operational,
    contributed,
    disbursed,
    writtenOff,
    repaid,
  }
}

export function platformMetrics(state: AppState) {
  const active = state.loans.filter((l) => l.status === 'active')
  const repaid = state.loans.filter((l) => l.status === 'repaid')
  const overdue = state.loans.filter((l) => l.status === 'overdue')
  const writtenOff = state.loans.filter((l) => l.status === 'written_off')
  const pending = state.loans.filter((l) => l.status === 'pending')
  const disbursed = state.loans
    .filter((l) => l.status !== 'pending')
    .reduce((sum, l) => sum + l.amount, 0)
  const closed = repaid.length + overdue.length + writtenOff.length
  const repaymentRate = closed === 0 ? 0 : (repaid.length / closed) * 100
  const outstanding = active.reduce((sum, l) => sum + l.outstanding, 0)
  const avgTrust =
    state.borrowers.reduce((sum, b) => sum + b.trustScore, 0) / (state.borrowers.length || 1)
  return {
    activeLoans: active.length,
    pendingApprovals: pending.length,
    totalDisbursed: disbursed,
    repaymentRate,
    outstanding,
    overdueLoans: overdue.length,
    writtenOff: writtenOff.length,
    activePartners: state.partners.filter((p) => p.status === 'active').length,
    totalBorrowers: state.borrowers.length,
    avgTrust,
    openEscalations: state.escalations.filter((e) => e.status !== 'resolved').length,
  }
}

export function tierDistribution(state: AppState): Record<TrustTier, number> {
  const base: Record<TrustTier, number> = { New: 0, Trusted: 0, Established: 0, Elite: 0 }
  state.borrowers.forEach((b) => {
    base[b.tier] += 1
  })
  return base
}

export function tierIndex(tier: TrustTier): number {
  return TIERS.indexOf(tier)
}

const monthKey = (iso: string) => iso.slice(0, 7)

function lastMonths(count: number): string[] {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1)
    return d.toISOString().slice(0, 7)
  })
}

const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-NG', { month: 'short' })

export function monthlyPoolFlow(state: AppState) {
  const months = lastMonths(6)
  return months.map((key) => {
    const events = state.poolEvents.filter((e) => monthKey(e.at) === key)
    return {
      month: monthLabel(key),
      contributions: Math.round(
        events.filter((e) => e.type === 'contribution').reduce((s, e) => s + e.amount, 0),
      ),
      disbursements: Math.round(
        events.filter((e) => e.type === 'disbursement').reduce((s, e) => s + e.amount, 0),
      ),
      repayments: Math.round(
        events.filter((e) => e.type === 'repayment').reduce((s, e) => s + e.amount, 0),
      ),
    }
  })
}

const quarterKey = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`
}

function lastQuarters(count: number): string[] {
  const now = new Date()
  const current = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3)
  return Array.from({ length: count }, (_, i) => {
    const n = current - (count - 1 - i)
    return `${Math.floor(n / 4)}-Q${(n % 4) + 1}`
  })
}

export function cohortRepayment(state: AppState, quarters = 6) {
  const rows = lastQuarters(quarters).map((key) => {
    const loans = state.loans.filter(
      (l) => quarterKey(l.createdAt) === key && l.status !== 'pending',
    )
    const onTrack = loans.filter((l) => l.status === 'repaid' || l.status === 'active').length
    const [year, q] = key.split('-')
    return {
      month: `${q} ${year.slice(2)}`,
      rate: loans.length === 0 ? null : Math.round((onTrack / loans.length) * 100),
      loans: loans.length,
    }
  })
  let end = rows.length
  while (end > 0 && rows[end - 1].loans === 0) end -= 1
  return rows.slice(0, end || 1)
}

export function partnerPerformance(state: AppState) {
  return state.partners
    .map((partner) => {
      const loans = state.loans.filter((l) => l.referrerId === partner.id && l.status !== 'pending')
      const repaid = loans.filter((l) => l.status === 'repaid').length
      const overdue = loans.filter((l) => l.status === 'overdue').length
      return {
        ...partner,
        loans: loans.length,
        repaid,
        overdue,
        onTimeRate:
          loans.length === 0 ? 0 : Math.round(((loans.length - overdue) / loans.length) * 100),
      }
    })
    .sort((a, b) => b.contributed - a.contributed)
}

export function notificationsByChannel(state: AppState) {
  return {
    email: state.notifications.filter((n) => n.channel === 'email').length,
    in_app: state.notifications.filter((n) => n.channel === 'in_app').length,
    webhook: state.notifications.filter((n) => n.channel === 'webhook').length,
  }
}
