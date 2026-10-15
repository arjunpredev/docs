// Checks the static build in out/: every docs.json page has HTML and Markdown,
// every internal link and anchor resolves, every image exists and has alt text,
// every redirect lands on a page, llms.txt links resolve, and the agent
// discovery files exist.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(site, '..');
const out = path.join(site, 'out');
const docs = JSON.parse(fs.readFileSync(path.join(root, 'docs.json'), 'utf8'));
const errors = [];

const navPages = [];
const walk = (items) => {
  for (const item of items) typeof item === 'string' ? navPages.push(item) : walk(item.pages);
};
for (const tab of docs.navigation.tabs) {
  if (tab.pages) walk(tab.pages);
  for (const group of tab.groups ?? []) walk(group.pages);
}

const redirects = new Map((docs.redirects ?? []).map((r) => [r.source, r.destination]));

function pageFile(urlPath) {
  const clean = urlPath.replace(/\/+$/, '') || '/';
  const candidates = [path.join(out, `${clean}.html`), path.join(out, clean, 'index.html'), path.join(out, clean)];
  return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile());
}

function resolve(urlPath) {
  const clean = urlPath.replace(/\/+$/, '') || '/';
  if (redirects.has(clean)) return pageFile(redirects.get(clean));
  return pageFile(clean);
}

// 1. Pages
for (const slug of navPages) {
  if (!fs.existsSync(path.join(out, `${slug}.html`))) errors.push(`missing HTML for nav page ${slug}`);
  if (!fs.existsSync(path.join(out, `${slug}.md`))) errors.push(`missing Markdown for nav page ${slug}`);
  if (!fs.existsSync(path.join(out, 'og', slug, 'image.png'))) errors.push(`missing OG image for ${slug}`);
}

// 2. Redirects land on real pages and never hide one
for (const [source, destination] of redirects) {
  if (!pageFile(destination.split('#')[0])) errors.push(`redirect ${source} -> ${destination}: destination missing`);
  if (source !== '/' && pageFile(source) && source.split('/').pop() !== '') errors.push(`redirect ${source} hides a real page`);
}

// 3. Internal links and anchors in every HTML page
const ids = new Map();
function idsOf(file) {
  if (!ids.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return ids.get(file);
}
let linkCount = 0;
for (const slug of navPages) {
  const file = path.join(out, `${slug}.html`);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  // only the article body; layout chrome is checked once through the nav pages
  const article = html.slice(html.indexOf('<article'), html.lastIndexOf('</article>'));
  for (const [, raw] of article.matchAll(/\shref="([^"]+)"/g)) {
    const href = raw.replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|cursor:|vscode:)/.test(href)) continue;
    linkCount++;
    const [target, anchor] = href.split('#');
    const targetFile = target ? resolve(decodeURI(target)) : file;
    if (!targetFile) {
      errors.push(`${slug}: broken link ${href}`);
      continue;
    }
    if (anchor && targetFile.endsWith('.html') && !idsOf(targetFile).has(decodeURIComponent(anchor))) {
      errors.push(`${slug}: missing anchor ${href}`);
    }
  }
  for (const [, src] of article.matchAll(/\ssrc="(\/[^"]+)"/g)) {
    if (src.startsWith('/_next/')) continue;
    if (!fs.existsSync(path.join(out, decodeURI(src.split('?')[0])))) errors.push(`${slug}: missing image ${src}`);
  }
  for (const [tag] of article.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="[^"]+"/.test(tag)) errors.push(`${slug}: image without alt text ${tag.match(/\ssrc="([^"]+)"/)?.[1] ?? tag}`);
  }
}

// 4. llms.txt links
const llms = fs.readFileSync(path.join(out, 'llms.txt'), 'utf8');
for (const [, url] of llms.matchAll(/\]\((https:\/\/docs\.pre\.dev[^)\s]*)\)/g)) {
  const p = new URL(url).pathname;
  const ok = p.endsWith('.md') || p.endsWith('.txt') || p.endsWith('.json') ? fs.existsSync(path.join(out, p)) : resolve(p);
  if (!ok) errors.push(`llms.txt: broken link ${url}`);
}

// 5. Static and agent files
for (const file of [
  '_redirects',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'llms-full.txt',
  'skill.md',
  'favicon.ico',
  '404.html',
  'data/search.json',
  'data/fs.json',
  '.well-known/llms.txt',
  '.well-known/mcp.json',
  '.well-known/mcp/server-card.json',
  '.well-known/agent-card.json',
  '.well-known/agent-skills/index.json',
  '.well-known/skills/index.json',
  ...[docs.api?.openapi ?? []].flat(),
]) {
  if (!fs.existsSync(path.join(out, file))) errors.push(`missing ${file}`);
}

const full = fs.readFileSync(path.join(out, 'llms-full.txt'), 'utf8');
const firstSource = full.match(/^Source: (.+)$/m)?.[1];
if (firstSource !== 'https://docs.pre.dev/agents') errors.push(`llms-full.txt should start with /agents, starts with ${firstSource}`);

if (errors.length) {
  console.error(`check-out: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`check-out: ${navPages.length} pages, ${redirects.size} redirects, ${linkCount} internal links OK`);
