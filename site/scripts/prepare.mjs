// Copies the static files Mintlify served from the repo root into public/ and
// generates the files Mintlify generated: redirects, robots, .well-known cards.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mcpServerCard } from '../worker/mcp-tools.mjs';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(site, '..');
const pub = path.join(site, 'public');
const docs = JSON.parse(fs.readFileSync(path.join(root, 'docs.json'), 'utf8'));
const siteUrl = 'https://docs.pre.dev';

fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(pub, { recursive: true });

function copy(from, to = from) {
  const src = path.join(root, from);
  const dest = path.join(pub, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function write(to, content) {
  const dest = path.join(pub, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}

// Static files
copy('images');
copy('llms.txt');
copy('llms.txt', '.well-known/llms.txt');
copy('skill.md');
copy('skill.md', '.well-known/agent-skills/predev/skill.md');
copy('skill.md', '.well-known/skills/predev/SKILL.md');
if (docs.favicon) copy(docs.favicon.replace(/^\//, ''), 'favicon.ico');
// SVG and PNG icons (tabs that prefer them, home screens), the same files pre.dev serves
for (const icon of ['favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-32.png']) copy(`site/assets/${icon}`, icon);
const openapi = [docs.api?.openapi ?? []].flat();
for (const file of openapi) copy(file);

// Redirects (Cloudflare `_redirects`; Mintlify answers these with 308)
const redirects = (docs.redirects ?? []).map((r) => `${r.source} ${r.destination} ${r.permanent === false ? 307 : 308}`);
write('_redirects', `${redirects.join('\n')}\n`);

// robots.txt (preview hosts get a disallow-all from the worker)
write(
  'robots.txt',
  ['User-agent: *', 'Content-Signal: ai-train=yes, search=yes, ai-input=yes', 'Allow: /', '', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n'),
);

// Agent discovery files
const skill = fs.readFileSync(path.join(root, 'skill.md'), 'utf8');
const skillMeta = Object.fromEntries(
  [...skill.matchAll(/^(name|description):\s*(.+)$/gm)].map(([, k, v]) => [k, v.trim()]),
);
const digest = crypto.createHash('sha256').update(skill).digest('hex');
write(
  '.well-known/agent-skills/index.json',
  JSON.stringify({
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: skillMeta.name,
        type: 'skill-md',
        description: skillMeta.description,
        url: `/.well-known/agent-skills/${skillMeta.name}/skill.md`,
        digest: `sha256:${digest}`,
      },
    ],
  }),
);
write(
  '.well-known/skills/index.json',
  JSON.stringify({ skills: [{ name: skillMeta.name, description: skillMeta.description, files: ['SKILL.md'] }] }),
);
write(
  '.well-known/agent-card.json',
  JSON.stringify({
    name: docs.name,
    description: docs.description,
    url: `${siteUrl}/`,
    version: '1.0.0',
    protocolVersion: '0.3',
    preferredTransport: 'HTTP+JSON',
    supportedInterfaces: [{ url: `${siteUrl}/`, protocolBinding: 'HTTP+JSON', protocolVersion: '0.3' }],
    provider: { url: `${siteUrl}/`, organization: docs.name },
    documentationUrl: `${siteUrl}/`,
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: [
      {
        id: skillMeta.name,
        name: skillMeta.name,
        description: skillMeta.description,
        tags: [],
        url: `${siteUrl}/.well-known/agent-skills/${skillMeta.name}/skill.md`,
      },
    ],
  }),
);
const mcpUrl = `${siteUrl}/mcp`;
write(
  '.well-known/mcp.json',
  JSON.stringify({
    version: '1.0.0',
    transport: 'http',
    url: mcpUrl,
    servers: [{ name: 'public', url: mcpUrl, transport: 'http', authentication: 'none' }],
  }),
);
write('.well-known/mcp/server-card.json', JSON.stringify(mcpServerCard(docs.name, mcpUrl)));

console.log(`prepare: public/ ready (${redirects.length} redirects, ${openapi.length} OpenAPI files)`);
