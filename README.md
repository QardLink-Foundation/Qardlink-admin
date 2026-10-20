# QardLink Admin

A UI-only, fully interactive demo of the QardLink Foundation console — a halal, riba-free micro-lending platform for Nigerian small businesses. All data is deterministic mock data seeded in the browser; there is no backend.

## Run

```bash
npm install
npm run dev
```

Production preview:

```bash
npm run build
npm run preview
```

## Demo accounts

| Role | Email | Password | Lands on |
| --- | --- | --- | --- |
| Founder | `amina@qardlink.ng` | `qardlink` | `/overview` |
| Developer | `chinedu@qardlink.ng` | `qardlink` | `/system` |

Sessions are stored in `sessionStorage` under `qardlink.session`. Reset the demo by signing out.

## What's inside

- **Founder surfaces** — Overview, Loan queue (approve/decline), Loans, Borrowers, Partners, Trust & compliance, Pool, Analytics, Escalations, Notifications, Settings.
- **Developer surfaces** — System health, User management, Notification delivery logs. No financial data is exposed to this role.
- **Role guards** — wrong-role visits are redirected to the role's home; unknown routes render a branded 404.
- **Design system** — "Emerald Grove" tokens, Instrument Sans/Serif, emerald primary with operational accents; responsive tables collapse to card lists on mobile; Recharts visualisations with reduced motion respected.
- **Interactivity** — approve/decline with pool balance updates and toasts, escalation case viewer, notification replay, webhook re-sync, profile settings, command palette (`⌘K` / `Ctrl+K`).

## Structure

```
src/
  components/app/   shell, command palette
  components/ui/    design-system primitives (table, overlay, chart, etc.)
  lib/              auth, store, seed, metrics, formatting
  pages/            founder/, dev/, Login, Profile, NotFound
```

See `PRODUCT.md` for the product brief and `DESIGN.md` for the visual system.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — type-check and production build
- `npm run preview` — serve the production build
- `npm run lint` — ESLint
