import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const base = 'http://127.0.0.1:3219/docusignisdead';
for (let i = 0; i < 60; i++) { try { await fetch(base); break; } catch { await new Promise(resolve => setTimeout(resolve, 1000)); } }
const browser = await chromium.launch();
for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const context = await browser.newContext({ viewport }); const page = await context.newPage(); const dir = `test-results/baseline-${name}`; await mkdir(dir, { recursive: true });
  for (const [topic, path] of [['landing', ''], ['pricing', '/pricing'], ['login', '/login'], ['404', '/missing-parity-page']]) { await page.goto(base + path); await page.screenshot({ path: `${dir}/${topic}-before.png`, fullPage: true }); }
  await page.request.post(base + '/api/session/demo');
  for (const [topic, path] of [['agreements', '/app'], ['agreements-route', '/app/envelopes'], ['templates', '/app/templates'], ['contacts', '/app/contacts'], ['settings', '/app/settings']]) { await page.goto(base + path); await page.screenshot({ path: `${dir}/${topic}-before.png`, fullPage: true }); }
  await context.close();
}
await browser.close();
