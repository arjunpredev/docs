// Lets the Mintlify-format MDX in the repo root render unchanged:
// - `import X from "/snippets/x.mdx"` + `<X />` is inlined, so the snippet text
//   also lands in the Markdown served to agents (Mintlify does the same).
// - ```lang Title code fences get a `title="Title"` meta.
// <CodeGroup> stays in the tree (and in the Markdown); components/mintlify.tsx renders it.
import fs from 'node:fs';
import path from 'node:path';
import type { Code, Root, RootContent } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

export interface RemarkMintlifyOptions {
  /** Repo root that holds `snippets/` */
  root: string;
}

const snippetCache = new Map<string, RootContent[]>();

function loadSnippet(root: string, source: string): RootContent[] {
  const file = path.join(root, source.replace(/^\/+/, ''));
  const cached = snippetCache.get(file);
  if (cached) return structuredClone(cached);
  const tree = unified().use(remarkParse).use(remarkMdx).use(remarkGfm).parse(fs.readFileSync(file, 'utf8')) as Root;
  // Snippet files carry no frontmatter today; drop it if one ever appears.
  const children = tree.children.filter((node) => node.type !== 'yaml');
  for (const node of children) normalizeCodeMeta(node);
  snippetCache.set(file, children);
  return structuredClone(children);
}

/** "Title" or "Title key=value" → `title="Title" key=value` */
function toTitleMeta(meta: string | null | undefined): string | null | undefined {
  if (!meta) return meta;
  if (/(^|\s)title=/.test(meta)) return meta;
  const attr = meta.search(/\s?[\w-]+=/);
  const head = (attr === -1 ? meta : meta.slice(0, attr)).trim();
  const rest = attr === -1 ? '' : meta.slice(attr).trim();
  if (!head || head.startsWith('{')) return meta;
  return [`title="${head.replace(/"/g, '&quot;')}"`, rest].filter(Boolean).join(' ');
}

function normalizeCodeMeta(tree: RootContent | Root) {
  visit(tree, 'code', (node: Code) => {
    node.meta = toTitleMeta(node.meta);
  });
}

export function remarkMintlify({ root }: RemarkMintlifyOptions) {
  return (tree: Root) => {
    // 1. snippet imports
    const snippets = new Map<string, string>();
    tree.children = tree.children.filter((node) => {
      if (node.type !== 'mdxjsEsm') return true;
      const imports = [...node.value.matchAll(/import\s+(\w+)\s+from\s+["'](\/snippets\/[^"']+\.mdx)["'];?/g)];
      if (imports.length === 0) return true;
      for (const [, name, source] of imports) snippets.set(name, source);
      const rest = node.value.replace(/import\s+\w+\s+from\s+["']\/snippets\/[^"']+\.mdx["'];?/g, '').trim();
      if (rest) throw new Error(`remark-mintlify: mixed snippet and code imports are not supported: ${node.value}`);
      return false;
    });

    if (snippets.size > 0) {
      visit(tree, (node, index, parent) => {
        if (!parent || index === undefined) return;
        if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;
        const source = node.name ? snippets.get(node.name) : undefined;
        if (!source) return;
        let content = loadSnippet(root, source);
        if (node.type === 'mdxJsxTextElement') {
          // inline use: unwrap a single paragraph
          content = content.length === 1 && content[0].type === 'paragraph' ? content[0].children : content;
        }
        parent.children.splice(index, 1, ...(content as never[]));
        return [SKIP, index + content.length];
      });
    }

    // 2. code fence titles
    normalizeCodeMeta(tree);
  };
}
