import type { OpenAPIRef } from '@/lib/openapi';
import { MethodBadge } from './method-badge';

/** Mintlify-style method + URL bar at the top of an API page, linking to the playground below. */
export function EndpointBar({ spec, ref_ }: { spec: { servers?: { url?: string }[] }; ref_: OpenAPIRef }) {
  const server = spec.servers?.[0]?.url?.replace(/\/$/, '') ?? '';
  return (
    <div className="not-prose mt-4 flex items-center gap-2 rounded-xl border bg-fd-card p-1.5 text-sm">
      <MethodBadge method={ref_.method} />
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
