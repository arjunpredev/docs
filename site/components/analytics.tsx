'use client';
import { useEffect } from 'react';
import { initAnalytics } from '@/lib/track';

export function Analytics({ apiKey, apiHost }: { apiKey?: string; apiHost?: string }) {
  useEffect(() => {
    if (!apiKey || location.hostname !== 'docs.pre.dev') return;
    const start = () => initAnalytics(apiKey, apiHost);
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(start, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(start, 1500);
    return () => clearTimeout(id);
  }, [apiKey, apiHost]);
  return null;
}
