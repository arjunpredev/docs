import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
  // MDX sources and snippets live in the repo root
  outputFileTracingRoot: new URL('..', import.meta.url).pathname,
  turbopack: { root: new URL('..', import.meta.url).pathname },
};

export default withMDX(config);
