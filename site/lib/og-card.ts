// Each docs page's share card (lib/share-card.mjs is the design) and the
// address it is published under. The page's og:image and twitter:image point at
// /og/<page>/<hash>.png, where the hash covers everything the card shows plus
// CARD_DESIGN: change a title, a description, a section or the design and the
// card gets a new URL, so link scrapers that cache images forever fetch it again.
import crypto from 'node:crypto';
import { CARD_DESIGN, CARD_HEIGHT, CARD_WIDTH, cardAlt, type ShareCard } from './share-card.mjs';
import { sectionOf } from './groups';
import { pageSlug, type DocsPage } from './source';

const HOST = 'docs.pre.dev';

/** The page's description, or for a page without one, its first paragraph. */
export function cardText(page: DocsPage): string | undefined {
  if (page.data.description?.trim()) return page.data.description.trim();
  const first = page.data.structuredData?.contents?.find((c) => c.content.trim())?.content;
  return first
    ?.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function docsCard(page: DocsPage): ShareCard {
  const slug = pageSlug(page);
  const section = sectionOf(slug);
  const card: ShareCard = {
    eyebrow: ['pre.dev', 'Docs', ...(section ? [section] : [])],
    title: page.data.title,
    text: cardText(page),
    footer: { meta: ['pre.dev documentation', `${HOST}/${slug}`] },
    fit: true,
  };
  checkEyebrow(card.eyebrow!, slug);
  return card;
}

// The eyebrow is set in JetBrains Mono capitals (0.6em advance, 0.2em apart) and is
// never fitted, so a section name too long for the line fails the build instead.
function checkEyebrow(parts: string[], slug: string) {
  const ch = 28 * 0.6 + 5.6;
  const words = parts.map((p) => p.split(/\s+/).filter(Boolean));
  const chars = words.flat().join('').length + (parts.length - 1);
  const gaps = words.reduce((n, w) => n + w.length - 1, 0) + (parts.length - 1) * 4;
  const room = CARD_WIDTH - 72 * 2 - Math.round(34 * (432 / 312)) - 18;
  const width = (chars + gaps) * ch;
  if (width > room) throw new Error(`share card for ${slug}: eyebrow "${parts.join(' / ')}" is ${Math.round(width)}px wide, room for ${room}px`);
}

export function cardHash(card: ShareCard): string {
  return crypto.createHash('sha256').update(JSON.stringify([CARD_DESIGN, card])).digest('hex').slice(0, 10);
}

/** The card's file name under /og/<page>/. */
export function cardFile(card: ShareCard): string {
  return `${cardHash(card)}.png`;
}

/** What a page's metadata needs for its og:image and twitter:image. */
export function cardImage(page: DocsPage) {
  const card = docsCard(page);
  return {
    url: `/og/${pageSlug(page)}/${cardFile(card)}`,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alt: cardAlt(card),
    type: 'image/png',
  };
}
