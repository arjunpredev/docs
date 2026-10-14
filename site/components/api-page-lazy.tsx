'use client';
// The API reference UI (playground, schema views, code samples) is the largest
// client code on the site. Loading it through next/dynamic keeps it out of the
// shared docs bundle: only API pages fetch it, and it still renders on the server.
import dynamic from 'next/dynamic';

export const OpenAPIPage = dynamic(() => import('./api-page').then((m) => m.OpenAPIPage));
