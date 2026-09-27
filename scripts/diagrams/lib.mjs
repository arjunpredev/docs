// Shared drawing helpers for the docs diagrams. Geometry is theme-free: every
// color comes from a class, and the light and dark files differ only in <style>.
export const W = 540;
export const PAD = 20;

export const THEMES = {
  light: {
    bg: '#fafafa', border: '#e5e5e5',
    node: '#ffffff', nodeStroke: '#d4d4d4',
    soft: '#f0f0f0',
    t1: '#161616', t2: '#474747', t3: '#666666',
    line: '#8f8f8f', rule: '#e3e3e3',
    accent: '#315cbc', accentSoft: '#eaf0fc', accentText: '#2b52a8', onAccent: '#ffffff',
  },
  dark: {
    bg: '#141416', border: '#2a2a2e',
    node: '#1c1c1f', nodeStroke: '#3b3b41',
    soft: '#232327',
    t1: '#ededed', t2: '#bdbdbd', t3: '#9a9a9f',
    line: '#76767d', rule: '#2c2c31',
    accent: '#a9bff6', accentSoft: '#1f2940', accentText: '#b9ccf9', onAccent: '#0e0e10',
  },
};

const SANS = `Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
const MONO = `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`;

export function style(t) {
  return [
    `text{font-family:${SANS}}`,
    `.m{font-family:${MONO}}`,
    `.b{font-weight:600}`,
    `.cap{letter-spacing:.07em}`,
    `.bg{fill:${t.bg};stroke:${t.border}}`,
    `.n{fill:${t.node};stroke:${t.nodeStroke}}`,
    `.na{fill:${t.accentSoft};stroke:${t.accent}}`,
    `.soft{fill:${t.soft}}`,
    `.fa{fill:${t.accent}}`,
    `.fsa{fill:${t.accentSoft}}`,
    `.t1{fill:${t.t1}}`,
    `.t2{fill:${t.t2}}`,
    `.t3{fill:${t.t3}}`,
    `.ta{fill:${t.accentText}}`,
    `.ton{fill:${t.onAccent}}`,
    `.ln{fill:none;stroke:${t.line}}`,
    `.lna{fill:none;stroke:${t.accent}}`,
    `.hd{fill:${t.line}}`,
    `.hda{fill:${t.accent}}`,
    `.rule{fill:none;stroke:${t.rule}}`,
  ].join('\n');
}

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = n => Math.round(n * 10) / 10;

export function rect(x, y, w, h, cls = 'n', rx = 8, extra = '') {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${rx}" class="${cls}"${extra}/>`;
}

// text(x, y, 'string', { size, cls, bold, mono, anchor, cap })
export function text(x, y, s, o = {}) {
  const cls = [o.cls || 't1', o.bold ? 'b' : '', o.mono ? 'm' : '', o.cap ? 'cap' : ''].filter(Boolean).join(' ');
  const anchor = o.anchor && o.anchor !== 'start' ? ` text-anchor="${o.anchor}"` : '';
  return `<text x="${r1(x)}" y="${r1(y)}" font-size="${o.size || 15}" class="${cls}"${anchor}>${esc(s)}</text>`;
}

// Mixed runs on one line: [['label ', {cls}], ['code', {mono:true}]]
export function runs(x, y, parts, o = {}) {
  const spans = parts.map(([s, p = {}]) => {
    const cls = [p.cls || o.cls || 't1', p.bold ? 'b' : '', p.mono ? 'm' : ''].filter(Boolean).join(' ');
    const size = p.size ? ` font-size="${p.size}"` : '';
    return `<tspan class="${cls}"${size}>${esc(s)}</tspan>`;
  }).join('');
  const anchor = o.anchor && o.anchor !== 'start' ? ` text-anchor="${o.anchor}"` : '';
  return `<text x="${r1(x)}" y="${r1(y)}" font-size="${o.size || 15}"${anchor}>${spans}</text>`;
}

export function line(x1, y1, x2, y2, cls = 'ln', w = 1.5, dash = '') {
  return `<path d="M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}" class="${cls}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

export function poly(points, cls = 'ln', w = 1.5, dash = '') {
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`).join('');
  return `<path d="${d}" class="${cls}" stroke-width="${w}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}

// Filled triangular head with its tip at (x, y), pointing along (dx, dy).
export function head(x, y, dx, dy, cls = 'hd', size = 7) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const bx = x - ux * size, by = y - uy * size;
  const px = -uy * size * 0.55, py = ux * size * 0.55;
  return `<path d="M${r1(x)} ${r1(y)}L${r1(bx + px)} ${r1(by + py)}L${r1(bx - px)} ${r1(by - py)}Z" class="${cls}"/>`;
}

// Straight or orthogonal arrow; the line stops at the head's base.
export function arrow(points, o = {}) {
  const cls = o.accent ? 'lna' : 'ln';
  const hcls = o.accent ? 'hda' : 'hd';
  const size = o.size || 7;
  const pts = points.map(p => [...p]);
  const [x2, y2] = pts[pts.length - 1];
  const [x1, y1] = pts[pts.length - 2];
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  pts[pts.length - 1] = [x2 - (dx / len) * (size - 1), y2 - (dy / len) * (size - 1)];
  return poly(pts, cls, o.width || 1.5, o.dash || '') + head(x2, y2, dx, dy, hcls, size);
}

export function circle(cx, cy, r, cls) {
  return `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" class="${cls}"/>`;
}

// Numbered step marker.
export function badge(cx, cy, n, accent = false) {
  return circle(cx, cy, 12, accent ? 'fa' : 'n') +
    text(cx, cy + 4.6, String(n), { size: 13, bold: true, anchor: 'middle', cls: accent ? 'ton' : 't2' });
}

// Small uppercase section label.
export function eyebrow(x, y, s, o = {}) {
  return text(x, y, s.toUpperCase(), { size: 13, bold: true, cap: true, cls: o.cls || 't3', anchor: o.anchor });
}

export function doc({ w = W, h, title, desc, body }, themeName) {
  const t = THEMES[themeName];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc">`,
    `<title id="title">${esc(title)}</title>`,
    `<desc id="desc">${esc(desc)}</desc>`,
    `<style>`,
    style(t),
    `</style>`,
    rect(0.5, 0.5, w - 1, h - 1, 'bg', 12),
    body,
    `</svg>`,
    '',
  ].join('\n');
}

// WCAG contrast, used by the build to reject weak text/background pairs.
function lum(hex) {
  const c = hex.replace('#', '').match(/../g).map(v => parseInt(v, 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
