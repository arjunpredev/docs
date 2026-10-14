import type { OpenAPIRef } from '@/lib/openapi';

const methodColors: Record<string, string> = {
  get: 'bg-green-500/15 text-green-700 dark:text-green-400',
  post: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  put: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  patch: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  delete: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

/** Mintlify-style method + URL bar at the top of an API page, linking to the playground below. */
export function EndpointBar({ spec, ref_ }: { spec: { servers?: { url?: string }[] }; ref_: OpenAPIRef }) {
  const server = spec.servers?.[0]?.url?.replace(/\/$/, '') ?? '';
  return (
    <div className="not-prose mt-4 flex items-center gap-2 rounded-xl border bg-fd-card p-1.5 text-sm">
      <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-semibold uppercase ${methodColors[ref_.method] ?? 'bg-fd-secondary'}`}>
        {ref_.method}
      </span>
      <code className="min-w-0 flex-1 truncate font-mono text-fd-muted-foreground">
        {server}
        <span className="text-fd-foreground">{ref_.path}</span>
      </code>
      <a href="#openapi" className="rounded-lg bg-fd-primary px-3 py-1 text-xs font-medium text-fd-primary-foreground">
        Try it
      </a>
    </div>
  );
}
