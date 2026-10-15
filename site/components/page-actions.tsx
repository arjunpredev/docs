'use client';
// Mintlify's contextual menu: copy the page as Markdown, view it, open it in
// an AI assistant, or connect the docs MCP server to an editor.
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { Check, ChevronDown, Copy, ExternalLink, FileText, Plug } from 'lucide-react';
import { useState, type ReactNode } from 'react';

const MCP_URL = 'https://docs.pre.dev/mcp';

function prompt(pageUrl: string) {
  return `Read ${pageUrl} so I can ask questions about it.`;
}

export function PageActions({ markdownUrl, pageUrl }: { markdownUrl: string; pageUrl: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string, text: () => Promise<string> | string) {
    await navigator.clipboard.writeText(await text());
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  const copyPage = () => copy('page', async () => (await fetch(markdownUrl)).text());
  const q = encodeURIComponent(prompt(pageUrl));
  const cursorConfig = typeof window === 'undefined' ? '' : window.btoa(JSON.stringify({ url: MCP_URL }));
  const vscodeConfig = encodeURIComponent(JSON.stringify({ name: 'pre.dev', type: 'http', url: MCP_URL }));

  const links: { id: string; label: string; description: string; href: string; icon: ReactNode }[] = [
    { id: 'view', label: 'View as Markdown', description: 'View this page as plain text', href: markdownUrl, icon: <FileText className="size-4" /> },
    { id: 'chatgpt', label: 'Open in ChatGPT', description: 'Ask questions about this page', href: `https://chatgpt.com/?hints=search&q=${q}`, icon: <ExternalLink className="size-4" /> },
    { id: 'claude', label: 'Open in Claude', description: 'Ask questions about this page', href: `https://claude.ai/new?q=${q}`, icon: <ExternalLink className="size-4" /> },
    { id: 'perplexity', label: 'Open in Perplexity', description: 'Ask questions about this page', href: `https://www.perplexity.ai/search/new?q=${q}`, icon: <ExternalLink className="size-4" /> },
    { id: 'cursor', label: 'Connect to Cursor', description: 'Install the docs MCP server in Cursor', href: `cursor://anysphere.cursor-deeplink/mcp/install?name=pre.dev&config=${cursorConfig}`, icon: <Plug className="size-4" /> },
    { id: 'vscode', label: 'Connect to VS Code', description: 'Install the docs MCP server in VS Code', href: `vscode:mcp/install?${vscodeConfig}`, icon: <Plug className="size-4" /> },
  ];

  const item = 'flex w-full items-start gap-2.5 rounded-lg p-2 text-start text-sm hover:bg-fd-accent hover:text-fd-accent-foreground';

  return (
    <div className="flex items-center rounded-lg border bg-fd-card text-sm text-fd-muted-foreground">
      <button type="button" onClick={copyPage} className="flex items-center gap-1.5 rounded-s-lg px-2.5 py-1.5 hover:bg-fd-accent hover:text-fd-accent-foreground">
        {copied === 'page' ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        Copy page
      </button>
      <Popover>
        <PopoverTrigger aria-label="More page actions" className="rounded-e-lg border-s px-1.5 py-1.5 hover:bg-fd-accent hover:text-fd-accent-foreground">
          <ChevronDown className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent className="flex w-72 flex-col p-1" align="end">
          <button type="button" className={item} onClick={copyPage}>
            <span className="mt-0.5">{copied === 'page' ? <Check className="size-4" /> : <Copy className="size-4" />}</span>
            <span>
              <span className="block font-medium text-fd-foreground">Copy page</span>
              <span className="block text-xs">Copy this page as Markdown for LLMs</span>
            </span>
          </button>
          {links.map((link) => (
            <a key={link.id} href={link.href} target="_blank" rel="noreferrer noopener" className={item}>
              <span className="mt-0.5">{link.icon}</span>
              <span>
                <span className="block font-medium text-fd-foreground">{link.label}</span>
                <span className="block text-xs">{link.description}</span>
              </span>
            </a>
          ))}
          <button type="button" className={item} onClick={() => copy('mcp', () => MCP_URL)}>
            <span className="mt-0.5">{copied === 'mcp' ? <Check className="size-4" /> : <Plug className="size-4" />}</span>
            <span>
              <span className="block font-medium text-fd-foreground">Copy MCP server URL</span>
              <span className="block text-xs">{MCP_URL}</span>
            </span>
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
