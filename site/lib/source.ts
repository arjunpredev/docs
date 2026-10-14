import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
});

export type DocsPage = NonNullable<ReturnType<typeof source.getPage>>;

export function getPageBySlug(slug: string): DocsPage | undefined {
  return source.getPage(slug.split('/').filter(Boolean));
}

export function pageSlug(page: DocsPage): string {
  return page.slugs.join('/');
}
