'use client';
import { createContext, useContext, useState, type ComponentProps, type ReactNode } from 'react';
import { useComponents } from 'fumadocs-openapi';
import { useCodeUsage, useOperation } from 'fumadocs-openapi/operation';
import type { CodeUsageGeneratorRegistry } from 'fumadocs-openapi/requests/generators';
import { createOpenAPIPage } from 'fumadocs-openapi/ui';
import { CodeBlockTab, CodeBlockTabs, CodeBlockTabsList, CodeBlockTabsTrigger } from 'fumadocs-ui/components/codeblock';
import { DocsBody } from 'fumadocs-ui/layouts/notebook/page';

interface CodeSample {
  id?: string;
  lang: string;
  label?: string;
  source?: unknown;
}

const KINDS: Record<string, string> = {
  curl: 'curl',
  bash: 'curl',
  shell: 'curl',
  sh: 'curl',
  javascript: 'js',
  js: 'js',
  node: 'js',
  'node.js': 'js',
  typescript: 'js',
  python: 'python',
  py: 'python',
  'c#': 'csharp',
};

const HIGHLIGHT: Record<string, string> = { curl: 'bash', js: 'javascript' };

function kindOf(lang: string): string {
  const key = lang.toLowerCase();
  return KINDS[key] ?? key;
}

interface SampleTab {
  value: string;
  label: string;
  lang: string;
  /** Curated sample text; generated samples have `generator` instead */
  code?: string;
  generator?: string;
}

/**
 * Request samples: the spec's own samples (x-codeSamples) first and selected,
 * then a generated sample for each language they don't cover. Every panel is
 * rendered so the server HTML holds all of them, but only the selected one is
 * highlighted: the rest show as plain text in the same frame until opened.
 * Highlighting all seven languages at load cost ~650 ms of main thread on a
 * throttled phone.
 */
function UsageTabs({ registry }: { registry: CodeUsageGeneratorRegistry }) {
  const { operation } = useOperation();
  const curated = (((operation as Record<string, unknown>)['x-codeSamples'] as CodeSample[] | undefined) ?? []).filter(
    (sample): sample is CodeSample & { source: string } => typeof sample.source === 'string' && sample.source.length > 0,
  );
  const covered = new Set(curated.map((sample) => kindOf(sample.lang)));
  const curatedIds = new Set(curated.map((sample) => sample.id ?? sample.lang));

  const used = new Set<string>();
  const unique = (base: string) => {
    let value = base;
    for (let n = 2; used.has(value); n++) value = `${base}-${n}`;
    used.add(value);
    return value;
  };

  const tabs: SampleTab[] = curated.map((sample) => {
    const kind = kindOf(sample.lang);
    return { value: unique(kind), label: sample.label ?? sample.lang, lang: HIGHLIGHT[kind] ?? kind, code: sample.source };
  });
  for (const [id, generator] of registry.map()) {
    if (curatedIds.has(id) || covered.has(kindOf(id)) || covered.has(kindOf(generator.lang))) continue;
    tabs.push({ value: unique(kindOf(id)), label: generator.label ?? generator.lang, lang: generator.lang, generator: id });
  }
  const [active, setActive] = useState(tabs[0]?.value);
  if (tabs.length === 0) return null;

  return (
    <CodeBlockTabs value={active} onValueChange={setActive}>
      <CodeBlockTabsList className="flex-wrap">
        {tabs.map((tab) => (
          <CodeBlockTabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {tabs.map((tab) => (
        <CodeBlockTab key={tab.value} value={tab.value} forceMount className="data-[state=inactive]:hidden">
          {tab.code !== undefined ? (
            <Sample lang={tab.value === active ? tab.lang : 'text'} code={tab.code} />
          ) : (
            <GeneratedSample id={tab.generator!} lang={tab.lang} highlight={tab.value === active} />
          )}
        </CodeBlockTab>
      ))}
    </CodeBlockTabs>
  );
}

function Sample({ lang, code }: { lang: string; code: string }) {
  const { CodeBlock } = useComponents();
  return <CodeBlock lang={lang} code={code} />;
}

/** A sample built from the playground's request; an empty bearer token shows a placeholder instead. */
function GeneratedSample({ id, lang, highlight }: { id: string; lang: string; highlight: boolean }) {
  const code = useCodeUsage(id);
  if (!code) return null;
  const token = kindOf(lang) === 'curl' ? '$PREDEV_API_KEY' : '<token>';
  return <Sample lang={highlight ? lang : 'text'} code={code.replace(/Bearer (?=["'`])/g, `Bearer ${token}`)} />;
}

/** The parts of an API page laid out around the operation: the title block and the page's own text. */
interface PageParts {
  intro?: ReactNode;
  prose?: ReactNode;
}

const PartsContext = createContext<PageParts>({});

type OperationSlots = Record<
  'header' | 'description' | 'apiExample' | 'apiPlayground' | 'authSchemes' | 'parameters' | 'body' | 'responses' | 'callbacks',
  ReactNode
>;

/**
 * Once the content area is wide enough (as on Mintlify): the title, the page text and the operation's
 * reference on the left, and the request samples and example responses on the right, kept in view
 * below the header. Narrower, one column with the examples right after the page text. The last row
 * is 1fr so a tall example column never opens gaps between the rows beside it.
 */
function OperationLayout({ slots }: { slots: OperationSlots }) {
  const { intro, prose } = useContext(PartsContext);
  return (
    <div className="@container">
      <div className="grid gap-x-8 gap-y-6 @4xl:grid-cols-[minmax(0,1fr)_25rem] @4xl:grid-rows-[auto_auto_1fr] @6xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div data-ask-bar-anchor="" className="min-w-0 @4xl:col-start-1 @4xl:row-start-1">
          {intro}
        </div>
        <DocsBody className="min-w-0 @4xl:col-start-1 @4xl:row-start-2">{prose}</DocsBody>
        {/* beside the text, each code panel scrolls within ~42% of the screen so the request and a response both stay in view */}
        <div className="min-w-0 @4xl:sticky @4xl:top-[calc(var(--fd-docs-row-3,6rem)+1rem)] @4xl:col-start-2 @4xl:row-span-3 @4xl:row-start-1 @4xl:max-h-[calc(100dvh-var(--fd-docs-row-3,6rem)-2rem)] @4xl:self-start @4xl:overflow-y-auto @4xl:[&_.fd-scroll-container]:max-h-[min(24rem,42dvh)]">
          {slots.apiExample}
        </div>
        <DocsBody id="openapi" className="min-w-0 scroll-mt-28 border-t pt-6 @4xl:col-start-1 @4xl:row-start-3">
          {slots.header}
          {slots.apiPlayground}
          {slots.description}
          {slots.authSchemes}
          {slots.parameters}
          {slots.body}
          {slots.responses}
          {slots.callbacks}
        </DocsBody>
      </div>
    </div>
  );
}

const BasePage = createOpenAPIPage({
  content: {
    renderAPIExampleUsageTabs: (registry) => <UsageTabs registry={registry} />,
    renderOperationLayout: (slots) => <OperationLayout slots={slots} />,
  },
});

export function OpenAPIPage({ intro, prose, ...props }: ComponentProps<typeof BasePage> & PageParts) {
  return (
    <PartsContext.Provider value={{ intro, prose }}>
      <BasePage {...props} />
    </PartsContext.Provider>
  );
}
