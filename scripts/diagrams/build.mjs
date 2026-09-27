// Generates the light and dark SVG pair for every docs diagram from diagrams.mjs.
//   node scripts/diagrams/build.mjs          write images/diagrams/<name>-{light,dark}.svg
//   node scripts/diagrams/build.mjs --check  exit 1 if a committed SVG differs from its source
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { doc, THEMES, contrast } from './lib.mjs';
import diagrams from './diagrams.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DIAGRAM_DIR = path.join(root, 'images/diagrams');

// Every text color must reach WCAG AA (4.5:1) on every background it is drawn on.
function checkContrast() {
  for (const [name, t] of Object.entries(THEMES)) {
    const pairs = [
      ['t1 on bg', t.t1, t.bg], ['t2 on bg', t.t2, t.bg], ['t3 on bg', t.t3, t.bg],
      ['t2 on node', t.t2, t.node], ['t3 on node', t.t3, t.node], ['t3 on soft', t.t3, t.soft],
      ['accent text on accent fill', t.accentText, t.accentSoft], ['accent text on bg', t.accentText, t.bg],
      ['text on accent', t.onAccent, t.accent],
    ];
    for (const [label, fg, bg] of pairs) {
      const ratio = contrast(fg, bg);
      if (ratio < 4.5) throw new Error(`${name} theme: ${label} contrast ${ratio.toFixed(2)} is below 4.5`);
    }
  }
}

/** Map of file name to SVG source for every diagram and theme. */
export function renderDiagrams() {
  checkContrast();
  const files = new Map();
  for (const [name, make] of Object.entries(diagrams)) {
    const spec = make();
    for (const theme of Object.keys(THEMES)) files.set(`${name}-${theme}.svg`, doc(spec, theme));
  }
  return files;
}

/** Names of committed diagram files that are missing, stale, or have no source. */
export function staleDiagrams() {
  const files = renderDiagrams();
  const problems = [];
  for (const [file, svg] of files) {
    const target = path.join(DIAGRAM_DIR, file);
    if (!fs.existsSync(target)) problems.push(`${file} is missing; run npm run diagrams`);
    else if (fs.readFileSync(target, 'utf8') !== svg) problems.push(`${file} differs from scripts/diagrams; run npm run diagrams`);
  }
  for (const file of fs.existsSync(DIAGRAM_DIR) ? fs.readdirSync(DIAGRAM_DIR) : []) {
    if (file.endsWith('.svg') && !files.has(file)) problems.push(`${file} has no source in scripts/diagrams/diagrams.mjs`);
  }
  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const problems = staleDiagrams();
    for (const p of problems) console.error(p);
    process.exitCode = problems.length ? 1 : 0;
    if (!problems.length) console.log('Diagrams match their source');
  } else {
    fs.mkdirSync(DIAGRAM_DIR, { recursive: true });
    for (const [file, svg] of renderDiagrams()) fs.writeFileSync(path.join(DIAGRAM_DIR, file), svg);
    console.log(`Wrote ${renderDiagrams().size} files to images/diagrams`);
  }
}
