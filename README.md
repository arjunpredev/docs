# pre.dev docs

Source for [docs.pre.dev](https://docs.pre.dev). Built with [Mintlify](https://mintlify.com); deploys automatically from `main`.

## Preview locally

```bash
npx mintlify@latest dev
```

## Editing rules

- **One fact, one home.** Spec timings (Fast ≈ 1 minute, Deep ≈ 3–5 minutes), credit costs, and caps must stay consistent across pages — grep before you change a number.
- **API key URL is always** `https://pre.dev/projects/key`.
- **MCP setup is always** HTTP at `https://api.pre.dev/mcp` with browser OAuth. There is no npm MCP package.
- **Never mention internal infrastructure** (auth provider, sandbox vendors, databases, Kubernetes) — CI greps for leaks.
- **openapi.json is the source of truth** for the API reference pages; update it and the mdx together.
- **User-facing product change shipped?** Add a `changelog.mdx` entry in the same PR.
- Nav lives in `docs.json` (`_redirects` mirrors its redirects for the edge — update both when moving pages).

## Structure

- `coding-agent/` — the flagship product (workspace, build, verify, ship)
- `cli/` — the `predev` terminal CLI
- `browser-agents/` — browser automation API + SDKs
- `architect-agent/` — spec generation API + MCP + SDKs
- `api-reference/openapi.json` — OpenAPI spec backing the API pages
