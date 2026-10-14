'use client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { fetchClient } from 'fumadocs-core/search/client/fetch';
import posthog from 'posthog-js';
import { useEffect } from 'react';

// Search runs in the Worker (/api/search?query=...), so the browser never downloads the index.
const client = fetchClient({ api: '/api/search' });

export default function DocsSearchDialog(props: SharedProps) {
  const { search, setSearch, query } = useDocsSearch({ client });

  // Mintlify's dashboard showed search terms; keep that signal in PostHog.
  useEffect(() => {
    if (search.trim().length < 3) return;
    const id = setTimeout(() => posthog.capture?.('docs_search', { query: search.trim() }), 1000);
    return () => clearTimeout(id);
  }, [search]);

  return (
    <SearchDialog search={search} onSearchChange={setSearch} isLoading={query.isLoading} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== 'empty' ? query.data : null} />
      </SearchDialogContent>
    </SearchDialog>
  );
}
