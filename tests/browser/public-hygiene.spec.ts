import { test, expect } from "@playwright/test";
test("404 has working project navigation and help", async ({ page, baseURL }, testInfo) => {
  const response = await page.goto(`${baseURL}/missing-parity-page`);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/\bdocusign\b/i);
  await page.screenshot({ path: testInfo.outputPath("404-after.png"), fullPage: true });
  await page.getByRole("link", { name: "Go to homepage" }).click();
  await expect(page.getByRole("heading", { name: "Everything you need to agree" })).toBeVisible();
});

test("a signed-out app visit opens login", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/app`);
  await expect(page).toHaveURL(/login\?callbackUrl=%2Fapp$/);
  await expect(page.getByRole("heading", { name: "Log in to DocuSignIsDead" })).toBeVisible();
});
