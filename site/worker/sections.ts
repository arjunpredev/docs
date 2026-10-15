// Section-level search over the docs, used by the MCP search tool and Ask AI.
// Each page is split at its h2 to h4 headings, and each <Tab> and <Step> becomes
// its own section, so a query for one client or one step lands on it. Anchors
// are the heading ids the site renders (taken from the search index, else the
// site's Mintlify-compatible slug rule), so every link lands on a heading; a tab
// links to its own id and a step to its heading.
import { create, insertMultiple, search, type AnyZBSearch } from 'zbsearch';
import { loadFiles, loadSearchIndex, SITE_URL, type DocsFiles, type SearchIndexEntry } from './docs-data';
import type { Env } from './index';
import { createSlugger, mintlifySlug } from '../lib/slug.mjs';

export interface Section {
  /** Section heading, tab or step title, or the page title for the text before the first heading */
  title: string;
  /** Heading, tab or step title; empty for the page intro */
  heading: string;
  pageTitle: string;
  /** Page slug, e.g. "api-reference/errors" */
  page: string;
  /** Absolute URL with #anchor when the section starts at a heading or tab */
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
const BLOCK_OPEN = /^\s*<(Tab|Step)\b[^>]*?\btitle=(["'])(.*?)\2[^>]*>\s*$/;
const BLOCK_CLOSE = /^\s*<\/(Tab|Step)>\s*$/;
// wrappers whose children become sections of their own
const WRAPPER = /^\s*<\/?(Tabs|Steps)\b[^>]*>\s*$/;
/** The page's OpenAPI operation; agents read it in full from the page file instead. */
const SKIPPED_HEADINGS = new Set(['OpenAPI']);

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

/** Undoes the indentation a <Tab> or <Step> body carries in the source. */
function dedent(lines: string[]): string[] {
  const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^\s*/)![0].length);
  const cut = indents.length ? Math.min(...indents) : 0;
  return cut ? lines.map((line) => line.slice(Math.min(cut, line.match(/^\s*/)![0].length))) : lines;
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
  // the description blockquote after the title is the page's best summary: it opens the intro
  while (start < lines.length && lines[start].trim() === '') start++;
  const intro: string[] = [];
  if (lines[start]?.startsWith('> ')) intro.push(lines[start++], '');

  // heading ids as rendered, in document order, keyed by text
  const ids = new Map<string, string[]>();
  for (const heading of index?.structuredData.headings ?? []) {
    const key = norm(heading.content);
    ids.set(key, [...(ids.get(key) ?? []), heading.id]);
  }
  const slug = createSlugger();
  const urlFor = (anchor: string) => `${SITE_URL}/${page}${anchor ? `#${anchor}` : ''}`;

  const sections: Section[] = [];
  const push = (title: string, heading: string, anchor: string, body: string[]) => {
    const content = body.join('\n').trim();
    if (content) sections.push({ title, heading, pageTitle, page, url: urlFor(anchor), content });
  };

  let current = { title: pageTitle, heading: '', anchor: '', lines: intro, skip: false };
  // tab and step sections inside the current heading, emitted after it
  let children: Section[] = [];
  let block: { kind: string; title: string; anchor: string; lines: string[]; depth: number } | null = null;
  let fence: string | null = null;
  // inside an h2 the index leaves out, down to the next h2
  let skipping = false;

  const flush = () => {
    if (!current.skip) {
      push(current.title, current.heading, current.anchor, current.lines);
      sections.push(...children);
    }
    children = [];
  };

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const target = block ? block.lines : current.lines;
    const fenceMatch = line.match(FENCE);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (fence === null) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) fence = null;
      target.push(line);
      continue;
    }
    if (fence !== null) {
      target.push(line);
      continue;
    }

    const open = line.match(BLOCK_OPEN);
    const close = line.match(BLOCK_CLOSE);
    if (block) {
      if (open?.[1] === block.kind) block.depth++;
      if (close?.[1] === block.kind && block.depth-- === 0) {
        const anchor = block.kind === 'Tab' ? block.anchor : current.anchor;
        const body = [`### ${block.title}`, '', ...dedent(block.lines)];
        const content = body.join('\n').trim();
        if (block.lines.some((l) => l.trim())) {
          children.push({ title: block.title, heading: block.title, pageTitle, page, url: urlFor(anchor), content });
        }
        block = null;
        continue;
      }
      block.lines.push(line);
      continue;
    }
    if (open) {
      const title = headingText(open[3]);
      block = { kind: open[1], title, anchor: mintlifySlug(title), lines: [], depth: 0 };
      continue;
    }
    if (WRAPPER.test(line)) continue;

    const heading = line.match(HEADING);
    if (heading) {
      flush();
      const title = headingText(heading[2]);
      const custom = heading[2].match(/\[#([^\]]+)\]\s*$/)?.[1];
      // keep the duplicate counter in step with every heading
      const slugged = slug(title);
      const anchor = custom ?? ids.get(norm(title))?.shift() ?? slugged;
      if (heading[1].length === 2) skipping = SKIPPED_HEADINGS.has(title);
      current = { title, heading: title, anchor, lines: [line], skip: skipping };
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

// path: the page slug's words ("architect agent mcp setup"), a light topic signal
const schema = { heading: 'string', pageTitle: 'string', path: 'string', content: 'string' } as const;

interface PlainText {
  body: string;
  /** heading, page title and path: where a section says what it is about */
  titles: string;
  /** titles and body together, for query word coverage */
  all: string;
  /** each code line and inline code span, as plain() text without a leading "$ " */
  code: string[];
}

interface SectionDb {
  db: AnyZBSearch;
  sections: Section[];
  /** plain() of each section's parts, for phrase matching */
  plainText: PlainText[];
}

/** Code lines of a section's fenced blocks and its inline code spans. */
function codeOf(markdown: string): string[] {
  const fenced = [...markdown.matchAll(/^\s*(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^\s*\1\s*$/gm)].flatMap((m) => m[2].split('\n'));
  const inline = [...markdown.replace(/^\s*(`{3,}|~{3,})[\s\S]*?^\s*\1\s*$/gm, '').matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
  return [...fenced, ...inline].map((line) => plain(line).trim().replace(/^\$\s+/, '')).filter(Boolean);
}

let sectionDb: SectionDb | undefined;

async function getSectionDb(env: Env): Promise<SectionDb> {
  if (sectionDb) return sectionDb;
  const [files, index] = await Promise.all([loadFiles(env), loadSearchIndex(env)]);
  const sections = splitAll(files, index);
  const plainText = sections.map((s) => {
    const body = plain(s.content);
    const heading = plain(s.heading || s.pageTitle);
    const titles = `${heading} ${plain(s.pageTitle)} ${s.page.replace(/[/-]/g, ' ')}`;
    return { body, code: codeOf(s.content), titles, all: `${titles} ${body}` };
  });
  const db = create({
    schema,
    components: { tokenizer: { language: 'english', stemming: true } },
  }) as AnyZBSearch;
  // A page intro is weighed by the page title once, as its heading, not twice.
  const docs = sections.map((s, i) => ({
    id: String(i),
    heading: s.heading || s.pageTitle,
    pageTitle: s.heading ? s.pageTitle : '',
    path: s.page.replace(/[/-]/g, ' '),
    content: s.content,
  }));
  await insertMultiple(db, docs as never[]);
  sectionDb ??= { db, sections, plainText };
  return sectionDb;
}

const PER_PAGE = 3;
/** Changelog entries describe a release, not how a feature works now: they rank below the reference pages. */
const PAGE_WEIGHT: Record<string, number> = { changelog: 0.5 };
const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'can', 'do', 'does', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'my', 'of', 'on', 'or', 'per', 'the', 'to', 'what', 'when', 'which', 'with']);

/** Query words as loose stems: "authenticate" also finds "authentication". */
function queryWords(phrase: string): RegExp[] {
  const words = [...new Set(phrase.split(/[^a-z0-9@_]+/).filter((w) => w && !STOP_WORDS.has(w)))];
  return words.map((w) => (w.length < 4 ? new RegExp(`\\b${w}\\b`) : new RegExp(w.slice(0, Math.max(4, w.length - 3)))));
}
/** Typos of two edits are only tried on words this long, and only when nothing else matched. */
const LONG_WORD = 8;

/** Text compared for exact phrases: lowercase, code marks and repeated spaces removed. */
function plain(text: string): string {
  return text.toLowerCase().replace(/[`*]/g, '').replace(/\s+/g, ' ');
}

/**
 * Phrase evidence for a section, 0 when there is none: a code line or span that
 * starts with the whole query (a command such as `predev run`, also after a
 * path such as `~/.predev/bin/`), and identifiers such as `@predotdev/mcp` or
 * `429` anywhere in the section.
 */
function phraseScore({ body, code }: PlainText, phrase: string, identifiers: string[]): number {
  let score = 0;
  // how central the command is: repeated uses and a short section mean it is the topic
  const uses = phrase.includes(' ') ? code.filter((line) => line.startsWith(phrase) || line.includes(`/${phrase}`)).length : 0;
  if (uses > 0) score += 2 + Math.min(uses, 4) * 0.5 + (body.length < 3000 ? 0.5 : 0);
  for (const id of identifiers) {
    // a section that keeps coming back to the identifier is about it
    const uses = body.split(id).length - 1;
    if (uses > 0) score += 1 + Math.min(uses - 1, 3) * 0.5;
  }
  return score;
}

/** Section results for a query, best first, at most 3 per page (empty when nothing matches). */
export async function searchSections(env: Env, query: string, limit = 8): Promise<SectionHit[]> {
  const term = query.trim().slice(0, 200);
  if (!term) return [];
  const { db, sections, plainText } = await getSectionDb(env);
  const params = {
    term,
    properties: ['heading', 'pageTitle', 'path', 'content'],
    boost: { heading: 3, pageTitle: 1.5, path: 2 },
    threshold: 0.3,
    // a wide pool, so the coverage and phrase scores below can reorder it
    limit: Math.max(200, limit * 6),
  };
  let result = await search(db, params as never);
  // nothing matched exactly: allow one typo per word, then two on long words
  if (result.count === 0) result = await search(db, { ...params, tolerance: 1 } as never);
  if (result.count === 0 && term.split(/\s+/).some((word) => word.length >= LONG_WORD)) {
    result = await search(db, { ...params, tolerance: 2 } as never);
  }

  // Exact phrases and identifiers: the keyword index splits `@predotdev/mcp` and
  // `predev run` into common words, so the section that quotes them can rank low.
  const phrase = plain(term).replace(/^["']|["']$/g, '').trim();
  const identifiers = phrase.split(' ').filter((word) => /[-@/_.]|\d/.test(word) && word.replace(/[^a-z0-9]/g, '').length >= 3);
  const scored = new Map<Section, number>();
  const top = result.hits[0]?.score ?? 1;
  // Coverage: a section that matches every query word beats one that matches a
  // single word many times or in its heading, and one whose heading, page title
  // and path name the query words is about them.
  const words = queryWords(phrase);
  const share = (text: string) => (words.length ? words.filter((w) => w.test(text)).length / words.length : 1);
  for (const hit of result.hits) {
    const i = Number(hit.id);
    scored.set(sections[i], hit.score * share(plainText[i].all) * (1 + share(plainText[i].titles)));
  }
  if (phrase.includes(' ') || identifiers.length > 0) {
    sections.forEach((section, i) => {
      const bonus = phraseScore(plainText[i], phrase, identifiers);
      if (bonus > 0) scored.set(section, (scored.get(section) ?? 0) + bonus * top * 0.5);
    });
  }
  const ranked = [...scored.entries()]
    .map(([section, score]) => [section, score * (PAGE_WEIGHT[section.page] ?? 1)] as const)
    .sort((a, b) => b[1] - a[1])
    .map(([section]) => section);

  const perPage = new Map<string, number>();
  const hits: SectionHit[] = [];
  for (const doc of ranked) {
    const count = perPage.get(doc.page) ?? 0;
    if (count >= PER_PAGE) continue;
    perPage.set(doc.page, count + 1);
    hits.push({ title: doc.title, url: doc.url, page: doc.page, content: doc.content });
    if (hits.length >= limit) break;
  }
  return hits;
}
