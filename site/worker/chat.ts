// Ask AI: answers questions from the docs through the pre.dev AI Gateway.
// Retrieval reuses the MCP search; the reply streams back as small SSE events:
//   {"sources":[{title,url}]}  then  {"t":"text delta"}...  then  {"done":true}
import docsJson from '../../docs.json';
import type { Env } from './index';
import { readDocsFile, searchSections } from './search';

const GATEWAY_URL = 'https://api.pre.dev/v1/chat/completions';
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 4000;
const MAX_CONTEXT_CHARS = 28_000;
const MAX_PAGE_CHARS = 12_000;

const SYSTEM_PROMPT = `You are the assistant on the pre.dev documentation site (https://docs.pre.dev).
Answer questions about pre.dev using only the documentation excerpts provided below.
- Link every page you rely on as a Markdown link with the exact URL given in the excerpts.
- If the excerpts do not answer the question, say so plainly, then point to the closest page or to support@pre.dev. Never invent endpoints, fields, prices, limits or behavior.
- Keep answers short and practical. Use fenced code blocks with a language for code. Do not use em dashes.
- Only answer questions about pre.dev and building with it. Politely decline anything else.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function parseMessages(value: unknown): ChatMessage[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const messages = value.slice(-MAX_MESSAGES).map((m) => {
    if (!m || typeof m !== 'object') return undefined;
    const { role, content } = m as Record<string, unknown>;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) return undefined;
    return { role, content: content.slice(0, MAX_MESSAGE_CHARS) } satisfies ChatMessage;
  });
  if (messages.some((m) => !m)) return undefined;
  const list = messages as ChatMessage[];
  return list.at(-1)?.role === 'user' ? list : undefined;
}

async function verifyTurnstile(env: Env, token: unknown, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  if (typeof token !== 'string' || !token) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const outcome = (await res.json()) as { success?: boolean };
  return outcome.success === true;
}

function capture(env: Env, ctx: ExecutionContext, ip: string, properties: Record<string, unknown>) {
  const apiKey = docsJson.integrations?.posthog?.apiKey;
  if (!apiKey) return;
  const host = docsJson.integrations?.posthog?.apiHost ?? 'https://us.i.posthog.com';
  ctx.waitUntil(
    fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event: 'docs_ask_ai',
        distinct_id: `docs-ask-ai:${ip || 'unknown'}`,
        properties: { ...properties, $process_person_profile: false },
      }),
    }).catch(() => undefined),
  );
}

export async function handleChat(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'Use POST' });

  // Browser calls only come from the docs site itself.
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json(403, { error: 'Forbidden' });

  if (!env.ASK_AI_KEY) return json(503, { error: 'Ask AI is not available right now.' });

  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  if (env.CHAT_LIMITER) {
    const { success } = await env.CHAT_LIMITER.limit({ key: ip || 'unknown' });
    if (!success) return json(429, { error: 'Too many questions. Wait a minute and try again.' });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }
  const messages = parseMessages(body.messages);
  if (!messages) return json(400, { error: 'Send messages as [{ role, content }] ending with a user message.' });
  if (!(await verifyTurnstile(env, body.turnstileToken, ip))) return json(403, { error: 'Verification failed. Reload the page and try again.' });

  const question = messages.at(-1)!.content;
  const page = typeof body.page === 'string' && /^[a-z0-9/-]{1,120}$/.test(body.page) ? body.page : undefined;

  const [sections, pageText] = await Promise.all([
    searchSections(env, question.slice(0, 500), 8),
    page ? readDocsFile(env, `/${page}.mdx`) : Promise.resolve(undefined),
  ]);

  let context = '';
  if (pageText) context += `## Page the reader is on (https://docs.pre.dev/${page})\n\n${pageText.slice(0, MAX_PAGE_CHARS)}\n\n`;
  for (const section of sections) {
    const block = `## ${section.title}\nURL: ${section.url}\n\n${section.content}\n\n`;
    if (context.length + block.length > MAX_CONTEXT_CHARS) break;
    context += block;
  }

  const upstream = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.ASK_AI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.ASK_AI_MODEL,
      stream: true,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [{ role: 'system', content: `${SYSTEM_PROMPT}\n\n# Documentation excerpts\n\n${context || '(no matching excerpts)'}` }, ...messages],
    }),
  });
  if (!upstream.ok || !upstream.body) {
    console.error('ask-ai upstream error', upstream.status, (await upstream.text()).slice(0, 500));
    return json(502, { error: 'The assistant is unavailable right now. Try again shortly.' });
  }

  capture(env, ctx, ip, { question: question.slice(0, 500), page, sources: sections.length });

  const sources = [...new Map(sections.map((s) => [s.url.split('#')[0], { title: s.title, url: s.url }])).values()].slice(0, 5);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const send = (data: unknown) => writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  const pump = async () => {
    try {
      await send({ sources });
      const reader = upstream.body!.getReader();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline: number;
        while ((newline = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const chunk = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
            const text = chunk.choices?.[0]?.delta?.content;
            if (text) await send({ t: text });
          } catch {
            // ignore keep-alives and partial frames
          }
        }
      }
      await send({ done: true });
    } catch (error) {
      console.error('ask-ai stream error', error);
      await send({ error: 'The answer was interrupted. Try again.' }).catch(() => undefined);
    } finally {
      await writer.close().catch(() => undefined);
    }
  };
  ctx.waitUntil(pump());

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  });
}
