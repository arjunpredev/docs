import { notFound } from 'next/navigation';
import { generateOGImage } from 'fumadocs-ui/og';
import { source, pageSlug } from '@/lib/source';
import { groupOf } from '@/lib/groups';
import { docsJson } from '@/lib/docs-config';

export const revalidate = false;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();
  return generateOGImage({
    title: page.data.title,
    description: page.data.description,
    site: [docsJson.name, groupOf(pageSlug(page))].filter(Boolean).join(' · '),
    primaryColor: 'rgba(255,255,255,0.15)',
    primaryTextColor: 'rgb(255,255,255)',
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({ slug: [...page.slugs, 'image.png'] }));
}
