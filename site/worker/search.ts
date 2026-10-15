// GET /api/search?query=... for the site's search dialog (fumadocs fetchClient).
// Pages are ranked by the section search the MCP server uses (titles, coverage,
// commands), then fumadocs' full-text index fills in pages it found too. Each
// page shows at most a few rows, so one long page cannot fill the list. The
// indexes are built once per isolate from out/data/*.json, so the browser never
// downloads them.
import { initAdvancedSearch } from 'fumadocs-core/search/server';
import docsJson from '../../docs.json';
import { loadSearchIndex } from './docs-data';
import type { Env } from './index';
import { searchSections } from './sections';

export { readDocsFile } from './docs-data';
export { searchSections, type SectionHit } from './sections';

type SearchServer = ReturnType<typeof initAdvancedSearch>;
type Row = Awaited<ReturnType<SearchServer['search']>>[number];

const PAGES = 12;
const ROWS_PER_PAGE = 3;

let server: SearchServer | undefined;

async function getServer(env: Env): Promise<SearchServer> {
  if (server) return server;
  const indexes = await loadSearchIndex(env);
  const fresh = initAdvancedSearch({
    indexes,
    tokenizer: { language: 'english', stemming: true } as never,
  });
  // build the index inside this request before sharing it with later ones
  await fresh.search('pre.dev');
  server ??= fresh;
  return server;
}

interface NavItem {
  group?: string;
  pages?: (string | NavItem)[];
}

let trails: Map<string, string[]> | undefined;

/** Tab and group names above each page in the sidebar, e.g. ["Build with pre.dev", "Payments"]. */
function trailOf(path: string): string[] {
  if (!trails) {
    const map = new Map<string, string[]>();
    const walk = (items: (string | NavItem)[], trail: string[]) => {
      for (const item of items) {
        if (typeof item === 'string') map.set(`/${item}`, trail);
        else if (item.pages) walk(item.pages, item.group ? [...trail, item.group] : trail);
      }
    };
    for (const tab of docsJson.navigation.tabs as { tab: string; groups?: NavItem[] }[]) {
      for (const group of tab.groups ?? []) walk(group.pages ?? [], group.group ? [tab.tab, group.group] : [tab.tab]);
    }
    trails = map;
  }
  return trails.get(path) ?? [];
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Marks the query's words in a title, as fumadocs marks its own rows. */
function highlight(text: string, query: string): string {
  const words = query.toLowerCase().split(/[^a-z0-9_@-]+/).filter((w) => w.length >= 2);
  if (words.length === 0) return text;
  return text.replace(new RegExp(`\\b(${words.map(escapeRegExp).join('|')})[a-z0-9]*`, 'gi'), '<mark>$&</mark>');
}

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=300',
};

export async function handleSearch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const query = (new URL(request.url).searchParams.get('query') ?? '').trim().slice(0, 200);
  if (query.length < 2) return new Response('[]', { headers });

  const [rows, hits, index] = await Promise.all([
    getServer(env).then((s) => s.search(query, { limit: 300 })),
    searchSections(env, query, 30),
    loadSearchIndex(env),
  ]);
  const pages = new Map(index.map((entry) => [entry.url, entry]));

  // fumadocs rows by page, in their order
  const found = new Map<string, Row[]>();
  for (const row of rows) {
    const page = row.url.split('#')[0];
    found.set(page, [...(found.get(page) ?? []), row]);
  }
  // sections by page, best first
  const sections = new Map<string, { title: string; url: string }[]>();
  for (const hit of hits) {
    const url = new URL(hit.url);
    sections.set(url.pathname, [...(sections.get(url.pathname) ?? []), { title: hit.title, url: `${url.pathname}${url.hash}` }]);
  }
  const order = [...new Set([...sections.keys(), ...found.keys()])].filter((page) => pages.has(page)).slice(0, PAGES);

  const out: Row[] = [];
  const ids = new Set<string>();
  const add = (row: Row) => {
    let id = row.id;
    for (let n = 1; ids.has(id); n++) id = `${row.id}~${n}`;
    ids.add(id);
    out.push({ ...row, id });
  };
  for (const page of order) {
    const entry = pages.get(page)!;
    const pageRow = found.get(page)?.find((row) => row.type === 'page');
    const trail = trailOf(page);
    const operation = entry.operation ? [entry.operation] : [];
    add({
      id: page,
      type: 'page',
      url: page,
      content: pageRow?.content ?? highlight(entry.title, query),
      breadcrumbs: [...trail, ...operation],
    } as Row);

    const children: Row[] = [];
    const seen = new Set<string>();
    for (const section of sections.get(page) ?? []) {
      if (section.url === page && section.title === entry.title) continue;
      seen.add(section.url);
      children.push({ id: `${section.url}#section`, type: 'heading', url: section.url, content: highlight(section.title, query) } as Row);
    }
    // then fumadocs' own matches: headings before paragraphs
    const rest = (found.get(page) ?? []).filter((row) => row.type !== 'page' && !seen.has(row.url));
    for (const row of [...rest.filter((r) => r.type === 'heading'), ...rest.filter((r) => r.type === 'text')]) {
      seen.add(row.url);
      children.push(row);
    }
    children.slice(0, ROWS_PER_PAGE).forEach(add);
  }
  return new Response(JSON.stringify(out), { headers });
}
