import { defineConfig, devices } from "@playwright/test";

// The app is served under Vite's configured base path (see vite.config.ts).
const PORT = 5173;
const BASE_PATH = "/parametric-diagrams/";
const baseURL = `http://localhost:${PORT}${BASE_PATH}`;

// On NixOS the browsers come from the flake dev shell (PLAYWRIGHT_BROWSERS_PATH
// is exported by `nix develop`); elsewhere run `npx playwright install chromium`.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // html reporter in CI so the on-failure artifact upload has a report to collect
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
