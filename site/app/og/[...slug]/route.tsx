import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { source, pageSlug } from '@/lib/source';
import { groupOf } from '@/lib/groups';
import { docsJson } from '@/lib/docs-config';
import { BrandMark } from '@/components/brand-mark';

export const revalidate = false;

// Inter, the site's font (the renderer reads WOFF, not WOFF2)
const inter = (weight: 400 | 600) =>
  fs.readFileSync(path.join(process.cwd(), `node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`));
const fonts = [
  { name: 'Inter', data: inter(400), weight: 400 as const, style: 'normal' as const },
  { name: 'Inter', data: inter(600), weight: 600 as const, style: 'normal' as const },
];

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();
  const group = groupOf(pageSlug(page));
  const title = page.data.title;
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#000', padding: '64px 72px', color: '#fff', fontFamily: 'Inter' }}>
        {/* the pre.dev header lockup: brain mark and name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <BrandMark width={62} height={44} fill="#fff" />
          <div style={{ fontSize: 34 }}>{docsJson.name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
          {group ? <div style={{ fontSize: 30, color: '#a3a3a3', marginBottom: 16 }}>{group}</div> : null}
          <div style={{ fontSize: title.length > 40 ? 64 : 76, fontWeight: 600, lineHeight: 1.1, letterSpacing: -2 }}>{title}</div>
          {page.data.description ? (
            <div style={{ fontSize: 30, color: '#a3a3a3', marginTop: 24, lineHeight: 1.35, maxHeight: 82, overflow: 'hidden' }}>
              {page.data.description}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 24, color: '#737373' }}>docs.pre.dev</div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({ slug: [...page.slugs, 'image.png'] }));
}
