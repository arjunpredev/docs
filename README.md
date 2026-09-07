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

`check` validates OpenAPI, lifecycle fixtures, JSON and curl examples, JSX syntax and imports, interactive response examples, page metadata, navigation coverage, and mirrored redirects. `validate` runs Mintlify's strict build checks; `links` includes anchors and redirect targets. `check:node` compiles and runs the guide snippets against pinned SDK 1.1.0; `check:python` runs the Python snippets. Both mock every HTTP call. Inspect the local preview in light/dark mode and at a narrow viewport after layout changes. Mintlify writes its preview cache under `~/.mintlify`.

When sibling product repositories are available, also run:

```bash
npm run check -- --source-root ..
```

This compares public REST route coverage and MCP registrations with `predev-app`. It deliberately excludes the internal agent screenshot-upload route. It does not run authenticated requests or prove deployed behavior.

## Sources to check when editing

| Contract | Implementation |
| --- | --- |
| Architect/proposal REST | `predev-app/backend/src/routes/api_endpoints.ts` and `helpers/api/` |
| Authentication | `routes/api_endpoint/helpers.ts` and `unified_api_key_auth.ts` |
| Browser REST | `routes/browser_agents.ts` and `services/BrowserAgents/` |
| MCP | `routes/mcp.ts` and `services/MCP/` |
| Browser event payloads | `browser-tasks/src/types.ts`, the runner, and public event sanitization |
| Published SDK behavior | npm/PyPI release artifacts, then `predev-api` source |
| CLI commands | `predev-agent/src/constants/slash_manifest.ts` plus actual `tui-v2/slash_commands.ts` handlers |
| Web controls and connections | Current frontend handlers, ProjectConfigModal, and integration services |
| Commercial plans | Live pricing page and frontend pricing configuration |

Source comments and type declarations can lag runtime behavior. Compare handlers, serializers, and published package code; identify differences instead of documenting an intended behavior as implemented. Use Doppler config `dev` or `prd` if an authorized check needs environment configuration, and never print secret values.

## Editing rules

- Keep the OpenAPI schema and endpoint MDX in the same change. Bind pages explicitly, for example `openapi: "/api-reference/openapi.json GET /credits-balance"`.
- OpenAPI is the machine-readable public reference; product handlers determine actual behavior. Record backend defects separately from public documentation.
- Write product guides in the present tense. Keep audit dates, "checked on" notes, and "at the time of writing" caveats out of published docs. Keep estimates in their canonical guide, label them as estimates, and update facts when the product changes. Dates belong in release history and versioned protocol identifiers.
- A pre.dev API key comes from `https://pre.dev/projects/key`; third-party service keys belong in Integrations.
- Product MCP executes tools at `https://api.pre.dev/mcp`; documentation search MCP is separate. There is no pre.dev npm MCP-server package.
- Match examples to a published SDK version. Check Python dictionary/object responses, file MIME types, stream termination, and terminal task outcomes.
- Use the native HTML/React visuals in `snippets/` for workflows, specification outlines, branch lanes, and request lifecycles. Keep essential facts in MDX prose or tables as well, so Markdown exports remain useful.
- Put each page in `docs.json`. Preserve useful old URLs in both `docs.json` and `_redirects`; a redirect must never hide a real page.
- Keep internal infrastructure, credentials, and private audit findings out of public pages.
- Add product-release changelog entries only for verified releases. Label documentation-only updates accordingly.

## Visuals

`styles.css` defines a scoped `.pd-visual` system with light and dark palettes. Use the site's existing typography; reserve monospace for code, field names, and endpoints. Color communicates selection or status, with text labels supplying the same meaning. Layouts reflow on mobile without scaling text down to fit a diagram.

| Component | Use for |
| --- | --- |
| `ProductPaths` | Product selection with plain descriptions of workflows and outputs |
| `Workflow` | An ordered process with a short explanation per stage |
| `SpecBlueprint` | Comparing Fast and Deep structure in a concrete example |
| `LifecycleExplorer` | Inspecting async states, response excerpts, and next actions |
| `SessionBranches` | Independent workstreams and review before integration |
| `ProtocolTrace` | Requests, events, and message direction |
| `ConnectionScope` | A project override and its workspace default |
| `GraphExample` | Mapping graph IDs to a directed relationship |

Import named components directly from `/snippets/` in the page. [Mintlify's component environment](https://www.mintlify.com/docs/customize/react-components) provides React hooks and does not support cross-snippet or third-party imports. [Custom CSS](https://www.mintlify.com/docs/customize/custom-scripts) is loaded automatically. Keep state changes user-triggered, controls keyboard-accessible, and changing content announced with `aria-live`. Label synthetic output as an example and avoid API calls in educational visuals.

After changing a visual, inspect it at desktop and mobile widths in both themes, exercise every state with keyboard and pointer, and check the console. `check` validates the lifecycle examples against OpenAPI directly from the component's literal data.

## Structure

- `overview.mdx`, `for-agents.mdx`: entry points for humans and agents
- `api-reference/`: shared REST guidance and OpenAPI
- `mcp/`: product tool reference
- `architect-agent/`: specifications, proposals, and SDK usage
- `browser-agents/`: browser tasks, lifecycle, streaming, and SDK usage
- `coding-agent/`, `cli/`: web and terminal workflows
- `scripts/`: offline documentation checks
- `snippets/`, `styles.css`: reusable documentation visuals
