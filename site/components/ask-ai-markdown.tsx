'use client';
// Renders Ask AI answers. Loaded only when the panel opens, so the Markdown
// pipeline and the code highlighter stay out of every page's first load.
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { Root } from 'hast';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { useMemo, type ComponentProps } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';

const processor = remark().use(remarkGfm).use(remarkRehype);

function Pre(props: ComponentProps<'pre'>) {
  const code = props.children as { props?: { className?: string; children?: unknown } } | undefined;
  const lang = code?.props?.className?.replace('language-', '') ?? 'text';
  return <DynamicCodeBlock lang={lang} code={String(code?.props?.children ?? '').trimEnd()} />;
}

/** Docs links stay on the host the reader is on (previews included). */
function A({ href, ...props }: ComponentProps<'a'>) {
  const local = href?.replace(/^https:\/\/docs\.pre\.dev(?=\/|$)/, '') || href;
  return <defaultMdxComponents.a href={local} {...props} />;
}

export default function Markdown({ text }: { text: string }) {
  const node = useMemo(() => {
    const hast = processor.runSync(processor.parse(text)) as Root;
    return toJsxRuntime(hast, {
      Fragment,
      jsx,
      jsxs,
      components: { ...defaultMdxComponents, a: A, pre: Pre, img: undefined },
    });
  }, [text]);
  return <div className="ask-ai-answer prose prose-sm max-w-none text-sm [&_p]:my-2">{node}</div>;
}
