'use client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { fetchClient } from 'fumadocs-core/search/client/fetch';
import { track } from '@/lib/track';
import { Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { ASK_EVENT } from './ask-ai';

// Search runs in the Worker (/api/search?query=...), so the browser never downloads the index.
const client = fetchClient({ api: '/api/search' });

export default function DocsSearchDialog(props: SharedProps) {
  const { search, setSearch, query } = useDocsSearch({ client });

  // Mintlify's dashboard showed search terms; keep that signal in PostHog.
  useEffect(() => {
    if (search.trim().length < 3) return;
    const id = setTimeout(() => track('docs_search', { query: search.trim() }), 1000);
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
        {search.trim() ? (
          <SearchDialogFooter>
            <button
              type="button"
              onClick={() => {
                props.onOpenChange(false);
                window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: search.trim() }));
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <Sparkles className="size-4 shrink-0" />
              <span className="truncate">
                Ask AI about &ldquo;{search.trim()}&rdquo;
              </span>
            </button>
          </SearchDialogFooter>
        ) : null}
      </SearchDialogContent>
    </SearchDialog>
  );
}
