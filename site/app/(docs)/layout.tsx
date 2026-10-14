import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { docsJson } from '@/lib/docs-config';
import { getTree } from '@/lib/tree';
import { NavIcon } from '@/components/icons';
import { AskAITrigger } from '@/components/ask-ai';
import { ChevronRight } from 'lucide-react';

function Logo() {
  const { logo, name } = docsJson;
  if (!logo) return <span className="font-semibold">{name}</span>;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.light} alt={name} className="h-7 w-auto dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.dark} alt={name} className="hidden h-7 w-auto dark:block" />
    </>
  );
}

function Anchors() {
  const anchors = docsJson.navigation.global?.anchors ?? [];
  if (anchors.length === 0) return null;
  return (
    <div className="flex flex-col gap-0.5 pb-2">
      {anchors.map((anchor) => (
        <a
          key={anchor.anchor}
          href={anchor.href}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2 rounded-lg p-1.5 text-sm text-fd-muted-foreground hover:bg-fd-accent/50 hover:text-fd-accent-foreground"
        >
          {anchor.icon ? (
            <span className="rounded-md border bg-fd-secondary p-1">
              <NavIcon name={anchor.icon} className="size-3.5" />
            </span>
          ) : null}
          {anchor.anchor}
        </a>
      ))}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const links: LinkItemType[] = (docsJson.navbar?.links ?? []).map((link) => ({
    text: link.label,
    url: link.href,
    external: /^https?:\/\//.test(link.href),
    active: 'none',
  }));
  links.unshift({ type: 'custom', on: 'nav', children: <AskAITrigger /> });
  const primary = docsJson.navbar?.primary;
  if (primary) {
    links.push({
      type: 'custom',
      on: 'nav',
      children: (
        <a
          href={primary.href}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-fd-primary px-3 py-1.5 text-sm font-medium text-fd-primary-foreground hover:opacity-90"
        >
          {primary.label}
          <ChevronRight className="size-3.5" />
        </a>
      ),
    });
    links.push({ text: primary.label, url: primary.href, external: true, on: 'menu' });
  }

  return (
    <DocsLayout
      tree={getTree()}
      tabMode="navbar"
      nav={{ title: <Logo />, url: '/overview', mode: 'top' }}
      links={links}
      sidebar={{ banner: <Anchors /> }}
    >
      {children}
    </DocsLayout>
  );
}
