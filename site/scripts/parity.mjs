// Compares every public URL of a docs deployment with a reference deployment.
//   node scripts/parity.mjs <candidate base URL> [reference base URL]
// Checks status codes, redirect targets, content types and Markdown negotiation
// for: every sitemap page, every docs.json redirect, each page's .md twin,
// llms files, agent discovery files, OpenAPI files, images and the MCP endpoint.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [candidate, reference = 'https://docs.pre.dev'] = process.argv.slice(2);
if (!candidate) {
  console.error('usage: node scripts/parity.mjs <candidate base URL> [reference base URL]');
  process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const docs = JSON.parse(fs.readFileSync(path.join(root, 'docs.json'), 'utf8'));

const sitemap = await (await fetch(`${reference}/sitemap.xml`)).text();
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

const checks = [];
for (const p of pages) {
  checks.push({ path: p, kind: 'page' });
  checks.push({ path: `${p}.md`, kind: 'markdown' });
  checks.push({ path: p, kind: 'negotiated', headers: { Accept: 'text/markdown' } });
}
for (const r of docs.redirects ?? []) checks.push({ path: r.source, kind: 'redirect' });
for (const p of [
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
let done = 0;
const queue = [...checks];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let check = queue.shift(); check; check = queue.shift()) {
      const [a, b] = await Promise.all([probe(reference, check), probe(candidate, check)]);
      done++;
      const sameStatus = a.status === b.status || (a.status >= 300 && a.status < 400 && b.status >= 300 && b.status < 400);
      const sameType = a.type === b.type || a.status >= 300;
      const sameLocation = a.location === b.location;
      if (!sameStatus || !sameType || !sameLocation) failures.push({ ...check, reference: a, candidate: b });
    }
  }),
);

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

console.log(`parity: ${done} URL checks against ${reference}, MCP tools: ${tools.join(', ')}`);
if (failures.length) {
  for (const f of failures) console.log(JSON.stringify(f));
  console.log(`parity: ${failures.length} difference(s)`);
  process.exit(1);
}
console.log('parity: no differences');
