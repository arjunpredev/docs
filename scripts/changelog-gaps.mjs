// List in-app changelog entries that are newer than the latest entry in
// changelog.mdx. A maintenance aid for writing docs changelog entries by hand;
// it never edits files and never publishes anything.
//
//   node scripts/changelog-gaps.mjs                       # reads https://pre.dev/changelog.json
//   node scripts/changelog-gaps.mjs --source-root ..      # reads ../predev-app/frontend/public/changelog.json
//   node scripts/changelog-gaps.mjs --file path/to/changelog.json
//   node scripts/changelog-gaps.mjs --since 2026-08-01 --type feature,improvement --details
//   node scripts/changelog-gaps.mjs --json
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const option = name => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const flag = name => args.includes(name);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

async function loadInApp() {
  const file = option('--file');
  const sourceRoot = option('--source-root');
  if (file || sourceRoot) {
    const target = file ?? path.join(path.resolve(sourceRoot), 'predev-app/frontend/public/changelog.json');
    return { source: target, data: JSON.parse(await fs.readFile(target, 'utf8')) };
  }
  const url = option('--url') ?? 'https://pre.dev/changelog.json';
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`GET ${url} returned HTTP ${response.status}`);
  return { source: url, data: await response.json() };
}

function fail(message) {
  console.error(`changelog-gaps: ${message}`);
  process.exit(1);
}

const docs = await fs.readFile('changelog.mdx', 'utf8');
const documented = [...docs.matchAll(/^## (\d{4}-\d{2}-\d{2})\s*$/gm)].map(match => match[1]).sort();
const since = option('--since') ?? documented.at(-1);
if (!since || !DATE.test(since)) fail('pass --since YYYY-MM-DD (changelog.mdx has no dated heading to start from)');

const { source, data } = await loadInApp().catch(error => fail(error.message));
const releases = Array.isArray(data?.changelog) ? data.changelog : [];
const types = option('--type')?.split(',').map(type => type.trim()).filter(Boolean);
const gaps = releases
  .filter(release => DATE.test(release?.date ?? '') && release.date > since)
  .map(release => ({
    date: release.date,
    items: (release.items ?? []).filter(item => !types || types.includes(item.type))
  }))
  .filter(release => release.items.length)
  .sort((a, b) => a.date.localeCompare(b.date));

if (flag('--json')) {
  console.log(JSON.stringify({ source, since, releases: gaps }, null, 2));
} else {
  const count = gaps.reduce((total, release) => total + release.items.length, 0);
  console.log(`In-app changelog entries after ${since} (latest docs entry${option('--since') ? ' overridden by --since' : ''}): ${count} in ${gaps.length} release days`);
  console.log(`Source: ${source}\n`);
  for (const release of gaps) {
    console.log(release.date);
    for (const item of release.items) {
      console.log(`  [${item.type ?? 'change'}] ${item.title ?? '(untitled)'}`);
      if (flag('--details') && item.description) console.log(`      ${item.description}`);
    }
  }
  if (count) console.log('\nDocs entries cover verified, developer-facing releases only: no prices, no vendor names. Label documentation-only updates.');
}
