import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Provider } from '@/components/provider';
import { Analytics } from '@/components/analytics';
import { docsJson, siteUrl } from '@/lib/docs-config';
import './global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: docsJson.name, template: `%s - ${docsJson.name}` },
  description: docsJson.description,
  applicationName: docsJson.name,
  icons: { icon: docsJson.favicon ?? '/favicon.ico' },
  openGraph: { siteName: docsJson.name, type: 'website' },
  twitter: { card: 'summary_large_image', site: docsJson.seo?.metatags?.['twitter:site'] },
  alternates: { types: { 'application/xml': '/sitemap.xml' } },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: docsJson.name,
  url: siteUrl,
  publisher: { '@type': 'Organization', ...docsJson.seo?.organization },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const posthog = docsJson.integrations?.posthog;
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Provider defaultTheme={docsJson.appearance?.default ?? 'dark'}>{children}</Provider>
        <Analytics apiKey={posthog?.apiKey} apiHost={posthog?.apiHost} />
      </body>
    </html>
  );
}
