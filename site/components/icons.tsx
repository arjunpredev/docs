// Mintlify uses Font Awesome names; map the ones the docs use to Lucide.
import {
  ArrowLeftRight,
  Cloud,
  Code,
  Coins,
  FolderOpen,
  Key,
  Laptop,
  LayoutGrid,
  List,
  Newspaper,
  Play,
  Plug,
  Plus,
  SlidersHorizontal,
  Columns3,
  Terminal,
  type LucideIcon,
} from 'lucide-react';
import type { SVGProps } from 'react';

function brand(path: string, viewBox = '0 0 24 24') {
  return function BrandIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox={viewBox} fill="currentColor" aria-hidden="true" {...props}>
        <path d={path} />
      </svg>
    );
  };
}

const GitHub = brand(
  'M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.8 1.1.8 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3',
);
const Discord = brand(
  'M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.7M8 15.4c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.6 8 10.6s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4m8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4',
);
const Python = brand(
  'M11.9 0C5.8 0 6.2 2.6 6.2 2.6v2.7H12v.8H3.9S0 5.7 0 11.8c0 6.1 3.4 5.9 3.4 5.9h2v-2.8s-.1-3.4 3.3-3.4h5.7s3.2.1 3.2-3.1V3.2S18.1 0 11.9 0M8.7 1.8a1 1 0 1 1 0 2.1 1 1 0 0 1 0-2.1M12.1 24c6.1 0 5.7-2.6 5.7-2.6v-2.7H12v-.8h8.1s3.9.4 3.9-5.7c0-6.1-3.4-5.9-3.4-5.9h-2v2.8s.1 3.4-3.3 3.4H9.6s-3.2-.1-3.2 3.1v5.2S5.9 24 12.1 24m3.2-1.8a1 1 0 1 1 0-2.1 1 1 0 0 1 0 2.1',
);
const NodeJs = brand(
  'M12 1.9c-.3 0-.6.1-.8.2L3 6.8c-.5.3-.8.9-.8 1.4v9.5c0 .6.3 1.1.8 1.4l2.2 1.2c1 .5 1.4.5 1.9.5 1.5 0 2.4-.9 2.4-2.5V8.9c0-.1-.1-.2-.2-.2h-1c-.1 0-.2.1-.2.2v9.4c0 .7-.8 1.4-1.9.8L4 18c-.1 0-.1-.1-.1-.2V8.2c0-.1 0-.2.1-.2l8.2-4.7h.2l8.2 4.7c.1 0 .1.1.1.2v9.5c0 .1 0 .2-.1.2l-8.2 4.7h-.2l-2.1-1.2h-.2c-.6.3-.7.4-1.2.6-.1 0-.3.1.1.3l2.7 1.6c.3.2.6.2.8.2.3 0 .6-.1.8-.2l8.2-4.7c.5-.3.8-.8.8-1.4V8.2c0-.6-.3-1.1-.8-1.4l-8.2-4.7c-.2-.1-.5-.2-.8-.2m2.2 6.8c-2.4 0-3.8 1-3.8 2.7 0 1.8 1.4 2.3 3.7 2.6 2.7.3 2.9.7 2.9 1.2 0 .9-.7 1.3-2.4 1.3-2.1 0-2.6-.5-2.8-1.6 0-.1-.1-.2-.2-.2h-1c-.1 0-.2.1-.2.2 0 1.3.7 2.9 4.2 2.9 2.5 0 4-1 4-2.8s-1.2-2.2-3.7-2.6c-2.5-.3-2.8-.5-2.8-1.1 0-.5.2-1.1 2.1-1.1 1.7 0 2.3.4 2.6 1.5 0 .1.1.2.2.2h1c.1 0 .1 0 .2-.1v-.1c-.2-2-1.5-2.9-4-2.9',
);

const LinkedIn = brand(
  'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z',
);
const X = brand(
  'M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z',
);
const YouTube = brand(
  'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12z',
);
function Instagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="0.6" fill="currentColor" />
    </svg>
  );
}

const icons: Record<string, LucideIcon | ReturnType<typeof brand>> = {
  'arrow-right-arrow-left': ArrowLeftRight,
  cloud: Cloud,
  code: Code,
  coins: Coins,
  discord: Discord,
  'folder-open': FolderOpen,
  github: GitHub,
  instagram: Instagram,
  linkedin: LinkedIn,
  x: X,
  youtube: YouTube,
  'grid-2': LayoutGrid,
  key: Key,
  laptop: Laptop,
  list: List,
  newspaper: Newspaper,
  'node-js': NodeJs,
  play: Play,
  plug: Plug,
  plus: Plus,
  python: Python,
  sliders: SlidersHorizontal,
  'table-columns': Columns3,
  terminal: Terminal,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name];
  if (!Icon) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[icons] no mapping for "${name}"`);
    return null;
  }
  return <Icon className={className ?? 'size-4'} />;
}
