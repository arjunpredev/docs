import { docsJson, type NavGroup } from './docs-config';

export interface NavPlace {
  tab: string;
  /** First page of the tab */
  tabPage: string;
  group?: string;
}

let map: Map<string, NavPlace> | undefined;

function places(): Map<string, NavPlace> {
  if (!map) {
    map = new Map();
    for (const tab of docsJson.navigation.tabs) {
      const pages: { slug: string; group?: string }[] = [];
      const walk = (items: NavGroup['pages'], group?: string) => {
        for (const item of items) {
          if (typeof item === 'string') pages.push({ slug: item, group });
          else walk(item.pages, item.group);
        }
      };
      if (tab.pages) walk(tab.pages);
      for (const group of tab.groups ?? []) walk(group.pages, group.group);
      for (const page of pages) map.set(page.slug, { tab: tab.tab, tabPage: pages[0].slug, group: page.group });
    }
  }
  return map;
}

/** The navigation group a page sits in (shown above the title, like Mintlify). */
export function groupOf(slug: string): string | undefined {
  return places().get(slug)?.group;
}

/** The tab and group a page sits in. */
export function placeOf(slug: string): NavPlace | undefined {
  return places().get(slug);
}
