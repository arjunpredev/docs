import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/docs-config';
import { orderedPages } from '@/lib/markdown';
import { pageSlug } from '@/lib/source';

export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  return orderedPages().map((page) => ({ url: `${siteUrl}/${pageSlug(page)}` }));
}
