import type {
  AppState,
  Borrower,
  Escalation,
  Loan,
  NotificationRecord,
  Partner,
  Payment,
  PoolEvent,
  TeamMember,
  TrustScoreEvent,
  TrustTier,
} from './types'
import { tierForScore } from './types'

const DAY = 86_400_000

function mulberry32(seed: number) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(1971)
const pick = <T,>(items: T[]): T => items[Math.floor(rand() * items.length)]
const between = (min: number, max: number) => min + rand() * (max - min)
const int = (min: number, max: number) => Math.floor(between(min, max + 1))
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString()
const rounded = (value: number, step = 500) => Math.round(value / step) * step

const firstNames = [
  'Adebayo', 'Chidinma', 'Emeka', 'Aisha', 'Tunde', 'Ngozi', 'Ibrahim', 'Funmilayo',
  'Yusuf', 'Blessing', 'Kelechi', 'Fatima', 'Segun', 'Amaka', 'Musa', 'Temilade',
  'Chukwuemeka', 'Halima', 'Oluwaseun', 'Zainab', 'Ifeanyi', 'Bisi', 'Sani', 'Chiamaka',
  'Gbenga', 'Rukayat', 'Uchenna', 'Deborah', 'Kabiru', 'Yetunde', 'Sadiq', 'Adaora',
  'Bola', 'Bashir', 'Ebere', 'Grace', 'Nasiru', 'Precious', 'Salihu', 'Ifeoma',
  'Adekunle', 'Nneka',
]
const lastNames = [
  'Ogunlesi', 'Okafor', 'Nwosu', 'Bello', 'Bakare', 'Eze', 'Suleiman', 'Adeyemi',
  'Danjuma', 'Oyelaran', 'Obi', 'Abubakar', 'Adeleke', 'Uche', 'Garba', 'Ajayi',
  'Ezeh', 'Yakubu', 'Adewale', 'Musa', 'Nnamdi', 'Adeyemo', 'Aliyu', 'Nnaji',
  'Ojo', 'Lawal', 'Madu', 'Danladi', 'Sani', 'Balogun', 'Ibrahim', 'Okonkwo',
  'Shittu', 'Mohammed', 'Chukwu', 'Ilori', 'Abdullahi', 'Effiong', 'Bello', 'Duru',
  'Adebola', 'Ibe',
]
const businesses = [
  ['Mama Cass Kitchen', 'Food & catering', 'Surulere, Lagos'],
  ['Okafor Fabrics', 'Textiles', 'Ariaria, Aba'],
  ['Green Mart Provisions', 'Retail', 'Wuse, Abuja'],
  ['Danjuma Agro Supplies', 'Agro-inputs', 'Kaduna South'],
  ['Lagos Threads Tailoring', 'Tailoring', 'Yaba, Lagos'],
  ['Zainab Spice House', 'Food & catering', 'Kano Municipal'],
  ['TechFix Repairs', 'Repairs', 'Ikeja, Lagos'],
  ['Amaka Beauty Studio', 'Personal care', 'Enugu North'],
  ['Garba Motors Spare Parts', 'Auto parts', 'Kano Municipal'],
  ['Sunrise Poultry', 'Poultry', 'Ogun State'],
  ['Adaora Crochet', 'Handicraft', 'Onitsha'],
  ['Ilori Print Shop', 'Printing', 'Ibadan North'],
  ['Kabiru Phone Accessories', 'Retail', 'Kaduna Central'],
  ['Efe Cold Room', 'Cold storage', 'Warri'],
  ['Balogun Groceries', 'Retail', 'Mushin, Lagos'],
]
const banks = ['GTBank', 'Access Bank', 'Zenith Bank', 'First Bank', 'UBA', 'Kuda', 'Wema Bank']
const purposes = [
  'Restock inventory for market season',
  'Purchase a second sewing machine',
  'Buy fabric in bulk before the wedding season',
  'Expand the poultry pen with 200 birds',
  'Buy a deep freezer for cold storage',
  'Restock spare parts for the workshop',
  'Upgrade repair tools and test equipment',
  'Bulk-buy spices ahead of Ramadan',
]

const partnerSeed: Array<[string, string, number, number, number, string]> = [
  ['An-Nur Cooperative', 'Musa Ibrahim', 18_000_000, 18, 4.8, 'active'],
  ['Lagos Central Welfare', 'Taibat Olawale', 14_500_000, 14, 4.5, 'active'],
  ['Barakah Foundation', 'Suleiman Adamu', 11_200_000, 11, 4.6, 'active'],
  ['Ihsan Trust', 'Fatima Sani', 9_800_000, 9, 4.1, 'active'],
  ['Al-Falah Cooperative', 'Abdul Rahman', 7_400_000, 7, 3.9, 'active'],
  ['Sunnah Relief Initiative', 'Hauwa Bello', 5_100_000, 5, 4.4, 'paused'],
]

const teamSeed: Array<[string, string, string, 'founder' | 'dev', string]> = [
  ['Amina Yusuf', 'Founder & Executive Director', 'amina@qardlink.ng', 'founder', 'active'],
  ['Tobi Adeyemi', 'Head of Operations', 'tobi@qardlink.ng', 'founder', 'active'],
  ['Chinedu Okeke', 'Platform Engineer', 'chinedu@qardlink.ng', 'dev', 'active'],
  ['Zainab Lawal', 'Support Engineer', 'zainab@qardlink.ng', 'dev', 'active'],
  ['Farouk Bello', 'Data & Systems Analyst', 'farouk@qardlink.ng', 'dev', 'invited'],
]

function buildPartners(): Partner[] {
  return partnerSeed.map(([org, rep, contributed, referrals, qualityRating, status], i) => ({
    id: `p${i + 1}`,
    org,
    rep,
    email: `partners@${org.toLowerCase().replace(/[^a-z]+/g, '')}.ng`,
    phone: `+234 80${int(1, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
    contributed,
    referrals,
    activeLoans: Math.round(referrals * 0.55),
    referralQuota: Math.max(referrals + int(3, 10), 12),
    qualityRating,
    subAccountBalance: rounded(contributed * 0.25, 1000),
    status: status as Partner['status'],
    joinedAt: ago(int(30, 700)),
  }))
}

function buildTeam(): TeamMember[] {
  return teamSeed.map(([name, role, email, accessLevel, status], i) => ({
    id: `t${i + 1}`,
    name,
    role,
    email,
    accessLevel,
    joinedAt: ago(int(120, 800)),
    status: status as TeamMember['status'],
    lastActive: ago(between(0, 4)),
  }))
}

function buildBorrowers(): Borrower[] {
  const referrers = [...Array(6)].map((_, i) => `p${i + 1}`).concat(
    [...Array(5)].map((_, i) => `t${i + 1}`),
  )
  return Array.from({ length: firstNames.length }, (_, i) => {
    const name = `${firstNames[i]} ${lastNames[i]}`
    const [businessName, businessType, location] = businesses[i % businesses.length]
    const score = i < 3 ? int(86, 96) : i < 14 ? int(70, 84) : i < 28 ? int(50, 69) : int(22, 49)
    const tier: TrustTier = tierForScore(score)
    const flagged = i === 8 || i === 23
    const suspended = i === 33
    return {
      id: `b${i + 1}`,
      name,
      email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@mail.ng`,
      phone: `+234 ${int(70, 91)} ${int(100, 999)} ${int(1000, 9999)}`,
      businessName,
      businessType,
      location,
      monthlyRevenue: rounded(between(280_000, 2_400_000), 10_000),
      yearsOperating: int(1, 12),
      bankName: pick(banks),
      accountNumber: `0${int(10, 99)}${int(100000, 999999)}`,
      accountName: name.toUpperCase(),
      trustScore: score,
      tier,
      referrerId: referrers[(i * 3) % referrers.length],
      joinedAt: ago(int(2, 620)),
      status: suspended ? 'suspended' : flagged ? 'flagged' : 'active',
      flagReason: flagged ? 'Bank account name mismatch on re-verification' : undefined,
    }
  })
}

function buildLoans(borrowers: Borrower[]): { loans: Loan[]; payments: Payment[] } {
  const loans: Loan[] = []
  const payments: Payment[] = []
  let loanIndex = 0

  borrowers.forEach((borrower, i) => {
    const loanCount = i < 8 ? 2 : 1
    for (let n = 0; n < loanCount; n++) {
      loanIndex += 1
      const amount = rounded(between(80_000, 1_200_000), 25_000)
      const frequency = rand() > 0.42 ? 'weekly' : 'monthly'
      const installmentsTotal = frequency === 'weekly' ? 12 : 6
      const isSecond = n === 1
      let status: Loan['status']
      if (isSecond) status = i >= 35 ? 'repaid' : 'pending'
      else if (i === 5 || i === 19 || i === 30) status = 'overdue'
      else if (i === 9) status = 'written_off'
      else if (i < 18) status = 'active'
      else if (i < 27) status = 'pending'
      else status = 'repaid'
      const created =
        status === 'pending'
          ? ago(int(1, 18))
          : status === 'repaid'
            ? ago(int(130, 540))
            : status === 'written_off'
              ? ago(int(260, 430))
              : status === 'overdue'
                ? ago(int(100, 280))
                : ago(int(25, 210))

      const paid = status === 'repaid' ? installmentsTotal : status === 'active' ? int(2, installmentsTotal - 2) : status === 'overdue' ? int(1, 3) : 0
      const outstanding = status === 'repaid' || status === 'pending' ? 0 : rounded(amount * (1 - paid / installmentsTotal), 500)

      const loan: Loan = {
        id: `L-${String(2400 + loanIndex)}`,
        borrowerId: borrower.id,
        referrerId: borrower.referrerId,
        amount,
        purpose: purposes[(i + n) % purposes.length],
        frequency,
        installmentsTotal,
        installmentsPaid: paid,
        outstanding,
        status,
        createdAt: created,
        disbursedAt: status === 'pending' ? undefined : created,
        deadline:
          status === 'pending'
            ? undefined
            : new Date(new Date(created).getTime() + installmentsTotal * (frequency === 'weekly' ? 7 : 30) * DAY).toISOString(),
        approvedBy: status === 'pending' ? undefined : i % 3 === 0 ? 'Amina Yusuf' : 'Tobi Adeyemi',
      }
      loans.push(loan)

      for (let p = 0; p < paid; p++) {
        payments.push({
          id: `PMT-${loan.id}-${p + 1}`,
          loanId: loan.id,
          borrowerId: borrower.id,
          amount: rounded(amount / installmentsTotal, 100),
          paidAt: new Date(new Date(created).getTime() + (p + 1) * (frequency === 'weekly' ? 7 : 30) * DAY).toISOString(),
        })
      }
    }
  })

  return { loans, payments }
}

function buildPoolEvents(partners: Partner[], loans: Loan[]): PoolEvent[] {
  const events: PoolEvent[] = []
  let index = 0
  const nextId = () => `PE-${String(1000 + ++index)}`

  partners.forEach((partner) => {
    events.push({
      id: nextId(),
      type: 'contribution',
      amount: partner.contributed,
      at: partner.joinedAt,
      partnerId: partner.id,
      note: `Pool contribution — ${partner.org}`,
      lendingShare: partner.contributed * 0.75,
      operationalShare: partner.contributed * 0.25,
    })
  })

  loans
    .filter((loan) => loan.status !== 'pending')
    .forEach((loan) => {
      events.push({
        id: nextId(),
        type: 'disbursement',
        amount: loan.amount,
        at: loan.disbursedAt ?? loan.createdAt,
        loanId: loan.id,
        note: `Loan disbursed — ${loan.id}`,
      })
    })

  const repaidLoans = loans.filter((loan) => loan.installmentsPaid > 0)
  repaidLoans.forEach((loan) => {
    const inflow = rounded(loan.amount * (loan.installmentsPaid / loan.installmentsTotal), 500)
    events.push({
      id: nextId(),
      type: 'repayment',
      amount: inflow,
      at: ago(int(2, 120)),
      loanId: loan.id,
      note: `Repayment received — ${loan.id}`,
      lendingShare: inflow * 0.75,
      operationalShare: inflow * 0.25,
    })
  })

  loans
    .filter((loan) => loan.status === 'written_off')
    .forEach((loan) => {
      events.push({
        id: nextId(),
        type: 'write_off',
        amount: loan.outstanding,
        at: ago(int(20, 60)),
        loanId: loan.id,
        note: `Write-off approved — ${loan.borrowerId}`,
      })
    })

  return events.sort((a, b) => b.at.localeCompare(a.at))
}

function buildEscalations(loans: Loan[], borrowers: Borrower[]): Escalation[] {
  return loans
    .filter((loan) => loan.status === 'overdue')
    .map((loan, i) => {
      const borrower = borrowers.find((b) => b.id === loan.borrowerId)!
      return {
        id: `ESC-${String(310 + i)}`,
        borrowerId: loan.borrowerId,
        loanId: loan.id,
        daysOverdue: int(6, 52),
        amountOverdue: rounded(loan.outstanding * between(0.25, 0.6), 500),
        status: i === 0 ? 'contacted' : i === 2 ? 'resolved' : 'open',
        openedAt: ago(int(4, 40)),
        referrerContactedAt: i === 0 || i === 2 ? ago(int(1, 5)) : undefined,
        notes:
          i === 0
            ? [
                {
                  at: ago(2),
                  by: 'Tobi Adeyemi',
                  text: `Called ${borrower.name}. Promised to clear the outstanding by Friday.`,
                },
              ]
            : [],
        recommendedAction:
          i % 2 === 0
            ? 'Call the referrer and agree a repayment date before suspending the account.'
            : 'Send a formal reminder, then schedule a field visit if no response in 72 hours.',
      }
    })
}

function buildTrustEvents(borrowers: Borrower[]): TrustScoreEvent[] {
  const reasons = [
    ['Repayment received on time', 4],
    ['Loan fully repaid', 7],
    ['Referrer verification completed', 2],
    ['Missed installment', -8],
    ['Late payment', -4],
    ['Manual review adjustment', 3],
  ] as const
  const events: TrustScoreEvent[] = []
  let index = 0
  borrowers.forEach((borrower, i) => {
    const count = int(1, 3)
    let score = borrower.trustScore
    for (let n = 0; n < count; n++) {
      const [reason, delta] = reasons[(i + n) % reasons.length]
      events.push({
        id: `TS-${String(5000 + ++index)}`,
        borrowerId: borrower.id,
        delta,
        reason,
        at: ago(int(1, 300)),
        scoreAfter: Math.max(0, Math.min(100, score)),
        flagged: delta < 0 && rand() > 0.72,
        reviewed: rand() > 0.75,
      })
      score -= delta
    }
  })
  return events.sort((a, b) => b.at.localeCompare(a.at))
}

function buildNotifications(team: TeamMember[]): NotificationRecord[] {
  const templates: Array<[string, string, NotificationRecord['channel'], NotificationRecord['status'], string]> = [
    ['Loan approved', 'Your application has been approved and will be disbursed within 24 hours.', 'email', 'delivered', 'loan.approved'],
    ['Payment received', 'We received your repayment. Your trust score has been updated.', 'in_app', 'delivered', 'payment.received'],
    ['Payment due reminder', 'Your next installment is due in 3 days.', 'email', 'delivered', 'payment.reminder'],
    ['Referrer linked', 'A new borrower selected you as their referrer.', 'in_app', 'delivered', 'referral.linked'],
    ['Virtual account generated', 'A dynamic virtual account was created for this transaction.', 'webhook', 'delivered', 'payment.virtual_account'],
    ['Webhook delivery failed', 'Paystack settlement webhook returned 502. Retry scheduled.', 'webhook', 'failed', 'webhook.retry'],
    ['Escalation opened', 'A borrower you referred is 14 days overdue.', 'email', 'queued', 'escalation.opened'],
    ['Trust score updated', 'Trust score adjusted after manual review.', 'in_app', 'delivered', 'trust.updated'],
  ]
  return Array.from({ length: 22 }, (_, i) => {
    const [title, body, channel, status, trigger] = templates[i % templates.length]
    return {
      id: `NTF-${String(8100 + i)}`,
      audience: i % 3 === 0 ? 'All borrowers' : i % 3 === 1 ? 'Founder team' : 'Dev team',
      title,
      body,
      at: ago(between(0.05, 24)),
      channel,
      status: i === 5 ? 'failed' : status,
      trigger,
      attempts: i === 5 ? 3 : 1,
    }
  }).concat([
    {
      id: 'NTF-9001',
      audience: team[2].name,
      title: 'Queue depth above threshold',
      body: 'Notification queue reached 1,240 jobs for more than 5 minutes.',
      at: ago(0.2),
      channel: 'webhook',
      status: 'delivered',
      trigger: 'system.queue_alert',
      attempts: 1,
    },
  ])
}

export function buildSeedState(): AppState {
  const partners = buildPartners()
  const team = buildTeam()
  const borrowers = buildBorrowers()
  const { loans, payments } = buildLoans(borrowers)
  const poolEvents = buildPoolEvents(partners, loans)
  const escalations = buildEscalations(loans, borrowers)
  const trustEvents = buildTrustEvents(borrowers)
  const notifications = buildNotifications(team)

  const referralsByPartner = new Map<string, number>()
  borrowers.forEach((b) => {
    referralsByPartner.set(b.referrerId, (referralsByPartner.get(b.referrerId) ?? 0) + 1)
  })
  const activeByPartner = new Map<string, number>()
  loans
    .filter((l) => l.status === 'active')
    .forEach((l) => {
      activeByPartner.set(l.referrerId, (activeByPartner.get(l.referrerId) ?? 0) + 1)
    })

  const enrichedPartners = partners.map((p) => ({
    ...p,
    referrals: referralsByPartner.get(p.id) ?? p.referrals,
    activeLoans: activeByPartner.get(p.id) ?? 0,
  }))

  return {
    borrowers,
    loans,
    payments,
    poolEvents,
    partners: enrichedPartners,
    escalations,
    trustEvents,
    team,
    notifications,
    system: {
      uptimePct: 99.98,
      errorRate: 0.12,
      p95LatencyMs: 184,
      queueDepth: 12,
      lastDeploy: ago(1.6),
      webhooks: [
        { id: 'wh1', name: 'Paystack settlements', url: 'https://api.qardlink.ng/hooks/paystack', status: 'healthy', deliveryPct: 99.6, lastDelivery: ago(0.01) },
        { id: 'wh2', name: 'Transactional email', url: 'https://api.qardlink.ng/hooks/mail', status: 'healthy', deliveryPct: 99.9, lastDelivery: ago(0.02) },
        { id: 'wh3', name: 'SMS delivery receipts', url: 'https://api.qardlink.ng/hooks/sms', status: 'degraded', deliveryPct: 94.2, lastDelivery: ago(0.3) },
        { id: 'wh4', name: 'Trust score sync', url: 'https://api.qardlink.ng/hooks/trust', status: 'healthy', deliveryPct: 100, lastDelivery: ago(0.005) },
      ],
    },
    notificationTriggers: [
      { id: 'tr1', label: 'Loan approved', channel: 'email', enabled: true },
      { id: 'tr2', label: 'Payment received', channel: 'in_app', enabled: true },
      { id: 'tr3', label: 'Payment due reminder (3 days)', channel: 'email', enabled: true },
      { id: 'tr4', label: 'Referral approval request', channel: 'in_app', enabled: true },
      { id: 'tr5', label: 'Missed payment alert', channel: 'email', enabled: true },
      { id: 'tr6', label: 'Escalation opened', channel: 'webhook', enabled: false },
    ],
  }
}
