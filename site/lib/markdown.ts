// Markdown served to agents: /<page>.md, Accept: text/markdown, llms-full.txt
// and the docs MCP server. Mirrors Mintlify's output format.
import { stringify } from 'yaml';
import { docsJson, navPages, siteUrl } from './docs-config';
import { extractOperation, parseOpenAPIRef, readSpec, resolveRef } from './openapi';
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

/** One-line table rows: the stringifier pads every cell to its column's width. */
export function compactTables(markdown: string): string {
  let fence: string | null = null;
  return markdown
    .split('\n')
    .map((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
      if (marker) {
        if (fence === null) fence = marker;
        else if (marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) fence = null;
        return line;
      }
      if (fence !== null || !/^\s*\|.*\|\s*$/.test(line)) return line;
      const cells = line.trim().slice(1, -1).split(/(?<!\\)\|/).map((cell) => cell.trim());
      const delimiter = cells.every((cell) => /^:?-+:?$/.test(cell));
      const out = delimiter ? cells.map((cell) => `${cell.startsWith(':') ? ':' : ''}-${cell.endsWith(':') ? ':' : ''}`) : cells;
      return `| ${out.join(' | ')} |`;
    })
    .join('\n');
}

async function processedText(page: DocsPage): Promise<string> {
  return compactTables((await page.data.getText('processed')).trim());
}

async function pageBody(page: DocsPage): Promise<string> {
  let body = await processedText(page);
  if (page.data.openapi) body += `\n\n\n## OpenAPI\n\n${operationYaml(page.data.openapi)}`;
  return body;
}

const SAMPLE_LANGS: Record<string, string> = { curl: 'bash', javascript: 'javascript', typescript: 'typescript', python: 'python' };

/** The first sentence of a description, on one line. */
function brief(text: unknown, max = 160): string {
  if (typeof text !== 'string') return '';
  const line = text.replace(/\s+/g, ' ').trim();
  const sentence = line.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? line;
  return sentence.length > max ? `${sentence.slice(0, max - 1)}…` : sentence;
}

/** A schema's type in a few words: "string", "array of Message", "one of: a, b". */
function typeLabel(spec: Record<string, any>, schema: any): string {
  const name = typeof schema?.$ref === 'string' ? schema.$ref.split('/').pop() : undefined;
  const node = resolveRef(spec, schema);
  if (!node) return name ?? 'unknown';
  if (Array.isArray(node.enum)) return `one of: ${node.enum.slice(0, 6).map((v: unknown) => JSON.stringify(v)).join(', ')}${node.enum.length > 6 ? ', …' : ''}`;
  if (node.type === 'array') return `array of ${typeLabel(spec, node.items)}`;
  if (node.oneOf || node.anyOf) return (node.oneOf ?? node.anyOf).map((v: any) => typeLabel(spec, v)).join(' or ');
  if (name) return name;
  return Array.isArray(node.type) ? node.type.join(' or ') : (node.type ?? 'object');
}

/** Top-level properties of an object schema, through allOf/oneOf/anyOf and refs. */
function properties(spec: Record<string, any>, schema: any): { name: string; schema: any; required: boolean }[] {
  const node = resolveRef(spec, schema);
  if (!node) return [];
  if (node.type === 'array') return properties(spec, node.items);
  const parts = [node, ...(node.allOf ?? []).map((p: any) => resolveRef(spec, p))];
  const out = new Map<string, { name: string; schema: any; required: boolean }>();
  for (const part of parts.filter(Boolean)) {
    for (const [name, prop] of Object.entries(part.properties ?? {})) {
      out.set(name, { name, schema: prop, required: (part.required ?? []).includes(name) });
    }
  }
  // variants of the body: their fields, none required across all of them
  for (const variant of [...(node.oneOf ?? []), ...(node.anyOf ?? [])]) {
    for (const field of properties(spec, variant)) if (!out.has(field.name)) out.set(field.name, { ...field, required: false });
  }
  return [...out.values()];
}

/**
 * An API page's operation for the MCP filesystem: what an agent needs to make the
 * call (method, URL, auth, inputs, outcomes) and the curated code samples, with
 * the full definition left in the spec file. Shared responses are named, not
 * repeated on every page.
 */
export function operationSummary(value: string): string {
  const ref = parseOpenAPIRef(value);
  const spec = readSpec(ref.document);
  const pathItem = spec.paths[ref.path];
  const operation = pathItem[ref.method];
  const server = spec.servers?.[0]?.url ?? '';
  const lines = [`## ${ref.method.toUpperCase()} ${ref.path} [#openapi]`, ''];
  lines.push(`\`${ref.method.toUpperCase()} ${server}${ref.path}\`${operation.summary ? `: ${brief(operation.summary)}` : ''}`);
  lines.push('', `Full definition: \`/openapi/${ref.document}\`, \`paths["${ref.path}"].${ref.method}\`.`);

  const security = operation.security ?? spec.security ?? [];
  const schemes = spec.components?.securitySchemes ?? {};
  const auth = security
    .flatMap((requirement: Record<string, unknown>) => Object.keys(requirement))
    .map((name: string) => {
      const scheme = schemes[name];
      if (scheme?.type === 'http' && scheme.scheme === 'bearer') return '`Authorization: Bearer <key>`';
      if (scheme?.type === 'apiKey') return `\`${scheme.name}: <key>\` (${scheme.in})`;
      return `\`${name}\``;
    });
  lines.push('', `Auth: ${auth.length ? auth.join(' or ') : 'none'}.`);

  const params = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])].map((p: any) => resolveRef(spec, p)).filter(Boolean);
  if (params.length) {
    lines.push('', 'Parameters:');
    for (const p of params) {
      lines.push(`- \`${p.name}\` (${p.in}, ${typeLabel(spec, p.schema)}${p.required ? ', required' : ''})${p.description ? `: ${brief(p.description)}` : ''}`);
    }
  }

  const body = resolveRef(spec, operation.requestBody);
  if (body?.content) {
    const [type, ...others] = Object.keys(body.content);
    lines.push('', `Request body (\`${type}\`${others.length ? `; also ${others.map((t) => `\`${t}\``).join(', ')}` : ''}):`);
    for (const field of properties(spec, body.content[type].schema)) {
      const prop = resolveRef(spec, field.schema) ?? {};
      lines.push(`- \`${field.name}\` (${typeLabel(spec, field.schema)}${field.required ? ', required' : ''})${prop.description ? `: ${brief(prop.description)}` : ''}`);
    }
  }

  lines.push('', 'Responses:');
  for (const [status, response] of Object.entries<any>(operation.responses ?? {})) {
    if (typeof response?.$ref === 'string') {
      lines.push(`- \`${status}\`: shared response \`${response.$ref.split('/').pop()}\``);
      continue;
    }
    const [type] = Object.keys(response?.content ?? {});
    const fields = type ? properties(spec, response.content[type].schema).map((f) => `\`${f.name}\``) : [];
    const shape = type === 'text/event-stream' ? ' Server-sent events.' : fields.length ? ` Fields: ${fields.slice(0, 15).join(', ')}${fields.length > 15 ? ', …' : ''}.` : '';
    lines.push(`- \`${status}\`: ${brief(response?.description) || 'No description.'}${shape}`);
  }

  const samples: { lang?: string; label?: string; source?: string }[] = operation['x-codeSamples'] ?? [];
  if (samples.length) {
    lines.push('', '### Code samples [#openapi]');
    for (const sample of samples) {
      const lang = SAMPLE_LANGS[(sample.lang ?? '').toLowerCase()] ?? (sample.lang ?? '').toLowerCase();
      lines.push('', `\`\`\`${lang} ${sample.label ?? sample.lang ?? ''}`.trimEnd(), (sample.source ?? '').trimEnd(), '```');
    }
  }
  return lines.join('\n');
}

/** /<page>.md */
export async function pageMarkdown(page: DocsPage): Promise<string> {
  const parts = [indexNotice(), agentInstructions(), `# ${page.data.title}`];
  if (page.data.description) parts.push(`> ${page.data.description}`);
  parts.push(await pageBody(page));
  return `${parts.filter(Boolean).join('\n\n')}\n`;
}

/** A page as the MCP filesystem shows it: title, description, body, and an API page's operation in brief. */
export async function pageFileText(page: DocsPage): Promise<string> {
  const parts = [`# ${page.data.title}`];
  if (page.data.description) parts.push(`> ${page.data.description}`);
  parts.push(await processedText(page));
  if (page.data.openapi) parts.push(operationSummary(page.data.openapi));
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
      return `${head}${desc}\n\n${await processedText(page)}`;
    }),
  );
  return `${[agentInstructions(), ...sections].filter(Boolean).join('\n\n\n')}\n`;
}
