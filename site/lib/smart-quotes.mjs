// Curly quotes in rendered prose, as Mintlify showed them. Markdown output
// keeps the straight quotes from the source.

/**
 * @param {string} text
 * @param {string} [before] the character just before this text, if any
 */
export function smartQuotes(text, before = '') {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== "'" && ch !== '"') {
      out += ch;
      continue;
    }
    const prev = i > 0 ? text[i - 1] : before;
    const opening = prev === '' || /[\s([{\u2014\u2013-]/.test(prev);
    if (ch === '"') out += opening ? '“' : '”';
    else out += opening && !/^'(s|re|ve|ll|d|t|m)\b/i.test(text.slice(i)) ? '‘' : '’';
  }
  return out;
}

const SKIP = new Set(['code', 'pre', 'kbd', 'script', 'style', 'samp', 'var']);

/** rehype plugin: curly quotes in text outside code. */
export function rehypeSmartQuotes() {
  /** @param {any} tree */
  return (tree) => {
    let last = '';
    /** @param {any} node */
    const walk = (node) => {
      if (node.type === 'text') {
        node.value = smartQuotes(node.value, last);
        if (node.value) last = node.value.at(-1);
        return;
      }
      if (node.type === 'element' && SKIP.has(node.tagName)) {
        last = 'x';
        return;
      }
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        // JSX attributes stay as written; children are prose
      }
      for (const child of node.children ?? []) walk(child);
    };
    walk(tree);
  };
}
