import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { PDFDocument, StandardFonts } from 'pdf-lib';
const base = 'http://127.0.0.1:3219/docusignisdead';
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
pdf.addPage([612, 792]).drawText('Test agreement — no real transaction', { x: 48, y: 740, font, size: 16 });
const buffer = Buffer.from(await pdf.save());
async function shot(page, dir, topic) { await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `${dir}/${topic}-before.png`, fullPage: true }); }
for (let i = 0; i < 60; i++) { try { await fetch(base); break; } catch { await new Promise(resolve => setTimeout(resolve, 1000)); } }
const browser = await chromium.launch();
for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const context = await browser.newContext({ viewport }); const page = await context.newPage(); const dir = `test-results/baseline-${name}`; await mkdir(dir, { recursive: true });
  page.setDefaultTimeout(30000);
  for (const [topic, path] of [['landing', ''], ['pricing', '/pricing'], ['login', '/login'], ['404', '/missing-parity-page']]) { await page.goto(base + path); await shot(page, dir, topic); }
  await page.request.post(base + '/api/session/demo');
  for (const [topic, path] of [['agreements', '/app'], ['agreements-route', '/app/envelopes'], ['templates', '/app/templates'], ['contacts', '/app/contacts'], ['settings', '/app/settings']]) { await page.goto(base + path); await shot(page, dir, topic); }
  // Prepare synthetic baseline data; sending/signing still use real browser clicks.
  const created = await page.request.post(`${base}/api/envelopes`, { multipart: { file: { name: `Baseline ${name}.pdf`, mimeType: 'application/pdf', buffer } } });
  expect(created.status()).toBe(201);
  const { envelope } = await created.json();
  const patched = await page.request.put(`${base}/api/envelopes/${envelope.id}`, { data: { title: `Baseline ${name}`, sequential: true, message: 'Only synthetic test data.', recipients: [{ id: 'r_baseline', name: 'Test Example', email: 'baseline@example.test', order: 1 }], fields: [{ id: 'f_baseline', recipientId: 'r_baseline', type: 'signature', page: 0, x: .2, y: .4, w: .28, h: .055, required: true }] } });
  expect(patched.ok()).toBe(true);
  await page.goto(`${base}/app/envelopes/${envelope.id}`);
  await expect(page.getByTestId('pdf-pages')).toHaveAttribute('data-state', 'ready');
  await shot(page, dir, 'editor');
  await page.getByRole('button', { name: 'Send for signature', exact: true }).click();
  await expect(page.getByTestId('status')).toHaveText('Out for signature');
  const link = await page.getByLabel('Signing link for Test Example').inputValue();
  await shot(page, dir, 'sent');
  await page.goto(link);
  await expect(page.getByTestId('pdf-pages')).toHaveAttribute('data-state', 'ready');
  await shot(page, dir, 'signing');
  await page.getByTestId('sig-field').click();
  await shot(page, dir, 'adopt-signature');
  await page.getByRole('button', { name: 'Adopt and sign', exact: true }).click();
  await page.getByTestId('finish').click();
  await expect(page.getByTestId('signed-done')).toBeVisible();
  await shot(page, dir, 'completed');
  await context.close();
}
await browser.close();
