'use client';
import SearchDialog from '@/components/search';
import { AskAIProvider } from '@/components/ask-ai';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';

export function Provider({ children, defaultTheme }: { children: ReactNode; defaultTheme: string }) {
  return (
    <RootProvider search={{ SearchDialog }} theme={{ defaultTheme }}>
      <AskAIProvider>{children}</AskAIProvider>
    </RootProvider>
  );
}
