// Search documents for the Worker, which answers /api/search and the MCP
// search tool server-side (the full client-side index would be ~700 KB gzipped).
import { orderedPages } from '@/lib/markdown';

export const revalidate = false;

export function GET() {
  const indexes = orderedPages().map((page) => ({
    id: page.url,
    url: page.url,
    title: page.data.title,
    description: page.data.description,
    structuredData: page.data.structuredData,
  }));
  return Response.json(indexes);
}
