import type { LoanStatus, TrustTier } from './types'

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

export function money(value: number): string {
  return naira.format(value).replace('NGN', '₦').replace(/\s/g, '')
}

export function moneyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}b`
  if (Math.abs(value) >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}m`
  if (Math.abs(value) >= 1_000) return `₦${Math.round(value / 1_000)}k`
  return money(value)
}

export function number(value: number): string {
  return new Intl.NumberFormat('en-NG').format(value)
}

export function percent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relative(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (Math.abs(mins) < 1) return 'just now'
  if (Math.abs(mins) < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (Math.abs(hours) < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return `${days}d ago`
  return shortDate(iso)
}

export function daysUntil(iso: string, now = Date.now()): number {
  return Math.ceil((new Date(iso).getTime() - now) / 86_400_000)
}

export const loanStatusLabel: Record<LoanStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  repaid: 'Repaid',
  overdue: 'Overdue',
  written_off: 'Written off',
}

export const loanStatusTone: Record<LoanStatus, 'due' | 'positive' | 'neutral' | 'overdue'> = {
  pending: 'due',
  active: 'positive',
  repaid: 'neutral',
  overdue: 'overdue',
  written_off: 'neutral',
}

export const tierLabel: Record<TrustTier, string> = {
  New: 'New',
  Trusted: 'Trusted',
  Established: 'Established',
  Elite: 'Elite',
}

export function frequencyLabel(value: 'weekly' | 'monthly'): string {
  return value === 'weekly' ? 'Weekly' : 'Monthly'
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
