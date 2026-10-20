# QardLink Admin — Product

## What this is

The internal administration surface for **QardLink**, a halal (riba-free) micro-lending initiative. QardLink pools charitable and partner capital, lends it as interest-free *qard hasan* loans to small businesses, and recycles repayments back into the pool. Trust is the product's central instrument: every borrower carries a **Trust Score** that moves through tiers (New → Trusted → Established → Elite) as they repay.

This repository is the **admin console only**, built UI-first with seeded mock data so the whole thing is demoable end to end. No backend, no real money.

## Who uses it

Two authenticated roles, one shared login page:

**Founder (Foundation Admin)** — full access. Owns the pool, approvals, partners, borrowers, escalations, trust-score oversight, team and analytics. Sees every financial figure.

**Dev Team Member** — scoped access. Platform operations only: system health, webhook/queue status, notification delivery logs, and a user list stripped of financial data. Must not see pool balances, loan amounts, borrower financials, or partner commercial terms.

## Surfaces (mode: Operate)

The visitor is completing a task. Scanability, consistency, native expectations and the real usage scene outrank expression. Brand lives in precise details: colour only where it encodes meaning, figures that line up, status that is legible at a glance.

| Surface | Role | Job |
|---|---|---|
| Login | both | Route to the correct dashboard by role |
| Admin Overview | founder | Read platform health in one screen, act on what needs action |
| Loan Approval Queue | founder | Decide on pending applications with full context |
| All Loans | founder | Search the complete ledger |
| Pool Management | founder | Understand pool balance, inflows/outflows and the 75/25 split |
| Partner Management | founder | Track partner contribution, referral quality, onboarding |
| Borrower Management | founder | Find a borrower, see history, flag or suspend |
| Escalation Center | founder | Triage missed payments across all borrowers |
| Team & Roles | founder | Manage team members and access levels |
| Trust Score Oversight | founder | Audit every score change, catch anomalies |
| Analytics & Reports | founder | Read repayment, recycling, partner and tier performance |
| Notifications Management | founder | Read system notification log, configure triggers |
| System Overview | dev | Platform health: uptime, errors, webhooks, queues |
| User Management | dev | View users, flag technical issues (no financials) |
| Notification Logs | dev | Technical delivery log for email/in-app |
| Profile | both | Own details and settings |

## Domain vocabulary

Loan lifecycle: `pending → active → repaid`, with `overdue` and `written_off` branches. Repayment frequency is weekly or monthly. The 75/25 split routes 75% of inflow to the lending pool and 25% to the operational pool. Partners contribute to the pool and refer borrowers; a borrower names exactly one referrer at registration.

## Non-goals

Public marketing, borrower portal, partner portal, real authentication, real payments, persistence. Everything lives in an in-memory store for the demo.
