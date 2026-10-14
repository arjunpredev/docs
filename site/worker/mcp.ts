// The docs MCP server at /mcp: stateless Streamable HTTP, JSON-RPC over POST.
// Tool names, schemas and output formats match the server Mintlify hosted here,
// so agents that were already connected keep working.
import docsJson from '../../docs.json';
import { serverInstructions, tools } from './mcp-tools.mjs';
import { readSkill } from './docs-data';
import { searchSections } from './sections';
import { runDocsCommand } from './shell';
import type { Env } from './index';

const SUPPORTED_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const DEFAULT_VERSION = '2025-06-18';
const MAX_BODY = 256 * 1024;
const SEARCH_RESULTS = 10;
const MAX_SECTION = 8000;

const SKILL_URI = 'predev://skills/predev';
const LEGACY_SKILL_URI = 'mintlify://skills/predev';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
};

type Id = string | number | null;

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: Id;
  method?: unknown;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: Id;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

class RpcError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
  }
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extra },
  });
}

function wantsSse(request: Request): boolean {
  return (request.headers.get('Accept') ?? '').includes('text/event-stream');
}

function reply(request: Request, messages: JsonRpcResponse[], batch: boolean): Response {
  if (wantsSse(request)) {
    const body = messages.map((m) => `event: message\ndata: ${JSON.stringify(m)}\n\n`).join('');
    return new Response(body, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', ...CORS },
    });
  }
  return json(batch ? messages : messages[0]);
}

function text(value: string) {
  return { type: 'text', text: value };
}

function stringArg(args: Record<string, unknown>, name: string, max: number): string {
  const value = args[name];
  if (typeof value !== 'string' || value.trim().length === 0) throw new RpcError(-32602, `Invalid arguments: "${name}" must be a non-empty string`);
  return value.length > max ? value.slice(0, max) : value;
}

function skillMeta(skill: string): { name: string; description: string } {
  const field = (key: string) => skill.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
  return { name: field('name') || 'predev', description: field('description') };
}

async function callTool(name: string, args: Record<string, unknown>, env: Env, ctx: ExecutionContext, prod: boolean) {
  switch (name) {
    case 'search_pre_dev': {
      const query = stringArg(args, 'query', 500);
      const hits = await searchSections(env, query, SEARCH_RESULTS);
      if (hits.length === 0) {
        return { content: [text(`No results found for "${query}". Try other keywords, or run \`rg -il "<keyword>" /\` with query_docs_filesystem_pre_dev.`)] };
      }
      return {
        content: hits.map((hit) => {
          const content = hit.content.length > MAX_SECTION ? `${hit.content.slice(0, MAX_SECTION)}\n\n[section truncated; read the full page with query_docs_filesystem_pre_dev]` : hit.content;
          return text(`Title: ${hit.title}\nLink: ${hit.url}\nPage: ${hit.page}\nContent: ${content}`);
        }),
      };
    }
    case 'query_docs_filesystem_pre_dev': {
      const command = args.command;
      if (typeof command !== 'string' || command.trim().length === 0) {
        throw new RpcError(-32602, 'Invalid arguments: "command" must be a non-empty string');
      }
      const result = await runDocsCommand(env, command);
      return result.isError ? { content: [text(result.text)], isError: true } : { content: [text(result.text)] };
    }
    case 'submit_feedback': {
      const path = stringArg(args, 'path', 500).trim();
      const feedback = stringArg(args, 'feedback', 5000).trim();
      // only production feedback reaches PostHog; previews and local runs just answer
      const apiKey = docsJson.integrations?.posthog?.apiKey;
      if (apiKey && prod) {
        ctx.waitUntil(
          fetch('https://us.i.posthog.com/capture/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: apiKey,
              event: 'docs_mcp_feedback',
              distinct_id: 'docs-mcp',
              properties: { path, feedback, source: 'docs-mcp', $process_person_profile: false },
            }),
          }).catch(() => undefined),
        );
      }
      return { content: [text(`Thanks. Your feedback about ${path} was sent to the pre.dev docs team.`)] };
    }
    default:
      throw new RpcError(-32602, `Unknown tool: ${name}`);
  }
}

async function dispatch(message: JsonRpcRequest, env: Env, ctx: ExecutionContext, prod: boolean): Promise<unknown> {
  const params = (message.params ?? {}) as Record<string, unknown>;
  switch (message.method) {
    case 'initialize': {
      const requested = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
      return {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : DEFAULT_VERSION,
        capabilities: { tools: { listChanged: false }, resources: { listChanged: true } },
        serverInfo: { name: docsJson.name, version: '1.0.0' },
        instructions: serverInstructions,
      };
    }
    case 'ping':
      return {};
    case 'tools/list':
      return { tools };
    case 'tools/call': {
      const name = params.name;
      if (typeof name !== 'string') throw new RpcError(-32602, 'Invalid params: "name" is required');
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      if (typeof args !== 'object' || args === null || Array.isArray(args)) throw new RpcError(-32602, 'Invalid params: "arguments" must be an object');
      return callTool(name, args, env, ctx, prod);
    }
    case 'resources/list': {
      const skill = await readSkill(env);
      if (!skill) return { resources: [] };
      const meta = skillMeta(skill);
      return { resources: [{ uri: SKILL_URI, name: meta.name, description: meta.description, mimeType: 'text/markdown' }] };
    }
    case 'resources/templates/list':
      return { resourceTemplates: [] };
    case 'resources/read': {
      const uri = params.uri;
      const skill = uri === SKILL_URI || uri === LEGACY_SKILL_URI ? await readSkill(env) : undefined;
      if (!skill) throw new RpcError(-32002, `Resource not found: ${String(uri)}`);
      return { contents: [{ uri, mimeType: 'text/markdown', text: skill }] };
    }
    default:
      throw new RpcError(-32601, `Method not found: ${String(message.method)}`);
  }
}

async function handleMessage(message: JsonRpcRequest, env: Env, ctx: ExecutionContext, prod: boolean): Promise<JsonRpcResponse | null> {
  const isRequest = message && typeof message === 'object' && 'id' in message && message.id !== undefined;
  const id: Id = isRequest ? (message.id as Id) : null;
  if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    // a response or malformed message: requests get an error, the rest are ignored
    return isRequest ? { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request' } } : null;
  }
  if (!isRequest) return null; // notification
  try {
    return { jsonrpc: '2.0', id, result: await dispatch(message, env, ctx, prod) };
  } catch (error) {
    if (error instanceof RpcError) return { jsonrpc: '2.0', id, error: { code: error.code, message: error.message } };
    console.error('mcp: internal error', error);
    return { jsonrpc: '2.0', id, error: { code: -32603, message: 'Internal error' } };
  }
}

export async function handleMcp(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') {
    return json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null }, 405, { Allow: 'POST, OPTIONS' });
  }

  if (env.MCP_LIMITER) {
    const key = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const { success } = await env.MCP_LIMITER.limit({ key });
    if (!success) {
      return json({ jsonrpc: '2.0', error: { code: -32000, message: 'Rate limit exceeded. Wait a minute and retry.' }, id: null }, 429, { 'Retry-After': '60' });
    }
  }

  const declared = Number(request.headers.get('Content-Length') ?? 0);
  if (declared > MAX_BODY) return json({ jsonrpc: '2.0', error: { code: -32600, message: 'Request too large' }, id: null }, 413);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ jsonrpc: '2.0', error: { code: -32600, message: 'Request too large' }, id: null }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }, 400);
  }

  const batch = Array.isArray(body);
  const messages = (batch ? body : [body]) as JsonRpcRequest[];
  if (messages.length === 0) return json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: null }, 400);
  if (messages.length > 20) return json({ jsonrpc: '2.0', error: { code: -32600, message: 'Batch too large' }, id: null }, 400);

  const prod = new URL(request.url).hostname === 'docs.pre.dev';
  const responses = (await Promise.all(messages.map((m) => handleMessage(m, env, ctx, prod)))).filter(
    (r): r is JsonRpcResponse => r !== null,
  );
  // only notifications or responses: accepted, no body
  if (responses.length === 0) return new Response(null, { status: 202, headers: CORS });
  return reply(request, responses, batch);
}

