// Source for every diagram in images/diagrams. Each entry returns its height,
// title, description, and body; build.mjs renders one light and one dark file.
// Layouts are 540 units wide and stacked so that text stays legible at a 390px
// viewport. A page that shows a diagram states the same facts in its text.
import { W, PAD, rect, text, runs, line, arrow, circle, badge, eyebrow } from './lib.mjs';

const RIGHT = W - PAD;

// A block of body lines; each line is a string or a runs() part list.
function lines(x, y, list, o = {}) {
  const step = o.step || 20;
  return list.map((l, i) => (Array.isArray(l)
    ? runs(x, y + i * step, l, { size: o.size || 15, cls: o.cls || 't2' })
    : text(x, y + i * step, l, { size: o.size || 15, cls: o.cls || 't2' }))).join('\n');
}

// A numbered vertical step list with optional group labels. Returns markup,
// the next free y, and each badge center (for loops drawn by the caller).
function stepList(groups, { railX = 42, textX = 70, startY = PAD + 14 } = {}) {
  const out = [];
  const centers = [];
  let y = startY;
  let n = 0;
  groups.forEach((g, gi) => {
    if (g.label) {
      out.push(eyebrow(textX, y, g.label));
      y += 24;
    }
    g.steps.forEach(s => {
      n += 1;
      const size = s.size || 15;
      const step = s.step || 20;
      const bodyH = s.d.length * step;
      const tx = s.accent ? textX + 14 : textX;
      if (s.accent) out.push(rect(textX, y - 14, RIGHT - textX, 46 + bodyH, 'na', 10));
      centers.push(y + 12);
      out.push(badge(railX, y + 12, n, !!s.accent));
      out.push(text(tx, y + 18, s.t, { size: 17, bold: true }));
      s.d.forEach((l, i) => {
        const ly = y + 42 + i * step;
        const bullet = s.bullets && s.bullets.includes(i);
        const indent = s.bullets ? 14 : 0;
        if (bullet) out.push(circle(tx + 3, ly - 5, 2.5, 'fa'));
        out.push(Array.isArray(l)
          ? runs(tx + indent, ly, l, { size, cls: 't2' })
          : text(tx + indent, ly, l, { size, cls: 't2' }));
      });
      y += s.accent ? 54 + bodyH : 44 + bodyH;
    });
    if (gi < groups.length - 1) y += 22;
  });
  out.unshift(line(railX, centers[0], railX, centers[centers.length - 1], 'rule', 2));
  return { markup: out.join('\n'), y, centers };
}

// ---------------------------------------------------------------------------
// Home: products, the ways in, and what each returns.
function productMap() {
  const cols = [['Web', 202], ['CLI', 248], ['API', 294], ['MCP', 340]];
  const rows = [
    { name: 'Coding Agent', sub: 'plans, builds, verifies', via: ['Web', 'CLI'], out: ['Pull requests,', 'published apps'] },
    { name: 'Architect', sub: 'fast or deep specs', via: ['API', 'MCP'], out: ['Markdown and', 'JSON specs'] },
    { name: 'Browser Agents', sub: 'tasks on live websites', via: ['API', 'MCP'], out: ['Results and an', 'event timeline'] },
    { name: 'AI Gateway', sub: 'hundreds of models', via: ['API'], out: ['Model responses,', 'OpenAI-compatible'] },
    { name: 'Payments, sign-in', sub: 'built into your apps', via: ['Web'], out: ['Checkout, payouts,', 'user accounts'] },
  ];
  const outX = 374, top = 88, rowH = 66;
  const bottom = top + rows.length * rowH;
  const b = [];
  b.push(eyebrow(PAD, 34, 'Product'));
  b.push(eyebrow((cols[0][1] + cols[3][1]) / 2, 34, 'Ways in', { anchor: 'middle' }));
  b.push(eyebrow(outX, 34, 'You get'));
  for (const [label, cx] of cols) {
    b.push(line(cx, 70, cx, bottom - 10, 'rule', 1.5));
    b.push(rect(cx - 20, 48, 40, 24, 'soft', 12));
    b.push(text(cx, 64.5, label, { size: 13, bold: true, anchor: 'middle', cls: 't2' }));
  }
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    if (i) b.push(line(PAD, y, RIGHT, y, 'rule', 1));
    b.push(text(PAD, y + 29, r.name, { size: 17, bold: true }));
    b.push(text(PAD, y + 49, r.sub, { size: 14, cls: 't3' }));
    for (const [label, cx] of cols) if (r.via.includes(label)) b.push(circle(cx, y + 33, 6.5, 'fa'));
    b.push(text(outX, y + 29, r.out[0], { size: 15, cls: 't1' }));
    b.push(text(outX, y + 49, r.out[1], { size: 15, cls: 't2' }));
  });
  b.push(line(PAD, bottom, RIGHT, bottom, 'rule', 1));
  b.push(text(PAD, bottom + 28, 'API: REST at api.pre.dev and the Node and Python SDKs.', { size: 14, cls: 't3' }));
  b.push(text(PAD, bottom + 48, 'One pre.dev account works across every product.', { size: 14, cls: 't3' }));
  return {
    h: bottom + 68,
    title: 'pre.dev products',
    desc: 'Five products and how to reach them. Coding Agent: web and CLI; returns pull requests and published apps. Architect: API and MCP; returns Markdown and JSON specs. Browser Agents: API and MCP; returns results and an event timeline. AI Gateway: API; returns OpenAI-compatible model responses. Payments and sign-in: built into apps made in the web workspace; provides Checkout, payouts, and user accounts.',
    body: b.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Coding Agent overview: one change from request to shipped.
function lifeOfAChange() {
  const steps = [
    { agent: false, title: 'Describe the change', body: ['In the web workspace or the CLI: the behavior', 'you want, the context, and the constraints.'] },
    { agent: true, title: 'The agent picks an approach', body: ['It answers, edits the code directly, or plans', 'first, with a plan you can review.'] },
    { agent: true, title: 'It builds on the session branch', body: ['Every session has its own branch. Sprints set', 'the scope of the work; effort sets its depth.'] },
    { agent: true, title: 'It verifies the work', body: ['An independent judge scores each acceptance criterion', 'from the recorded run, then unproven work is fixed.'] },
    { agent: false, title: 'You review and ship', body: ['Read the diff, the checks, and the preview. Merge', 'through a GitHub pull request, or publish the app.'] },
  ];
  const railX = 42, textX = 70, top = 40, gap = 86;
  const cy = i => top + i * gap;
  const b = [];
  b.push(line(railX, cy(0), railX, cy(steps.length - 1), 'rule', 2));
  b.push(arrow([[railX - 12, cy(3)], [18, cy(3)], [18, cy(2)], [railX - 13, cy(2)]], { accent: true }));
  steps.forEach((s, i) => {
    const y = cy(i);
    b.push(badge(railX, y, i + 1, s.agent));
    b.push(text(textX, y + 6, s.title, { size: 17, bold: true }));
    b.push(lines(textX, y + 29, s.body));
  });
  const ly = cy(steps.length - 1) + 102;
  b.push(line(PAD, ly - 26, RIGHT, ly - 26, 'rule', 1));
  b.push(circle(PAD + 7, ly - 5, 7, 'n'));
  b.push(text(PAD + 22, ly, 'You', { size: 14, cls: 't2' }));
  b.push(circle(PAD + 72, ly - 5, 7, 'fa'));
  b.push(text(PAD + 87, ly, 'The agent', { size: 14, cls: 't2' }));
  b.push(arrow([[PAD + 175, ly - 5], [PAD + 205, ly - 5]], { accent: true }));
  b.push(text(PAD + 213, ly, 'Unproven criteria go back to the build', { size: 14, cls: 't2' }));
  return {
    h: ly + 24,
    title: 'Life of a change',
    desc: 'Five steps. You describe the change in the web workspace or CLI. The agent picks an approach: answer, edit directly, or plan first. It builds on the session branch. An independent judge scores each acceptance criterion from the recorded run, and unproven work is fixed and resubmitted. You review the diff, checks, and preview, then merge through a GitHub pull request or publish the app.',
    body: b.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// API overview: the shared async pattern for specs, browser runs and video jobs.
function asyncJobs() {
  const labelX = 66, valX = 150;
  const blocks = [
    {
      title: 'Submit the job',
      rows: [
        ['Specs', [['POST /fast-spec', { mono: true, cls: 't1' }], [' or ', {}], ['/deep-spec', { mono: true, cls: 't1' }]], 'async: true'],
        ['Browser', [['POST /browser-agent', { mono: true, cls: 't1' }]], 'async: true'],
        ['Video', [['POST /v1/videos', { mono: true, cls: 't1' }]], null],
      ],
    },
    {
      title: 'Save the ID it returns',
      rows: [
        ['Specs', [['specId', { mono: true, cls: 't1' }]], 'status: pending'],
        ['Browser', [['id', { mono: true, cls: 't1' }]], 'status: processing'],
        ['Video', [['id', { mono: true, cls: 't1' }]], null],
      ],
    },
    {
      title: 'Poll it, or stream it',
      rows: [
        ['Specs', [['GET /spec-status/{specId}', { mono: true, cls: 't1' }]], null],
        ['Browser', [['GET /browser-agent/{id}', { mono: true, cls: 't1' }]], 'or /{id}/stream'],
        ['Video', [['GET /v1/videos/{jobId}', { mono: true, cls: 't1' }]], null],
      ],
    },
    {
      title: 'Stop at a terminal status, then read',
      rows: [
        ['Specs', [['completed', { mono: true, cls: 't1' }], [' → Markdown, JSON, graphs', {}]], null],
        ['Browser', [['completed', { mono: true, cls: 't1' }], [' → each task’s ', {}], ['status', { mono: true, cls: 't1' }]], null],
        ['Video', [['completed', { mono: true, cls: 't1' }], [' → ', {}], ['GET …/{jobId}/content', { mono: true, cls: 't1' }]], null],
      ],
      foot: [['failed', { mono: true, cls: 't1' }], [' also ends the job.', {}]],
    },
  ];
  const b = [];
  let y = PAD;
  blocks.forEach((blk, i) => {
    const h = 124 + (blk.foot ? 26 : 0);
    b.push(rect(PAD, y, W - 2 * PAD, h, i === blocks.length - 1 ? 'na' : 'n', 10));
    b.push(badge(44, y + 26, i + 1, i === blocks.length - 1));
    b.push(text(labelX, y + 32, blk.title, { size: 17, bold: true }));
    blk.rows.forEach(([label, parts, tag], j) => {
      const ry = y + 62 + j * 24;
      b.push(text(labelX, ry, label, { size: 14, cls: 't3' }));
      b.push(runs(valX, ry, parts, { size: 14, cls: 't2' }));
      if (tag) b.push(text(RIGHT - 14, ry, tag, { size: 13, mono: true, cls: 't3', anchor: 'end' }));
    });
    if (blk.foot) b.push(runs(labelX, y + 62 + 3 * 24 + 6, blk.foot, { size: 14, cls: 't2' }));
    y += h;
    if (i < blocks.length - 1) {
      b.push(arrow([[W / 2, y + 2], [W / 2, y + 24]]));
      y += 26;
    }
  });
  return {
    h: y + PAD,
    title: 'Async jobs on the pre.dev API',
    desc: 'Specs, browser runs, and video jobs follow one pattern. Submit the job: POST /fast-spec or /deep-spec with async true, POST /browser-agent with async true, or POST /v1/videos. Save the ID it returns: specId, or id. Poll it or stream it: GET /spec-status/{specId}, GET /browser-agent/{id} or its /stream, GET /v1/videos/{jobId}. Stop at a terminal status: completed specs carry Markdown, JSON, and graphs; a completed browser run carries each task status; a completed video downloads from /content. A failed status also ends the job.',
    body: b.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Browser task status: the states a task moves through and what each costs.
function browserTaskStates() {
  const b = [];
  const cx = W / 2;
  const row = (y, h, name, sub, cost, cls = 'n') => {
    b.push(rect(PAD, y, W - 2 * PAD, h, cls, 10));
    b.push(text(PAD + 16, y + 28, name, { size: 16, bold: true, mono: name !== 'Submit' }));
    b.push(text(PAD + 16, y + 50, sub, { size: 14, cls: 't3' }));
    b.push(text(RIGHT - 16, y + 28, cost, { size: 15, bold: true, cls: 'ta', anchor: 'end' }));
  };
  b.push(eyebrow(PAD, 32, 'State'));
  b.push(eyebrow(RIGHT, 32, 'Charge', { anchor: 'end' }));
  let y = 44;
  row(y, 88, 'Submit', 'POST /browser-agent checks, charges, and queues', '0.1 credits per task');
  b.push(text(PAD + 16, y + 72, 'Refunded only if the submission fails before queueing.', { size: 14, cls: 't3' }));
  y += 88;
  b.push(arrow([[cx, y + 2], [cx, y + 22]])); y += 24;
  row(y, 64, 'PENDING', 'waiting to run', 'nothing more');
  y += 64;
  b.push(arrow([[cx, y + 2], [cx, y + 22]])); y += 24;
  row(y, 64, 'RUNNING', 'executing; a retry adds no charge', 'nothing more');
  y += 64;
  // Split into the two terminal outcomes.
  const lx = PAD, lw = 186, rx = PAD + lw + 14, rw = W - PAD - rx;
  b.push(arrow([[cx, y + 2], [cx, y + 14], [lx + lw / 2, y + 14], [lx + lw / 2, y + 34]]));
  b.push(arrow([[cx, y + 14], [rx + rw / 2, y + 14], [rx + rw / 2, y + 34]]));
  y += 36;
  const th = 150;
  b.push(rect(lx, y, lw, th, 'na', 10));
  b.push(text(lx + 14, y + 28, 'SUCCESS', { size: 16, bold: true, mono: true }));
  b.push(lines(lx + 14, y + 52, ['Metered by the work', 'the task did'], { size: 14, cls: 't2' }));
  b.push(text(lx + 14, y + 104, '0.1 credits', { size: 15, bold: true, cls: 'ta' }));
  b.push(text(lx + 14, y + 124, 'or more', { size: 15, bold: true, cls: 'ta' }));
  b.push(rect(rx, y, rw, th, 'n', 10));
  b.push(text(rx + 14, y + 28, 'Unsuccessful', { size: 16, bold: true }));
  const codes = [['BLOCKED', 'CAPTCHA_FAILED'], ['TIMEOUT', 'LOOP'], ['NO_TARGET', 'ERROR']];
  codes.forEach(([a, c], i) => {
    b.push(text(rx + 14, y + 54 + i * 21, a, { size: 13, mono: true, cls: 't2' }));
    b.push(text(rx + 116, y + 54 + i * 21, c, { size: 13, mono: true, cls: 't2' }));
  });
  b.push(text(rx + 14, y + 124, '0.1 credits, nothing more', { size: 15, bold: true, cls: 'ta' }));
  y += th;
  b.push(text(PAD, y + 30, 'A completed run can still contain unsuccessful', { size: 14, cls: 't3' }));
  b.push(text(PAD, y + 50, 'tasks, so read each task’s status.', { size: 14, cls: 't3' }));
  return {
    h: y + 70,
    title: 'Browser task states and charges',
    desc: 'Submitting a browser run charges 0.1 credits per task, refunded only if the submission fails before queueing. A task moves from PENDING to RUNNING with no further charge; a retry adds no charge. A SUCCESS is metered by the work the task did, at 0.1 credits or more. An unsuccessful task (BLOCKED, CAPTCHA_FAILED, TIMEOUT, LOOP, NO_TARGET, or ERROR) costs 0.1 credits and nothing more.',
    body: b.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// AI Gateway: what happens to one call, as the gateway works today.
function gatewayRouting() {
  const b = [];
  const cx = W / 2;
  let y = PAD;
  // Caller.
  b.push(rect(PAD, y, W - 2 * PAD, 96, 'n', 10));
  b.push(text(PAD + 16, y + 28, 'Your code', { size: 17, bold: true }));
  b.push(text(PAD + 16, y + 50, 'An OpenAI or Anthropic SDK, or plain HTTP', { size: 14, cls: 't3' }));
  b.push(runs(PAD + 16, y + 76, [['base URL ', { cls: 't3' }], ['https://api.pre.dev/v1', { mono: true, cls: 't1' }]], { size: 14 }));
  y += 96;
  b.push(arrow([[cx, y + 2], [cx, y + 24]])); y += 26;
  // Gateway steps.
  const steps = [
    { t: 'Authenticate', d: [[['Your pre.dev key, sent as ', {}], ['Bearer', { mono: true, cls: 't1' }], [' or ', {}], ['x-api-key', { mono: true, cls: 't1' }], [',', {}]], 'identifies the workspace.'], stop: '401' },
    { t: 'Admit', d: ['Enough credits for the call, and under the', 'workspace rate limit. Nothing runs otherwise.'], stop: '402, 429' },
    { t: 'Route', d: [[['The ', {}], ['model', { mono: true, cls: 't1' }], [' you named, or your ', {}], ['models', { mono: true, cls: 't1' }], [' list in', {}]], 'order. pre.dev chooses how to serve it.'] },
    { t: 'Charge', d: ['Credits for the call’s metered cost, once', 'the response or stream finishes.'] },
  ];
  const boxTop = y;
  const stepH = 86;
  const boxH = 44 + steps.length * stepH;
  b.push(rect(PAD, boxTop, W - 2 * PAD, boxH, 'na', 12));
  b.push(eyebrow(PAD + 16, boxTop + 28, 'pre.dev AI Gateway', { cls: 'ta' }));
  steps.forEach((s, i) => {
    const sy = boxTop + 44 + i * stepH;
    if (i) b.push(line(PAD + 16, sy - 4, RIGHT - 16, sy - 4, 'rule', 1));
    b.push(badge(PAD + 30, sy + 24, i + 1, true));
    b.push(text(PAD + 54, sy + 30, s.t, { size: 16, bold: true }));
    b.push(lines(PAD + 54, sy + 52, s.d, { size: 14, step: 19 }));
    if (s.stop) b.push(text(RIGHT - 16, sy + 30, `refused: ${s.stop}`, { size: 13, mono: true, cls: 't3', anchor: 'end' }));
  });
  y = boxTop + boxH;
  b.push(arrow([[cx, y + 2], [cx, y + 24]])); y += 26;
  // Response.
  b.push(rect(PAD, y, W - 2 * PAD, 156, 'n', 10));
  b.push(text(PAD + 16, y + 28, 'The response', { size: 17, bold: true }));
  b.push(text(PAD + 16, y + 50, 'The standard response shape, streamed if you asked.', { size: 14, cls: 't3' }));
  b.push(runs(PAD + 16, y + 78, [['Every response: ', { cls: 't3' }], ['x-predev-request-id', { mono: true, cls: 't1', size: 13 }]], { size: 14 }));
  b.push(text(PAD + 16, y + 104, 'Non-streamed responses also carry:', { size: 14, cls: 't3' }));
  ['x-predev-credits-charged', 'x-predev-credits-remaining'].forEach((h, i) => {
    b.push(text(PAD + 16, y + 124 + i * 18, h, { size: 13, mono: true, cls: 't1' }));
  });
  y += 156;
  return {
    h: y + PAD,
    title: 'How the AI Gateway handles a call',
    desc: 'Your code calls https://api.pre.dev/v1 with an OpenAI or Anthropic SDK or plain HTTP. The gateway authenticates your pre.dev key from Bearer or x-api-key (refused with 401 otherwise), admits the call only with enough credits and under the workspace rate limit (402 or 429 otherwise), routes to the model you named or your models list in order, with pre.dev choosing how to serve it, and charges credits for the metered cost when the response or stream finishes. The response keeps the standard shape and carries an x-predev-request-id header; non-streamed responses also carry x-predev-credits-charged and x-predev-credits-remaining.',
    body: b.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Payments overview: money and events for one Checkout.
function moneyFlow() {
  const b = [];
  const cx = W / 2;
  let y = PAD;
  b.push(rect(PAD, y, W - 2 * PAD, 90, 'n', 10));
  b.push(badge(44, y + 26, 1, false));
  b.push(text(66, y + 32, 'Your app starts Checkout', { size: 17, bold: true }));
  b.push(lines(66, y + 55, ['Its server calls Stripe with the Stripe SDK through', 'api.pre.dev, on your workspace’s Stripe account.'], { size: 14, step: 19 }));
  y += 90;
  b.push(arrow([[cx, y + 2], [cx, y + 24]])); y += 26;
  b.push(rect(PAD, y, W - 2 * PAD, 64, 'na', 10));
  b.push(badge(44, y + 26, 2, true));
  b.push(text(66, y + 32, 'The customer pays', { size: 17, bold: true }));
  b.push(text(66, y + 53, 'on Stripe’s hosted Checkout page.', { size: 14, cls: 't2' }));
  y += 64;
  // Split: money (left) and the event (right).
  const lw = 243, lx = PAD, rx = W - PAD - lw;
  const lc = lx + lw / 2, rc = rx + lw / 2;
  b.push(arrow([[cx, y + 2], [cx, y + 14], [lc, y + 14], [lc, y + 58]]));
  b.push(arrow([[cx, y + 14], [rc, y + 14], [rc, y + 58]]));
  b.push(eyebrow(lx + 2, y + 42, 'Money'));
  b.push(eyebrow(rx + lw - 2, y + 42, 'Event', { anchor: 'end' }));
  y += 60;
  const col = (x, top, h, n, title, body) => {
    b.push(rect(x, top, lw, h, 'n', 10));
    b.push(badge(x + 24, top + 26, n, false));
    b.push(text(x + 44, top + 32, title, { size: 16, bold: true }));
    b.push(lines(x + 14, top + 58, body, { size: 14, step: 19 }));
  };
  const h1 = 124;
  col(lx, y, h1, 3, 'Stripe settles', ['The payment lands in your', 'Stripe balance, minus', 'Stripe’s processing fee and', 'any pre.dev platform fee.']);
  col(rx, y, h1, 3, 'pre.dev relays it', ['The Stripe event goes to', 'your app’s server:', [['POST /api/stripe/webhook', { mono: true, cls: 't1', size: 13.5 }]]]);
  y += h1;
  b.push(arrow([[lc, y + 2], [lc, y + 24]]));
  b.push(arrow([[rc, y + 2], [rc, y + 24]]));
  y += 26;
  const h2 = 124;
  col(lx, y, h2, 4, 'Stripe pays out', ['to your bank account, on', 'your Stripe payout schedule.', 'The Stripe account is yours.']);
  col(rx, y, h2, 4, 'Your handler runs', ['It verifies the signature', [['with ', {}], ['STRIPE_WEBHOOK_SECRET', { mono: true, cls: 't1', size: 13.5 }]], 'and marks the order paid.']);
  y += h2;
  b.push(text(PAD, y + 30, 'In test mode Checkout takes Stripe test cards: no money', { size: 14, cls: 't3' }));
  b.push(text(PAD, y + 50, 'moves and no fees are charged.', { size: 14, cls: 't3' }));
  return {
    h: y + 70,
    title: 'How money and events move in pre.dev Payments',
    desc: 'Your app server starts Checkout through api.pre.dev with the Stripe SDK, on your workspace Stripe account. The customer pays on Stripe hosted Checkout. The money settles in your Stripe balance minus Stripe processing fees and any pre.dev platform fee, then Stripe pays out to your bank on your payout schedule. In parallel, pre.dev relays the Stripe event to POST /api/stripe/webhook on your app server, where your handler verifies it with STRIPE_WEBHOOK_SECRET and marks the order paid. In test mode no money moves and no fees are charged.',
    body: b.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Labs, RL Tasks: how one task is made.
function rlTaskPipeline() {
  const { markup, y, centers } = stepList([
    { label: 'Build the task', steps: [
      { t: 'A licensed repository', d: ['Private production code with its git history,', 'cleaned of secrets and personal data first.', 'It has passed the exposure check.'] },
      { t: 'One real commit, one task', d: ['Mechanical changes are dropped. Small neighboring', 'commits in one module can be combined.'] },
      { t: 'The before-state, rebuilt', d: ['A Harbor task container at the parent commit.', 'Grading runs offline; the commit message is withheld.'] },
      { t: 'A graded verifier', d: ['Checks run the code instead of scanning it. Fakes', 'are used only at external service boundaries.'] },
    ] },
    { label: 'Prove it, then ship it', steps: [
      { t: 'QC checks', accent: true, size: 14, step: 20, bullets: [0, 1, 2, 3, 5, 6], d: [
        'Reference solution: 0.95 or more, in a cold container',
        'Doing nothing: 0.1 or less, with no scored check passing',
        'Checks audited for fairness against the instruction',
        'Renamed internals keep the score; removing a',
        'specified behavior lowers it',
        'Cheat probes: 0.1 or less',
        'Solver scores vary, and checks order by difficulty',
      ] },
      { t: 'Calibration', d: ['Solver runs set the band: 0.1 to 0.8 is deliverable.', 'Easier and harder tasks go to separate tiers.'] },
      { t: 'Export', d: ['One bundle per task, shipped as a .tar.gz', 'with its SHA-256 checksum.'] },
    ] },
  ]);
  const b = [markup];
  // Repair loop: a failed QC check goes back to the verifier.
  b.push(arrow([[30, centers[4]], [18, centers[4]], [18, centers[3]], [29, centers[3]]], { accent: true, dash: '4 3' }));
  b.push(line(PAD, y - 6, RIGHT, y - 6, 'rule', 1));
  b.push(text(PAD, y + 20, 'A task that fails a check goes back for repair, or does not ship.', { size: 14, cls: 't3' }));
  return {
    h: y + 42,
    title: 'How an RL task is made',
    desc: 'Seven steps. A licensed private repository with its git history, cleaned of secrets and personal data, that passed the exposure check. One real commit becomes one task. The before-state is rebuilt as a Harbor task container; grading runs offline and the commit message is withheld. A graded verifier runs the code. QC checks: the reference solution scores 0.95 or more in a cold container, doing nothing scores 0.1 or less with no scored check passing, checks are audited for fairness, renamed internals keep the score while removing a specified behavior lowers it, cheat probes score 0.1 or less, and solver scores vary with checks ordered by difficulty. Calibration by solver runs: 0.1 to 0.8 is deliverable. Export as a .tar.gz with its SHA-256. A task that fails a check goes back for repair or does not ship.',
    body: b.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Labs, RL Tasks: how a run is scored and where a task must land.
function rewardBands() {
  const b = [];
  let y = PAD + 14;
  b.push(eyebrow(PAD, y, 'How a run is scored'));
  y += 16;
  b.push(rect(PAD, y, W - 2 * PAD, 58, 'soft', 10));
  b.push(runs(W / 2, y + 36, [['reward = ', { cls: 't3' }], ['weighted checks passed', { cls: 't1', bold: true }], [' ÷ ', { cls: 't3' }], ['weighted total', { cls: 't1', bold: true }]], { size: 16, anchor: 'middle' }));
  y += 58 + 14;
  const weights = [
    ['×4', 'behavioral, integration, end-to-end, runtime', true],
    ['×1', 'core and all other checks', false],
    ['×0', 'setup, install, typecheck, build, lint', false],
  ];
  weights.forEach(([wt, what, strong], i) => {
    const ry = y + i * 34;
    b.push(rect(PAD, ry, 46, 26, strong ? 'na' : 'n', 13));
    b.push(text(PAD + 23, ry + 18, wt, { size: 14, bold: true, anchor: 'middle', cls: strong ? 'ta' : 't2' }));
    b.push(text(PAD + 60, ry + 18, what, { size: 15, cls: 't2' }));
  });
  y += 3 * 34 + 8;
  const rules = [
    ['A failed core check scales the score by the share', 'of core checks passed.'],
    ['A synthesized check layer, when present, is a', 'fixed 50% of the reward.'],
    ['A run scores 0 if its results file is missing, test', 'tooling was altered, tracked files are left modified,', 'or a grading pass runs past the time cap.'],
  ];
  y += 10;
  for (const r of rules) {
    b.push(circle(PAD + 3, y - 5, 2.5, 'fa'));
    b.push(lines(PAD + 14, y, r, { size: 14, cls: 't2', step: 19 }));
    y += r.length * 19 + 7;
  }
  y += 8;
  b.push(line(PAD, y, RIGHT, y, 'rule', 1));
  y += 34;
  b.push(eyebrow(PAD, y, 'Where a task must land'));
  y += 24;
  // Scale.
  const x0 = 34, x1 = W - 34;
  const X = v => x0 + (x1 - x0) * v;
  // Gate pins above the scale.
  const pinTop = y + 16;
  const barY = pinTop + 58, barH = 30;
  b.push(line(X(0.1), pinTop + 8, X(0.1), barY - 2, 'ln', 1.5));
  b.push(circle(X(0.1), pinTop + 6, 4.5, 'fa'));
  b.push(text(X(0.1) + 10, pinTop + 11, 'doing nothing: 0.1 or less', { size: 14, cls: 't1' }));
  b.push(line(X(0.95), pinTop + 36, X(0.95), barY - 2, 'ln', 1.5));
  b.push(circle(X(0.95), pinTop + 34, 4.5, 'fa'));
  b.push(text(X(0.95) - 10, pinTop + 39, 'reference: 0.95 or more', { size: 14, cls: 't1', anchor: 'end' }));
  // Bands.
  b.push(rect(X(0), barY, X(0.1) - X(0) - 2, barH, 'soft', 6));
  b.push(rect(X(0.1), barY, X(0.8) - X(0.1), barH, 'fa', 6));
  b.push(rect(X(0.8) + 2, barY, X(1) - X(0.8) - 2, barH, 'soft', 6));
  b.push(text((X(0.1) + X(0.8)) / 2, barY + 20, 'deliverable: 0.1 to 0.8', { size: 15, bold: true, cls: 'ton', anchor: 'middle' }));
  b.push(text((X(0.8) + X(1)) / 2 + 1, barY + 20, 'too easy', { size: 14, cls: 't2', anchor: 'middle' }));
  // Ticks.
  const ty = barY + barH + 8;
  for (const v of [0, 0.1, 0.5, 0.8, 1]) {
    b.push(line(X(v), ty, X(v), ty + 6, 'ln', 1));
    b.push(text(X(v), ty + 22, String(v), { size: 13, mono: true, cls: 't3', anchor: 'middle' }));
  }
  b.push(text(X(0.05), ty + 44, 'too hard', { size: 14, cls: 't2', anchor: 'start' }));
  b.push(line(X(0.05), ty + 30, X(0.05), barY + barH + 2, 'ln', 1));
  y = ty + 44;
  const notes = [
    'Solver runs set the band. A task under 0.1 gets one',
    'de-scope round, then goes to a separate hard tier; one',
    'over 0.8 goes to a separate easy tier.',
  ];
  b.push(lines(PAD, y + 34, notes, { size: 14, cls: 't3', step: 19 }));
  y += 34 + 2 * 19;
  return {
    h: y + 30,
    title: 'RL task reward and difficulty bands',
    desc: 'Reward is weighted checks passed divided by weighted total. Behavioral, integration, end-to-end, and runtime checks weigh 4; core and other checks weigh 1; setup, install, typecheck, build, and lint weigh 0. A failed core check scales the score by the share of core checks passed; a synthesized layer, when present, is a fixed 50% of the reward. On a 0 to 1 scale, doing nothing must score 0.1 or less and the reference solution 0.95 or more. Solver scores from 0.1 to 0.8 are deliverable; under 0.1 is too hard and over 0.8 is too easy, each going to a separate tier.',
    body: b.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Labs, Codebases: from the team that built it to a lab's download.
function codebaseFlow() {
  const { markup, y } = stepList([
    { label: 'License', steps: [
      { t: 'Licensed from the team that built it', d: ['A signed agreement lets pre.dev sublicense', 'the code to labs, non-exclusively by default.'] },
      { t: 'Exposure check', d: ['Refused if public on its host, captured publicly', 'by the Internet Archive, a fork of an outside', 'project, or a published npm or PyPI package.'] },
    ] },
    { label: 'Clean', steps: [
      { t: 'Pull requests captured', d: ['Titles, descriptions, reviews, inline comments,', 'and discussion, from the host.'] },
      { t: 'History rewritten', accent: true, d: ['Three secret scanners read every file version.', 'Emails, phone numbers, and profile URLs are', 'replaced; authors become Contributor N; the', 'origin organization name is rewritten; binaries,', 'archives, vendored code, and build output go.', 'A byte-level check refuses any leftover secret.'] },
    ] },
    { label: 'Package and deliver', steps: [
      { t: 'Measured', d: ['Source and history tokens, languages, tests,', 'and a quality grade.'] },
      { t: 'Zipped and checked', d: ['Every branch and tag, the pull request record,', 'and a README. Refs, git fsck, and the record are', 'verified; the zip is scanned again for personal data.'] },
      { t: 'Delivered', d: ['A catalog row under an ID instead of a name, and', 'a download link that expires after seven days.'] },
    ] },
  ]);
  return {
    h: y + 4,
    title: 'How a codebase is licensed, cleaned, and delivered',
    desc: 'Seven steps. The codebase is licensed from the team that built it under a signed agreement that allows non-exclusive sublicensing to labs. An exposure check refuses public, archived, forked, or published code. Pull requests are captured from the host. The history is rewritten: three secret scanners over every file version; emails, phone numbers, and profile URLs replaced; authors pseudonymized; the origin organization name rewritten; binaries, archives, vendored code, and build output removed; a byte-level check refuses leftovers. The repository is measured, zipped with every branch and tag, the pull request record, and a README, verified and rescanned, and delivered as a catalog row under an ID with a download link that expires after seven days.',
    body: markup,
  };
}

export default {
  'product-map': productMap,
  'life-of-a-change': lifeOfAChange,
  'async-jobs': asyncJobs,
  'browser-task-states': browserTaskStates,
  'gateway-routing': gatewayRouting,
  'money-flow': moneyFlow,
  'rl-task-pipeline': rlTaskPipeline,
  'reward-bands': rewardBands,
  'codebase-flow': codebaseFlow,
};
