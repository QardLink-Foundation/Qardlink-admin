# QardLink Admin — Design System

Concept: **the sadaqah ledger.** A calm, institutional workspace where trust is quantified. The interface treats money and trust like instruments — precise figures, visible status, colour used only where it means something. Surface mode is **Operate**: precision and restraint, not expression.

## Colour

**Emerald Grove** — a deep, confident emerald-teal with warm sage neutrals.

| Token | Hex | Use |
|---|---|---|
| `emerald-600` | `#0B6B4F` | Primary: actions, active nav, positive figures |
| `emerald-900` | `#083D2E` | Sidebar / the "vault" contrast |
| `emerald-50` | `#EAF4F0` | Selected rows, soft fills |
| `canvas` | `#F6F8F6` | App background |
| `surface` | `#FFFFFF` | Panels and tables |
| `line` / `line-strong` | `#E2E9E3` / `#CFDAD2` | Quiet borders, no shadows-as-separation |
| `ink` / `ink-muted` / `ink-subtle` | `#17221C` / `#5C6B62` / `#8A978F` | Text hierarchy |
| `pool` | `#0E7490` | Pool / inflow / liquidity |
| `due` | `#B45309` | Pending, due soon |
| `overdue` | `#A93226` | Overdue, escalation, destructive |
| `info` | `#3F5F8F` | Neutral system state |

Every status colour is paired with an icon and a word — never colour alone.

## Type

One family carries the UI: **Instrument Sans Variable**, with **Instrument Serif** reserved for the login hero and empty-state moments. Numbers that are scanned or compared (money, trust scores, counts, dates in tables) always use tabular figures (`.tnum`).

Scale: 11 micro-label / 12 table meta / 13 dense / 14 body / 16 strong / 20 section / 24 page title / 30 KPI figure. Weights 400 / 500 / 600 only. Letter-spacing tightens slightly as size grows.

## Layout

Fixed dark sidebar (240px), sticky topbar (56px, search + role + notifications), scrolling content at max-width 1280 with 24px gutters. Data pages follow a fixed rhythm: page header → filter rail → content panel. Cards are used only where a card is the object (a partner, a team member); tables and panels are separated by hairlines, not shadows.

Metric groups use a flat strip with shared alignment and thin dividers. Each screen gives its actionable or defining figure the largest type; supporting figures remain quieter. On phones, filters fill the available width, compact buttons grow to a comfortable touch size, and data tables become labelled two-column records.

## Structure that carries meaning

Status pills, tier progress, the 75/25 split bar, escalation day-counts and timeline rails all encode real state. No numbered markers unless the content is genuinely a sequence (approval steps, escalation log, trust-score history).

## Motion (Apple-derived)

Feedback on pointer-down, not release. Motion starts from the current on-screen value, carries the user's velocity, and can be interrupted. Springs for anything the hand touches (drawers, modals, toasts); short ease-out for state changes. Nothing animates without a reason — no entrance animations sprinkled across a page. `prefers-reduced-motion` is respected globally.

## Voice

Plain, specific, active. A button says exactly what happens ("Approve loan", "Restore partner"), and the toast repeats it ("Loan approved"). Errors state what happened and how to fix it, without apology. An empty screen is an invitation to act.

## Component inventory

Buttons (primary/secondary/ghost/destructive, with pressed and disabled states) · Input · Select · Textarea · Search input · Status pill (loan, trust tier, escalation, delivery) · Panel · Card · Data table (sort, filter chips, sticky header, row select, aggregate footer) · KPI stat · Page header · Detail drawer · Modal (confirm / approve-reject with notes) · Toast · Tier progress bar · Split bar · Timeline · Avatar + role chip · Sidebar nav (two role variants) · Topbar · Command palette (⌘K) · Empty state · Error state · Skeleton.
