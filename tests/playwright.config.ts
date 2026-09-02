import { defineConfig, devices } from '@playwright/test';

/**
 * Bidshop E2E test configuration.
 *
 * One config, two "projects":
 *   - api : exercises the Express API over real HTTP (no browser)
 *   - ui  : exercises the React app in Chromium
 *
 * `webServer` boots BOTH services before a run and tears them down after —
 * so every run starts from the app's deterministic in-memory seed state.
 */
export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  projects: [
    {
      name: 'api',
      testDir: './api',
      // API tests talk HTTP only — no browser is ever launched.
      use: {
        baseURL: 'http://localhost:4000',
        extraHTTPHeaders: { 'Content-Type': 'application/json' },
      },
    },
    {
      name: 'ui',
      testDir: './ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
      },
    },
  ],

  webServer: [
    // Strict mode: never reuse a server that is already running. A stray
    // (dirty) server silently corrupts state between runs — fail loudly
    // instead, so the developer kills it and gets a guaranteed fresh boot.
    {
      command: 'cd ../backend && npm run dev',
      url: 'http://localhost:4000/health',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'cd ../frontend && npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});