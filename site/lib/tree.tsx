// Builds the sidebar from docs.json: tabs become root folders (navbar tabs),
// top-level groups become labelled sections, nested groups become folders.
import type * as PageTree from 'fumadocs-core/page-tree';
import { docsJson, type NavGroup } from './docs-config';
import { getPageBySlug } from './source';
import { NavIcon } from '@/components/icons';
import { MethodBadge } from '@/components/method-badge';

function pageNode(slug: string): PageTree.Item {
  const page = getPageBySlug(slug);
  if (!page) throw new Error(`docs.json lists "${slug}" but no ${slug}.mdx exists`);
  const title = page.data.sidebarTitle ?? page.data.title;
  // API endpoint pages lead with their HTTP method, as on the Mintlify site
  const method = page.data.openapi?.trim().split(/\s+/)[1];
  return {
    $id: slug,
    type: 'page',
    name: method ? (
      <span className="flex items-center gap-2">
        <MethodBadge method={method} size="sm" />
        <span>{title}</span>
      </span>
    ) : (
      title
    ),
    url: page.url,
    icon: page.data.icon ? <NavIcon name={page.data.icon} /> : undefined,
  };
}

function itemNodes(items: (string | NavGroup)[], parentId: string): PageTree.Node[] {
  return items.map((item) => (typeof item === 'string' ? pageNode(item) : folderNode(item, parentId)));
}

function folderNode(group: NavGroup, parentId: string): PageTree.Folder {
  const $id = `${parentId}/${group.group}`;
  return {
    $id,
    type: 'folder',
    name: group.group,
    icon: group.icon ? <NavIcon name={group.icon} /> : undefined,
    defaultOpen: group.expanded ?? false,
    collapsible: true,
    children: itemNodes(group.pages, $id),
  };
}

let cached: PageTree.Root | undefined;

export function getTree(): PageTree.Root {
  if (cached) return cached;
  const children: PageTree.Node[] = docsJson.navigation.tabs.map((tab) => {
    const $id = `tab:${tab.tab}`;
    const nodes: PageTree.Node[] = [];
    if (tab.pages) nodes.push(...itemNodes(tab.pages, $id));
    for (const group of tab.groups ?? []) {
      nodes.push({ $id: `${$id}/${group.group}`, type: 'separator', name: group.group });
      nodes.push(...itemNodes(group.pages, `${$id}/${group.group}`));
    }
    return { $id, type: 'folder', name: tab.tab, root: true, children: nodes };
  });
  cached = { $id: 'root', name: docsJson.name, children };
  return cached;
}
