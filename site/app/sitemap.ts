import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/docs-config';
import { orderedPages } from '@/lib/markdown';
import { pageSlug } from '@/lib/source';
import { lastModified } from '@/lib/last-modified';

export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  return orderedPages().map((page) => {
    const modified = lastModified(page.path);
    return { url: `${siteUrl}/${pageSlug(page)}`, ...(modified ? { lastModified: modified } : {}) };
  });
}
