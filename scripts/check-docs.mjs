import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { staleDiagrams } from './diagrams/build.mjs';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const config = JSON.parse(await read('docs.json'));
const api = JSON.parse(await read('api-reference/openapi.json'));
await SwaggerParser.validate(structuredClone(api));
// The AI Gateway has its own OpenAPI file; its reference pages bind to it by path.
const gatewaySpecPath = 'api-reference/ai-gateway.openapi.json';
const gateway = JSON.parse(await read(gatewaySpecPath));
await SwaggerParser.validate(structuredClone(gateway));
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
async function walk(dir = '') {
  const entries = await fs.readdir(path.join(root, dir), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const name = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(name));
    else files.push(name);
  }
  return files;
}
const files = await walk();
const pages = new Map(await Promise.all(files.filter(f => f.endsWith('.mdx') && !f.startsWith('snippets/')).map(async f => [f.slice(0, -4), await read(f)])));
const nav = [];
function visit(value) {
  if (typeof value === 'string') nav.push(value);
  else if (Array.isArray(value)) value.forEach(visit);
  else if (value && typeof value === 'object') {
    for (const key of ['tabs', 'groups', 'pages']) if (value[key]) visit(value[key]);
  }
}
visit(config.navigation);
for (const page of nav) check(pages.has(page), `Navigation page missing: ${page}`);
for (const page of pages.keys()) check(nav.includes(page), `Page missing from navigation: ${page}`);
check(nav.length === new Set(nav).size, 'Duplicate navigation entries');
const redirects = new Map(config.redirects.map(r => [r.source, r.destination]));
check(redirects.size === config.redirects.length, 'Duplicate redirect sources');
for (const [source, destination] of redirects) {
  check(!pages.has(source.slice(1)), `Redirect hides a real page: ${source}`);
  check(pages.has(destination.slice(1)), `Redirect target missing: ${destination}`);
}
const edge = (await read('_redirects')).trim().split('\n').map(line => line.trim().split(/\s+/));
check(edge.length === redirects.size && edge.every(([from, to, status]) => redirects.get(from) === to && status === '301!'), '_redirects must mirror docs.json');

const operationsOf = spec => new Set(Object.entries(spec.paths).flatMap(([url, methods]) => Object.keys(methods).filter(m => /^(get|post|put|patch|delete|head|options)$/.test(m)).map(m => `${m.toUpperCase()} ${url}`)));
const operations = operationsOf(api);
const referenced = new Map();
const gatewayOperations = operationsOf(gateway);
const gatewayReferenced = new Map();
check([].concat(config.api?.openapi ?? []).includes(gatewaySpecPath), `docs.json api.openapi must list ${gatewaySpecPath}`);
let jsonExamples = 0;
let curlExamples = 0;
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
const transform = value => JSON.parse(JSON.stringify(value).replaceAll('#/components/schemas/', '#/$defs/'));
const defs = transform(api.components.schemas);
const gatewayDefs = transform(gateway.components.schemas);
function validate(schema, value, label, schemaDefs = defs) {
  const validator = ajv.compile({ $defs: schemaDefs, ...transform(schema) });
  check(validator(value), `${label}: ${ajv.errorsText(validator.errors)}`);
}
for (const [slug, text] of pages) {
  check(text.startsWith('---\n') && /^title:\s*[^\n]+/m.test(text.split('\n---\n')[0]), `Missing title/frontmatter: ${slug}`);
  check(/^description:\s*[^\n]+/m.test(text.split('\n---\n')[0]), `Missing description: ${slug}`);
  check(!/^api:\s/m.test(text), `Duplicate legacy API declaration: ${slug}`);
  const binding = text.match(/^openapi:\s*["']?(?:\/(api-reference\/(?:ai-gateway\.)?openapi\.json) )?((?:GET|POST|PUT|PATCH|DELETE) [^"'\n]+)["']?$/m);
  if (binding) {
    const [, specFile = 'api-reference/openapi.json', operation] = binding;
    const [known, seen] = specFile === gatewaySpecPath ? [gatewayOperations, gatewayReferenced] : [operations, referenced];
    check(known.has(operation), `Unknown OpenAPI operation on ${slug}: ${specFile} ${operation}`);
    check(!seen.has(operation), `Duplicate reference for ${specFile} ${operation}`);
    seen.set(operation, slug);
  }
  for (const match of text.matchAll(/```json[^\n]*\n([\s\S]*?)\n\s*```/g)) {
    try { JSON.parse(match[1]); jsonExamples++; }
    catch (error) { failures.push(`Invalid JSON example on ${slug}: ${error.message}`); }
  }
  for (const match of text.matchAll(/import\s+\{([^}]+)\}\s+from\s+["'](\/snippets\/[^"']+)["']/g)) {
    const target = match[2].slice(1);
    check(files.includes(target), `Missing snippet imported by ${slug}: ${target}`);
    if (!files.includes(target)) continue;
    const snippet = await read(target);
    for (const name of match[1].split(',').map(name => name.trim().split(/\s+as\s+/)[0])) {
      check(new RegExp(`export (?:const|function) ${name}\\b`).test(snippet), `Missing export ${name} in ${target}`);
    }
  }
  const prose = text.replace(/```[\s\S]*?```/g, '');
  for (const match of prose.matchAll(/(?:\]\(|\bhref=["']|\bsrc=["'])(\/[^\s)"']+)/g)) {
    const target = match[1].split(/[?#]/)[0].replace(/^\//, '');
    check(!target || pages.has(target) || files.includes(target) || redirects.has('/'+target), `Broken local link: ${slug} → ${match[1]}`);
  }
  // Validate actual JSON request bodies in curl snippets against their operation.
  for (const block of text.matchAll(/```(?:bash|shell)[^\n]*\n([\s\S]*?)\n\s*```/g)) {
    const shell = spawnSync('bash', ['-n'], { input: block[1], encoding: 'utf8' });
    check(shell.status === 0, `Invalid shell example on ${slug}: ${shell.stderr}`);
    const url = block[1].match(/https:\/\/api\.pre\.dev(\/v1\/[\w/-]+|\/[\w-]+)/)?.[1];
    const payload = block[1].match(/(?:-d|--data(?:-raw)?)\s+'([\s\S]*?)'/)?.[1];
    if (!url || !payload) continue;
    const [spec, specDefs] = url.startsWith('/v1/') ? [gateway, gatewayDefs] : [api, defs];
    const schema = spec.paths[url]?.post?.requestBody?.content?.['application/json']?.schema;
    if (!schema) continue;
    try { validate(schema, JSON.parse(payload), `curl request on ${slug}`, specDefs); curlExamples++; }
    catch (error) { failures.push(`Invalid curl JSON on ${slug}: ${error.message}`); }
  }
}
for (const operation of operations) check(referenced.has(operation), `Missing reference page: ${operation}`);
for (const operation of gatewayOperations) check(gatewayReferenced.has(operation), `Missing reference page: ${gatewaySpecPath} ${operation}`);

// llms.txt is written by hand: one link per navigation page, unique titles, agent entry points first.
const llms = await read('llms.txt');
check(/^# \S/.test(llms), 'llms.txt must start with an H1 site title');
check(Buffer.byteLength(llms) <= 16384, `llms.txt is ${Buffer.byteLength(llms)} bytes; keep it under 16 KB`);
const llmsPages = [...llms.matchAll(/\]\(https:\/\/docs\.pre\.dev\/([^)\s]+)\.md\)/g)].map(m => m[1]).filter(page => page !== 'skill');
for (const page of nav) check(llmsPages.includes(page), `llms.txt is missing ${page}`);
for (const page of llmsPages) check(nav.includes(page), `llms.txt links a page that is not in the navigation: ${page}`);
check(llmsPages.length === new Set(llmsPages).size, 'llms.txt lists a page twice');
const llmsTitles = [...llms.matchAll(/^- \[([^\]]+)\]\(https:\/\/docs\.pre\.dev\/[^)\s]+\.md\)/gm)].map(m => m[1]);
check(llmsTitles.length === new Set(llmsTitles).size, 'llms.txt link titles must be unique');

// Diagrams are SVG light and dark pairs generated from scripts/diagrams. Each
// committed SVG must match its source, and a page shows both files of a pair
// with Mintlify's theme classes and alt text that states what the figure shows.
for (const problem of staleDiagrams()) failures.push(problem);
const diagramNames = new Set(files.filter(f => /^images\/diagrams\/[\w-]+-light\.svg$/.test(f)).map(f => f.slice('images/diagrams/'.length, -'-light.svg'.length)));
const diagramUse = new Map();
for (const [slug, text] of pages) {
  for (const [tag] of text.replace(/```[\s\S]*?```/g, '').matchAll(/<img\b[^>]*>/g)) {
    const src = tag.match(/\bsrc="\/images\/diagrams\/([\w-]+)-(light|dark)\.svg"/);
    if (!src) continue;
    const [, name, theme] = src;
    const wanted = theme === 'light' ? 'block dark:hidden' : 'hidden dark:block';
    check(tag.match(/\bclassName="([^"]*)"/)?.[1] === wanted, `Diagram ${name}-${theme} on ${slug} needs className="${wanted}"`);
    check((tag.match(/\balt="([^"]*)"/)?.[1] || '').trim().length >= 40, `Diagram ${name}-${theme} on ${slug} needs alt text that states what it shows`);
    const bySlug = diagramUse.get(name) || new Map();
    bySlug.set(slug, [...(bySlug.get(slug) || []), theme]);
    diagramUse.set(name, bySlug);
  }
}
for (const name of diagramNames) check(diagramUse.has(name), `Diagram not shown on any page: ${name}`);
for (const [name, bySlug] of diagramUse) {
  check(diagramNames.has(name), `Page shows a missing diagram: ${name}`);
  for (const [slug, themes] of bySlug) check(themes.includes('light') && themes.includes('dark'), `Diagram ${name} on ${slug} must show both its light and dark file`);
}

// Validate examples consumed by Mintlify's generated request/response panels.
// Every JSON response, errors included, carries at least one example.
let openapiExamples = 0;
for (const [spec, specDefs, file] of [[api, defs, 'api-reference/openapi.json'], [gateway, gatewayDefs, gatewaySpecPath]]) {
  const resolve = response => (response?.$ref ? spec.components.responses[response.$ref.split('/').pop()] : response);
  for (const [url, methods] of Object.entries(spec.paths)) {
    for (const operation of Object.values(methods)) {
      for (const sample of operation['x-codeSamples'] || []) {
        if (sample.lang === 'cURL') {
          const shell = spawnSync('bash', ['-n'], {input:sample.source,encoding:'utf8'});
          check(shell.status === 0, `Invalid generated curl sample ${file} ${url}: ${shell.stderr}`);
        }
      }
      const containers = [['request', operation.requestBody], ...Object.entries(operation.responses || {}).map(([status, response]) => [status, resolve(response)])];
      for (const [status, container] of containers) {
        for (const [mediaType, content] of Object.entries(container?.content || {})) {
          if (mediaType !== 'application/json' || !content.schema) continue;
          const values = content.example !== undefined ? [content.example] : Object.values(content.examples || {}).map(example => example.value);
          check(status === 'request' || values.length > 0, `Missing response example: ${file} ${url} ${status}`);
          for (const value of values) { validate(content.schema, value, `OpenAPI example ${file} ${url} ${status}`, specDefs); openapiExamples++; }
        }
      }
    }
  }
}

// Representative lifecycle contracts. These prevent regressions in the cases that
// were misdocumented: async IDs, pending slots, numeric events, and summary bodies.
const id = '507f1f77bcf86cd799439011';
validate(api.paths['/fast-spec'].post.responses['200'].content['application/json'].schema, {specId:id,status:'pending'}, 'Async spec');
validate(api.paths['/fast-spec'].post.responses['200'].content['application/json'].schema, {_id:id,status:'completed',codingAgentSpecMarkdown:'# Plan',userFlowGraph:null}, 'Completed spec');
validate(api.paths['/browser-agent'].post.responses['200'].content['application/json'].schema, {id,status:'processing',total:1,completed:0,results:[],totalCreditsUsed:0}, 'Async browser run');
validate(api.paths['/browser-agent'].post.responses['200'].content['application/json'].schema, {id,status:'processing',total:3,completed:3,results:[{status:'PENDING',queuePosition:2},{status:'RUNNING',queuePosition:0},null]}, 'Pending browser run');
validate({$ref:'#/components/schemas/RunnerEvent'}, {type:'navigation',timestamp:1788739200000,data:{url:'https://example.com'}}, 'Numeric event timestamp');
validate({$ref:'#/components/schemas/SpecGraph'}, {nodes:[{id:'api',label:'API',level:'C2'},{id:'flow',label:'Flow',level:1}],edges:[{source:'flow',target:'api'}]}, 'Mixed graph levels');
validate({$ref:'#/components/schemas/ListSpecsResponse'}, {specs:[{_id:id,status:'processing',progress:0}],total:1,hasMore:false}, 'Spec summaries');
for (const omitted of ['codingAgentSpecJson','humanSpecJson','codingAgentSpecMarkdown','humanSpecMarkdown','userFlowGraph','architectureGraph','creditsUsed','totalHumanHours','progressMessage']) {
  check(!(omitted in api.components.schemas.SpecSummary.properties), `SpecSummary falsely advertises ${omitted}`);
}
// Optional source coverage check; never pretends the product checkout is present in CI.
const sourceIndex = process.argv.indexOf('--source-root');
if (sourceIndex !== -1) {
  const sourceRoot = path.resolve(process.argv[sourceIndex+1] || '..');
  const sources = await Promise.all(['api_endpoints.ts','browser_agents.ts'].map(f => fs.readFile(path.join(sourceRoot,'predev-app/backend/src/routes',f),'utf8')));
  const routes = new Set(sources.flatMap(source => [...source.matchAll(/router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)/g)].map(([,method,url]) => `${method.toUpperCase()} ${url.replace(/:([\w]+)/g, '{$1}')}`)));
  // Internal agent media uploads (screenshots, browser-flow recordings) are
  // implementation endpoints, not public REST.
  routes.delete('POST /api/upload-agent-screenshot');
  routes.delete('POST /api/agent-flow-recording');
  // Product directive: the proposal-vetting suite stays out of the public docs.
  // The endpoints stay live; only their documentation was removed.
  for (const route of ['POST /upload-proposal', 'GET /list-proposals', 'GET /get-proposal/{proposalId}', 'POST /vet-proposal', 'GET /list-vetted-proposals', 'GET /get-vetted-proposal/{vettedProposalId}']) routes.delete(route);
  for (const operation of routes) check(operations.has(operation), `Undocumented source route: ${operation}`);
  for (const operation of operations) check(routes.has(operation), `Documented route absent from source: ${operation}`);
  const registry = await fs.readFile(path.join(sourceRoot,'predev-app/backend/src/services/MCP/server.ts'),'utf8');
  // Tools come from the MCP_TOOLS list (`{ name: 'fast_spec', ... }`); older servers
  // called registerTool('name', ...) or a register('name', ...) wrapper directly.
  const toolList = registry.match(/MCP_TOOLS[^=]*=\s*\[([\s\S]*?)\n\];/)?.[1] ?? '';
  const names = [...new Set([
    ...[...toolList.matchAll(/\bname:\s*['"]([^'"]+)['"]/g)].map(m => m[1]),
    ...[...registry.matchAll(/(?:registerTool|register)\(\s*['"]([^'"]+)/g)].map(m => m[1])
  ])];
  check(names.length > 0, 'Found no MCP tool registrations in services/MCP/server.ts; update the parser');
  const reference = pages.get('mcp/tools');
  for (const name of names) check(reference.includes('`'+name+'`'), `Undocumented MCP tool: ${name}`);
  // AI Gateway: the JSON and multipart POST sets, the literal routes, and the mirrored catalog paths.
  const gatewaySource = await fs.readFile(path.join(sourceRoot, 'predev-app/backend/src/routes/ai_gateway.ts'), 'utf8');
  const catalogSource = await fs.readFile(path.join(sourceRoot, 'predev-app/backend/src/services/AiGateway/catalog.ts'), 'utf8');
  const quoted = text => [...(text ?? '').matchAll(/'([^']+)'/g)].map(m => m[1]);
  const setOf = name => quoted(gatewaySource.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\)`))?.[1]);
  const gatewayRoutes = new Set([
    ...[...setOf('JSON_POST_PATHS'), ...setOf('MULTIPART_POST_PATHS')].map(url => `POST /v1${url}`),
    ...[...gatewaySource.matchAll(/router\.(get|post|put|patch|delete)\(\s*'([^']+)'/g)].map(([, method, url]) => `${method.toUpperCase()} /v1${url.replace(/:(\w+)/g, '{$1}')}`),
    ...quoted(catalogSource.match(/CATALOG_PATHS = new Set\(\[([^\]]*)\]\)/)?.[1]).map(url => `GET /v1${url}`)
  ]);
  check(gatewayRoutes.size > 0, 'Found no AI Gateway routes in routes/ai_gateway.ts; update the parser');
  for (const operation of gatewayRoutes) check(gatewayOperations.has(operation), `Undocumented AI Gateway route: ${operation}`);
  for (const operation of gatewayOperations) check(gatewayRoutes.has(operation), `Documented AI Gateway route absent from source: ${operation}`);
  console.log(`Source coverage: ${routes.size} REST operations, ${gatewayRoutes.size} AI Gateway operations and ${names.length} MCP registrations`);
}
assert.equal(failures.length, 0, failures.join('\n'));
console.log(`Docs checks passed: ${pages.size} pages, ${operations.size} REST and ${gatewayOperations.size} AI Gateway operations, ${openapiExamples} schema-checked OpenAPI examples, ${diagramNames.size} diagram pairs, ${jsonExamples} JSON examples, ${curlExamples} schema-checked curl requests, ${llmsPages.length} llms.txt pages`);
