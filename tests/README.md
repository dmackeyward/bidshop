# Bidshop Test Suite

**Author:** David Mackey-Ward
**Date:** 02-09-2026

---

Playwright test project for the Bidfood SDET technical test, covering the
Express API (`backend/`) and the React web app (`frontend/`) with **one
toolchain and zero changes to product code** (all tests live out-of-tree in
this folder).

## Frameworks — and why

**Playwright (single framework) for both the API and UI suites.**

- **One toolchain, one mental model.** The API suite uses Playwright's
  `request` fixture (real HTTP, no browser); the UI suite drives Chromium.
  Installing, configuring, and reasoning about one framework is simpler than
  maintaining two.
- **Sessions can cross layers.** A user registered via API requests can be
  reused by a browser test (`storageState`), which lets UI tests skip slow
  form setup when the journey under test starts later in the funnel.
- **Auto-waiting reduces flakiness.** Assertions retry until the UI settles,
  instead of sleeping — the brief's "no flaky tests" concern drove this
  choice over raw-speed runners.
- **First-class tooling:** native TypeScript, HTML report, screenshots +
  trace capture on failure, and headed mode for debugging.

## Prerequisites

- Node.js 18+ (developed and verified on v22.23.1)
- No Docker, databases, or cloud accounts — everything runs locally.

## Install & run (from a clean checkout)

```bash
cd tests
npm install                 # test dependencies
npx playwright install chromium   # one-time browser download

npm test                    # full run: boots API + frontend fresh, runs both suites
npm run test:api            # API suite only
npm run test:ui             # UI suite only
npm run test:headed         # UI tests in a visible browser (debugging)
npm run report              # open the HTML report of the last run
```

> The API (`:4000`) and frontend (`:5173`) are started **and torn down by
> Playwright itself** on every run. Do not start them manually while running
> the suite — the config deliberately refuses to reuse a running server so
> every run starts from a clean, deterministic seed state. The app stores
> everything in memory, so "fresh boot" == "pristine world", with zero
> teardown code.

## Layout

```
tests/
├── playwright.config.ts   # one config, two projects (api + ui), webServer boot
├── helpers/
│   └── api.ts             # registerUser(): unique-email user factory
├── api/                   # API suite (no browser)
│   ├── smoke.spec.ts      #   health + seeded catalogue (plumbing proof)
│   ├── auth.spec.ts       #   register / login / me, validation, authz
│   ├── products.spec.ts   #   catalogue listing, filters, 404s
│   ├── cart.spec.ts       #   add / patch / delete / clear, stock caps
│   └── orders.spec.ts     #   checkout flow, stock decrement, isolation
└── ui/                    # UI suite (Chromium)
    ├── shop.spec.ts       #   grid, search, category filters, logged-out CTA
    └── buy-journey.spec.ts#   register → cart → checkout → confirmation
```

## Determinism & isolation — how the suite stays trustworthy

1. **Fresh world per run:** `webServer` boots both services; `reuseExistingServer:
   false` fails loudly instead of silently testing against a stale server
   (I hit that exact trap mid-exercise — see trade-offs).
2. **Unique users per test:** helper-generated emails mean tests never share
   state and can run in any order.
3. **Stock-mutating tests are confined to one spec file** so parallel workers
   never race each other on shared data.
4. **Restart-reset design:** the app's in-memory store means no fixtures,
   migrations, or teardown are needed — the suite *is* the reset.

## Known issues (tracked, not hidden)

- **BUG-005 — GST rate inconsistency.** The cart prices GST at **12.5%**
  while orders charge **15%**, so the checkout total differs from the amount
  actually charged (72c on a $29 order). Two tests encode the *intended*
  contract — cart total == order total — and are marked `test.fixme` so the
  suite stays green while the bug is visible and tracked:
  - `api/orders.spec.ts` → "cart and order apply the same GST rate (BUG-005)"
  - `ui/buy-journey.spec.ts` → "total charged matches the total displayed"
  When the bug is fixed, deleting `fixme` turns both into regression tests.
- Full evidence, reproduction, and severity ratings: see `../FINDINGS.md`.
- **BUG-001..004 (product imagery):** dead/duplicated image URLs in the seed
  — logged in FINDINGS.md; not automated because third-party image loads
  would make an always-on test flaky by design (covered by a manual visual
  check pass instead).

## Trade-offs & things I'd do differently with more time

- **Out-of-tree `tests/` project** keeps product code untouched (the brief's
  rule) at the cost of a third npm install on a fresh checkout.
- **Chromium only** — fast and sufficient locally; I'd add Firefox/WebKit
  projects (and run them) in CI.
- **CI:** the config already respects a CI environment; with more time I'd
  add a GitHub Actions workflow and schema-contract checks driven by the
  API's `/openapi.json`.
- **Speed:** UI tests register through the real form (valuable coverage);
  journeys that *start* logged-in could use API-registered `storageState`
  sessions to shave seconds.
- **The dirty-server incident:** a leftover dev server silently invalidated
  two runs before I noticed. Lesson applied: strict `reuseExistingServer`,
  and "suspect the environment before the product" when green tests go red
  on stateful values.