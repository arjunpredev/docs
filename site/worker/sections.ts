// Section-level search over the docs, used by the MCP search tool and Ask AI.
// Each page is split at its h2 to h4 headings; anchors are the heading ids the
// site renders (taken from the search index, else the site's Mintlify-compatible
// slug rule), so every link lands on a heading.
import { create, insertMultiple, search, type AnyZBSearch } from 'zbsearch';
import { loadFiles, loadSearchIndex, SITE_URL, type DocsFiles, type SearchIndexEntry } from './docs-data';
import type { Env } from './index';
import { createSlugger } from '../lib/slug.mjs';

export interface Section {
  /** Section heading, or the page title for the text before the first heading */
  title: string;
  pageTitle: string;
  /** Page slug, e.g. "api-reference/errors" */
  page: string;
  /** Absolute URL with #anchor when the section starts at a heading */
  url: string;
  /** Section Markdown, starting with its heading line */
  content: string;
}

export interface SectionHit {
  title: string;
  url: string;
  page: string;
  content: string;
}

const HEADING = /^(#{2,4})\s+(.+?)\s*#*\s*$/;
const FENCE = /^\s*(`{3,}|~{3,})/;

/** Heading Markdown to the plain text the site slugs (code, links and emphasis unwrapped). */
function headingText(markdown: string): string {
  return markdown
    .replace(/\s*\[#[^\]]+\]\s*$/, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__|\*|_)(.+?)\1/g, '$2')
    .trim();
}

function norm(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function splitPage(path: string, text: string, index?: SearchIndexEntry): Section[] {
  const page = path.replace(/^\//, '').replace(/\.mdx$/, '');
  const lines = text.split('\n');
  let pageTitle = page;
  let start = 0;
  if (lines[0]?.startsWith('# ')) {
    pageTitle = lines[0].slice(2).trim();
    start = 1;
  }
  // skip the description blockquote that follows the title
  while (start < lines.length && lines[start].trim() === '') start++;
  if (lines[start]?.startsWith('> ')) start++;

  // heading ids as rendered, in document order, keyed by text
  const ids = new Map<string, string[]>();
  for (const heading of index?.structuredData.headings ?? []) {
    const key = norm(heading.content);
    ids.set(key, [...(ids.get(key) ?? []), heading.id]);
  }
  const slug = createSlugger();

  const sections: Section[] = [];
  let current: { title: string; anchor: string; lines: string[] } = { title: pageTitle, anchor: '', lines: [] };
  let fence: string | null = null;

  const flush = () => {
    const content = current.lines.join('\n').trim();
    if (!content) return;
    sections.push({
      title: current.title,
      pageTitle,
      page,
      url: `${SITE_URL}/${page}${current.anchor ? `#${current.anchor}` : ''}`,
      content,
    });
  };

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(FENCE);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (fence === null) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) fence = null;
      current.lines.push(line);
      continue;
    }
    const heading = fence === null ? line.match(HEADING) : null;
    if (heading) {
      flush();
      const title = headingText(heading[2]);
      const custom = heading[2].match(/\[#([^\]]+)\]\s*$/)?.[1];
      // keep the duplicate counter in step with every heading
      const slugged = slug(title);
      const anchor = custom ?? ids.get(norm(title))?.shift() ?? slugged;
      current = { title, anchor, lines: [line] };
      continue;
    }
    current.lines.push(line);
  }
  flush();
  return sections;
}

export function splitAll(files: DocsFiles, index: SearchIndexEntry[]): Section[] {
  const byUrl = new Map(index.map((entry) => [entry.url, entry]));
  const out: Section[] = [];
  for (const [path, text] of Object.entries(files)) {
    if (!path.endsWith('.mdx')) continue;
    out.push(...splitPage(path, text, byUrl.get(path.replace(/\.mdx$/, ''))));
  }
  return out;
}

const schema = { title: 'string', pageTitle: 'string', content: 'string' } as const;

let sectionDb: AnyZBSearch | undefined;

async function getSectionDb(env: Env): Promise<AnyZBSearch> {
  if (sectionDb) return sectionDb;
  const [files, index] = await Promise.all([loadFiles(env), loadSearchIndex(env)]);
  const db = create({
    schema,
    components: { tokenizer: { language: 'english', stemming: true } },
  }) as AnyZBSearch;
  await insertMultiple(db, splitAll(files, index) as never[]);
  sectionDb ??= db;
  return sectionDb;
}

const PER_PAGE = 3;

/** Section results for a query, best first, at most 3 per page (empty when nothing matches). */
export async function searchSections(env: Env, query: string, limit = 8): Promise<SectionHit[]> {
  const term = query.trim().slice(0, 200);
  if (!term) return [];
  const db = await getSectionDb(env);
  const params = {
    term,
    properties: ['title', 'pageTitle', 'content'],
    boost: { title: 3, pageTitle: 1.5 },
    threshold: 0.3,
    limit: limit * 4,
  };
  let result = await search(db, params as never);
  // nothing matched exactly: allow one typo per word
  if (result.count === 0) result = await search(db, { ...params, tolerance: 1 } as never);

  const perPage = new Map<string, number>();
  const hits: SectionHit[] = [];
  for (const hit of result.hits) {
    const doc = hit.document as unknown as Section;
    const count = perPage.get(doc.page) ?? 0;
    if (count >= PER_PAGE) continue;
    perPage.set(doc.page, count + 1);
    hits.push({ title: doc.title, url: doc.url, page: doc.page, content: doc.content });
    if (hits.length >= limit) break;
  }
  return hits;
}
