// Heading anchors as Mintlify generated them, so existing links like
// /agents#recipe-4-take-a-payment-in-an-app-built-on-pre-dev keep working.
// Matches all 440 headings on the Mintlify-hosted site: quotes are curled (as
// on the page), then lowercase, whitespace and dots become "-", common ASCII
// punctuation is dropped, and characters such as @ = / and curly quotes stay.
import { smartQuotes } from './smart-quotes.mjs';

/** @param {string} text */
export function mintlifySlug(text) {
  return smartQuotes(text.replace(/​/g, '').trim())
    .toLowerCase()
    .replace(/[\s.]+/g, '-')
    .replace(/[?!,:;()[\]{}`'"*+<>|\\~#$%^&]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Slugger with -1, -2 suffixes for repeated headings on one page. */
export function createSlugger() {
  /** @type {Map<string, number>} */
  const seen = new Map();
  /** @param {string} text */
  return (text) => {
    const base = mintlifySlug(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}
