// Compares every public URL of a docs deployment with a reference: another
// deployment, or a baseline recorded from one.
//   node scripts/parity.mjs <candidate base URL> [reference base URL | baseline.json]
//   node scripts/parity.mjs --record <baseline.json> <reference base URL>
// Checks status codes, redirect targets, content types and Markdown negotiation
// for: every sitemap page, every docs.json redirect, each page's .md twin,
// llms files, agent discovery files, OpenAPI files, images and the MCP endpoint.
// The default reference, parity-baseline.json, was recorded from the Mintlify
// deployment on 2026-10-15, so every URL it served keeps answering the same way.
// After deliberately moving or removing a page, re-record it from docs.pre.dev.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scripts = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const recordTo = args[0] === '--record' ? args[1] : undefined;
const [candidate, reference = path.join(scripts, 'parity-baseline.json')] = recordTo ? [undefined, args[2]] : args;
if (recordTo ? !reference : !candidate) {
  console.error('usage: node scripts/parity.mjs <candidate base URL> [reference base URL | baseline.json]');
  console.error('       node scripts/parity.mjs --record <baseline.json> <reference base URL>');
  process.exit(2);
}

const root = path.resolve(scripts, '../..');
const docs = JSON.parse(fs.readFileSync(path.join(root, 'docs.json'), 'utf8'));
const baseline = reference.endsWith('.json') ? JSON.parse(fs.readFileSync(reference, 'utf8')) : undefined;

const sitemap = baseline ? '' : await (await fetch(`${reference}/sitemap.xml`)).text();
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

const checks = baseline ?? [];
for (const p of pages) {
  checks.push({ path: p, kind: 'page' });
  checks.push({ path: `${p}.md`, kind: 'markdown' });
  checks.push({ path: p, kind: 'negotiated', headers: { Accept: 'text/markdown' } });
}
for (const r of baseline ? [] : (docs.redirects ?? [])) checks.push({ path: r.source, kind: 'redirect' });
for (const p of baseline ? [] : [
  '/llms.txt',
  '/llms-full.txt',
  '/skill.md',
  '/robots.txt',
  '/sitemap.xml',
  '/.well-known/llms.txt',
  '/.well-known/mcp.json',
  '/.well-known/mcp/server-card.json',
  '/.well-known/agent-card.json',
  '/.well-known/agent-skills/index.json',
  '/.well-known/agent-skills/predev/skill.md',
  '/.well-known/skills/index.json',
  '/.well-known/skills/predev/SKILL.md',
  '/images/logo-light.png',
  '/images/logo-dark.png',
  '/images/diagrams/product-map-dark.svg',
  '/this-page-does-not-exist',
  ...[docs.api?.openapi ?? []].flat().map((f) => `/${f}`),
]) {
  checks.push({ path: p, kind: 'file' });
}

async function probe(base, check) {
  const res = await fetch(base + check.path, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 parity-check', ...check.headers } });
  const location = res.headers.get('location');
  await res.arrayBuffer();
  return {
    status: res.status,
    type: (res.headers.get('content-type') ?? '').split(';')[0].trim(),
    location: location ? new URL(location, base).pathname : undefined,
  };
}

const failures = [];
const recorded = [];
let done = 0;
const queue = [...checks];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const { expected, ...check } = next;
      const [a, b] = await Promise.all([expected ?? probe(reference, check), recordTo ? undefined : probe(candidate, check)]);
      done++;
      if (recordTo) {
        recorded.push({ ...check, expected: a });
        continue;
      }
      const sameStatus = a.status === b.status || (a.status >= 300 && a.status < 400 && b.status >= 300 && b.status < 400);
      const xml = (t) => (t === 'application/xml' ? 'text/xml' : t);
      const sameType = xml(a.type) === xml(b.type) || a.status >= 300;
      const sameLocation = a.location === b.location;
      if (!sameStatus || !sameType || !sameLocation) failures.push({ ...check, reference: a, candidate: b });
    }
  }),
);

if (recordTo) {
  recorded.sort((x, y) => x.path.localeCompare(y.path) || x.kind.localeCompare(y.kind));
  fs.writeFileSync(recordTo, `[\n${recorded.map((r) => `  ${JSON.stringify(r)}`).join(',\n')}\n]\n`);
  console.log(`parity: recorded ${recorded.length} URL checks from ${reference} in ${recordTo}`);
  process.exit(0);
}

const mcp = await fetch(`${candidate}/mcp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
});
const mcpText = await mcp.text();
const tools = [...mcpText.matchAll(/"name":"([a-z_]+)"/g)].map((m) => m[1]);
for (const name of ['search_pre_dev', 'query_docs_filesystem_pre_dev', 'submit_feedback']) {
  if (!tools.includes(name)) failures.push({ path: '/mcp', kind: 'mcp', missing: name });
}

console.log(`parity: ${done} URL checks against ${baseline ? path.relative(process.cwd(), reference) : reference}, MCP tools: ${tools.join(', ')}`);
if (failures.length) {
  for (const f of failures) console.log(JSON.stringify(f));
  console.log(`parity: ${failures.length} difference(s)`);
  process.exit(1);
}
console.log('parity: no differences');
