// Search documents for the Worker, which answers /api/search and the MCP
// search tool server-side (the full client-side index would be ~700 KB gzipped).
import { orderedPages } from '@/lib/markdown';
import { parseOpenAPIRef } from '@/lib/openapi';

export const revalidate = false;

function operationLabel(value: string): string {
  const ref = parseOpenAPIRef(value);
  return `${ref.method.toUpperCase()} ${ref.path}`;
}

export function GET() {
  const indexes = orderedPages().map((page) => ({
    id: page.url,
    url: page.url,
    title: page.data.title,
    description: page.data.description,
    operation: page.data.openapi ? operationLabel(page.data.openapi) : undefined,
    structuredData: page.data.structuredData,
  }));
  return Response.json(indexes);
}
