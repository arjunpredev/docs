import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsShell } from '@/components/docs-shell';
import { NotFoundSuggestions } from '@/components/not-found-suggestions';

export const metadata: Metadata = { title: 'Page Not Found' };

export default function NotFound() {
  return (
    <DocsShell>
      <main id="main-content" className="mx-auto flex w-full max-w-xl flex-col justify-center px-6 py-24 [grid-area:main]">
        <p className="text-sm font-medium text-fd-muted-foreground">404</p>
        <h1 className="mt-1 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-fd-muted-foreground">
          This page doesn&apos;t exist or has moved. Search with <kbd className="rounded border px-1 text-xs">⌘K</kbd>, or
          start from the <Link className="underline underline-offset-4" href="/overview">overview</Link>.
        </p>
        <NotFoundSuggestions />
      </main>
    </DocsShell>
  );
}
