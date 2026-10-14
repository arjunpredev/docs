// Last commit date of each content file, read once from git at build time.
// Used for the sitemap's <lastmod> and each page's structured data. Needs full
// history (CI checks out with fetch-depth 0); without git, dates are omitted.
import { execFileSync } from 'node:child_process';
import { repoRoot } from './docs-config';

let dates: Map<string, string> | undefined;

/** ISO date of the last commit that touched `file` (path relative to the repo root). */
export function lastModified(file: string): string | undefined {
  if (!dates) {
    dates = new Map();
    try {
      const log = execFileSync('git', ['log', '--format=%x00%cI', '--name-only', '--no-renames', '--', '*.mdx'], {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
      });
      let date = '';
      for (const line of log.split('\n')) {
        if (line.startsWith('\0')) date = line.slice(1);
        else if (line && !dates.has(line)) dates.set(line, date);
      }
    } catch {
      // no git or no history: leave dates out
    }
  }
  return dates.get(file);
}
