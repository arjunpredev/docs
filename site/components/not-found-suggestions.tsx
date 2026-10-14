'use client';
// Suggests pages for a missing URL by searching the words in its path.
import { useEffect, useState } from 'react';

interface Hit {
  type: string;
  url: string;
  content: string;
}

export function NotFoundSuggestions() {
  const [pages, setPages] = useState<{ url: string; title: string }[]>([]);

  useEffect(() => {
    const words = window.location.pathname
      .split(/[/_.\-]+/)
      .filter((w) => w.length > 1 && w !== 'md')
      .join(' ');
    if (!words) return;
    fetch(`/api/search?query=${encodeURIComponent(words)}`)
      .then((res) => (res.ok ? (res.json() as Promise<Hit[]>) : []))
      .then((hits) => {
        const seen = new Set<string>();
        const out: { url: string; title: string }[] = [];
        for (const hit of hits) {
          if (hit.type !== 'page' || seen.has(hit.url)) continue;
          seen.add(hit.url);
          out.push({ url: hit.url, title: hit.content.replace(/<\/?mark>/g, '') });
          if (out.length === 3) break;
        }
        setPages(out);
      })
      .catch(() => undefined);
  }, []);

  if (pages.length === 0) return null;
  return (
    <div className="mt-6 text-start">
      <p className="mb-2 text-sm font-medium text-fd-muted-foreground">Maybe you were looking for</p>
      <ul className="flex flex-col gap-1">
        {pages.map((page) => (
          <li key={page.url}>
            <a href={page.url} className="font-medium underline underline-offset-4">
              {page.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
