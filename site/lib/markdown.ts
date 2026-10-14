// Markdown served to agents: /<page>.md, Accept: text/markdown, llms-full.txt
// and the docs MCP server. Mirrors Mintlify's output format.
import { stringify } from 'yaml';
import { docsJson, navPages, siteUrl } from './docs-config';
import { extractOperation, parseOpenAPIRef, readSpec } from './openapi';
import { getPageBySlug, pageSlug, type DocsPage } from './source';

export function indexNotice(): string {
  return [
    '> ## Documentation Index',
    `> Fetch the complete documentation index at: ${siteUrl}/llms.txt`,
    '> Use this file to discover all available pages before exploring further.',
  ].join('\n');
}

export function agentInstructions(): string {
  const lines = docsJson.markdown?.instructions ?? [];
  if (lines.length === 0) return '';
  return ['> ## Agent Instructions', ...lines.map((line) => `> ${line}`)].join('\n');
}

/** The operation plus every component it references, like Mintlify's "## OpenAPI" block. */
export function operationYaml(value: string): string {
  const ref = parseOpenAPIRef(value);
  const extract = extractOperation(readSpec(ref.document), ref);
  return `\`\`\`\`yaml ${ref.document} ${ref.method.toUpperCase()} ${ref.path}\n${stringify(extract, { lineWidth: 80, singleQuote: true, blockQuote: 'folded', version: '1.1', aliasDuplicateObjects: false })}\`\`\`\``;
}

async function pageBody(page: DocsPage): Promise<string> {
  let body = (await page.data.getText('processed')).trim();
  if (page.data.openapi) body += `\n\n\n## OpenAPI\n\n${operationYaml(page.data.openapi)}`;
  return body;
}

/** /<page>.md */
export async function pageMarkdown(page: DocsPage): Promise<string> {
  const parts = [indexNotice(), agentInstructions(), `# ${page.data.title}`];
  if (page.data.description) parts.push(`> ${page.data.description}`);
  parts.push(await pageBody(page));
  return `${parts.filter(Boolean).join('\n\n')}\n`;
}

/** A page as the MCP filesystem shows it: title, description, body. */
export async function pageFileText(page: DocsPage): Promise<string> {
  const parts = [`# ${page.data.title}`];
  if (page.data.description) parts.push(`> ${page.data.description}`);
  parts.push(await pageBody(page));
  return `${parts.join('\n\n')}\n`;
}

/** Pages in navigation order, then any page docs.json does not list. */
export function orderedPages(): DocsPage[] {
  const seen = new Set<string>();
  const out: DocsPage[] = [];
  for (const slug of navPages()) {
    const page = getPageBySlug(slug);
    if (page && !seen.has(slug)) {
      seen.add(slug);
      out.push(page);
    }
  }
  return out;
}

/** /llms-full.txt */
export async function llmsFull(): Promise<string> {
  // Path order, as Mintlify did: agents.mdx sorts first on purpose (see README).
  const pages = [...orderedPages()].sort((a, b) => pageSlug(a).localeCompare(pageSlug(b)));
  const sections = await Promise.all(
    pages.map(async (page) => {
      const head = [`# ${page.data.title}`, `Source: ${siteUrl}/${pageSlug(page)}`].join('\n');
      const desc = page.data.description ? `\n\n${page.data.description}` : '';
      return `${head}${desc}\n\n${(await page.data.getText('processed')).trim()}`;
    }),
  );
  return `${[agentInstructions(), ...sections].filter(Boolean).join('\n\n\n')}\n`;
}
