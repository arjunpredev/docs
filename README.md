# pre.dev documentation

Source for [docs.pre.dev](https://docs.pre.dev), built with Mintlify. Changes on `main` deploy automatically; use a feature branch and review before publishing.

## Preview and validate

Use Node.js 22 or later. Tool versions are pinned in `package-lock.json`.

```bash
npm ci
npm run check
npm run check:node
# With predev-api==1.1.0 installed in your Python environment:
npm run check:python
npm run validate
npm run links
npm run a11y
npm run dev
```

`check` validates both OpenAPI files (every JSON response needs an example that matches its schema), that every operation has exactly one reference page, that `llms.txt` lists every navigation page once with a unique title, lifecycle fixtures, JSON and curl examples, snippet imports, diagram pairs and their alt text, page metadata, navigation coverage, and mirrored redirects. `validate` runs Mintlify's strict build checks; `links` includes anchors and redirect targets. `check:node` compiles and runs the guide snippets against pinned SDK 1.1.0; `check:python` runs the Python snippets. Both mock every HTTP call. Inspect the local preview in light/dark mode and at a narrow viewport after layout changes. Mintlify writes its preview cache under `~/.mintlify`.

When sibling product repositories are available, also run:

```bash
npm run check -- --source-root ..
```

This compares public REST routes, AI Gateway routes (`routes/ai_gateway.ts` and the catalog paths in `services/AiGateway/catalog.ts`), and MCP registrations with `predev-app`. It deliberately excludes the internal agent screenshot and flow-recording upload routes, and the proposal-review routes, which stay live but undocumented. It reads the sibling checkout's working tree, so check out or export `origin/main` first. It does not run authenticated requests or prove deployed behavior.

## Sources to check when editing

| Contract | Implementation |
| --- | --- |
| Architect REST | `predev-app/backend/src/routes/api_endpoints.ts` and `helpers/api/` |
| Authentication | `routes/api_endpoint/helpers.ts` and `unified_api_key_auth.ts` |
| Browser REST | `routes/browser_agents.ts` and `services/BrowserAgents/` |
| MCP | `routes/mcp.ts` and `services/MCP/` |
| AI Gateway | `routes/ai_gateway.ts`, `services/AiGateway/` (`scrub_upstream.ts` decides what callers see), and `config/ai_gateway_pricing.ts` |
| Built-in AI, payments, and sign-in in apps | the sandbox environment builder in `helpers/codegen/deploy/`, `services/Payments/`, `routes/payments_gateway.ts`, and `predev-agent/src/prompts/dev-environment-instructions.ts` |
| Publish | `helpers/publish/` (`publish_gate.ts`, `publish_project.ts`, `app_worker_module.ts`) and `frontend/src/components/ProjectDashboard/Publish/` |
| Browser event payloads | `browser-tasks/src/types.ts`, the runner, and public event sanitization |
| Published SDK behavior | npm/PyPI release artifacts, then `predev-api` source |
| CLI commands | `predev-agent/src/constants/slash_manifest.ts` plus actual `tui-v2/slash_commands.ts` handlers |
| Web controls and connections | Current frontend handlers (the web slash menu is `TerminalChat/components/SlashCommandMenu.tsx`), ProjectConfigModal, and `components/Integrations/` |
| Commercial plans | Live pricing page, `frontend/src/components/Pricing/prices.tsx`, `services/credit_core.ts`, and the entitlement checks |
| Labs: RL task bundles | `predev-agent/src/helpers/rl_env/` (`export_env.ts`, `flat_verifier.ts`, `qc_bundle.ts`, `calibration_bands.ts`) and `scripts/export_final_env.ts` |
| Labs: codebase deliveries | `services/CodeLicensing/` (`delivery_zip.ts`, `delivery_batch.ts`, `delivery_checks.ts`, `metadata_sheet.ts`, `anonymize_repo.ts`, `public_exposure_check.ts`, `token_count.ts`) |

Source comments and type declarations can lag runtime behavior. Compare handlers, serializers, and published package code; identify differences instead of documenting an intended behavior as implemented. Use Doppler config `dev` or `prd` if an authorized check needs environment configuration, and never print secret values.

## Editing rules

- Keep the OpenAPI schema and endpoint MDX in the same change. Bind pages explicitly, for example `openapi: "/api-reference/openapi.json GET /credits-balance"`. AI Gateway pages bind to `api-reference/ai-gateway.openapi.json`, for example `openapi: "/api-reference/ai-gateway.openapi.json POST /v1/chat/completions"`.
- OpenAPI is the machine-readable public reference; product handlers determine actual behavior. Record backend defects separately from public documentation.
- Write product guides in the present tense. Keep audit dates, "checked on" notes, and "at the time of writing" caveats out of published docs. Keep estimates in their canonical guide, label them as estimates, and update facts when the product changes. Dates belong in release history and versioned protocol identifiers.
- The pre.dev API key is the workspace `pdk_` key on **Integrations → Built-in** (`https://pre.dev/projects/integrations?tab=built-in`). State its location only through `snippets/api-key-location.mdx`. Legacy keys still authenticate, but never send readers to the legacy key page. Third-party service keys belong in the Integrations **API Keys** tab.
- Product MCP executes tools at `https://api.pre.dev/mcp`; documentation search MCP is `https://docs.pre.dev/mcp`, hosted by Mintlify. There is no pre.dev npm MCP-server package.
- Match examples to a published SDK version. Check Python dictionary/object responses, file MIME types, stream termination, and terminal task outcomes.
- Say each repeated fact once, in a `snippets/*.mdx` file imported where it is needed: key location (`api-key-location`), base URLs, auth headers, SDK install lines, MCP URL, credit value, the browser credit floor, and limits. Change the snippet, not a copy.
- Draw diagrams as SVG light and dark pairs with alt text (see [Visuals](#visuals)), and state every fact a diagram shows in the page's prose or a table, so Markdown exports carry the facts. Do not add JSX components: Markdown exports inline their source.
- Put each page in `docs.json` under one of the four tabs: Start (entry points, quickstarts, authentication, errors, plans), Build with pre.dev (web workspace, CLI, building and shipping, integrations, what is built into apps), API & SDKs (REST, AI Gateway, SDKs, MCP), and Labs (RL Tasks and Codebases for AI labs). Changelog is a navbar link. Group placement does not require moving a file: keep paths stable and move a file only when a merge or rename demands it.
- One page per shared topic: authentication, errors, and plans, credits, and pricing each have a single page; product pages link to them instead of restating them.
- Preserve useful old URLs in both `docs.json` and `_redirects`; a redirect must never hide a real page.
- Do not document the proposal-review endpoints or the media API (`/media/*`); both stay out of the public docs. The AI Gateway is described as pre.dev AI: never name the upstream router or providers, never call it a proxy or pass-through, never show dollar costs next to credit prices, and never state the margin.
- The published build serves the static front end plus `/predev-ai`; server routes (checkout, webhooks, APIs) run in the project's sandbox. Do not claim otherwise.
- Keep internal infrastructure, credentials, and private audit findings out of public pages.
- Labs pages carry no counts of tasks, environments, or repositories, no prices or rates, and no names of labs, buyers, sellers, or source repositories. Samples are walked through on a call, never offered for download.
- Add product-release changelog entries only for verified releases. Label documentation-only updates accordingly. No prices and no vendor or upstream names in the changelog. `node scripts/changelog-gaps.mjs` lists in-app changelog entries (`https://pre.dev/changelog.json`, or `--source-root ..` for a sibling checkout) dated after the latest docs entry; add `--details`, `--type feature,improvement`, `--since YYYY-MM-DD` or `--json`. It never edits files.
- `llms.txt`, `skill.md`, and the AI Gateway OpenAPI file at the repo root and in `api-reference/` are written by hand and served in place of Mintlify's generated versions. When you add, move, or rename a page, add it to `llms.txt` under its tab with a unique title (`npm run check` fails otherwise), and update `skill.md` if a fact it states changes.
- `agents.mdx` sorts first in the path-ordered `llms-full.txt` on purpose, so agents read it first; keep that path.

## Visuals

Diagrams are SVG pairs in `images/diagrams/`: `<name>-light.svg` and `<name>-dark.svg`. Both are generated from one layout in `scripts/diagrams/diagrams.mjs`, so a pair differs only in its `<style>` block. Edit the source, then regenerate:

```bash
npm run diagrams
```

Show a pair with Mintlify's theme classes and alt text that states what the figure shows:

```mdx
<img className="block dark:hidden" src="/images/diagrams/async-jobs-light.svg" alt="The async job pattern in four steps: submit, save the ID, poll or stream it, and read the result." />
<img className="hidden dark:block" src="/images/diagrams/async-jobs-dark.svg" alt="The async job pattern in four steps: submit, save the ID, poll or stream it, and read the result." />
```

State every fact a diagram shows in the page's prose or a table as well. Screen readers and Markdown exports get the text, not the picture. Layouts are 540 units wide and stacked, so text stays legible at a 390px viewport; keep text at 13 units or larger. Colors are black, white, and neutral grays with one blue accent, and every text color keeps a contrast ratio of at least 4.5:1, which the generator enforces.

`check` fails when a committed SVG differs from its source, a page shows only one file of a pair, the theme classes or alt text are missing, or a diagram is not used on any page. After changing a diagram, inspect it in both themes at desktop width and at 390px.

## Structure

Paths predate the four tabs and stay stable; `docs.json` decides where each page appears.

- `overview.mdx`, `agents.mdx`, `changelog.mdx`: entry points for humans and agents, and release history
- `llms.txt`, `skill.md`: hand-written agent entry points served at `/llms.txt` and `/skill.md`
- `api-reference/`: API overview, authentication, errors, and the two OpenAPI files (`openapi.json` for REST, `ai-gateway.openapi.json` for `/v1`)
- `coding-agent/`: the web workspace, building and shipping, integrations, plans, and `built-in.mdx` (AI, payments, and sign-in inside apps)
- `cli/`: the terminal workflow
- `payments/`: Payments guides
- `architect-agent/`: specifications, the SDKs (`sdks/`, covering specifications and browser tasks), and MCP setup
- `browser-agents/`: browser tasks, lifecycle, and streaming
- `ai-gateway/`: AI Gateway guides and reference
- `mcp/`: product tool reference
- `scripts/`: offline documentation checks, `changelog-gaps.mjs` for changelog upkeep, and the diagram generator in `scripts/diagrams/`
- `labs/`: RL Tasks and Codebases for AI labs
- `snippets/`: shared fact snippets (`*.mdx`)
- `images/diagrams/`: diagram SVG pairs, generated from `scripts/diagrams/`
