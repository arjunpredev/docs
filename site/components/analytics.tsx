'use client';
import posthog from 'posthog-js';
import { useEffect } from 'react';

export function Analytics({ apiKey, apiHost }: { apiKey?: string; apiHost?: string }) {
  useEffect(() => {
    if (!apiKey || location.hostname !== 'docs.pre.dev') return;
    posthog.init(apiKey, {
      api_host: apiHost ?? 'https://us.i.posthog.com',
      capture_pageview: 'history_change',
      disable_session_recording: true,
      persistence: 'localStorage+cookie',
    });
  }, [apiKey, apiHost]);
  return null;
}
