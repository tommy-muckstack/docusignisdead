import { test, expect, type Page } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
let pdf: Buffer;
test.beforeAll(async () => { const doc = await PDFDocument.create(); const font = await doc.embedFont(StandardFonts.Helvetica); doc.addPage([612, 792]).drawText("Test agreement — no real transaction", { x: 48, y: 740, font, size: 16 }); pdf = Buffer.from(await doc.save()); });
async function login(page: Page, baseURL: string) { await page.goto(`${baseURL}/login`); await page.getByRole("button", { name: "Use the demo account" }).click(); await expect(page).toHaveURL(/\/app$/); }
async function upload(page: Page, baseURL: string, title: string) {
  await page.goto(`${baseURL}/app?start=send`);
  await page.getByLabel("Upload a PDF", { exact: true }).setInputFiles({ name: `${title}.pdf`, mimeType: "application/pdf", buffer: pdf });
  await expect(page).toHaveURL(/\/app\/envelopes\/e_/); await expect(page.getByTestId("pdf-pages")).toHaveAttribute("data-state", "ready");
}
async function place(page: Page, type: string, x: number, y: number) {
  await page.locator(".dse__pal button").filter({ hasText: type }).click(); const sheet = page.locator('[data-page="0"]'); const box = await sheet.boundingBox();
  await sheet.click({ position: { x: box!.width * x, y: box!.height * y } });
}
async function adopt(page: Page, draw = false) {
  await page.getByTestId("sig-field").first().click();
  if (draw) { await page.getByRole("tab", { name: "Draw", exact: true }).click(); const pad = page.getByTestId("pad"); await pad.scrollIntoViewIfNeeded(); const b = (await pad.boundingBox())!; await page.mouse.move(b.x + 30, b.y + 30); await page.mouse.down(); await page.mouse.move(b.x + b.width * .35, b.y + b.height * .65, { steps: 8 }); await page.mouse.move(b.x + b.width * .75, b.y + b.height * .3, { steps: 8 }); await page.mouse.up(); }
  await page.getByRole("button", { name: "Adopt and sign" }).click();
}
async function consent(page: Page) { await page.getByLabel("I agree to use electronic records and signatures.").check(); await page.getByRole("button", { name: "Continue", exact: true }).click(); await expect(page.getByTestId("pdf-pages")).toHaveAttribute("data-state", "ready"); }

test("account routes, profile, contacts, settings and sign out work", async ({ page, baseURL }, info) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await login(page, baseURL!); await page.getByLabel("Account menu").click(); await page.getByRole("link", { name: "My profile", exact: true }).first().click();
  await page.getByLabel("Name", { exact: true }).fill(`Parity ${info.project.name}`); await page.getByRole("button", { name: "Save profile" }).click(); await expect(page.getByRole("status")).toHaveText("Saved");
  await page.goto(`${baseURL}/app/contacts`); const email = `contact-${info.project.name}@example.test`; await page.getByLabel("Name", { exact: true }).fill("Test Contact"); await page.getByLabel("Email", { exact: true }).fill(email); await page.getByRole("button", { name: "Add contact", exact: true }).click(); await expect(page.getByText(email, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit Test Contact", exact: true }).click(); await page.getByLabel("Name", { exact: true }).fill("Updated Contact"); await page.getByRole("button", { name: "Save contact" }).click(); await expect(page.getByRole("listitem").filter({ hasText: email }).locator("b")).toBeVisible();
  page.once("dialog", d => d.accept()); await page.getByRole("button", { name: "Delete Updated Contact" }).click(); await expect(page.getByText(email, { exact: true })).toHaveCount(0);
  await page.goto(`${baseURL}/app/settings`); await page.getByLabel("Expire after (days)").fill("45"); await page.getByRole("button", { name: "Save defaults" }).click(); await expect(page.getByRole("status")).toHaveText("Saved"); await page.reload(); await expect(page.getByLabel("Expire after (days)")).toHaveValue("45");
  for (const path of ["envelopes", "reports", "contacts", "settings", "templates"]) { await page.goto(`${baseURL}/app/${path}`); await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: info.outputPath(`${path}-after.png`), fullPage: true }); }
  await page.getByLabel("Account menu").click(); await page.getByRole("button", { name: "Sign out", exact: true }).click(); await expect(page).toHaveURL(baseURL!); expect(errors).toEqual([]);
});

test("folders, search, rename, move and delete preserve the right documents", async ({ page, baseURL }, info) => {
  await login(page, baseURL!); const title = `Folder agreement ${info.project.name}`; await upload(page, baseURL!, title); await page.getByRole("link", { name: "← Agreements" }).click();
  page.once("dialog", d => d.accept(`Folder ${info.project.name}`)); await page.getByRole("button", { name: "New folder" }).click();
  await expect(page.getByLabel(`Move ${title} to folder`).getByRole("option", { name: `Folder ${info.project.name}`, exact: true })).toHaveCount(1);
  await page.getByLabel(`Move ${title} to folder`).selectOption({ label: `Folder ${info.project.name}` }); await page.getByLabel("Folder", { exact: true }).selectOption({ label: `Folder ${info.project.name}` });
  await page.getByLabel("Search", { exact: true }).fill("does-not-match"); await expect(page.getByRole("heading", { name: "No agreements match" })).toBeVisible(); await page.getByLabel("Search", { exact: true }).fill(title);
  page.once("dialog", d => d.accept(`Renamed ${info.project.name}`)); await page.getByRole("button", { name: "Rename folder", exact: true }).click(); await expect(page.getByLabel("Folder", { exact: true })).toContainText(`Renamed ${info.project.name}`);
  await page.screenshot({ path: info.outputPath("agreements-folder-after.png"), fullPage: true });
  page.once("dialog", d => d.accept()); await page.getByRole("button", { name: "Delete folder", exact: true }).click(); await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: title }); await row.locator("summary").click(); page.once("dialog", d => d.accept(title + " renamed")); await row.getByRole("button", { name: "Rename", exact: true }).click(); await expect(page.getByRole("link", { name: title + " renamed", exact: true })).toBeVisible();
  page.once("dialog", d => d.accept()); await page.getByRole("row").filter({ hasText: title + " renamed" }).getByRole("button", { name: "Delete", exact: true }).click(); await expect(page.getByRole("link", { name: title + " renamed", exact: true })).toHaveCount(0);
});

test("PDF templates save placeholder roles, create an independent draft and delete", async ({ page, baseURL }, info) => {
  await login(page, baseURL!); await page.goto(`${baseURL}/app/templates`); const title = `Template ${info.project.name}`;
  await page.getByLabel("Template PDF").setInputFiles({ name: title + ".pdf", mimeType: "application/pdf", buffer: pdf }); await expect(page).toHaveURL(/\/app\/templates\/e_/); await expect(page.getByTestId("pdf-pages")).toHaveAttribute("data-state", "ready");
  await page.getByRole("button", { name: "+ Add role" }).click(); await page.getByLabel("Role 1 name").fill("Client"); await place(page, "Signature", .3, .3); const templateId = page.url().split("/").pop()!; await page.getByRole("button", { name: "Save template", exact: true }).click(); await expect(page).toHaveURL(/\/app\/templates$/); const savedTemplate = (await (await page.request.get(`${baseURL}/api/envelopes/${templateId}`)).json()).envelope; expect(savedTemplate.recipients[0].roleName).toBe("Client"); expect(savedTemplate.fields).toHaveLength(1);
  const row = page.getByRole("listitem").filter({ hasText: title }); await row.getByRole("link", { name: "Edit", exact: true }).click(); await expect(page.getByLabel("Role 1 name")).toHaveValue("Client"); await expect(page.getByTestId("field")).toHaveCount(1); await page.screenshot({ path: info.outputPath("template-editor-after.png"), fullPage: true });
  await page.getByRole("button", { name: "Use template", exact: true }).click(); await expect(page).toHaveURL(/\/app\/envelopes\/e_/); await expect(page.getByLabel("Recipient 1 name")).toHaveValue(""); await expect(page.getByTestId("field")).toHaveCount(1);
  await page.goto(`${baseURL}/app/templates`); page.once("dialog", d => d.accept()); await page.getByRole("listitem").filter({ hasText: title }).getByRole("button", { name: "Delete", exact: true }).click(); await expect(page.getByRole("listitem").filter({ hasText: title })).toHaveCount(0);
});

test("two recipients complete type/draw, required fields, consent, saved progress and certificate", async ({ page, context, baseURL }, info) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await login(page, baseURL!); await upload(page, baseURL!, `Signing ${info.project.name}`); const editorURL = page.url(); const id = editorURL.split("/").pop()!;
  await page.getByRole("button", { name: "+ Add recipient" }).click(); await page.getByLabel("Recipient 1 name").fill("Alpha Example"); await page.getByLabel("Recipient 1 email").fill("alpha@example.test");
  for (const [kind, x, y] of [["Signature", .3, .25], ["Initials", .65, .25], ["Date signed", .65, .4], ["Text", .3, .5], ["Checkbox", .3, .65]] as const) await place(page, kind, x, y);
  await page.getByLabel("Required", { exact: true }).check(); await page.getByLabel("Label", { exact: true }).fill("I approve");
  const signatureField = page.locator('[data-testid="field"][data-type="signature"]'); await signatureField.scrollIntoViewIfNeeded(); const old = (await signatureField.boundingBox())!; await page.mouse.move(old.x + old.width / 2, old.y + old.height / 2); await page.mouse.down(); await page.mouse.move(old.x + old.width / 2 + 16, old.y + old.height / 2 + 18, { steps: 5 }); await page.mouse.up();
  const grip = page.getByLabel("Resize", { exact: true }); const handle = (await grip.boundingBox())!; await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2); await page.mouse.down(); await page.mouse.move(handle.x + 18, handle.y + 12, { steps: 5 }); await page.mouse.up();
  await page.getByRole("button", { name: "+ Add recipient" }).click(); await page.getByLabel("Recipient 2 name").fill("Beta Example"); await page.getByLabel("Recipient 2 email").fill("beta@example.test"); await place(page, "Signature", .3, .8);
  await page.getByLabel("Email subject", { exact: true }).fill("Please review test agreement"); await page.getByLabel("Message to recipients").fill("Only synthetic test data."); await page.screenshot({ path: info.outputPath("editor-after.png"), fullPage: true });
  await page.getByRole("button", { name: "Send for signature", exact: true }).click(); await expect(page.getByTestId("status")).toHaveText("Out for signature"); await expect(page.getByText(/Email is unavailable for this agreement/)).toBeVisible();
  const stored = (await (await page.request.get(`${baseURL}/api/envelopes/${id}`)).json()).envelope; expect(stored.fields[0].x).toBeGreaterThan(.16); expect(stored.fields[0].w).toBeGreaterThan(.28);
  const firstLink = await page.getByLabel("Signing link for Alpha Example").inputValue(); const secondLink = await page.getByLabel("Signing link for Beta Example").inputValue(); await page.screenshot({ path: info.outputPath("sent-after.png"), fullPage: true });
  const signer = await context.newPage(); signer.on("pageerror", e => errors.push(e.message)); await signer.goto(secondLink); await expect(signer.getByRole("heading", { name: "Not your turn yet" })).toBeVisible(); await signer.goto(firstLink); await expect(signer.getByRole("button", { name: "Continue", exact: true })).toBeDisabled(); await signer.screenshot({ path: info.outputPath("disclosure-after.png"), fullPage: true }); await consent(signer);
  await signer.getByRole("button", { name: "Start", exact: true }).click(); await adopt(signer); await signer.getByLabel("Text", { exact: true }).fill("Approved test"); await signer.getByLabel("I approve").check(); await signer.getByRole("button", { name: "Next", exact: true }).click(); await signer.getByRole("button", { name: "Finish later", exact: true }).click(); await expect(signer.getByRole("heading", { name: "Progress saved" })).toBeVisible(); await signer.reload(); await expect(signer.getByLabel("Text", { exact: true })).toHaveValue("Approved test"); await expect(signer.getByLabel("I approve")).toBeChecked(); await expect(signer.getByTestId("pdf-pages")).toHaveAttribute("data-state", "ready"); await signer.getByTestId("finish").click(); await expect(signer.getByRole("heading", { name: "You’ve signed" })).toBeVisible();
  await signer.goto(secondLink); await consent(signer); await adopt(signer, true); await signer.screenshot({ path: info.outputPath("draw-signature-after.png"), fullPage: true }); await signer.getByTestId("finish").click(); await expect(signer.getByRole("heading", { name: "Agreement complete" })).toBeVisible(); await signer.screenshot({ path: info.outputPath("completed-after.png"), fullPage: true });
  const response = await signer.request.get(secondLink.replace("/sign/", "/api/sign/") + "/pdf?dl=1"); expect(response.ok()).toBe(true); const completedPdf = await PDFDocument.load(await response.body()); expect(completedPdf.getPageCount()).toBeGreaterThan(1);
  await page.reload(); await expect(page.getByTestId("status")).toHaveText("Completed"); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]); await signer.close();
});

test("void and decline close recipient links; deleting revokes them", async ({ page, context, baseURL }, info) => {
  await login(page, baseURL!);
  for (const action of ["void", "decline"] as const) {
    await upload(page, baseURL!, `${action} ${info.project.name}`); const id = page.url().split("/").pop()!; await page.getByRole("button", { name: "+ Add recipient" }).click(); await page.getByLabel("Recipient 1 name").fill("Test Person"); await page.getByLabel("Recipient 1 email").fill("person@example.test"); await place(page, "Signature", .3, .4); await page.getByRole("button", { name: "Send for signature", exact: true }).click(); await expect(page.getByTestId("status")).toHaveText("Out for signature"); const link = await page.getByLabel("Signing link for Test Person").inputValue(); const signer = await context.newPage(); await signer.goto(link);
    if (action === "void") { page.once("dialog", d => d.accept("Test cancellation")); await page.getByRole("button", { name: "Void", exact: true }).click(); await signer.reload(); await expect(signer.getByRole("heading", { name: "This agreement was voided" })).toBeVisible(); }
    else { signer.once("dialog", d => d.accept("Needs revision")); await signer.getByRole("button", { name: "Decline", exact: true }).click(); await expect(signer.getByRole("heading", { name: "This agreement was declined" })).toBeVisible(); }
    expect((await signer.request.get(link.replace("/sign/", "/api/sign/") + "/pdf")).status()).toBe(404);
    expect((await page.request.delete(`${baseURL}/api/envelopes/${id}`)).status()).toBe(204); await signer.reload(); await expect(signer.getByRole("heading", { name: "Link unavailable" })).toBeVisible(); await signer.close();
  }
});

test("Needs to view and CC respect recipient order and complete without signature fields", async ({ page, context, baseURL }, info) => {
  await login(page, baseURL!); await upload(page, baseURL!, `Roles ${info.project.name}`);
  for (const [index, name, role] of [[1, "Signer Example", "signer"], [2, "Viewer Example", "viewer"], [3, "Copy Example", "cc"]] as const) { await page.getByRole("button", { name: "+ Add recipient" }).click(); await page.getByLabel(`Recipient ${index} name`).fill(name); await page.getByLabel(`Recipient ${index} email`).fill(`role-${index}@example.test`); await page.getByLabel(`Recipient ${index} action`).selectOption(role); if (index === 1) await place(page, "Signature", .3, .4); }
  await page.getByRole("button", { name: "Send for signature", exact: true }).click(); await expect(page.getByTestId("status")).toHaveText("Out for signature");
  const signerLink = await page.getByLabel("Signing link for Signer Example").inputValue(), viewerLink = await page.getByLabel("Signing link for Viewer Example").inputValue(), copyLink = await page.getByLabel("Signing link for Copy Example").inputValue();
  const recipient = await context.newPage(); await recipient.goto(copyLink); await expect(recipient.getByRole("heading", { name: "Not your turn yet" })).toBeVisible(); expect((await recipient.request.get(copyLink.replace("/sign/", "/api/sign/") + "/pdf")).status()).toBe(404);
  await recipient.goto(viewerLink); await expect(recipient.getByRole("heading", { name: "Not your turn yet" })).toBeVisible(); await recipient.goto(signerLink); await consent(recipient); await adopt(recipient); await recipient.getByTestId("finish").click(); await expect(recipient.getByRole("heading", { name: "You’ve signed" })).toBeVisible();
  await recipient.goto(viewerLink); await consent(recipient); await recipient.getByRole("button", { name: "Finish review", exact: true }).click(); await expect(recipient.getByRole("heading", { name: "Agreement complete" })).toBeVisible(); await recipient.goto(copyLink); await expect(recipient.getByRole("link", { name: "Download signed PDF" })).toBeVisible(); await recipient.close();
});
