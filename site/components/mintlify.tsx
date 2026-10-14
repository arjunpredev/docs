// Mintlify component names used by the MDX in the repo root, mapped onto
// Fumadocs UI so the content renders without edits.
import { Callout } from 'fumadocs-ui/components/callout';
import { Card as FdCard, Cards } from 'fumadocs-ui/components/card';
import { Step as FdStep, Steps as FdSteps } from 'fumadocs-ui/components/steps';
import { Tab as FdTab, Tabs as FdTabs } from 'fumadocs-ui/components/tabs';
import { CodeBlockTab, CodeBlockTabs, CodeBlockTabsList, CodeBlockTabsTrigger } from 'fumadocs-ui/components/codeblock';
import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { NavIcon } from './icons';

export function Note({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <Callout type="info" title={title}>
      {children}
    </Callout>
  );
}

export function Info(props: { children: ReactNode; title?: string }) {
  return <Note {...props} />;
}

export function Warning({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <Callout type="warning" title={title}>
      {children}
    </Callout>
  );
}

export function Tip({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <Callout type="idea" title={title}>
      {children}
    </Callout>
  );
}

export function Check({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <Callout type="success" title={title}>
      {children}
    </Callout>
  );
}

export function Card({
  title,
  icon,
  href,
  children,
}: {
  title: string;
  icon?: string;
  href?: string;
  children?: ReactNode;
}) {
  const external = href ? /^https?:\/\//.test(href) : false;
  return (
    <FdCard title={title} href={href} external={external} icon={icon ? <NavIcon name={icon} /> : undefined}>
      {children}
    </FdCard>
  );
}

const gridCols: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

export function CardGroup({ cols = 2, children }: { cols?: number; children: ReactNode }) {
  return <Cards className={gridCols[cols] ?? gridCols[2]}>{children}</Cards>;
}

export function Steps({ children }: { children: ReactNode }) {
  return <FdSteps>{children}</FdSteps>;
}

export function Step({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <FdStep>
      {title ? <p className="mt-0! mb-2! font-semibold text-fd-foreground">{title}</p> : null}
      {children}
    </FdStep>
  );
}

type TabElement = ReactElement<{ title?: string; children?: ReactNode }>;

export function Tabs({ children }: { children: ReactNode }) {
  const tabs = Children.toArray(children).filter(isValidElement) as TabElement[];
  const items = tabs.map((tab, i) => tab.props.title ?? `Tab ${i + 1}`);
  return (
    <FdTabs items={items}>
      {tabs.map((tab, i) => (
        <FdTab key={items[i]} value={items[i]}>
          {tab.props.children}
        </FdTab>
      ))}
    </FdTabs>
  );
}

/** Only rendered through <Tabs>, which reads its props. */
export function Tab({ children }: { title?: string; children?: ReactNode }) {
  return <>{children}</>;
}

export function Frame({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <figure className="my-6 overflow-hidden rounded-xl border p-2">
      {children}
      {caption ? <figcaption className="mt-2 text-center text-sm text-fd-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}

type CodeElement = ReactElement<{ title?: string; 'data-language'?: string; className?: string }>;

/** Mintlify's <CodeGroup>: one tab per code block, labelled by the block's title. */
export function CodeGroup({ children }: { children: ReactNode }) {
  // MDX wraps each highlighted block in a Fragment
  const blocks = Children.toArray(children)
    .flatMap((child) =>
      isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? Children.toArray(child.props.children) : [child],
    )
    .filter(isValidElement) as CodeElement[];
  const used = new Set<string>();
  const tabs = blocks.map((block, i) => {
    const lang = block.props['data-language'] ?? block.props.className?.match(/language-(\S+)/)?.[1];
    let value = block.props.title ?? lang ?? `Tab ${i + 1}`;
    while (used.has(value)) value = `${value} `;
    used.add(value);
    return { value, block: cloneElement(block, { title: undefined }) };
  });
  if (tabs.length === 0) return null;
  return (
    <CodeBlockTabs defaultValue={tabs[0].value}>
      <CodeBlockTabsList>
        {tabs.map(({ value }) => (
          <CodeBlockTabsTrigger key={value} value={value}>
            {value.trim()}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {tabs.map(({ value, block }) => (
        <CodeBlockTab key={value} value={value}>
          {block}
        </CodeBlockTab>
      ))}
    </CodeBlockTabs>
  );
}
