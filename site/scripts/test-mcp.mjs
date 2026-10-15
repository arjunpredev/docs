// Smoke test for the docs Worker's /mcp and /api/search.
// Usage: node scripts/test-mcp.mjs [baseUrl] [--compare https://docs.pre.dev]
// With --compare, the same tool calls also run against that server and both
// outputs are printed side by side (first lines only).
const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--compare')) ?? 'http://127.0.0.1:8798').replace(/\/$/, '');
const compareIdx = args.indexOf('--compare');
const compare = compareIdx === -1 ? undefined : args[compareIdx + 1]?.replace(/\/$/, '');

let failures = 0;
let id = 0;

function check(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
}

async function rpc(server, method, params, { accept = 'application/json, text/event-stream', raw } = {}) {
  const body = raw ?? JSON.stringify({ jsonrpc: '2.0', id: ++id, method, ...(params ? { params } : {}) });
  const res = await fetch(`${server}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: accept },
    body,
  });
  const text = await res.text();
  const type = res.headers.get('content-type') ?? '';
  let messages = [];
  if (type.includes('text/event-stream')) {
    messages = text
      .split('\n')
      .filter((l) => l.startsWith('data: '))
      .map((l) => JSON.parse(l.slice(6)));
  } else if (text) {
    const parsed = JSON.parse(text);
    messages = Array.isArray(parsed) ? parsed : [parsed];
  }
  return { status: res.status, type, messages, message: messages[0] };
}

const toolText = (m) => (m?.result?.content ?? []).map((c) => c.text).join('\n\n');

async function tool(server, name, args) {
  const r = await rpc(server, 'tools/call', { name, arguments: args });
  return r.message;
}

const fsCommands = [
  ['tree / -L 2', (t) => t.startsWith('exit: 0') && t.includes('coding-agent') && !t.includes('|-- bin')],
  ['ls /openapi/api-reference', (t) => t.includes('ai-gateway.openapi.json') && t.includes('openapi.json')],
  ['head -25 /coding-agent/quickstart.mdx', (t) => t.includes('# Coding Agent quickstart')],
  ['rg -il "rate limit" /', (t) => t.startsWith('exit: 0') && t.includes('.mdx')],
  ['wc -l /overview.mdx /agents.mdx', (t) => t.includes('total')],
  ['cat /etc/passwd', (t) => t.startsWith('exit: 1') && t.includes('No such file or directory')],
  ['foo', (t) => t.startsWith('exit: 127') && t.includes('command not found')],
  ["cat /openapi/api-reference/openapi.json | jq '.paths | keys'", (t) => t.includes('/browser-agent')],
  ['ls /bin', (t) => t.includes('No such file or directory')],
  ['pwd; echo $HOME', (t) => t.includes('/\n/home/user')],
  ['cat /overview.mdx > /dev/null && echo ok', (t) => t.includes('ok')],
  ['grep -rl webhook / | head -3', (t) => t.includes('\n/agents.mdx') && !t.includes('//')],
  // API pages carry the operation in brief plus its code samples, not the full YAML
  ['cat /architect-agent/api/fast-spec.mdx', (t) => t.includes('## POST /fast-spec') && t.includes('### Code samples') && !t.includes('truncated') && !t.includes('openapi: 3')],
];

// Queries whose canonical section must be in the top 3 results
const rankedSearches = [
  ['predev run', '/cli/overview#run-one-task-without-the-app'],
  ['npx -y @predotdev/mcp setup', '/architect-agent/mcp-setup#set-up-with-one-command'],
  ['MCP server setup in Cursor', '/architect-agent/mcp-setup#cursor'],
  ['call fast spec with curl', '/architect-agent/api/fast-spec#openapi'],
  ['429', '/api-reference/errors#http-errors'],
];

async function main() {
  console.log(`server: ${base}${compare ? ` (comparing with ${compare})` : ''}\n`);

  const init = await rpc(base, 'initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'test-mcp', version: '0' },
  });
  check('initialize', init.message?.result?.protocolVersion === '2025-06-18' && init.type.includes('text/event-stream'), init.message?.result?.serverInfo?.name);
  const initOld = await rpc(base, 'initialize', { protocolVersion: '1999-01-01', capabilities: {}, clientInfo: { name: 't', version: '0' } }, { accept: 'application/json' });
  check('initialize unknown version -> default, JSON mode', initOld.message?.result?.protocolVersion === '2025-06-18' && initOld.type.includes('application/json'));

  const list = await rpc(base, 'tools/list');
  const names = (list.message?.result?.tools ?? []).map((t) => t.name);
  check('tools/list', names.join(',') === 'search_pre_dev,query_docs_filesystem_pre_dev,submit_feedback', names.join(','));

  for (const query of ['rate limits', 'authentication', 'zzqx flibbertigibbet']) {
    const m = await tool(base, 'search_pre_dev', { query });
    const items = m?.result?.content ?? [];
    const first = items[0]?.text ?? '';
    const ok = query.startsWith('zzqx') ? items.length === 1 && first.startsWith('No results') : items.length > 0 && /^Title: .+\nLink: https:\/\/docs\.pre\.dev\/.+\nPage: .+\nContent: /.test(first);
    check(`search_pre_dev "${query}"`, ok, `${items.length} results; ${first.split('\n').slice(0, 3).join(' | ')}`);
    if (compare) {
      const live = await tool(compare, 'search_pre_dev', { query });
      const ours = items.map((c) => c.text.split('\n')[1]);
      const theirs = (live?.result?.content ?? []).map((c) => c.text.split('\n')[1]);
      console.log(`   ours : ${ours.join('  ')}`);
      console.log(`   live : ${theirs.join('  ')}`);
    }
  }

  for (const [query, link] of rankedSearches) {
    const m = await tool(base, 'search_pre_dev', { query });
    const links = (m?.result?.content ?? []).map((c) => c.text.match(/^Link: https:\/\/docs\.pre\.dev(.*)$/m)?.[1]);
    check(`search_pre_dev "${query}" ranks ${link} in the top 3`, links.slice(0, 3).includes(link), links.slice(0, 3).join('  '));
  }

  for (const [command, ok] of fsCommands) {
    const m = await tool(base, 'query_docs_filesystem_pre_dev', { command });
    const t = toolText(m);
    check(`fs: ${command}`, ok(t), JSON.stringify(t.slice(0, 120)));
    if (compare) {
      const live = toolText(await tool(compare, 'query_docs_filesystem_pre_dev', { command }));
      if (live.slice(0, 200) !== t.slice(0, 200)) console.log(`   differs from live: ${JSON.stringify(live.slice(0, 160))}`);
    }
  }
  const write = await tool(base, 'query_docs_filesystem_pre_dev', { command: 'echo hi > /x.txt' });
  check('fs: write is refused', write?.result?.isError === true && toolText(write).includes('read-only'), toolText(write));
  const loop = await tool(base, 'query_docs_filesystem_pre_dev', { command: 'while true; do echo x; done' });
  check('fs: infinite loop is bounded', Boolean(loop?.result), toolText(loop).slice(0, 100).replace(/\n/g, ' '));

  const fb = await tool(base, 'submit_feedback', { path: '/test/path', feedback: 'test-mcp smoke test, ignore' });
  check('submit_feedback', toolText(fb).startsWith('Thanks'), toolText(fb));
  const fbBad = await tool(base, 'submit_feedback', { path: '', feedback: 'x' });
  check('submit_feedback: empty path is a tool error the model can see', fbBad?.result?.isError === true && toolText(fbBad).includes('"path"'));

  const unknownTool = await tool(base, 'nope', {});
  check('unknown tool -> -32602', unknownTool?.error?.code === -32602);

  const resources = await rpc(base, 'resources/list');
  const uri = resources.message?.result?.resources?.[0]?.uri;
  check('resources/list', uri === 'predev://skills/predev', uri);
  const read = await rpc(base, 'resources/read', { uri });
  check('resources/read', read.message?.result?.contents?.[0]?.text?.startsWith('---'));
  const legacy = await rpc(base, 'resources/read', { uri: 'mintlify://skills/predev' });
  check('resources/read legacy uri', Boolean(legacy.message?.result?.contents?.[0]?.text));

  const unknown = await rpc(base, 'prompts/list');
  check('unknown method -> -32601', unknown.message?.error?.code === -32601);
  const ping = await rpc(base, 'ping');
  check('ping', JSON.stringify(ping.message?.result) === '{}');

  const notif = await rpc(base, null, null, { raw: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) });
  check('notification -> 202', notif.status === 202 && notif.messages.length === 0);

  const batch = await rpc(base, null, null, {
    accept: 'application/json',
    raw: JSON.stringify([
      { jsonrpc: '2.0', id: 'a', method: 'ping' },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 'b', method: 'tools/list' },
    ]),
  });
  check('batch', batch.messages.length === 2 && batch.messages[0].id === 'a' && batch.messages[1].id === 'b');

  const parse = await rpc(base, null, null, { raw: '{not json' });
  check('parse error -> -32700', parse.status === 400 && parse.message?.error?.code === -32700);

  const get = await fetch(`${base}/mcp`, { headers: { Accept: 'text/event-stream' } });
  const getBody = await get.text();
  check('GET -> 405', get.status === 405 && getBody === '{"jsonrpc":"2.0","error":{"code":-32000,"message":"Method not allowed."},"id":null}', getBody);
  const del = await fetch(`${base}/mcp`, { method: 'DELETE' });
  check('DELETE -> 405', del.status === 405);
  const opts = await fetch(`${base}/mcp`, { method: 'OPTIONS', headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'POST' } });
  check('OPTIONS CORS', opts.status === 204 && opts.headers.get('access-control-allow-origin') === '*');

  const search = await fetch(`${base}/api/search?query=authentication`);
  const results = await search.json();
  check(
    '/api/search',
    search.ok && Array.isArray(results) && results[0]?.type === 'page' && search.headers.get('cache-control') === 'public, max-age=300',
    `${results.length} results, first ${results[0]?.url}`,
  );
  // the dialog lists pages with a few rows each, best page first
  const apiKey = await (await fetch(`${base}/api/search?query=api%20key`)).json();
  const pages = apiKey.filter((r) => r.type === 'page').map((r) => r.url);
  const rowsPerPage = Math.max(...pages.map((p) => apiKey.filter((r) => r.type !== 'page' && r.url.split('#')[0] === p).length));
  check('/api/search "api key" lists Authentication in the top 3 pages', pages.slice(0, 3).includes('/api-reference/authentication') && rowsPerPage <= 3, pages.slice(0, 3).join('  '));
  const empty = await (await fetch(`${base}/api/search?query=a`)).json();
  check('/api/search short query -> []', Array.isArray(empty) && empty.length === 0);
  const data = await fetch(`${base}/data/fs.json`);
  check('/data/fs.json is not public', data.status === 404);

  console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} check(s) failed`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
