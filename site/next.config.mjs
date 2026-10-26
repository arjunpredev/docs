import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
  // the share card renderer (app/og) runs from node_modules at build time: resvg is a native addon
  serverExternalPackages: ['satori', '@resvg/resvg-js'],
  // MDX sources and snippets live in the repo root
  outputFileTracingRoot: new URL('..', import.meta.url).pathname,
  turbopack: { root: new URL('..', import.meta.url).pathname },
};

export default withMDX(config);
