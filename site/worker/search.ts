// GET /api/search?query=... for the site's search dialog (fumadocs fetchClient).
// The index is built once per isolate from out/data/search.json, so the browser
// never downloads it.
import { initAdvancedSearch } from 'fumadocs-core/search/server';
import { loadSearchIndex } from './docs-data';
import type { Env } from './index';

export { readDocsFile } from './docs-data';
export { searchSections, type SectionHit } from './sections';

type SearchServer = ReturnType<typeof initAdvancedSearch>;

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
  const results = await (await getServer(env)).search(query, { limit: 60 });
  return new Response(JSON.stringify(results), { headers });
}
