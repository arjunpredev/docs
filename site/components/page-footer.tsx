// Bottom of every page: "Suggest edits" (the page's file on GitHub) and the
// social links from docs.json footer.socials, as on the Mintlify site.
import { Pencil } from 'lucide-react';
import { docsJson, repoUrl } from '@/lib/docs-config';
import { NavIcon } from './icons';

const LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  x: 'X',
  youtube: 'YouTube',
  instagram: 'Instagram',
  discord: 'Discord',
  github: 'GitHub',
};

export function PageFooter({ file }: { file: string }) {
  const socials = Object.entries(docsJson.footer?.socials ?? {});
  return (
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-sm text-fd-muted-foreground">
      <a
        href={`${repoUrl}/edit/main/${file}`}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1.5 hover:text-fd-foreground"
      >
        <Pencil className="size-3.5" />
        Suggest edits
      </a>
      {socials.length ? (
        <ul className="flex items-center gap-1">
          {socials.map(([name, href]) => (
            <li key={name}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={LABELS[name] ?? name}
                className="inline-flex rounded-md p-2 hover:bg-fd-accent hover:text-fd-foreground"
              >
                <NavIcon name={name} className="size-4" />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </footer>
  );
}
