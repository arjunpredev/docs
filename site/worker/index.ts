// Serves the static docs build and the few dynamic routes Mintlify provided:
// Markdown for agents, the docs MCP server at /mcp, and Ask AI at /api/chat.
import { handleMcp } from './mcp';
import { handleChat } from './chat';
import { handleSearch, searchSections } from './search';

export interface Env {
  ASSETS: Fetcher;
  /** Ask AI provider key (secret) */
  ASK_AI_KEY?: string;
  /** OpenAI-compatible chat completions URL for the writer model (secret) */
  ASK_AI_CHAT_URL?: string;
  /** Jev key; without it Ask AI answers from keyword search alone (secret) */
  ASK_AI_JEV_KEY?: string;
  /** Model that writes Ask AI answers */
  ASK_AI_MODEL?: string;
  /** Decision model that triages Ask AI questions */
  ASK_AI_JEV_MODEL?: string;
  /** "off" skips the decision model and answers from keyword search alone */
  ASK_AI_JEV?: string;
  /** Turnstile secret; when set, Ask AI requires a token (secret) */
  TURNSTILE_SECRET?: string;
  CHAT_LIMITER?: RateLimit;
  MCP_LIMITER?: RateLimit;
}

const PROD_HOST = 'docs.pre.dev';
const SITE = `https://${PROD_HOST}`;

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

const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Same shape as the policy the Mintlify-hosted site sent: HTTPS sources only, no framing.
const CSP = [
  "default-src 'self' https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' data: https: wss:",
  "frame-src 'self' blob: https:",
  "worker-src 'self' blob:",
  "media-src 'self' data: blob: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

/** Browser cache lifetime by path; everything else revalidates on each visit. */
function cacheControl(pathname: string): string | undefined {
  if (pathname.startsWith('/_next/static/')) return 'public, max-age=31536000, immutable';
  if (pathname.startsWith('/og/') || pathname.startsWith('/images/') || pathname === '/favicon.ico') {
    return 'public, max-age=86400, stale-while-revalidate=604800';
  }
  if (pathname.endsWith('llms-full.txt')) return 'public, max-age=3600';
  return undefined;
}

/** Markdown 404 for agents: the index pointers plus a few pages that match the requested path. */
async function markdownNotFound(env: Env, pathname: string): Promise<Response> {
  const words = pathname
    .replace(/\.(md|txt)$/i, '')
    .split(/[/_.\-]+/)
    .filter((w) => w.length > 1)
    .join(' ');
  const hits = words ? await searchSections(env, words, 5).catch(() => []) : [];
  const pages = [...new Map(hits.map((h) => [h.page, h])).values()].slice(0, 3);
  const lines = [
    '> ## Documentation Index',
    `> Fetch the documentation index at: ${SITE}/llms.txt`,
    '> Use this file to discover all available pages before exploring further.',
    `> For broader context, fetch the full documentation at: ${SITE}/llms-full.txt (large file).`,
    '',
    '# Page Not Found',
    '',
    `There is no page at \`${pathname}\`. Every page is listed in ${SITE}/llms.txt, and adding \`.md\` to a page URL returns its Markdown.`,
  ];
  if (pages.length) {
    lines.push('', '## Related pages', '');
    for (const p of pages) lines.push(`- [${p.title}](${SITE}/${p.page}.md)`);
  }
  return new Response(`${lines.join('\n')}\n`, {
    status: 404,
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', Link: LINK },
  });
}

function redirect(url: URL, pathname: string, status = 308): Response {
  return new Response(null, { status, headers: { Location: pathname + url.search } });
}

async function route(request: Request, env: Env, ctx: ExecutionContext, url: URL): Promise<Response> {
  const { pathname } = url;
  const prod = url.hostname === PROD_HOST;

  if (pathname === '/mcp' || pathname === '/mcp/') return handleMcp(request, env, ctx);
  if (pathname === '/api/chat') return handleChat(request, env, ctx);
  if (pathname === '/api/search') return handleSearch(request, env, ctx);
  // Build data the Worker reads through the ASSETS binding; not a public URL.
  if (pathname.startsWith('/data/')) return new Response('Not found', { status: 404 });

  if (!prod && pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  // Old and alternate spellings Mintlify answered with a redirect
  if (pathname.length > 1 && pathname.endsWith('/')) return redirect(url, pathname.replace(/\/+$/, '') || '/');
  if (pathname === '/index') return redirect(url, '/overview');
  if (pathname === '/index.md' || pathname === '/.md') return redirect(url, '/overview.md');

  // Discovery aliases
  if (pathname === '/.well-known/llms-full.txt') return env.ASSETS.fetch(new Request(new URL('/llms-full.txt', url), request));
  if (pathname === '/.well-known/mcp') {
    const card = await env.ASSETS.fetch(new Request(new URL('/.well-known/mcp.json', url), request));
    return withHeaders(card, { 'Content-Type': 'application/json' });
  }

  const markdown = (request.method === 'GET' || request.method === 'HEAD') && wantsMarkdown(request);
  if (markdown && isPagePath(pathname)) {
    const mdUrl = new URL(`${pathname === '/' ? '/overview' : pathname}.md`, url);
    const md = await env.ASSETS.fetch(new Request(mdUrl, { method: request.method, headers: request.headers }));
    if (md.status === 200) {
      return withHeaders(md, { 'Content-Type': 'text/markdown; charset=utf-8', Link: LINK }, { Vary: 'Accept, User-Agent' });
    }
  }

  const response = await env.ASSETS.fetch(request);
  if (response.status === 404) {
    // /AGENTS.md, /Overview: Mintlify sent any casing to the lowercase page
    if (/[A-Z]/.test(pathname)) {
      const lower = pathname.toLowerCase();
      const found = await env.ASSETS.fetch(new Request(new URL(lower, url), { method: 'HEAD' }));
      if (found.status < 400) return redirect(url, lower);
    }
    if (/\.(md|txt)$/i.test(pathname) || (markdown && isPagePath(pathname))) return markdownNotFound(env, pathname);
  }
  const type = response.headers.get('Content-Type') ?? '';
  if (type.includes('text/html')) return withHeaders(response, { Link: LINK }, { Vary: 'Accept, User-Agent' });
  if (pathname === '/sitemap.xml') return withHeaders(response, { 'Content-Type': 'text/xml; charset=utf-8' });
  return response;
}

/** Headers every response gets: charset on text, cache lifetime, security headers over HTTPS, and noindex off production. */
function finish(response: Response, url: URL, secure: boolean): Response {
  const headers = new Headers(response.headers);
  const type = headers.get('Content-Type') ?? '';
  if (type.startsWith('text/') && !/charset=/i.test(type)) headers.set('Content-Type', `${type}; charset=utf-8`);
  const cache = response.status === 200 ? cacheControl(url.pathname) : undefined;
  if (cache) headers.set('Cache-Control', cache);
  if (secure) {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
    if (type.startsWith('text/html')) headers.set('Content-Security-Policy', CSP);
  }
  if (url.hostname !== PROD_HOST) headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/** The scheme the visitor used, as Cloudflare reports it. Local dev reports none. */
function visitorScheme(request: Request): string | undefined {
  const forwarded = request.headers.get('X-Forwarded-Proto');
  if (forwarded) return forwarded.toLowerCase();
  try {
    return (JSON.parse(request.headers.get('CF-Visitor') ?? '') as { scheme?: string }).scheme;
  } catch {
    return undefined;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const scheme = visitorScheme(request);
    if (scheme === 'http') {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    return finish(await route(request, env, ctx, url), url, scheme === 'https');
  },
} satisfies ExportedHandler<Env>;
