import path from 'node:path';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';
import { remarkMintlify } from './lib/remark-mintlify';
import { createSlugger } from './lib/slug.mjs';
import { rehypeSmartQuotes } from './lib/smart-quotes.mjs';

const sluggers = new WeakMap<object, (text: string) => string>();

// The Mintlify-format content lives in the repo root, one level up.
const root = path.resolve(process.cwd(), '..');

export const docs = defineDocs({
  dir: '..',
  docs: {
    files: ['**/*.mdx', '!node_modules/**', '!site/**', '!snippets/**', '!tmp/**', '!.*/**'],
    schema: pageSchema.extend({
      sidebarTitle: z.string().optional(),
      openapi: z.string().optional(),
      icon: z.string().optional(),
    }),
    postprocess: {
      // Mintlify's Markdown has plain headings, without "[#anchor]" suffixes
      includeProcessedMarkdown: { headingIds: false },
    },
  },
  meta: {
    files: ['site/meta-none/*.json'],
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: (plugins) => [[remarkMintlify, { root }], ...plugins],
    remarkImageOptions: false,
    remarkHeadingOptions: {
      slug: (root, _heading, text) => {
        let slug = sluggers.get(root);
        if (!slug) sluggers.set(root, (slug = createSlugger()));
        return slug(text);
      },
    },
    rehypePlugins: (plugins) => [...plugins, rehypeSmartQuotes],
    rehypeCodeOptions: {
      // github-dark's comment gray is hard to read on the near-black code background
      themes: { light: 'github-light', dark: 'github-dark-default' },
    },
  },
});
