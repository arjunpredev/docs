// Each page's share card, drawn at build time from the pre.dev card spec
// (lib/share-card.mjs) and written to out/og/<page>/<hash>.png. satori lays out
// and measures the card (fitCard steps the title down and keeps whole sentences
// of the description), resvg turns its SVG into the PNG.
import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { source } from '@/lib/source';
import { cardFile, docsCard } from '@/lib/og-card';
import { CARD_FONTS, CARD_HEIGHT, CARD_WIDTH, MARK_SVG, cardTree, checkCard, fitCard, skySvg, svgDataUrl } from '@/lib/share-card.mjs';

export const revalidate = false;
export const dynamicParams = false;

// Inter and JetBrains Mono as WOFF (satori reads no WOFF2)
const fonts = CARD_FONTS.map((f) => ({
  name: f.name,
  weight: f.weight,
  style: 'normal' as const,
  data: fs.readFileSync(path.join(process.cwd(), 'node_modules/@fontsource', f.file)),
}));
const art = { mark: svgDataUrl(MARK_SVG), sky: svgDataUrl(skySvg()) };

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();
  const card = docsCard(page);
  // only the current card's address answers
  if (slug.at(-1) !== cardFile(card)) notFound();
  const fit = await fitCard(card, satori, fonts);
  const tree = cardTree(card, art, fit);
  const problems = checkCard(tree);
  if (problems.length) throw new Error(`share card for /${slug.slice(0, -1).join('/')}: ${problems.join('; ')}`);
  const svg = await satori(tree as never, { width: CARD_WIDTH, height: CARD_HEIGHT, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({ slug: [...page.slugs, cardFile(docsCard(page))] }));
}
