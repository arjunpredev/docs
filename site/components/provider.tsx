'use client';
import { AskAIProvider } from '@/components/ask-ai';
import { RootProvider } from 'fumadocs-ui/provider/next';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// The search dialog (and the Markdown renderer for its results) loads on first open.
const SearchDialog = dynamic(() => import('@/components/search'), { ssr: false });

export function Provider({ children, defaultTheme }: { children: ReactNode; defaultTheme: string }) {
  return (
    <RootProvider search={{ SearchDialog }} theme={{ defaultTheme }}>
      <AskAIProvider>{children}</AskAIProvider>
    </RootProvider>
  );
}
