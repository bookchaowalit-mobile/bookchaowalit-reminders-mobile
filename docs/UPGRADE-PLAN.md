# Upgrade Plan

## Current state

Score: 5/10 (was 2/10) — working reminders (add, repeat, group, complete, delete,
localStorage) with tested logic and honest CI; no notifications yet.

## Backlog

- P0: Local notifications at due time (Capacitor `@capacitor/local-notifications`);
  add Capacitor config + android/ios projects.
- P1: Edit a reminder; snooze (+10 min / +1 h).
- P1: Code-split Ionic (bundle is ~1 MB; Vite warns about chunk size).
- P2: Sync with the reminders backend; Explore tab with stats (completed this week).
- P2: PWA manifest + service worker for offline install.

## Done in this pass

- Fixed missing `setupIonicReact()` and the missing `padding.css`/`text-alignment.css`
  imports (so `ion-padding` actually applied).
- Reminders screen backed by pure `src/lib/reminders.ts` (month-end-safe repeats,
  roll-forward completion, grouping, formatting, defensive storage parsing) with 9
  vitest tests (verified in UTC, America/New_York and Asia/Bangkok).
- `npm run lint` was broken (ESLint not installed); added ESLint 9 flat config.
- CI runs `npm ci`, typecheck, lint, tests and build without `|| true`; lockfile committed.

## Done in this pass (pass 2)

Score: 6/10 (was 5/10) — the Home page now has component tests; notifications (P0) still need Capacitor native projects.

- Component tests: `src/pages/__tests__/Home.test.tsx` (Vitest + jsdom + @testing-library/react) covers restore from localStorage, add-and-persist via Ionic `ionInput` events, empty-title validation, and delete. 13 tests total.
- Advisories: `npm audit --omit=dev` is clean. Dev-only findings (vite 5 / esbuild dev server, vitest 3) need major upgrades (vite 6+, vitest 4) — not auto-fixed.
- Verified: typecheck, lint, vitest, `npm run build`.

## Done in this pass (pass 3)

Score: 6.5/10 (was 6/10) — edge-case hunt in `src/lib/reminders.ts` found real bugs.

- Bug: monthly reminders on the 29th–31st drifted permanently (Jan 31 -> Feb 28 -> Mar 28 ...).
  Reminders now remember `dayOfMonth` and return to Mar 31 / Apr 30; stored values outside 1–31 are dropped.
- Bug: a title of only zero-width characters (U+200B/U+200D/U+2060) passed "required" validation.
- Bug: the 120-character title limit counted UTF-16 units, so 61 emoji were "too long".
- Guard test: daily repeats keep 09:30 wall-clock across a DST change (checked with TZ=Europe/Berlin).
- Verified: typecheck, lint, vitest (UTC, Europe/Berlin, America/New_York, Asia/Bangkok), build;
  the new regression tests fail on the previous code.
