import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser", timeout: 30_000, retries: 0,
  use: { baseURL: process.env.PARITY_BASE_URL ?? "http://127.0.0.1:3218/docusignisdead", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }, { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } }],
});
