import { readdir, readFile } from 'node:fs/promises';
async function walk(path) { for (const item of await readdir(path, { withFileTypes: true }).catch(() => [])) { const file = `${path}/${item.name}`; if (item.isDirectory()) await walk(file); else if (item.name === 'error-context.md') console.log(`\n::group::${file}\n${await readFile(file, 'utf8')}\n::endgroup::`); } }
await walk('test-results');
