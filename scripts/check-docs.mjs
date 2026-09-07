import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import SwaggerParser from '@apidevtools/swagger-parser';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import ts from 'typescript';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const config = JSON.parse(await read('docs.json'));
const api = JSON.parse(await read('api-reference/openapi.json'));
await SwaggerParser.validate(structuredClone(api));
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

const operations = new Set(Object.entries(api.paths).flatMap(([url, methods]) => Object.keys(methods).filter(m => /^(get|post|put|patch|delete|head|options)$/.test(m)).map(m => `${m.toUpperCase()} ${url}`)));
const referenced = new Map();
let jsonExamples = 0;
let curlExamples = 0;
let visualExamples = 0;
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
const transform = value => JSON.parse(JSON.stringify(value).replaceAll('#/components/schemas/', '#/$defs/'));
const defs = transform(api.components.schemas);
function validate(schema, value, label) {
  const validator = ajv.compile({ $defs: defs, ...transform(schema) });
  check(validator(value), `${label}: ${ajv.errorsText(validator.errors)}`);
}
for (const [slug, text] of pages) {
  check(text.startsWith('---\n') && /^title:\s*[^\n]+/m.test(text.split('\n---\n')[0]), `Missing title/frontmatter: ${slug}`);
  check(/^description:\s*[^\n]+/m.test(text.split('\n---\n')[0]), `Missing description: ${slug}`);
  check(!/^api:\s/m.test(text), `Duplicate legacy API declaration: ${slug}`);
  const operation = text.match(/^openapi:\s*["']?(?:\/api-reference\/openapi\.json )?((?:GET|POST|PUT|PATCH|DELETE) [^"'\n]+)["']?$/m)?.[1];
  if (operation) {
    check(operations.has(operation), `Unknown OpenAPI operation on ${slug}: ${operation}`);
    check(!referenced.has(operation), `Duplicate reference for ${operation}`);
    referenced.set(operation, slug);
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
    const url = block[1].match(/https:\/\/api\.pre\.dev(\/[\w-]+)/)?.[1];
    const payload = block[1].match(/(?:-d|--data(?:-raw)?)\s+'([\s\S]*?)'/)?.[1];
    if (!url || !payload) continue;
    const schema = api.paths[url]?.post?.requestBody?.content?.['application/json']?.schema;
    if (!schema) continue;
    try { validate(schema, JSON.parse(payload), `curl request on ${slug}`); curlExamples++; }
    catch (error) { failures.push(`Invalid curl JSON on ${slug}: ${error.message}`); }
  }
}
for (const operation of operations) check(referenced.has(operation), `Missing reference page: ${operation}`);

// Custom visuals must compile, and links inside them need the same coverage as MDX.
const snippets = files.filter(file => file.startsWith('snippets/') && file.endsWith('.jsx'));
for (const file of snippets) {
  const source = await read(file);
  const compiled = ts.transpileModule(source, {fileName: file, reportDiagnostics: true, compilerOptions: {jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2022}});
  for (const diagnostic of compiled.diagnostics || []) failures.push(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
  for (const match of source.matchAll(/\bhref=["'](\/[^"']+)["']/g)) {
    const target = match[1].split(/[?#]/)[0].slice(1);
    check(pages.has(target) || files.includes(target) || redirects.has('/'+target), `Broken snippet link: ${file} → ${match[1]}`);
  }
}

// Read literal example data from the actual interactive component, without
// executing JSX or maintaining a second copy of its response fixtures.
const literal = node => {
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(property => {
    assert.ok(ts.isPropertyAssignment(property), 'Visual examples must use literal properties');
    return [property.name.text, literal(property.initializer)];
  }));
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  throw new Error('Visual examples must use literal data');
};
const lifecycle = ts.createSourceFile('lifecycle.jsx', await read('snippets/lifecycle.jsx'), ts.ScriptTarget.ES2022, true, ts.ScriptKind.JSX);
function checkVisualExamples(node) {
  if (ts.isVariableDeclaration(node) && ['specExamples', 'browserExamples'].includes(node.name.getText(lifecycle))) {
    const browser = node.name.getText(lifecycle) === 'browserExamples';
    for (const example of literal(node.initializer)) {
      // Browser excerpts omit the saved ID to keep the visual readable.
      const value = browser ? {id: '507f1f77bcf86cd799439011', ...example.response} : example.response;
      const specSchema = example.label === 'pending'
        ? api.paths['/fast-spec'].post.responses['200'].content['application/json'].schema
        : api.paths['/spec-status/{specId}'].get.responses['200'].content['application/json'].schema;
      validate(browser ? {$ref: '#/components/schemas/BatchResult'} : specSchema, value, `Visual ${browser ? 'browser' : 'spec'} ${example.label}`);
      visualExamples++;
    }
  }
  ts.forEachChild(node, checkVisualExamples);
}
checkVisualExamples(lifecycle);
check(visualExamples === 8, 'Expected four spec and four browser state examples');

// Validate examples consumed by Mintlify's generated request/response panels.
for (const [url, methods] of Object.entries(api.paths)) {
  for (const operation of Object.values(methods)) {
    for (const sample of operation['x-codeSamples'] || []) {
      if (sample.lang === 'cURL') {
        const shell = spawnSync('bash', ['-n'], {input:sample.source,encoding:'utf8'});
        check(shell.status === 0, `Invalid generated curl sample ${url}: ${shell.stderr}`);
      }
    }
    const containers = [operation.requestBody, ...Object.values(operation.responses || {})];
    for (const container of containers) {
      for (const [mediaType, content] of Object.entries(container?.content || {})) {
        if (mediaType !== 'application/json' || !content.schema) continue;
        if (content.example !== undefined) validate(content.schema, content.example, `OpenAPI example ${url}`);
        for (const example of Object.values(content.examples || {})) validate(content.schema, example.value, `OpenAPI example ${url}`);
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
  // Internal screenshot upload is an agent implementation endpoint, not public REST.
  routes.delete('POST /api/upload-agent-screenshot');
  for (const operation of routes) check(operations.has(operation), `Undocumented source route: ${operation}`);
  for (const operation of operations) check(routes.has(operation), `Documented route absent from source: ${operation}`);
  const registry = await fs.readFile(path.join(sourceRoot,'predev-app/backend/src/services/MCP/server.ts'),'utf8');
  const names = [...registry.matchAll(/registerTool\(\s*['"]([^'"]+)/g)].map(m => m[1]);
  const reference = pages.get('mcp/tools');
  for (const name of names) check(reference.includes('`'+name+'`'), `Undocumented MCP tool: ${name}`);
  console.log(`Source coverage: ${routes.size} REST operations and ${names.length} MCP registrations`);
}
assert.equal(failures.length, 0, failures.join('\n'));
console.log(`Docs checks passed: ${pages.size} pages, ${operations.size} operations, ${snippets.length} visual components, ${visualExamples} schema-checked visual states, ${jsonExamples} JSON examples, ${curlExamples} schema-checked curl requests`);
