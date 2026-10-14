// Emits /md/<page>.md at build; scripts/postbuild.mjs moves them to /<page>.md.
import { notFound } from 'next/navigation';
import { pageMarkdown } from '@/lib/markdown';
import { source } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const last = slug.at(-1)?.replace(/\.md$/, '');
  const page = source.getPage([...slug.slice(0, -1), last ?? '']);
  if (!page) notFound();
  return new Response(await pageMarkdown(page), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: [...page.slugs.slice(0, -1), `${page.slugs.at(-1)}.md`],
  }));
}
