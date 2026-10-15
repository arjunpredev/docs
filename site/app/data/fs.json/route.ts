// The virtual filesystem behind the MCP query_docs_filesystem tool:
// /<page>.mdx (title, description, Markdown body) and /openapi/<spec>.
import fs from 'node:fs';
import path from 'node:path';
import { openapiFiles, repoRoot } from '@/lib/docs-config';
import { pageFileText, orderedPages } from '@/lib/markdown';
import { pageSlug } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const files: Record<string, string> = {};
  for (const page of orderedPages()) files[`/${pageSlug(page)}.mdx`] = await pageFileText(page);
  for (const file of openapiFiles()) files[`/openapi/${file}`] = fs.readFileSync(path.join(repoRoot, file), 'utf8');
  return Response.json(files);
}
