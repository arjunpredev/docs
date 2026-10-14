import { docsJson, type NavGroup } from './docs-config';

let map: Map<string, string> | undefined;

/** The navigation group a page sits in (shown above the title, like Mintlify). */
export function groupOf(slug: string): string | undefined {
  if (!map) {
    map = new Map();
    const walk = (group: NavGroup) => {
      for (const item of group.pages) {
        if (typeof item === 'string') map!.set(item, group.group);
        else walk(item);
      }
    };
    for (const tab of docsJson.navigation.tabs) for (const group of tab.groups ?? []) walk(group);
  }
  return map.get(slug);
}
