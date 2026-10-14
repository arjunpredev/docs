const methodColors: Record<string, string> = {
  get: 'bg-green-500/15 text-green-700 dark:text-green-400',
  post: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  put: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  patch: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  delete: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

/** HTTP method pill, as in the endpoint bar and the sidebar. */
export function MethodBadge({ method, size = 'md' }: { method: string; size?: 'sm' | 'md' }) {
  const m = method.toLowerCase();
  const sizing =
    size === 'sm' ? 'w-[2.375rem] shrink-0 justify-center px-1 text-[0.625rem] leading-4' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex rounded-md font-mono font-semibold uppercase ${sizing} ${methodColors[m] ?? 'bg-fd-secondary text-fd-secondary-foreground'}`}>
      {m === 'delete' ? 'del' : m}
    </span>
  );
}
