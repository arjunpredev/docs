// Moves the build-time Markdown routes to /<page>.md and checks the output.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(site, 'out');
const mdDir = path.join(out, 'md');

let moved = 0;
for (const entry of fs.readdirSync(mdDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
  const from = path.join(entry.parentPath, entry.name);
  const to = path.join(out, path.relative(mdDir, from));
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
  moved++;
}
fs.rmSync(mdDir, { recursive: true, force: true });

// Every HTML page needs its Markdown twin
const missing = [];
for (const entry of fs.readdirSync(out, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const rel = path.relative(out, path.join(entry.parentPath, entry.name));
  if (/^(404|_not-found|index)\.html$/.test(rel) || rel.startsWith('_next') || rel.startsWith('og/')) continue;
  if (!fs.existsSync(path.join(out, rel.replace(/\.html$/, '.md')))) missing.push(rel);
}
if (missing.length) {
  console.error(`postbuild: pages without Markdown: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`postbuild: ${moved} Markdown pages in place`);
