// Compile and run the actual guide snippets against pinned predev-api. All HTTP
// is mocked; this command never authenticates or submits work to pre.dev.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';

const guides = ['architect-agent/sdks/node', 'browser-agents/sdks/node', 'browser-agents/quickstart'];
const sources = new Map();
for (const guide of guides) {
  const text = await fs.readFile(`${guide}.mdx`, 'utf8');
  const blocks = [...text.matchAll(/```typescript[^\n]*\n([\s\S]*?)\n\s*```/g)];
  assert.ok(blocks.length, `No TypeScript examples in ${guide}`);
  sources.set(path.resolve(`__doc_examples/${guide.replaceAll('/', '_')}.ts`), blocks.map(m => m[1]).join('\n'));
}
const options = { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, skipLibCheck: true, types: ['node'] };
const host = ts.createCompilerHost(options);
const originalRead = host.readFile.bind(host);
host.readFile = file => sources.get(file) ?? originalRead(file);
const originalExists = host.fileExists.bind(host);
host.fileExists = file => sources.has(file) || originalExists(file);
const program = ts.createProgram([...sources.keys()], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {getCurrentDirectory:()=>process.cwd(),getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));
const id = '507f1f77bcf86cd799439011';
const spec = {_id:id,status:'completed',codingAgentSpecMarkdown:'# Example plan'};
const batch = {id,status:'completed',total:1,completed:1,results:[{status:'SUCCESS',data:{heading:'Example Domain'},creditsUsed:0.1}],totalCreditsUsed:0.1};
const json = value => new Response(JSON.stringify(value), {headers:{'Content-Type':'application/json'}});
let calls = 0;
let uploads = 0;
let streams = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, options = {}) => {
  calls++;
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://api.pre.dev');
  assert.equal(new Headers(options.headers).get('Authorization'), 'Bearer docs-test-key');
  if (options.method === 'POST') {
    if (options.body instanceof FormData) {
      const file = options.body.get('file');
      assert.equal(file.type, 'application/pdf');
      assert.equal(options.body.get('async'), 'true');
      assert.ok(Array.isArray(JSON.parse(options.body.get('docURLs'))));
      uploads++;
      return json({specId:id,status:'pending'});
    }
    const body = JSON.parse(options.body);
    if (parsed.pathname === '/fast-spec') {
      assert.ok(body.input);
      return json(body.async ? {specId:id,status:'pending'} : spec);
    }
    assert.equal(parsed.pathname, '/browser-agent');
    assert.equal(body.tasks[0].url, 'https://example.com');
    assert.ok(body.tasks[0].output.required.includes('heading'));
    if (body.stream) {
      streams++;
      return new Response(`event: task_event\ndata: ${JSON.stringify({taskIndex:0,type:'navigation',timestamp:1})}\n\nevent: done\ndata: ${JSON.stringify(batch)}\n\n`, {headers:{'Content-Type':'text/event-stream'}});
    }
    return json(body.async ? {id,status:'processing'} : batch);
  }
  if (parsed.pathname.startsWith('/spec-status/')) return json(spec);
  if (parsed.pathname === '/list-specs' || parsed.pathname === '/find-specs') return json({specs:[spec],total:1,hasMore:false});
  if (parsed.pathname === '/credits-balance') return json({success:true,creditsRemaining:42.5});
  if (parsed.pathname === '/browser-agent-status') return json({total:0,cap:25});
  if (parsed.pathname === '/list-browser-agents') return json({batches:[batch],total:1,hasMore:false});
  if (parsed.pathname.startsWith('/browser-agent/')) return json(batch);
  throw new Error(`Unmocked SDK request: ${url}`);
};
// Use a synthetic key, never a developer credential.
process.env.PREDEV_API_KEY = 'docs-test-key';
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'predev-docs-examples-'));
const pdf = path.join(temporary, 'requirements.pdf');
await fs.writeFile(pdf, '%PDF-1.4\nExample fixture\n');
try {
  for (const [file, source] of sources) {
    const code = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText
      .replaceAll("'predev-api'", JSON.stringify(import.meta.resolve('predev-api')))
      .replaceAll("'requirements.pdf'", JSON.stringify(pdf));
    await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}#${encodeURIComponent(file)}`);
  }
  assert.equal(uploads, 1);
  assert.equal(streams, 1);
  assert.ok(calls >= 10);
  console.log(`Node guide checks passed: ${sources.size} compiled guides, ${calls} mocked requests, multipart MIME and SSE verified`);
} finally {
  globalThis.fetch = realFetch;
  await fs.rm(temporary, {recursive:true,force:true});
}
