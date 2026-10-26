// Checks the static build in out/: every docs.json page has HTML, Markdown and
// its own share card with alt text, every internal link and anchor resolves, every image exists and has alt text,
// every redirect lands on a page, llms.txt and API catalog links resolve, and
// the agent discovery files exist.
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
}

// 1b. Share cards: each page's og:image and twitter:image are its own card at
// /og/<page>/<hash>.png, a 1200x630 PNG in the build, with alt text and the full tag set
const metaTag = (html, key) => html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1];
const decodeHtml = (text) =>
  text.replace(/&(?:#x([0-9a-f]+)|#(\d+)|(amp|lt|gt|quot|apos));/gi, (_, hex, dec, name) =>
    hex ? String.fromCodePoint(parseInt(hex, 16)) : dec ? String.fromCodePoint(Number(dec)) : { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[name.toLowerCase()],
  );
let cardCount = 0;
for (const slug of navPages) {
  const file = path.join(out, `${slug}.html`);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const tag = (key) => metaTag(html, key);
  const problem = (text) => errors.push(`${slug}: ${text}`);
  const title = tag('og:title');
  if (!title) problem('no og:title');
  else if (html.match(/<title>([^<]*)<\/title>/)?.[1] !== `${title} - ${docs.name}`) problem(`og:title "${title}" is not the page title alone`);
  if (tag('og:site_name') !== docs.name) problem(`og:site_name should be ${docs.name}`);
  const image = tag('og:image');
  const expected = new RegExp(`^https://docs\\.pre\\.dev/og/${slug}/[0-9a-f]{10}\\.png$`);
  if (!image || !expected.test(image)) {
    problem(`og:image ${image ?? '(none)'} is not the page's card at /og/${slug}/<hash>.png`);
    continue;
  }
  const png = path.join(out, new URL(image).pathname);
  if (!fs.existsSync(png)) problem(`card missing from the build: ${new URL(image).pathname}`);
  else {
    const head = fs.readFileSync(png).subarray(0, 24);
    const size = head.toString('latin1', 12, 16) === 'IHDR' ? `${head.readUInt32BE(16)}x${head.readUInt32BE(20)}` : 'not a PNG';
    if (size !== '1200x630') problem(`card ${new URL(image).pathname} is ${size}, should be 1200x630`);
    else cardCount++;
  }
  if (tag('og:image:width') !== '1200' || tag('og:image:height') !== '630') problem('og:image:width/height should be 1200/630');
  const alt = tag('og:image:alt');
  if (!alt?.trim()) problem('no og:image:alt');
  else if (!alt.startsWith(title ?? '') || decodeHtml(alt).length > 420) problem(`og:image:alt should start with the title and stay under 420 characters: ${alt}`);
  if (tag('twitter:card') !== 'summary_large_image') problem('twitter:card should be summary_large_image');
  if (tag('twitter:image') !== image) problem(`twitter:image ${tag('twitter:image') ?? '(none)'} should be ${image}`);
  if (tag('twitter:image:alt') !== alt) problem('twitter:image:alt should match og:image:alt');
  if (!fs.existsSync(path.join(out, 'og', slug, 'image.png'))) problem(`missing /og/${slug}/image.png (the card's old address)`);
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
  '.well-known/api-catalog.json',
  '.well-known/agent-card.json',
  '.well-known/agent-skills/index.json',
  '.well-known/skills/index.json',
  ...[docs.api?.openapi ?? []].flat(),
]) {
  if (!fs.existsSync(path.join(out, file))) errors.push(`missing ${file}`);
}

// 6. Every docs link in the API catalog resolves
const catalog = JSON.parse(fs.readFileSync(path.join(out, '.well-known/api-catalog.json'), 'utf8'));
for (const entry of catalog.linkset) {
  for (const link of [...(entry['service-desc'] ?? []), ...(entry['service-doc'] ?? [])]) {
    const p = new URL(link.href).pathname;
    if (!(path.extname(p) ? fs.existsSync(path.join(out, p)) : resolve(p))) errors.push(`api-catalog: broken link ${link.href}`);
  }
}

const full = fs.readFileSync(path.join(out, 'llms-full.txt'), 'utf8');
const firstSource = full.match(/^Source: (.+)$/m)?.[1];
if (firstSource !== 'https://docs.pre.dev/agents') errors.push(`llms-full.txt should start with /agents, starts with ${firstSource}`);

if (errors.length) {
  console.error(`check-out: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`check-out: ${navPages.length} pages, ${cardCount} share cards, ${redirects.size} redirects, ${linkCount} internal links OK`);
