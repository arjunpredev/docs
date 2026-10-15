// Server-side PostHog events (Ask AI, MCP, agent reads). Fire and forget: the
// request never waits on PostHog and a failure is ignored. No person profiles.
// Callers send only from production, so previews and local runs stay out.
import docsJson from '../../docs.json';

export function capture(ctx: ExecutionContext, event: string, distinctId: string, properties: Record<string, unknown>) {
  const apiKey = docsJson.integrations?.posthog?.apiKey;
  if (!apiKey) return;
  const host = docsJson.integrations?.posthog?.apiHost ?? 'https://us.i.posthog.com';
  ctx.waitUntil(
    fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $process_person_profile: false },
      }),
    }).catch(() => undefined),
  );
}

// AI assistants, crawlers and HTTP libraries, most specific first. A user agent
// without "Mozilla" that matches none of these is counted as "Other client".
const AGENTS: [RegExp, string][] = [
  [/ChatGPT-User/i, 'ChatGPT'],
  [/OAI-SearchBot/i, 'OpenAI search'],
  [/GPTBot/i, 'GPTBot'],
  [/Claude-User/i, 'Claude'],
  [/Claude-SearchBot/i, 'Claude search'],
  [/ClaudeBot|anthropic-ai/i, 'ClaudeBot'],
  [/Perplexity-User/i, 'Perplexity'],
  [/PerplexityBot/i, 'PerplexityBot'],
  [/Google-Extended|Google-CloudVertexBot|GoogleAgent/i, 'Google AI'],
  [/MistralAI-User/i, 'Mistral'],
  [/cohere-ai/i, 'Cohere'],
  [/DuckAssistBot/i, 'DuckAssist'],
  [/meta-externalagent|meta-externalfetcher/i, 'Meta AI'],
  [/Amazonbot/i, 'Amazonbot'],
  [/Applebot-Extended|Applebot/i, 'Applebot'],
  [/Bytespider/i, 'Bytespider'],
  [/CCBot/i, 'Common Crawl'],
  [/Cursor/i, 'Cursor'],
  [/python-requests|python-httpx|Python-urllib|aiohttp/i, 'Python'],
  [/node-fetch|undici|axios|^node$/i, 'Node'],
  [/^curl\//i, 'curl'],
  [/Go-http-client/i, 'Go'],
];

/** The agent behind a request, or undefined for a browser (or our own parity check). */
export function agentOf(userAgent: string): string | undefined {
  if (!userAgent) return 'Other client';
  if (/parity-check/i.test(userAgent)) return undefined;
  for (const [pattern, name] of AGENTS) if (pattern.test(userAgent)) return name;
  return /Mozilla/i.test(userAgent) ? undefined : 'Other client';
}
