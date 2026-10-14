// Build data the Worker reads through the ASSETS binding (out/data/*.json).
// Values are cached per isolate once loaded. Only resolved values are shared,
// so no request ever awaits a promise that another request created.
import type { StructuredData } from 'fumadocs-core/mdx-plugins/remark-structure';
import type { Env } from './index';

export const SITE_URL = 'https://docs.pre.dev';

/** "/<slug>.mdx" and "/openapi/<spec>" to file text */
export type DocsFiles = Record<string, string>;

export interface SearchIndexEntry {
  id: string;
  url: string;
  title: string;
  description?: string;
  structuredData: StructuredData;
}

const cache = new Map<string, unknown>();

async function load<T>(env: Env, name: string): Promise<T> {
  if (cache.has(name)) return cache.get(name) as T;
  const res = await env.ASSETS.fetch(new Request(`https://assets.local/data/${name}`));
  if (!res.ok) throw new Error(`docs data /data/${name}: HTTP ${res.status}`);
  const value = (await res.json()) as T;
  if (!cache.has(name)) cache.set(name, value);
  return cache.get(name) as T;
}

export function loadFiles(env: Env): Promise<DocsFiles> {
  return load<DocsFiles>(env, 'fs.json');
}

export function loadSearchIndex(env: Env): Promise<SearchIndexEntry[]> {
  return load<SearchIndexEntry[]>(env, 'search.json');
}

/** Reads one file of the docs filesystem, e.g. "/coding-agent/quickstart.mdx". */
export async function readDocsFile(env: Env, path: string): Promise<string | undefined> {
  const files = await loadFiles(env);
  const normalized = `/${path.replace(/^\/+/, '')}`;
  return files[normalized] ?? files[`${normalized.replace(/\.mdx?$/, '')}.mdx`];
}

/** The agent skill served at /skill.md (also exposed as an MCP resource). */
export async function readSkill(env: Env): Promise<string | undefined> {
  if (cache.has('skill.md')) return cache.get('skill.md') as string;
  const res = await env.ASSETS.fetch(new Request('https://assets.local/skill.md'));
  if (!res.ok) return undefined;
  const text = await res.text();
  cache.set('skill.md', text);
  return text;
}
