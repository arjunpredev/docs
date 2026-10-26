import { docsJson, type NavGroup } from './docs-config';

export interface NavPlace {
  tab: string;
  /** First page of the tab */
  tabPage: string;
  group?: string;
  /** Every group above the page, outermost first */
  groups: string[];
}

let map: Map<string, NavPlace> | undefined;

function places(): Map<string, NavPlace> {
  if (!map) {
    map = new Map();
    for (const tab of docsJson.navigation.tabs) {
      const pages: { slug: string; groups: string[] }[] = [];
      const walk = (items: NavGroup['pages'], groups: string[]) => {
        for (const item of items) {
          if (typeof item === 'string') pages.push({ slug: item, groups });
          else walk(item.pages, [...groups, item.group]);
        }
      };
      if (tab.pages) walk(tab.pages, []);
      for (const group of tab.groups ?? []) walk(group.pages, [group.group]);
      for (const page of pages) {
        map.set(page.slug, { tab: tab.tab, tabPage: pages[0].slug, group: page.groups.at(-1), groups: page.groups });
      }
    }
  }
  return map;
}

/** The tab and group a page sits in. */
export function placeOf(slug: string): NavPlace | undefined {
  return places().get(slug);
}

/**
 * The section a page's share card names: its group, looking at most two levels
 * below the tab, so the AI Gateway's endpoint pages read "AI Gateway reference"
 * and the payments pages read "Payments".
 */
export function sectionOf(slug: string): string | undefined {
  const place = places().get(slug);
  if (!place) return undefined;
  return place.groups[Math.min(place.groups.length, 2) - 1] ?? place.tab;
}
