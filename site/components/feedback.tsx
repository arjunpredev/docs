'use client';
import posthog from 'posthog-js';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

export function Feedback({ page }: { page: string }) {
  const [sent, setSent] = useState<boolean | null>(null);

  function send(helpful: boolean) {
    posthog.capture?.('docs_feedback', { page, helpful });
    setSent(helpful);
  }

  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t pt-6 text-sm text-fd-muted-foreground">
      {sent === null ? (
        <>
          <span>Was this page helpful?</span>
          <button type="button" onClick={() => send(true)} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-fd-accent hover:text-fd-accent-foreground">
            <ThumbsUp className="size-3.5" /> Yes
          </button>
          <button type="button" onClick={() => send(false)} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-fd-accent hover:text-fd-accent-foreground">
            <ThumbsDown className="size-3.5" /> No
          </button>
        </>
      ) : (
        <span>Thanks for the feedback.</span>
      )}
    </div>
  );
}
