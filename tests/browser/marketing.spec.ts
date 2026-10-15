import { test, expect } from "@playwright/test";
const at = (base: string | undefined, path = "") => `${base}${path}`;
test("landing email and country lead to a separate signup page", async ({ page, baseURL }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.status() >= 400 && response.url().startsWith(baseURL!)) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(at(baseURL));
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Everything you need to agree" })).toBeVisible();
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("parity-test@example.com");
  await page.getByRole("combobox", { name: "Country/region" }).selectOption("Canada");
  await page.screenshot({ path: testInfo.outputPath("landing-after.png"), fullPage: true });
  await page.getByRole("button", { name: "Get Started" }).click();
  await expect(page).toHaveURL(/free-trial\?email=parity-test%40example.com&country=Canada/);
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue("parity-test@example.com");
  await expect(page.getByRole("combobox", { name: "Country/region" })).toHaveValue("Canada");
  await page.getByRole("button", { name: "Get Started" }).click();
  await expect(page.getByLabel("Password", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Use a different email" }).click();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeEditable();
  expect(errors).toEqual([]);
});
test("public pages have working links, unique chrome, project branding and no horizontal overflow", async ({ page, baseURL }, testInfo) => {
  for (const path of ["", "/pricing", "/login", "/free-trial", "/terms", "/privacy", "/trust"]) {
    await page.goto(at(baseURL, path));
    await expect(page.locator("body")).not.toContainText(/\bdocusign\b/i);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.locator('img[src$="/brand/icon-192.png"]')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${path.slice(1) || "landing"}-after.png`), fullPage: true });
  }
  await page.goto(at(baseURL));
  for (const link of await page.getByRole("contentinfo").getByRole("link").all()) {
    const href = await link.getAttribute("href");
    expect(href).not.toBe("#");
    if (href?.startsWith("/")) expect((await page.request.get(new URL(href, baseURL).href)).ok()).toBe(true);
  }
  const icon = page.locator('link[rel="icon"][href*="icon.png"]');
  expect((await page.request.get(new URL((await icon.getAttribute("href"))!, baseURL).href)).ok()).toBe(true);
});
test("login is email first and exposes a separate signup link", async ({ page, baseURL }, testInfo) => {
  await page.goto(at(baseURL, "/login"));
  await expect(page.getByLabel("Password", { exact: false })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Email" }).fill("parity-test@example.com");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.getByRole("button", { name: "Back to log in" }).click();
  await page.getByRole("link", { name: "Sign Up for Free" }).click();
  await expect(page).toHaveURL(/free-trial$/);
  await page.screenshot({ path: testInfo.outputPath("signup-after.png"), fullPage: true });
});
