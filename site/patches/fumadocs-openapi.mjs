// Small fixes to fumadocs-openapi's built files, applied after install and
// before every build. Each patch is a literal string swap that runs only once:
// a file already holding the replacement is left alone, and a file holding
// neither string stops the build, so a version bump cannot silently skip one.
//   - Server-rendered samples and the playground use the spec's absolute
//     server URL instead of https://example.com and "loading...".
//   - The first 2xx response starts open, and closed response panels stay in
//     the HTML (hidden until found), so readers without JavaScript see them.
//   - The select buttons beside Authorization, Request Body and responses get
//     accessible names.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '12.1.0';
const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = path.join(site, 'node_modules/fumadocs-openapi');
const { version } = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
if (version !== VERSION) {
  console.error(`patches/fumadocs-openapi.mjs targets fumadocs-openapi ${VERSION}, found ${version}. Update the patches.`);
  process.exit(1);
}

const patches = [
  {
    file: 'dist/utils/use-server.js',
    from: ': "https://example.com";',
    to: ': server && /^https?:\\/\\//.test(server.url) ? resolveServerUrl(server.url, server.variables) : "https://example.com";',
  },
  {
    file: 'dist/ui/playground/components/server-select.js',
    from: 'children: isMounted ? resolveUrl() : t("loading...")',
    to: 'children: resolveUrl()',
  },
  {
    file: 'dist/ui/operation/index.js',
    from: `jsx(Accordions, {
		type: "multiple",
		children: responses.map(`,
    to: `jsx(Accordions, {
		type: "multiple",
		defaultValue: responses.filter((item) => item.status.startsWith("2")).slice(0, 1).map((item) => item.status),
		children: responses.map(`,
  },
  {
    file: 'dist/packages/shared-api/dist/components/accordion.js',
    from: `return /* @__PURE__ */ jsx(Accordion.Panel, {
		...props,`,
    to: `return /* @__PURE__ */ jsx(Accordion.Panel, {
		hiddenUntilFound: true,
		...props,`,
  },
  {
    file: 'dist/ui/operation/index.js',
    from: `contentTypes.length > 1 ? /* @__PURE__ */ jsx(SelectTabTrigger, {
						items,
						className: "font-medium"`,
    to: `contentTypes.length > 1 ? /* @__PURE__ */ jsx(SelectTabTrigger, {
						items,
						"aria-label": "Request body content type",
						className: "font-medium"`,
  },
  {
    file: 'dist/ui/operation/index.js',
    from: 'items.length > 1 ? /* @__PURE__ */ jsx(SelectTabTrigger, { items })',
    to: 'items.length > 1 ? /* @__PURE__ */ jsx(SelectTabTrigger, { items, "aria-label": "Authorization method" })',
  },
  {
    file: 'dist/ui/operation/index.js',
    from: `jsx(SelectTabTrigger, {
				items,
				className: "my-1.5 py-1"`,
    to: `jsx(SelectTabTrigger, {
				items,
				"aria-label": "Response content type",
				className: "my-1.5 py-1"`,
  },
];

let applied = 0;
for (const { file, from, to } of patches) {
  const target = path.join(pkgDir, file);
  const text = fs.readFileSync(target, 'utf8');
  if (text.includes(to)) continue;
  if (!text.includes(from)) {
    console.error(`patches/fumadocs-openapi.mjs: ${file} no longer contains the text to patch:\n${from}`);
    process.exit(1);
  }
  fs.writeFileSync(target, text.replace(from, to));
  applied++;
}
if (applied) console.log(`fumadocs-openapi: applied ${applied} patch(es)`);
