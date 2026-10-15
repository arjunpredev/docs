// The read-only virtual shell behind the MCP query_docs_filesystem tool.
// just-bash (a TypeScript bash with an in-memory filesystem) runs the command
// over the docs pages and OpenAPI specs; nothing touches the network or a disk.
import { Bash, getCommandNames, InMemoryFs, type CommandName, type IFileSystem } from 'just-bash/browser';
import { loadFiles, type DocsFiles } from './docs-data';
import type { Env } from './index';

const MAX_COMMAND = 4000;
const MAX_OUTPUT = 30 * 1024;
const TIME_LIMIT_MS = 5000;

const BLOCKED_COMMANDS = new Set<string>(['sleep', 'html-to-markdown', 'gzip', 'gunzip', 'zcat', 'tar', 'sqlite3']);
const COMMANDS = getCommandNames().filter((name) => !BLOCKED_COMMANDS.has(name)) as CommandName[];

// just-bash's own layout (/bin stubs, /dev, /proc, /usr); hidden so the tree only shows docs
const SYSTEM_DIRS = ['/bin', '/usr', '/proc'];
const HIDDEN_AT_ROOT = new Set(['bin', 'usr', 'proc', 'dev', 'tmp', 'home']);
const WRITE_METHODS = new Set([
  'writeFile',
  'appendFile',
  'mkdir',
  'rm',
  'cp',
  'mv',
  'chmod',
  'symlink',
  'link',
  'utimes',
  'writeFileSync',
  'writeFileLazy',
  'mkdirSync',
]);

class ReadOnlyError extends Error {
  code = 'EROFS';
}

function isSystemPath(path: string): boolean {
  return SYSTEM_DIRS.some((dir) => path === dir || path.startsWith(`${dir}/`));
}

function notFound(path: string): Error {
  const err = new Error(`ENOENT: no such file or directory, '${path}'`) as Error & { code: string };
  err.code = 'ENOENT';
  return err;
}

/** Wraps the filesystem: no writes once sealed, and the shell's system dirs are invisible. */
function docsView(fs: IFileSystem): { fs: IFileSystem; seal: () => void } {
  let sealed = false;
  const view = new Proxy(fs, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof prop !== 'string' || typeof value !== 'function') return value;
      if (WRITE_METHODS.has(prop)) {
        return (...args: unknown[]) => {
          // redirects to /dev/null and friends still work
          if (!sealed || String(args[0]).startsWith('/dev/')) return (value as (...a: unknown[]) => unknown).apply(target, args);
          throw new ReadOnlyError(`EROFS: read-only file system, '${String(args[0])}'`);
        };
      }
      if (prop === 'readdir' || prop === 'readdirWithFileTypes') {
        return async (path: string) => {
          if (isSystemPath(path)) throw notFound(path);
          const entries = (await (value as (p: string) => Promise<unknown[]>).call(target, path)) as (string | { name: string })[];
          if (path !== '/') return entries;
          return entries.filter((e) => !HIDDEN_AT_ROOT.has(typeof e === 'string' ? e : e.name));
        };
      }
      if (prop === 'exists') {
        return async (path: string) => (isSystemPath(path) ? false : (value as (p: string) => Promise<boolean>).call(target, path));
      }
      if (['stat', 'lstat', 'readFile', 'readFileBytes', 'readFileBuffer', 'realpath', 'readlink'].includes(prop)) {
        return async (path: string, ...rest: unknown[]) => {
          if (isSystemPath(path)) throw notFound(path);
          return (value as (...a: unknown[]) => unknown).call(target, path, ...rest);
        };
      }
      if (prop === 'getAllPaths') {
        return () => (value as () => string[]).call(target).filter((p) => !isSystemPath(p) && !p.startsWith('/dev'));
      }
      return value.bind(target);
    },
  });
  return { fs: view, seal: () => (sealed = true) };
}

let lazyFiles: Record<string, () => string> | undefined;

function seedFiles(files: DocsFiles): Record<string, () => string> {
  // lazy providers: a file is only materialized when a command reads it
  lazyFiles ??= Object.fromEntries(Object.entries(files).map(([path, text]) => [path, () => text]));
  return lazyFiles;
}

export interface ShellResult {
  text: string;
  isError: boolean;
}

// A docs path at the start of a line, as grep -r, rg and find print them
const LEADING_PATH = /^\/[^\s:]*\.(?:mdx|json)(?=$|:)/gm;

/** `grep -r x /` joins "/" and "agents.mdx" as "//agents.mdx": print each docs path once-slashed. */
function tidyPaths(output: string): string {
  return output.replace(LEADING_PATH, (path) => path.replace(/\/{2,}/g, '/'));
}

/** Formats like the Mintlify tool: "exit: N", then stdout and stderr blocks when non-empty. */
function format(exitCode: number, rawStdout: string, stderr: string): string {
  const stdout = tidyPaths(rawStdout);
  const parts = [`exit: ${exitCode}`];
  if (stdout) parts.push(`--- stdout ---\n${stdout}`);
  if (stderr) parts.push(`--- stderr ---\n${stderr}`);
  let text = parts.join('\n');
  if (text.length > MAX_OUTPUT) {
    text = `${text.slice(0, MAX_OUTPUT)}\n\n[output truncated at 30KB; use head -N, rg -C or a narrower path]`;
  }
  return text;
}

export async function runDocsCommand(env: Env, command: string): Promise<ShellResult> {
  if (command.length > MAX_COMMAND) {
    return { text: `Docs filesystem query failed: command is longer than ${MAX_COMMAND} characters`, isError: true };
  }
  const files = await loadFiles(env);
  const { fs, seal } = docsView(new InMemoryFs(seedFiles(files)));
  const bash = new Bash({
    fs,
    cwd: '/',
    env: { HOME: '/home/user' },
    commands: COMMANDS,
    executionLimitProfile: 'hardened',
    executionLimits: {
      maxExecutionTimeMs: TIME_LIMIT_MS,
      maxCommandCount: 5000,
      maxLoopIterations: 10000,
      maxSourceBytes: MAX_COMMAND,
      maxOutputSize: 4 * 1024 * 1024,
    },
  });
  seal();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIME_LIMIT_MS + 1000);
  try {
    const result = await bash.exec(command, { signal: controller.signal });
    return { text: format(result.exitCode, result.stdout, result.stderr), isError: false };
  } catch (error) {
    const message =
      error instanceof ReadOnlyError || (error as { code?: string })?.code === 'EROFS'
        ? 'the docs filesystem is read-only'
        : error instanceof Error
          ? error.message
          : String(error);
    return { text: `Docs filesystem query failed: ${message}`, isError: true };
  } finally {
    clearTimeout(timer);
  }
}
