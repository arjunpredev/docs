'use client';
import { useComponents } from 'fumadocs-openapi';
import { useCodeUsage, useOperation } from 'fumadocs-openapi/operation';
import type { CodeUsageGeneratorRegistry } from 'fumadocs-openapi/requests/generators';
import { createOpenAPIPage } from 'fumadocs-openapi/ui';
import { CodeBlockTab, CodeBlockTabs, CodeBlockTabsList, CodeBlockTabsTrigger } from 'fumadocs-ui/components/codeblock';

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
 * rendered so the server HTML holds all of them.
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
  if (tabs.length === 0) return null;

  return (
    <CodeBlockTabs defaultValue={tabs[0].value}>
      <CodeBlockTabsList className="flex-wrap">
        {tabs.map((tab) => (
          <CodeBlockTabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {tabs.map((tab) => (
        <CodeBlockTab key={tab.value} value={tab.value} forceMount className="data-[state=inactive]:hidden">
          {tab.code !== undefined ? <Sample lang={tab.lang} code={tab.code} /> : <GeneratedSample id={tab.generator!} lang={tab.lang} />}
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
function GeneratedSample({ id, lang }: { id: string; lang: string }) {
  const code = useCodeUsage(id);
  if (!code) return null;
  const token = kindOf(lang) === 'curl' ? '$PREDEV_API_KEY' : '<token>';
  return <Sample lang={lang} code={code.replace(/Bearer (?=["'`])/g, `Bearer ${token}`)} />;
}

export const OpenAPIPage = createOpenAPIPage({
  content: {
    renderAPIExampleUsageTabs: (registry) => <UsageTabs registry={registry} />,
  },
});
