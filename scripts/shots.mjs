// Drives the real app (production build, demo account) to capture product shots AND smoke-test the whole signing flow:
// upload/sample → prepare → send → out-of-order block → sign (typed, drawn) → completed PDF with certificate → void.
import fs from "node:fs"; import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { withApp, demoPage, out } from "./shotlib.mjs";
const dir = out("docusignisdead"); const pub = new URL("../public/home/", import.meta.url).pathname; fs.mkdirSync(pub, { recursive: true });
const save = async (page, name) => { await page.screenshot({ path: `${dir}/${name}.png` }); fs.copyFileSync(`${dir}/${name}.png`, `${pub}${name}.png`); };
const rendered = async (page, n) => page.waitForFunction(k => document.querySelectorAll("canvas[data-rendered]").length >= k, n, { timeout: 20000 });
const lastPage = async page => page.locator(".dsp__page").last().scrollIntoViewIfNeeded();
await withApp("docusignisdead", async ({ base, browser }) => {
  const { ctx, page } = await demoPage(browser, base, { w: 1440, h: 900 });
  await page.getByTestId("empty").waitFor(); await page.screenshot({ path: `${dir}/dashboard-empty.png` });
  // upload validation: not a PDF
  await page.getByRole("button", { name: "Start" }).first().click();
  await page.getByLabel("Upload a PDF").setInputFiles({ name: "notes.pdf", mimeType: "application/pdf", buffer: Buffer.from("hello, not a pdf") });
  await page.getByRole("alert").filter({ hasText: "not a PDF" }).waitFor();
  // a real upload (generated here)
  const up = await PDFDocument.create(); for (let i = 0; i < 3; i++) { const p = up.addPage([612, 792]); p.drawText(`Uploaded page ${i + 1}`, { x: 72, y: 700, size: 24 }); }
  await page.getByLabel("Upload a PDF").setInputFiles({ name: "My lease.pdf", mimeType: "application/pdf", buffer: Buffer.from(await up.save()) });
  await page.waitForURL(/\/app\/envelopes\//); await rendered(page, 3); assert.equal(await page.getByLabel("Document title").inputValue(), "My lease"); assert.equal(await page.getByTestId("field").count(), 0);
  assert.equal(await page.locator(".dsp__page").count(), 3);
  await page.goto(base + "/app");
  // sample NDA
  await page.getByRole("button", { name: "Start" }).first().click(); await page.getByRole("button", { name: /Mutual NDA/ }).click(); await page.waitForURL(/\/app\/envelopes\//);
  const envId = page.url().split("/").pop(); await page.locator(".dsp__page").first().waitFor(); const nPages = await page.locator(".dsp__page").count(); assert.ok(nPages >= 2); await rendered(page, nPages);
  assert.equal(await page.getByTestId("field").count(), 4, "sample comes with 4 fields");
  assert.match(await page.getByTestId("todo").innerText(), /needs a name/); assert.ok(await page.getByRole("button", { name: "Send for signature" }).isDisabled());
  await page.getByLabel("Recipient 1 name").fill("Ana Diaz"); await page.getByLabel("Recipient 1 email").fill("ana@example.com"); await page.getByLabel("Recipient 2 name").fill("Bo Li"); await page.getByLabel("Recipient 2 email").fill("bo@example.com");
  // add a text field for Bo on the signature page
  await page.getByLabel("Recipient 2 name").click(); await page.locator(".dse__pbtn", { hasText: "Text" }).click(); await lastPage(page);
  const pg = page.locator(".dsp__page").last(); const box = await pg.boundingBox(); await pg.click({ position: { x: 150, y: box.height * 0.36 } });
  await page.getByLabel("Label").fill("Title"); assert.equal(await page.getByTestId("field").count(), 5);
  // drag the new field a bit and check it moved
  const nf = page.locator('[data-type="text"]'); const b0 = await nf.boundingBox(); await page.mouse.move(b0.x + 20, b0.y + 8); await page.mouse.down(); await page.mouse.move(b0.x + 70, b0.y + 48, { steps: 6 }); await page.mouse.up(); const b1 = await nf.boundingBox(); assert.ok(b1.x > b0.x + 30 && b1.y > b0.y + 20, "field drags");
  await page.getByText("Saved", { exact: true }).waitFor(); await page.waitForTimeout(900); await page.getByText("Saved", { exact: true }).waitFor();
  await page.reload(); await rendered(page, nPages); assert.equal(await page.getByTestId("field").count(), 5, "fields persist"); assert.equal(await page.getByLabel("Recipient 2 name").inputValue(), "Bo Li");
  await lastPage(page); await page.locator('[data-type="signature"]').first().click(); await page.waitForTimeout(400); await save(page, "editor");
  await page.getByRole("button", { name: "Send for signature" }).click(); await page.getByTestId("rstatus-1").waitFor(); assert.equal(await page.getByTestId("status").innerText(), "Out for signature");
  const link1 = await page.getByLabel("Signing link for Ana Diaz").inputValue(); const link2 = await page.getByLabel("Signing link for Bo Li").inputValue(); assert.match(link1, /\/docusignisdead\/sign\/t_/);
  // drafts are locked once sent
  const put = await page.request.put(`${base}/api/envelopes/${envId}`, { data: { title: "x" } }); assert.equal(put.status(), 409);
  // unauthenticated: owner API closed, bad token 404
  const anon = await browser.newContext({ viewport: { width: 1200, height: 900 } }); const a = await anon.newPage();
  assert.equal((await anon.request.get(`${base}/api/envelopes/${envId}`)).status(), 404); assert.equal((await anon.request.get(`${base}/api/sign/t_nopenopenope`)).status(), 404);
  // Bo can't go first
  await a.goto(link2); await a.getByText("Not your turn yet").waitFor(); assert.equal((await anon.request.post(link2.replace("/sign/", "/api/sign/"), { data: { signature: { kind: "typed", text: "Bo Li" }, values: {} } })).status(), 409);
  // Ana signs (typed)
  await a.goto(link1); await rendered(a, nPages); assert.equal(await a.getByTestId("finish").isDisabled(), true); assert.equal(await a.getByTestId("remaining").innerText(), "2 to complete");
  await a.locator(".dsp__page").last().scrollIntoViewIfNeeded(); await a.waitForTimeout(300); await a.screenshot({ path: `${dir}/sign-before.png` }); fs.copyFileSync(`${dir}/sign-before.png`, `${pub}sign.png`);
  await a.getByTestId("sig-field").first().click(); await a.getByLabel("Full name").fill("Ana Diaz"); await a.getByTestId("typed-preview").waitFor(); await a.screenshot({ path: `${dir}/sign-adopt.png` });
  await a.getByRole("button", { name: "Adopt and sign" }).click(); await a.getByText("Ready to finish").waitFor(); await a.waitForTimeout(250); await a.screenshot({ path: `${dir}/sign-after.png` });
  await a.getByTestId("finish").click(); await a.getByTestId("signed-done").waitFor(); assert.match(await a.getByTestId("signed-done").innerText(), /You’ve signed/);
  assert.equal((await anon.request.post(link1.replace("/sign/", "/api/sign/"), { data: { signature: { kind: "typed", text: "Ana Diaz" }, values: {} } })).status(), 409, "no double signing");
  // owner sees status
  await page.reload(); await page.getByTestId("rstatus-1").waitFor(); assert.equal(await page.getByTestId("rstatus-1").innerText(), "Signed"); assert.equal(await page.getByTestId("rstatus-2").innerText(), "Waiting");
  assert.match(await page.getByTestId("activity").innerText(), /Ana Diaz\s+Signed/); await page.waitForTimeout(400); await save(page, "status");
  // Bo signs (drawn) and must fill the required text field
  const b = await (await browser.newContext({ viewport: { width: 1200, height: 900 } })).newPage(); await b.goto(link2); await rendered(b, nPages); await b.locator(".dsp__page").last().scrollIntoViewIfNeeded();
  await b.getByTestId("sig-field").first().click(); await b.getByRole("tab", { name: "Draw" }).click(); const pad = await b.getByTestId("pad").boundingBox();
  await b.mouse.move(pad.x + 40, pad.y + 110); await b.mouse.down(); for (let i = 0; i <= 24; i++) await b.mouse.move(pad.x + 40 + i * 20, pad.y + 90 + Math.sin(i / 2.5) * 40); await b.mouse.up(); await b.screenshot({ path: `${dir}/sign-draw.png` });
  await b.getByRole("button", { name: "Adopt and sign" }).click(); assert.equal(await b.getByTestId("finish").isDisabled(), true, "required text still empty"); assert.equal(await b.getByTestId("remaining").innerText(), "1 to complete");
  await b.getByLabel("Title").fill("CEO"); await b.getByTestId("finish").click(); await b.getByTestId("signed-done").waitFor(); assert.match(await b.getByTestId("signed-done").innerText(), /Everyone has signed/);
  // signed PDF: original pages + certificate; both owner and signer can download
  const dl = await b.request.get(link2.replace("/sign/", "/api/sign/") + "/pdf?dl=1"); assert.equal(dl.status(), 200); const signedDoc = await PDFDocument.load(await dl.body()); assert.equal(signedDoc.getPageCount(), nPages + 1);
  const od = await page.request.get(`${base}/api/envelopes/${envId}/pdf?signed=1&dl=1`); assert.equal(od.status(), 200); assert.equal((await PDFDocument.load(await od.body())).getPageCount(), nPages + 1);
  assert.equal((await anon.request.get(`${base}/api/envelopes/${envId}/pdf?signed=1`)).status(), 404, "owner PDF is private");
  await page.reload(); await page.getByText("Completed", { exact: true }).first().waitFor(); await rendered(page, nPages); await lastPage(page); await page.waitForTimeout(400); await save(page, "completed");
  assert.ok(await page.getByRole("link", { name: "Download signed PDF" }).isVisible());
  // void a second document
  await page.goto(base + "/app"); await page.getByRole("button", { name: "Start" }).first().click(); await page.getByRole("button", { name: /Offer letter/ }).click(); await page.waitForURL(/\/app\/envelopes\//); await rendered(page, 2);
  await page.getByLabel("Recipient 1 name").fill("Cy Park"); await page.getByLabel("Recipient 1 email").fill("cy@example.com"); await page.getByLabel("Recipient 2 name").fill("Di Wu"); await page.getByLabel("Recipient 2 email").fill("di@example.com"); await page.getByText("Saved", { exact: true }).waitFor(); await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Send for signature" }).click(); const vlink = await page.getByLabel("Signing link for Cy Park").inputValue();
  page.once("dialog", d => d.accept("Terms changed")); await page.getByRole("button", { name: "Void" }).click(); await page.locator(".ds-err", { hasText: "Voided: Terms changed" }).waitFor({ timeout: 5000 }).catch(async e => { await page.screenshot({ path: "/tmp/void-fail.png" }); throw e; });
  await a.goto(vlink); await a.getByText("This document was voided").waitFor();
  // dashboard with mixed statuses, then marketing + login
  await page.goto(base + "/app"); await page.getByTestId("envelopes").waitFor(); assert.ok((await page.locator("tbody tr").count()) >= 3); await page.screenshot({ path: `${dir}/dashboard.png` });
  const m = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await m.goto(base); await m.waitForTimeout(500); await m.screenshot({ path: `${dir}/home-top.png` }); await m.screenshot({ path: `${dir}/home-full.png`, fullPage: true });
  await m.goto(base + "/#pricing"); await m.waitForTimeout(300); await m.screenshot({ path: `${dir}/home-pricing.png` }); await m.goto(base + "/login"); await m.waitForTimeout(300); await m.screenshot({ path: `${dir}/login.png` });
  const mob = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage(); await mob.goto(link2); await mob.waitForTimeout(800); await mob.screenshot({ path: `${dir}/sign-mobile.png` });
  console.log("docusignisdead shots + smoke OK");
}, {});
