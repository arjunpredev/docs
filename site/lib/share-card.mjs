/**
 * The pre.dev share card: one 1200 x 630 design for every link pre.dev
 * publishes (the site, shared plans, the blog, the docs). This file is the
 * spec. It has no dependencies and builds trees of elements for satori; each
 * surface keeps a copy and renders with its own satori and resvg:
 *
 *   predev-app   frontend/scripts/og/share-card.mjs (the original)
 *                backend/src/helpers/share_card.ts
 *   masthead     packages/server/src/card-layout.ts (the "pre.dev" design)
 *   docs         site/lib/share-card.mjs
 *
 * Change the design here first, copy it to the others, and bump CARD_DESIGN
 * so every card is drawn again under a new address.
 *
 * The rules every card follows:
 * - It is read at ~500px wide in a feed, sometimes 320px: a 0.42x scale, so
 *   nothing is smaller than 28px (MIN_FONT), and checkCard() fails a card
 *   that breaks it.
 * - The same frame: the brain mark and a mono eyebrow trail on top, the
 *   headline and one support line, then a footer band (stats, chips, a meta
 *   line or the RL chart) under a hairline, inside a 72px safe box.
 * - Text is fitted, never cut mid-sentence: a long title steps down from 64px
 *   to 48px, and support copy that does not fit loses whole sentences.
 */

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;
/** Part of every card's address: change it with the design and every card is drawn again. */
export const CARD_DESIGN = '2';
export const MIN_FONT = 28;

/** The font files a renderer loads (all WOFF from @fontsource; satori reads no WOFF2). */
export const CARD_FONTS = [
    { name: 'Inter', weight: 500, file: 'inter/files/inter-latin-500-normal.woff' },
    { name: 'Inter', weight: 600, file: 'inter/files/inter-latin-600-normal.woff' },
    { name: 'Inter', weight: 800, file: 'inter/files/inter-latin-800-normal.woff' },
    { name: 'JetBrains Mono', weight: 500, file: 'jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff' },
    { name: 'JetBrains Mono', weight: 700, file: 'jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff' }
];

const PAD = 72;
const INNER = CARD_WIDTH - PAD * 2;
const SANS = 'Inter';
const MONO = 'JetBrains Mono';
const INK = '#ffffff';
const DIM = '#7d7d7d';
const SOFT = '#a5a5a5';
const MUTE = '#8f8f8f';
const STRONG = '#e8e8e8';
const LABEL = '#c4c4c4';
const RULE = 'rgba(255,255,255,0.09)';

const TITLE_SIZES = [64, 60, 56, 52, 48];
const TEXT_SIZE = 31;
const TEXT_LINE = 1.42;
const TITLE_LINE = 1.06;
const MARK_HEIGHT = 34;

// ------------------------------------------------------------------ art

/** pre.dev's brain mark (favicon.svg), white, cropped to the glyph. */
export const MARK_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 100 432 312"><path fill="#fff" transform="translate(46 107.57) scale(0.733)" d="M440.43 219.69Q440.25 220.67 439.63 221.22Q439.27 221.53 439.01 221.13C436.33 216.94 432.83 213.26 427.92 212.10Q414.79 209.01 406.59 219.07Q404.52 221.61 403.79 224.83Q402.25 231.54 404.49 239.33Q405.06 241.30 406.80 242.68Q410.20 245.38 414.65 250.37Q415.06 250.84 415.06 251.47Q415.08 279.70 415.08 295.25Q415.08 295.89 414.28 296.83Q413.69 297.53 412.97 297.98Q405.22 302.82 398.61 304.85Q388.11 308.08 383.67 309.03Q376.15 310.64 368.41 311.28Q366.24 311.46 366.24 309.27Q366.39 259.28 366.13 214.25C366.11 209.58 366.65 204.92 366.60 201.08Q366.57 199.06 367.82 197.29Q369.72 194.60 371.49 192.48Q372.72 191.01 373.49 186.99Q373.89 184.90 373.53 181.15Q373.30 178.65 373.28 175.33Q373.16 139.32 373.11 81.54Q373.11 81.14 373.39 80.86L381.20 73.04A2.30 2.30 0.0 0 0 381.87 71.52Q382.30 62.29 381.74 55.72Q381.22 49.56 376.23 45.76C372.38 42.84 370.34 40.95 365.72 40.99Q360.44 41.03 359.90 41.05Q356.03 41.20 354.27 42.23Q350.63 44.35 348.14 48.44Q346.71 50.78 346.77 53.53Q346.94 61.95 347.26 64.26Q347.59 66.58 349.30 69.49Q351.09 72.53 355.42 78.82Q355.84 79.42 358.02 80.09Q358.49 80.23 358.45 80.73Q358.41 81.26 358.39 82.50Q358.08 98.56 358.18 175.84Q358.18 179.12 357.29 180.47Q355.93 182.52 354.48 184.49A0.42 0.42 0.0 0 1 353.84 184.54Q349.25 180.00 345.91 174.52Q345.64 174.10 345.80 173.62Q348.29 165.83 348.25 160.50Q348.24 158.00 346.64 153.50C344.33 147.00 338.03 143.34 331.53 142.33Q325.59 141.41 321.02 144.43Q316.56 147.38 314.46 150.14Q311.80 153.63 311.18 157.91Q309.95 166.37 316.26 173.08Q319.76 176.81 324.01 179.43C326.19 180.77 327.87 180.79 330.18 180.57Q330.73 180.52 331.09 180.94Q335.74 186.36 343.49 194.42Q345.20 196.20 348.18 198.36C349.47 199.29 350.44 201.41 350.55 203.26Q350.87 208.23 350.84 212.01Q350.49 254.94 350.43 311.35A0.91 0.91 0.0 0 1 349.67 312.25Q330.66 315.64 312.32 311.93Q308.28 311.11 305.70 309.16Q300.49 305.22 297.35 300.48Q295.61 297.86 292.78 291.72Q289.97 285.62 284.65 278.81Q279.49 272.21 271.17 270.71Q268.62 270.25 267.54 270.05Q265.35 269.65 263.91 269.64Q213.20 269.14 166.61 269.62Q163.99 269.64 161.43 269.99Q158.07 270.44 156.29 270.77C152.73 271.44 147.17 273.56 144.92 276.63Q143.98 277.93 142.77 278.89Q141.57 279.86 139.78 282.11C138.44 283.81 137.28 285.23 136.37 286.89Q132.24 294.39 125.27 302.62C122.03 306.44 118.04 308.38 113.77 311.49Q110.73 313.71 105.99 316.00C101.17 318.32 99.05 319.44 95.01 320.78Q77.09 326.70 57.28 322.85Q47.18 320.88 39.89 315.36Q39.05 314.72 33.54 308.49Q29.99 304.47 27.89 300.84Q22.46 291.44 20.21 285.81Q15.13 273.16 17.14 258.60Q17.79 253.86 20.50 247.44C23.13 241.21 26.28 235.57 27.89 229.32Q28.69 226.22 28.72 221.57Q28.79 211.39 28.86 201.63Q28.89 197.74 31.46 190.74Q33.39 185.49 38.69 178.32Q41.48 174.56 46.42 170.82Q53.68 165.34 55.10 164.34Q57.57 162.59 59.76 160.52Q68.42 152.32 70.72 145.21C74.21 134.40 75.44 128.82 79.80 121.57Q82.24 117.54 86.59 114.25Q95.35 107.63 104.32 103.34Q106.60 102.25 113.74 99.34Q114.20 99.15 114.41 98.70Q119.99 86.83 124.01 81.76Q135.51 67.26 152.78 62.80Q157.92 61.48 177.15 56.94Q179.81 56.31 185.45 53.84C192.46 50.78 200.32 45.74 205.88 42.88Q215.95 37.69 226.66 35.16Q231.31 34.06 243.37 32.90Q252.50 32.03 260.16 30.87Q262.20 30.57 270.76 30.72Q276.69 30.82 281.24 31.79Q283.61 32.29 288.58 33.07Q292.24 33.64 296.00 33.13Q307.33 31.62 317.12 28.35Q321.14 27.01 336.51 26.15Q352.62 25.25 366.04 30.41Q367.05 30.79 370.10 32.79Q371.75 33.87 374.11 34.70Q382.16 37.50 390.81 40.93C393.09 41.83 396.70 43.08 400.18 43.25Q409.26 43.70 417.96 45.16Q428.36 46.91 435.30 50.44Q448.52 57.18 458.35 66.68Q461.47 69.70 463.91 73.08Q465.87 75.79 467.53 77.67Q470.03 80.49 471.63 82.55Q472.42 83.56 479.32 89.34Q481.58 91.23 487.40 94.25Q496.34 98.89 501.96 102.99Q505.41 105.52 512.69 112.52Q516.64 116.33 520.13 121.58Q525.51 129.66 526.37 131.38Q528.93 136.54 530.36 138.39Q535.92 145.61 541.51 151.31Q544.09 153.93 546.27 156.87Q546.85 157.65 550.54 162.10Q554.96 167.44 557.15 173.60Q557.86 175.59 559.13 179.86Q560.05 182.95 560.41 186.34Q562.01 201.31 556.56 215.14Q553.78 222.21 548.59 227.84Q547.15 229.41 542.44 234.41Q540.34 236.63 538.24 237.66C536.18 238.67 534.57 240.37 532.29 241.80Q528.35 244.28 525.03 246.67C523.39 247.86 521.21 248.22 519.35 249.30Q509.08 255.28 497.42 257.89Q492.26 259.04 485.60 259.99Q478.28 261.04 473.87 262.27Q464.42 264.89 458.89 266.85Q450.46 269.85 441.58 275.02Q433.07 279.97 431.28 281.11Q430.12 281.85 430.12 280.48L430.12 250.76A1.51 1.50 71.8 0 1 430.73 249.55Q436.82 245.15 439.56 238.52C440.67 235.81 440.56 232.20 440.62 229.17Q440.63 228.78 441.01 228.81L441.26 228.82Q441.36 228.83 441.35 228.93Q441.12 231.20 443.30 231.36Q448.85 231.76 452.51 227.68Q455.42 224.44 457.41 220.10A3.66 3.63 -32.4 0 0 457.75 218.61L458.15 162.56Q458.16 161.88 458.74 161.54Q462.18 159.52 464.64 156.13Q473.45 144.03 465.52 130.99Q464.20 128.82 462.37 127.51C458.46 124.73 452.80 122.33 448.01 123.18C444.68 123.78 441.08 124.81 437.92 126.90Q434.83 128.96 433.00 132.27Q428.89 139.76 431.14 148.82Q432.15 152.89 434.28 155.22Q437.28 158.49 441.15 161.03A1.94 1.68 19.1 0 1 442.03 162.55L441.92 219.12Q441.92 219.53 441.25 219.57Q441.06 219.59 440.90 219.39Q440.57 218.97 440.43 219.69ZM252.41 110.45Q260.00 103.92 261.35 101.61C264.74 95.79 263.84 86.76 261.01 81.17Q258.85 76.88 255.02 74.55Q251.21 72.24 246.03 72.21Q237.73 72.15 231.94 76.69Q229.77 78.38 228.17 81.32Q226.00 85.27 225.64 86.88Q224.05 94.06 228.62 101.62Q231.82 106.91 235.94 110.84A2.37 2.35 21.8 0 1 236.67 112.52Q236.82 129.32 237.02 145.73Q237.09 151.89 236.96 165.72Q236.86 175.82 237.12 185.91Q237.15 187.03 237.86 193.54Q238.28 197.39 237.82 201.25Q237.13 207.14 237.11 207.33Q236.96 209.37 236.64 213.45Q236.45 215.89 235.35 217.27Q234.79 217.98 232.39 221.07Q232.09 221.46 231.61 221.61Q229.82 222.19 227.69 222.78Q225.59 223.37 223.25 223.35Q197.12 223.06 140.33 223.14Q138.64 223.14 138.49 221.45Q138.44 220.87 137.74 219.61Q137.38 218.95 136.45 218.16C134.03 216.11 133.36 214.71 133.36 211.33Q133.36 180.02 133.23 164.77Q133.15 154.35 133.44 145.11Q133.46 144.59 133.90 144.34Q143.82 138.64 144.34 127.44Q144.84 116.56 136.85 110.12Q134.05 107.87 130.93 107.13Q122.48 105.12 115.29 109.51C105.76 115.34 104.00 127.39 109.24 136.62Q110.70 139.19 115.83 143.73C117.25 144.98 117.45 145.89 117.46 147.75Q117.57 176.06 117.47 208.94Q117.46 212.22 117.78 214.55Q118.29 218.23 119.23 220.06Q119.82 221.22 122.83 226.74Q123.98 228.84 128.93 232.04Q134.33 235.52 140.27 237.16Q144.70 238.39 150.73 238.37Q207.98 238.19 216.64 238.16C220.72 238.15 224.94 237.80 229.08 237.56C230.82 237.46 233.20 236.85 234.50 236.25Q236.82 235.16 244.24 229.50Q245.60 228.47 247.15 225.51Q248.21 223.49 249.41 222.49Q251.03 221.16 252.22 219.74Q252.56 219.34 252.57 218.81Q252.97 168.08 252.90 124.26Q252.89 115.87 252.11 111.28Q252.03 110.78 252.41 110.45Z"/></svg>';
const MARK_RATIO = 432 / 312;

/**
 * The sky every card sits on: 260 still stars from a fixed seed and a soft
 * light from the top left, as one SVG so every renderer draws the same one.
 */
export function skySvg() {
    let seed = 0x5eed2026;
    const rnd = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const radii = [0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.4];
    let stars = '';
    for (let i = 0; i < 260; i++) {
        const x = (rnd() * CARD_WIDTH).toFixed(1);
        const y = (rnd() * CARD_HEIGHT).toFixed(1);
        const r = radii[Math.floor(rnd() * radii.length)];
        stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity="${(0.11 + rnd() * 0.49).toFixed(2)}"/>`;
    }
    return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">` +
        '<defs><radialGradient id="l" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(168 -50.4) scale(880 520)">' +
        '<stop offset="0" stop-color="#fff" stop-opacity="0.09"/><stop offset="0.64" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
        `<rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#000"/>${stars}<rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#l)"/></svg>`
    );
}

/** An SVG string as a data: URL satori embeds. */
export function svgDataUrl(svg) {
    const bytes = new TextEncoder().encode(svg);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:image/svg+xml;base64,${btoa(bin)}`;
}

// ------------------------------------------------------------------ elements

function el(type, style, ...children) {
    const kept = children.flat().filter(c => c !== null && c !== undefined && c !== false && c !== '');
    return { type, props: { style: { display: 'flex', ...style }, children: kept.length === 1 ? kept[0] : kept } };
}

function img(src, width, height, style = {}) {
    return { type: 'img', props: { src, width, height, style: { width, height, ...style } } };
}

/** "**bold**" marks the words support copy stresses; everything else is plain. */
export function plainText(text) {
    return String(text ?? '').replace(/\*\*/g, '');
}

/**
 * Support copy as satori lays out mixed weights: one element per word in a
 * wrapping row (satori does not flow spans inline), stressed words brighter.
 */
function richText(text, size, color) {
    // Words in order; `glued` marks one that follows the last with no space ("**code**.").
    const words = [];
    let spaced = true;
    for (const part of String(text).split(/(\*\*[^*]+\*\*)/)) {
        if (!part) continue;
        const strong = part.startsWith('**') && part.endsWith('**');
        const body = strong ? part.slice(2, -2) : part;
        body.split(/(\s+)/).forEach((w, i) => {
            if (!w) return;
            if (/^\s+$/.test(w)) {
                spaced = true;
                return;
            }
            words.push({ w, strong, glued: !spaced && words.length > 0 });
            spaced = false;
        });
    }
    const groups = [];
    for (const word of words) {
        if (word.glued) groups.at(-1).push(word);
        else groups.push([word]);
    }
    const space = size * 0.27;
    const span = ({ w, strong }) => el('div', strong ? { color: STRONG, fontWeight: 600 } : { color }, w);
    return groups.map((g, i) => el('div', { marginRight: i < groups.length - 1 ? space : 0 }, g.map(span)));
}

/**
 * The trail after the mark, set the way the site's mono eyebrows are: capitals
 * 0.2em apart, one space between words and two either side of each dot. Each
 * word is its own element, since satori spaces a run of mono capitals unevenly.
 */
function eyebrow(parts) {
    const space = 28 * 0.6 + 5.6;
    const items = [];
    parts.filter(Boolean).forEach((part, p) => {
        if (p) items.push({ t: '\u00b7', gap: space * 2 });
        const words = String(part).toUpperCase().split(/\s+/).filter(Boolean);
        words.forEach((w, i) => items.push({ t: w, gap: i < words.length - 1 ? space : space * 2 }));
    });
    return el(
        'div',
        { alignItems: 'center', fontFamily: MONO, fontSize: 28, fontWeight: 500, letterSpacing: 5.6, color: MUTE, lineHeight: 1 },
        items.map((it, i) => el('div', { marginRight: i < items.length - 1 ? it.gap : 0 }, it.t))
    );
}

function lockup(card, art) {
    const markWidth = Math.round(MARK_HEIGHT * MARK_RATIO * 100) / 100;
    return el(
        'div',
        { alignItems: 'center', height: MARK_HEIGHT },
        img(art.mark, markWidth, MARK_HEIGHT, { marginRight: 18 }),
        eyebrow(card.eyebrow ?? ['pre.dev'])
    );
}

function titleBlock(card, size, balance) {
    const line = (text, color) =>
        el(
            'div',
            {
                width: card.avatar || card.portrait ? INNER - 170 : INNER,
                fontSize: size,
                fontWeight: 800,
                lineHeight: TITLE_LINE,
                letterSpacing: -0.03 * size,
                color,
                ...(balance ? { textWrap: 'balance' } : {})
            },
            text
        );
    return el('div', { flexDirection: 'column', marginTop: 30 }, line(card.title, INK), card.dim ? line(card.dim, DIM) : null);
}

function textBlock(text, size) {
    return el(
        'div',
        { flexWrap: 'wrap', marginTop: 24, maxWidth: 1040, fontSize: size, fontWeight: 500, lineHeight: TEXT_LINE, letterSpacing: -0.01 * size, color: SOFT },
        richText(text, size, SOFT)
    );
}

function listBlock(rows) {
    return el(
        'div',
        { flexDirection: 'column', marginTop: 24 },
        rows.map(([lead, text], i) =>
            el(
                'div',
                { alignItems: 'baseline', marginTop: i ? 12 : 0, fontSize: TEXT_SIZE, fontWeight: 500, color: SOFT, lineHeight: 1.3, whiteSpace: 'nowrap' },
                el('div', { fontFamily: MONO, fontSize: 28, color: MUTE, marginRight: 22 }, lead),
                el('div', {}, text)
            )
        )
    );
}

const band = { borderTop: `1px solid ${RULE}`, paddingTop: 30, width: INNER };

function stats(items) {
    const five = items.length >= 5;
    return el(
        'div',
        { ...band, ...(five ? { justifyContent: 'space-between' } : {}) },
        items.map(([value, label], i) =>
            el(
                'div',
                { flexDirection: 'column', marginLeft: !five && i ? 72 : 0 },
                el('div', { fontFamily: MONO, fontSize: 58, fontWeight: 700, color: INK, letterSpacing: -1.16, lineHeight: 1, whiteSpace: 'nowrap' }, value),
                el('div', { marginTop: 12, fontSize: 28, fontWeight: 500, color: MUTE, lineHeight: 1.3 }, label)
            )
        )
    );
}

function chips(items) {
    return el(
        'div',
        band,
        items.map((c, i) =>
            el(
                'div',
                { marginLeft: i ? 20 : 0, fontSize: 28, fontWeight: 500, color: LABEL, border: '1px solid rgba(255,255,255,0.16)', borderRadius: 999, padding: '12px 24px', whiteSpace: 'nowrap' },
                c
            )
        )
    );
}

function meta([left, right]) {
    return el(
        'div',
        { ...band, justifyContent: 'space-between', alignItems: 'baseline' },
        el('div', { fontSize: 28, fontWeight: 500, color: LABEL, whiteSpace: 'nowrap' }, left || ''),
        el('div', { fontFamily: MONO, fontSize: 28, fontWeight: 500, color: MUTE, whiteSpace: 'nowrap' }, right || '')
    );
}

/**
 * Two bars against a reference line, the /rl-tasks result: { ref: { label, pct },
 * rows: [{ label, value, pct, strong }] }. Shapes are one SVG; text is satori's.
 */
function bars({ ref, rows }) {
    const W = INNER;
    const H = 182;
    const x0 = 300;
    const scale = 460 / Math.max(ref?.pct ?? 0, ...rows.map(r => r.pct));
    const refX = ref ? Math.round(x0 + ref.pct * scale) : 0;
    const tops = [48, 128];
    let shapes = ref ? `<line x1="${refX}" y1="34" x2="${refX}" y2="176" stroke="#6e6e6e" stroke-dasharray="6 5"/>` : '';
    rows.forEach((r, i) => {
        shapes += `<rect x="${x0}" y="${tops[i]}" width="${Math.max(4, Math.round(r.pct * scale))}" height="40" fill="${r.strong ? '#fff' : 'rgba(255,255,255,0.26)'}"/>`;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${shapes}</svg>`;
    return el(
        'div',
        { borderTop: `1px solid ${RULE}`, paddingTop: 26, width: INNER },
        el(
            'div',
            { position: 'relative', width: W, height: H },
            img(svgDataUrl(svg), W, H, { position: 'absolute', top: 0, left: 0 }),
            ref
                ? el(
                      'div',
                      { position: 'absolute', top: -6, left: refX - 400, width: 800, justifyContent: 'center', fontFamily: MONO, fontSize: 28, fontWeight: 500, color: MUTE },
                      ref.label
                  )
                : null,
            rows.map((r, i) =>
                el(
                    'div',
                    { position: 'absolute', top: tops[i], left: 0, width: W, height: 40, alignItems: 'center', justifyContent: 'space-between' },
                    el('div', { fontSize: 30, fontWeight: 500, color: LABEL }, r.label),
                    el('div', { fontFamily: MONO, fontSize: 40, fontWeight: 700, color: r.strong ? INK : '#9e9e9e' }, r.value)
                )
            )
        )
    );
}

function footer(f) {
    if (!f) return null;
    if (f.stats) return stats(f.stats);
    if (f.chips) return chips(f.chips);
    if (f.meta) return meta(f.meta);
    if (f.bars) return bars(f.bars);
    return null;
}

function avatar(card, art) {
    const box = { position: 'absolute', top: PAD, right: PAD, width: 132, height: 132, borderRadius: 132 };
    if (art.portrait) return img(art.portrait, 132, 132, { ...box, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.16)' });
    if (!card.avatar) return null;
    return el(
        'div',
        { ...box, border: '1px solid rgba(255,255,255,0.16)', backgroundColor: '#1a1a1a', color: STRONG, alignItems: 'center', justifyContent: 'center', fontSize: 52, fontWeight: 600, letterSpacing: -1 },
        card.avatar
    );
}

/**
 * One card's tree. `art` holds data: URLs: `mark` (MARK_SVG), `sky` (skySvg()) and,
 * for an author, `portrait`. `fit` is what fitCard() chose; without it the card
 * is drawn at the design sizes.
 */
export function cardTree(card, art, fit = {}) {
    const titleSize = fit.titleSize ?? TITLE_SIZES[0];
    const text = fit.text ?? card.text;
    return el(
        'div',
        { position: 'relative', width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: '#000', fontFamily: SANS, color: INK, overflow: 'hidden' },
        img(art.sky, CARD_WIDTH, CARD_HEIGHT, { position: 'absolute', top: 0, left: 0 }),
        el(
            'div',
            { position: 'absolute', top: 0, left: 0, width: CARD_WIDTH, height: CARD_HEIGHT, padding: PAD, flexDirection: 'column' },
            lockup(card, art),
            titleBlock(card, titleSize, !!card.fit),
            text ? textBlock(text, fit.textSize ?? TEXT_SIZE) : null,
            card.list ? listBlock(fit.list ?? card.list) : null,
            el('div', { flexGrow: 1 }),
            footer(fit.footer ?? card.footer)
        ),
        avatar(card, art)
    );
}

// ------------------------------------------------------------------ fitting

/** How tall the footer band is, so the body knows its room. */
function footerHeight(f) {
    if (!f) return 0;
    if (f.stats) return 31 + 58 + 12 + 37;
    if (f.chips) return 31 + 60;
    if (f.meta) return 31 + 34;
    if (f.bars) return 27 + 182;
    return 0;
}

function sentences(text) {
    // A sentence ends at . ! or ? before a space, so "pre.dev" and "3.0" stay whole.
    return String(text)
        .split(/(?<=[.!?](?:\*\*)?)\s+/)
        .map(s => s.trim())
        .filter(Boolean);
}

/** Height satori gives `node` laid out `width` wide. */
async function heightOf(satori, fonts, node) {
    const svg = await satori(el('div', { width: INNER, flexDirection: 'column', fontFamily: SANS }, node), { width: INNER, fonts });
    return Number(svg.match(/height="([\d.]+)"/)?.[1] ?? 0);
}

async function widthOf(satori, fonts, node) {
    const svg = await satori(el('div', { flexDirection: 'row', fontFamily: SANS }, node), { height: 200, fonts });
    return Number(svg.match(/width="([\d.]+)"/)?.[1] ?? 0);
}

/**
 * Fits a card's text to the frame with satori's own measurements. The title
 * steps down from 64px until it takes two lines (three at 48px). The support
 * copy keeps as many whole sentences as fit in three lines (two under a
 * three-line title) at 31px; a single sentence too long for that goes to 28px,
 * then ends at a clause or a word with an ellipsis. A list row or meta line
 * that would run off the card is shortened the same way.
 */
export async function fitCard(card, satori, fonts) {
    const room = CARD_HEIGHT - PAD * 2 - MARK_HEIGHT - footerHeight(card.footer) - 8;
    let titleSize = TITLE_SIZES[0];
    let titleHeight = 0;
    let titleLines = 0;
    for (const size of TITLE_SIZES) {
        titleSize = size;
        titleHeight = await heightOf(satori, fonts, titleBlock(card, size, !!card.fit));
        titleLines = Math.round((titleHeight - 30) / (size * TITLE_LINE));
        if (titleLines <= (card.dim ? 1 : 0) + (size === TITLE_SIZES.at(-1) ? 3 : 2)) break;
    }
    const fit = { titleSize };
    if (card.text) {
        const maxLines = titleLines >= 3 ? 2 : 3;
        const left = room - titleHeight;
        const fits = async (text, size) => {
            const h = await heightOf(satori, fonts, textBlock(text, size));
            return h <= left && Math.round((h - 24) / (size * TEXT_LINE)) <= maxLines;
        };
        const parts = sentences(card.text);
        for (let n = parts.length; n > 0 && !fit.text; n--) if (await fits(parts.slice(0, n).join(' '), TEXT_SIZE)) fit.text = parts.slice(0, n).join(' ');
        fit.textSize = TEXT_SIZE;
        if (!fit.text && (await fits(parts[0], MIN_FONT))) {
            fit.text = parts[0];
            fit.textSize = MIN_FONT;
        }
        if (!fit.text) {
            // One sentence too long for the card: end it at the last clause that fits, else at a word.
            fit.textSize = MIN_FONT;
            const words = parts[0].split(' ');
            let cut = null;
            for (let n = words.length - 1; n > 3 && !cut; n--) {
                const head = words.slice(0, n).join(' ');
                if (/[,;:]$/.test(head) && (await fits(`${head.slice(0, -1)}\u2026`, MIN_FONT))) cut = `${head.slice(0, -1)}\u2026`;
            }
            for (let n = words.length - 1; n > 3 && !cut; n--) {
                const text = `${words.slice(0, n).join(' ').replace(/[,;:\u2013-]+$/, '')}\u2026`;
                if (await fits(text, MIN_FONT)) cut = text;
            }
            fit.text = cut ?? `${words.slice(0, 4).join(' ')}\u2026`;
        }
    }
    const shorten = async (text, width, style) => {
        let t = text;
        while (t.includes(' ') && (await widthOf(satori, fonts, el('div', style, t))) > width) t = `${t.slice(0, t.lastIndexOf(' ')).replace(/[\u2026,;:]+$/, '')}\u2026`;
        return t;
    };
    if (card.list) {
        fit.list = [];
        for (const [lead, text] of card.list) fit.list.push([lead, await shorten(text, INNER - (28 * 0.6 * [...lead].length + 22), { fontSize: TEXT_SIZE, fontWeight: 500 })]);
    }
    if (card.footer?.meta) {
        // The address on the right stays whole; the line on the left gives way to it when both don't fit.
        const [l, r] = card.footer.meta;
        const right = r ? await widthOf(satori, fonts, el('div', { fontFamily: MONO, fontSize: 28, fontWeight: 500 }, r)) : 0;
        const fitsLeft = l && (await widthOf(satori, fonts, el('div', { fontSize: 28, fontWeight: 500 }, l))) <= INNER - right - 40;
        fit.footer = { meta: [fitsLeft ? l : '', r] };
    }
    return fit;
}

// ------------------------------------------------------------------ checks

/** Every problem with a tree: any text under MIN_FONT. Empty when the card is fine. */
export function checkCard(tree) {
    const errors = [];
    const walk = (node, size) => {
        if (!node || typeof node !== 'object') return;
        const s = node.props?.style?.fontSize ?? size;
        const kids = node.props?.children;
        const list = Array.isArray(kids) ? kids : [kids];
        if (list.some(k => typeof k === 'string' && k.trim()) && s < MIN_FONT) errors.push(`"${list.filter(k => typeof k === 'string').join(' ').slice(0, 40)}" is ${s}px (min ${MIN_FONT}px)`);
        for (const k of list) walk(k, s);
    };
    walk(tree, 16);
    return errors;
}

/** The card's alt text: its headline, its support line, then what the footer shows. At most 420 characters (X's limit). */
export function cardAlt(card) {
    const sentence = t => (/[.!?,:]$/.test(t) ? t : `${t}.`);
    const f = card.footer ?? {};
    const parts = [sentence([card.title, card.dim].filter(Boolean).join(' ')), plainText(card.text ?? '')];
    if (card.list) parts.push(sentence(`Latest: ${card.list.map(([, t]) => t).join('; ')}`));
    if (f.stats) parts.push(sentence(f.stats.map(([v, l]) => `${v} ${l}`).join(', ')));
    if (f.bars) parts.push(sentence(f.bars.rows.map(r => `${r.label} ${r.value}`).join(', ')));
    if (f.chips) parts.push(sentence(f.chips.join(', ')));
    let alt = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    if (alt.length > 420) alt = `${alt.slice(0, 419).replace(/\s+\S*$/, '')}\u2026`;
    return alt;
}
