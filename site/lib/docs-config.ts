// Reads the Mintlify docs.json in the repo root. It stays the single source of
// truth for navigation, redirects, navbar, footer and SEO.
import fs from 'node:fs';
import path from 'node:path';

export const repoRoot = path.resolve(process.cwd(), '..');

export interface NavGroup {
  group: string;
  icon?: string;
  expanded?: boolean;
  pages: (string | NavGroup)[];
}

export interface NavTab {
  tab: string;
  icon?: string;
  groups?: NavGroup[];
  pages?: (string | NavGroup)[];
  href?: string;
}

export interface NavAnchor {
  anchor: string;
  href: string;
  icon?: string;
}

export interface DocsJson {
  name: string;
  description?: string;
  favicon?: string;
  logo?: { light: string; dark: string; href?: string };
  colors?: { primary?: string; light?: string; dark?: string };
  appearance?: { default?: 'light' | 'dark' | 'system' };
  api?: { openapi?: string | string[] };
  redirects?: { source: string; destination: string; permanent?: boolean }[];
  navigation: { tabs: NavTab[]; global?: { anchors?: NavAnchor[] } };
  navbar?: {
    links?: { label: string; href: string }[];
    primary?: { type: 'button'; label: string; href: string };
  };
  footer?: { socials?: Record<string, string> };
  seo?: { metatags?: Record<string, string>; organization?: Record<string, unknown> };
  integrations?: { posthog?: { apiKey: string; apiHost?: string; sessionRecording?: boolean } };
  markdown?: { instructions?: string[] };
}

export const docsJson: DocsJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs.json'), 'utf8'));

export const siteUrl = 'https://docs.pre.dev';

/** Source repository; pages link to their file here ("Suggest edits"). */
export const repoUrl = 'https://github.com/arjunpredev/docs';

export function openapiFiles(): string[] {
  const value = docsJson.api?.openapi ?? [];
  return Array.isArray(value) ? value : [value];
}

/** Every page slug in navigation order (`overview`, `coding-agent/quickstart`, ...) */
export function navPages(): string[] {
  const out: string[] = [];
  const walk = (items: (string | NavGroup)[]) => {
    for (const item of items) {
      if (typeof item === 'string') out.push(item);
      else walk(item.pages);
    }
  };
  for (const tab of docsJson.navigation.tabs) {
    if (tab.pages) walk(tab.pages);
    for (const group of tab.groups ?? []) walk(group.pages);
  }
  return out;
}
