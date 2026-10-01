# Reminders — Mobile

Ionic + React cross-platform mobile app for **Reminders**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Features

- **Reminders** (Home tab): add a reminder with a date/time and optional
  daily/weekly/monthly repeat. Reminders are grouped into Overdue, Today,
  Upcoming and Done, saved in `localStorage`, and completing a repeating
  reminder rolls it to its next occurrence (monthly repeats clamp to month end).
- Reminder logic lives in `src/lib/reminders.ts` (pure TypeScript, unit-tested).

## Tech Stack

- **Framework:** Ionic 8 + React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **UI:** Ionic Components + Ionicons

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev         # Vite dev server
npm run typecheck   # tsc (noEmit)
npm run lint        # ESLint flat config (typescript-eslint + react-hooks)
npm test            # vitest unit tests for src/lib
npm run build       # tsc && vite build
```

CI (`.github/workflows/build.yml`) runs all of the above with `npm ci`; failures
are not masked.

## Build

```bash
npm run build
# Deploy as native app via Capacitor or as PWA
```

## Related

- **Frontend:** [bookchaowalit-website/reminders-frontend](https://github.com/bookchaowalit-website/reminders-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
