'use client';
// Ask AI: navbar button (Cmd/Ctrl+I), a question bar at the bottom of each page,
// and a side panel that streams answers from /api/chat.
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { Root } from 'hast';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { ArrowUp, Loader2, RotateCcw, Sparkles, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { getTurnstileToken } from './turnstile';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; url: string }[];
  error?: string;
}

interface AskAIState {
  open: boolean;
  setOpen: (open: boolean) => void;
  ask: (question: string) => void;
}

const Context = createContext<AskAIState | null>(null);

function useAskAI() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useAskAI outside <AskAIProvider>');
  return ctx;
}

const processor = remark().use(remarkGfm).use(remarkRehype);

function Pre(props: ComponentProps<'pre'>) {
  const code = props.children as { props?: { className?: string; children?: unknown } } | undefined;
  const lang = code?.props?.className?.replace('language-', '') ?? 'text';
  return <DynamicCodeBlock lang={lang} code={String(code?.props?.children ?? '').trimEnd()} />;
}

function Markdown({ text }: { text: string }) {
  const node = useMemo(() => {
    const hast = processor.runSync(processor.parse(text)) as Root;
    return toJsxRuntime(hast, {
      Fragment,
      jsx,
      jsxs,
      components: { ...defaultMdxComponents, pre: Pre, img: undefined },
    });
  }, [text]);
  return <div className="prose prose-sm max-w-none text-sm [&_p]:my-2">{node}</div>;
}

function currentPage(pathname: string | null): string | undefined {
  const slug = pathname?.replace(/^\/+|\/+$/g, '');
  return slug || undefined;
}

export function AskAIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();
  const abort = useRef<AbortController | null>(null);

  const send = useCallback(
    async (history: Message[]) => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setBusy(true);
      setMessages([...history, { role: 'assistant', content: '' }]);
      const update = (patch: Partial<Message>) =>
        setMessages((prev) => {
          const next = [...prev];
          const last = next.at(-1)!;
          next[next.length - 1] = { ...last, ...patch, content: patch.content !== undefined ? last.content + patch.content : last.content };
          return next;
        });

      try {
        const turnstileToken = await getTurnstileToken().catch(() => undefined);
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            page: currentPage(pathname),
            turnstileToken,
            messages: history.filter((m) => !m.error).map(({ role, content }) => ({ role, content })),
          }),
        });
        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          update({ error: body.error ?? 'Something went wrong. Try again.' });
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let split: number;
          while ((split = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, split);
            buffer = buffer.slice(split + 2);
            if (!frame.startsWith('data: ')) continue;
            const event = JSON.parse(frame.slice(6)) as { t?: string; sources?: Message['sources']; error?: string };
            if (event.sources) update({ sources: event.sources });
            if (event.t) update({ content: event.t });
            if (event.error) update({ error: event.error });
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') update({ error: 'Connection lost. Try again.' });
      } finally {
        setBusy(false);
      }
    },
    [pathname],
  );

  const ask = useCallback(
    (question: string) => {
      const text = question.trim();
      if (!text || busy) return;
      setOpen(true);
      posthog.capture?.('docs_ask_ai_question', { page: currentPage(pathname) });
      // Drop exchanges that failed, so a retry does not repeat the question
      const kept: Message[] = [];
      for (const m of messages) {
        if (m.role === 'assistant' && (m.error || !m.content)) {
          if (kept.at(-1)?.role === 'user') kept.pop();
          continue;
        }
        kept.push(m);
      }
      const history = [...kept, { role: 'user' as const, content: text }];
      void send(history);
    },
    [busy, messages, pathname, send],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(() => ({ open, setOpen, ask }), [open, ask]);

  return (
    <Context.Provider value={value}>
      {children}
      <AskAIBar />
      {open ? (
        <Panel
          messages={messages}
          busy={busy}
          onClose={() => setOpen(false)}
          onReset={() => {
            abort.current?.abort();
            setMessages([]);
          }}
        />
      ) : null}
    </Context.Provider>
  );
}

export function AskAITrigger() {
  const { setOpen } = useAskAI();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border bg-fd-secondary/50 px-2.5 py-1.5 text-sm text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
    >
      <Sparkles className="size-4" />
      <span className="max-md:hidden">Ask AI</span>
      <kbd className="rounded border bg-fd-background px-1 text-xs max-md:hidden">⌘I</kbd>
    </button>
  );
}

function QuestionInput({ placeholder, autoFocus, disabled }: { placeholder: string; autoFocus?: boolean; disabled?: boolean }) {
  const { ask } = useAskAI();
  const [text, setText] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    ask(text);
    setText('');
  };
  return (
    <form onSubmit={submit} className="flex items-end gap-2 rounded-xl border bg-fd-background p-2 shadow-lg">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) submit(e);
        }}
        rows={1}
        maxLength={4000}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-fd-muted-foreground"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        aria-label="Send"
        className="rounded-full bg-fd-primary p-1.5 text-fd-primary-foreground disabled:opacity-40"
      >
        <ArrowUp className="size-4" />
      </button>
    </form>
  );
}

function AskAIBar() {
  const { open, setOpen } = useAskAI();
  if (open) return null;
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 max-md:hidden">
        <div className="pointer-events-auto w-full max-w-xl">
          <QuestionInput placeholder="Ask a question..." />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask AI"
        className="fixed right-4 bottom-4 z-30 inline-flex items-center gap-2 rounded-full bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground shadow-lg md:hidden"
      >
        <Sparkles className="size-4" />
        Ask AI
      </button>
    </>
  );
}

function Panel({ messages, busy, onClose, onReset }: { messages: Message[]; busy: boolean; onClose: () => void; onReset: () => void }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <aside
      aria-label="Ask AI"
      className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-s bg-fd-background shadow-2xl sm:w-[440px]"
    >
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Sparkles className="size-4" />
        <p className="flex-1 text-sm font-medium">Ask AI</p>
        <button type="button" onClick={onReset} aria-label="New conversation" className="rounded-md p-1.5 text-fd-muted-foreground hover:bg-fd-accent">
          <RotateCcw className="size-4" />
        </button>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-fd-muted-foreground hover:bg-fd-accent">
          <X className="size-4" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-fd-muted-foreground">
            Ask anything about pre.dev. Answers come from these docs and link to the pages they use.
          </p>
        ) : null}
        <div className="flex flex-col gap-4">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="self-end rounded-xl bg-fd-secondary px-3 py-2 text-sm whitespace-pre-wrap">
                {m.content}
              </div>
            ) : (
              <div key={i} className="flex flex-col gap-2">
                {m.content ? <Markdown text={m.content} /> : null}
                {!m.content && !m.error && busy && i === messages.length - 1 ? (
                  <Loader2 className="size-4 animate-spin text-fd-muted-foreground" />
                ) : null}
                {m.error ? <p className="text-sm text-red-500">{m.error}</p> : null}
                {m.sources?.length && m.content ? (
                  <div className="flex flex-wrap gap-1.5">
                    {m.sources.map((s) => (
                      <a key={s.url} href={s.url.replace('https://docs.pre.dev', '')} className="rounded-full border px-2 py-0.5 text-xs text-fd-muted-foreground hover:text-fd-foreground">
                        {s.title}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ),
          )}
        </div>
        <div ref={end} />
      </div>
      <div className="border-t p-3">
        <QuestionInput placeholder="Ask a follow-up..." autoFocus disabled={busy} />
        <p className="mt-2 text-center text-xs text-fd-muted-foreground">AI answers can be wrong. Check the linked pages.</p>
      </div>
    </aside>
  );
}
