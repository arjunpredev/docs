import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/notebook/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { source, pageSlug } from '@/lib/source';
import { extractOperation, parseOpenAPIRef, readSpec } from '@/lib/openapi';
import { docsJson, siteUrl } from '@/lib/docs-config';
import { getMDXComponents } from '@/components/mdx';
import { OpenAPIPage } from '@/components/api-page-lazy';
import { forInteractivePage } from '@/components/api-spec';
import { PageActions } from '@/components/page-actions';
import { Feedback } from '@/components/feedback';
import { EndpointBar } from '@/components/endpoint-bar';
import { placeOf } from '@/lib/groups';
import { lastModified } from '@/lib/last-modified';
import { PageFooter } from '@/components/page-footer';
import { ImageZoom } from '@/components/image-zoom';

/** schema.org data for the page: an article (or API reference) and its breadcrumb trail. */
function structuredData(page: { title: string; description?: string; slug: string; api: boolean; modified?: string }) {
  const place = placeOf(page.slug);
  const url = `${siteUrl}/${page.slug}`;
  const crumbs = [
    { name: docsJson.name, item: `${siteUrl}/overview` },
    ...(place && place.tabPage !== 'overview' ? [{ name: place.tab, item: `${siteUrl}/${place.tabPage}` }] : []),
    ...(place?.group && place.group !== place.tab ? [{ name: place.group }] : []),
    { name: page.title, item: url },
  ];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': page.api ? 'APIReference' : 'TechArticle',
        headline: page.title,
        description: page.description,
        url,
        inLanguage: 'en',
        ...(page.modified ? { dateModified: page.modified } : {}),
        isPartOf: { '@type': 'WebSite', name: docsJson.name, url: siteUrl },
        publisher: { '@type': 'Organization', ...docsJson.seo?.organization },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((crumb, i) => ({ '@type': 'ListItem', position: i + 1, ...crumb })),
      },
    ],
  };
}

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
    <DocsPage toc={page.data.toc} full={Boolean(ref)} breadcrumb={{ enabled: false }} id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            structuredData({
              title: page.data.title,
              description: page.data.description,
              slug: pathSlug,
              api: Boolean(ref),
              modified: lastModified(page.path),
            }),
          ),
        }}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-medium text-fd-primary/70">{placeOf(pathSlug)?.group}</p>
          <DocsTitle className="text-3xl leading-tight sm:text-[2.25rem]">{page.data.title}</DocsTitle>
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
      <PageFooter file={page.path} />
      <ImageZoom container="main-content" />
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
    // page metadata replaces the root layout's openGraph and twitter objects, so repeat the shared fields
    openGraph: {
      type: 'article',
      siteName: docsJson.name,
      url: `/${pathSlug}`,
      title: page.data.title,
      description: page.data.description,
      images: { url: image, width: 1200, height: 630 },
      ...(lastModified(page.path) ? { modifiedTime: lastModified(page.path) } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: docsJson.seo?.metatags?.['twitter:site'],
      title: page.data.title,
      description: page.data.description,
      images: { url: image, width: 1200, height: 630 },
    },
  };
}
