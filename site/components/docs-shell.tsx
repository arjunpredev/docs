import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { docsJson } from '@/lib/docs-config';
import { getTree } from '@/lib/tree';
import { NavIcon } from '@/components/icons';
import { AskAITrigger } from '@/components/ask-ai';
import { BrandMark } from '@/components/brand-mark';
import { ChevronRight } from 'lucide-react';

/** Same lockup as the pre.dev header: the brain mark at 34x24 and the name in Inter, in the text color. */
function Logo() {
  return (
    <span className="-ml-0.5 inline-flex items-center gap-2 text-lg font-normal">
      <BrandMark className="h-6 w-[34px]" />
      {docsJson.name}
    </span>
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

/** The docs chrome (navbar, tabs, sidebar), shared by every page and the 404 page. */
export function DocsShell({ children }: { children: ReactNode }) {
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
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-fd-foreground px-3.5 py-1.5 text-sm font-medium text-fd-background hover:opacity-90"
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
      themeSwitch={{ mode: 'light-dark-system' }}
    >
      {children}
    </DocsLayout>
  );
}
