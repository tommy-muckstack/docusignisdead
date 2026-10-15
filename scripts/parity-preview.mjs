// A compact visual QA sheet in the log makes CI evidence inspectable when artifact downloads are unavailable.
import { readdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';
const images = [];
async function walk(path) { for (const item of await readdir(path, { withFileTypes: true }).catch(() => [])) { const file = `${path}/${item.name}`; if (item.isDirectory()) await walk(file); else if (/^(landing|pricing|login|agreements|agreements-folder|template-editor|templates|editor|sent|signing|adopt-signature|disclosure|draw-signature|completed)-(before|after)\.png$/.test(item.name) || item.name === 'test-failed-1.png') images.push(file); } }
await walk('test-results');
for (const mode of ['desktop', 'mobile']) for (const stage of ['before', 'after']) {
  const picked = [...new Map(images.filter(path => path.includes(`-${mode}/`) && path.endsWith(`-${stage}.png`)).map(path => [path.split('/').pop(), path])).values()];
  if (!picked.length) continue;
  const tiles = [];
  for (const [i, file] of picked.entries()) {
    const thumbnail = await sharp(await readFile(file)).resize({ width: 400, height: 560, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
    const label = `<svg width="420" height="30"><rect width="420" height="30" fill="white"/><text x="8" y="20" font-size="14">${mode}: ${file.split('/').pop()}</text></svg>`;
    const tile = await sharp({ create: { width: 420, height: 600, channels: 3, background: '#ddd' } }).composite([{ input: thumbnail, left: 10, top: 35 }, { input: Buffer.from(label), left: 0, top: 0 }]).png().toBuffer();
    tiles.push({ input: tile, left: i % 3 * 420, top: Math.floor(i / 3) * 600 });
  }
  const sheet = await sharp({ create: { width: 1260, height: Math.ceil(picked.length / 3) * 600, channels: 3, background: '#eee' } }).composite(tiles).png().toBuffer();
  const encoded = sheet.toString('base64'); for (let start = 0; start < encoded.length; start += 12000) console.log(`PARITY_PREVIEW_${mode.toUpperCase()}_${stage.toUpperCase()}_${start}=${encoded.slice(start, start + 12000)}`);
}
