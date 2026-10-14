import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/notebook/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { source, pageSlug } from '@/lib/source';
import { extractOperation, parseOpenAPIRef, readSpec } from '@/lib/openapi';
import { siteUrl } from '@/lib/docs-config';
import { getMDXComponents } from '@/components/mdx';
import { OpenAPIPage } from '@/components/api-page';
import { forInteractivePage } from '@/components/api-spec';
import { PageActions } from '@/components/page-actions';
import { Feedback } from '@/components/feedback';
import { EndpointBar } from '@/components/endpoint-bar';
import { groupOf } from '@/lib/groups';

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const ref = page.data.openapi ? parseOpenAPIRef(page.data.openapi) : undefined;
  // Embed only this operation; the full spec would add ~150 KB to every API page.
  const spec = ref ? extractOperation(readSpec(ref.document), ref) : undefined;
  const pathSlug = pageSlug(page);

  return (
    <DocsPage toc={page.data.toc} full={Boolean(ref)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-medium text-fd-primary/70">{groupOf(pathSlug)}</p>
          <DocsTitle>{page.data.title}</DocsTitle>
        </div>
        <PageActions markdownUrl={`/${pathSlug}.md`} pageUrl={`${siteUrl}/${pathSlug}`} />
      </div>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      {ref && spec ? <EndpointBar spec={spec} ref_={ref} /> : null}
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
        {ref && spec ? (
          <div id="openapi" className="mt-10 scroll-mt-28 border-t pt-6">
            <OpenAPIPage
              document={ref.document}
              operations={[{ path: ref.path, method: ref.method as never }]}
              preloaded={{ docs: { [ref.document]: forInteractivePage(spec) as never } }}
            />
          </div>
        ) : null}
      </DocsBody>
      <Feedback page={page.url} />
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({ slug: page.slugs }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const pathSlug = pageSlug(page);
  const image = `/og/${pathSlug}/image.png`;
  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: `/${pathSlug}`,
      types: { 'text/markdown': `/${pathSlug}.md` },
    },
    openGraph: { url: `/${pathSlug}`, images: { url: image, width: 1200, height: 630 } },
    twitter: { images: { url: image, width: 1200, height: 630 } },
  };
}
