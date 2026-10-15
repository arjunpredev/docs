import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { source, pageSlug } from '@/lib/source';
import { groupOf } from '@/lib/groups';
import { docsJson, repoRoot } from '@/lib/docs-config';

export const revalidate = false;

// The dark logo sits on black, so the card uses a black background.
const logo = `data:image/png;base64,${fs.readFileSync(path.join(repoRoot, docsJson.logo?.dark ?? '/images/logo-dark.png')).toString('base64')}`;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();
  const group = groupOf(pageSlug(page));
  const title = page.data.title;
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#000', padding: '64px 72px', color: '#fff' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" height={64} width={222} />
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
          {group ? <div style={{ fontSize: 30, color: '#a3a3a3', marginBottom: 16 }}>{group}</div> : null}
          <div style={{ fontSize: title.length > 40 ? 64 : 76, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5 }}>{title}</div>
          {page.data.description ? (
            <div style={{ fontSize: 30, color: '#a3a3a3', marginTop: 24, lineHeight: 1.35, maxHeight: 82, overflow: 'hidden' }}>
              {page.data.description}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 24, color: '#737373' }}>docs.pre.dev</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({ slug: [...page.slugs, 'image.png'] }));
}
