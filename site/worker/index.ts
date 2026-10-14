// Serves the static docs build and the few dynamic routes Mintlify provided:
// Markdown for agents, the docs MCP server at /mcp, and Ask AI at /api/chat.
import { handleMcp } from './mcp';
import { handleChat } from './chat';
import { handleSearch } from './search';

export interface Env {
  ASSETS: Fetcher;
  /** pre.dev AI Gateway key used by Ask AI (secret) */
  ASK_AI_KEY?: string;
  ASK_AI_MODEL?: string;
  /** Turnstile secret; when set, Ask AI requires a token (secret) */
  TURNSTILE_SECRET?: string;
  CHAT_LIMITER?: RateLimit;
  MCP_LIMITER?: RateLimit;
}

const PROD_HOST = 'docs.pre.dev';

const LINK = [
  '</llms.txt>; rel="llms-txt"',
  '</llms-full.txt>; rel="llms-full-txt"',
  '</.well-known/mcp/server-card.json>; rel="mcp-server-card"',
  '</.well-known/agent-card.json>; rel="agent-card"',
  '</.well-known/agent-skills/index.json>; rel="agent-skills"',
].join(', ');

// AI fetchers that get Markdown instead of HTML (same set Mintlify answered with Markdown)
const MARKDOWN_AGENTS = /(Claude-User|ChatGPT-User|OAI-SearchBot|PerplexityBot|Perplexity-User|cohere-ai|MistralAI-User|DuckAssistBot)/i;

function wantsMarkdown(request: Request): boolean {
  if (MARKDOWN_AGENTS.test(request.headers.get('User-Agent') ?? '')) return true;
  const accept = request.headers.get('Accept') ?? '';
  let md = -1;
  let html = -1;
  for (const part of accept.split(',')) {
    const [type, ...params] = part.trim().split(';');
    const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1);
    const t = type.trim().toLowerCase();
    if (t === 'text/markdown' || t === 'text/plain' || t === 'text/x-markdown') md = Math.max(md, q);
    if (t === 'text/html' || t === 'application/xhtml+xml') html = Math.max(html, q);
  }
  return md > 0 && md >= html;
}

function isPagePath(pathname: string): boolean {
  const last = pathname.split('/').pop() ?? '';
  return !last.includes('.') && !pathname.startsWith('/_next/') && !pathname.startsWith('/api/') && !pathname.startsWith('/og/');
}

function withHeaders(response: Response, set: Record<string, string>, append: Record<string, string> = {}): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(set)) headers.set(k, v);
  for (const [k, v] of Object.entries(append)) headers.append(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const prod = url.hostname === PROD_HOST;

    if (url.pathname === '/mcp' || url.pathname === '/mcp/') {
      return handleMcp(request, env, ctx);
    }
    if (url.pathname === '/api/chat') return handleChat(request, env, ctx);
    if (url.pathname === '/api/search') return handleSearch(request, env, ctx);
    // Build data the Worker reads through the ASSETS binding; not a public URL.
    if (url.pathname.startsWith('/data/')) return new Response('Not found', { status: 404 });

    if (!prod && url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    const noindex: Record<string, string> = prod ? {} : { 'X-Robots-Tag': 'noindex, nofollow' };

    if ((request.method === 'GET' || request.method === 'HEAD') && isPagePath(url.pathname) && wantsMarkdown(request)) {
      const mdUrl = new URL(`${url.pathname.replace(/\/$/, '') || '/overview'}.md`, url);
      const md = await env.ASSETS.fetch(new Request(mdUrl, { method: request.method, headers: request.headers }));
      if (md.status === 200) {
        return withHeaders(md, { 'Content-Type': 'text/markdown; charset=utf-8', Link: LINK, ...noindex }, { Vary: 'Accept, User-Agent' });
      }
    }

    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get('Content-Type') ?? '';
    if (type.includes('text/html')) {
      return withHeaders(response, { Link: LINK, ...noindex }, { Vary: 'Accept, User-Agent' });
    }
    if (url.pathname === '/sitemap.xml') {
      return withHeaders(response, { 'Content-Type': 'text/xml; charset=utf-8', ...noindex });
    }
    if (type.includes('text/markdown') && !type.includes('charset')) {
      return withHeaders(response, { 'Content-Type': 'text/markdown; charset=utf-8', ...noindex });
    }
    return prod ? response : withHeaders(response, noindex);
  },
} satisfies ExportedHandler<Env>;
