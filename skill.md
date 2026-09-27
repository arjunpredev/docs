---
name: predev
description: Work with pre.dev from code or an agent. Run browser tasks that read or act on websites, call hundreds of AI models through one OpenAI-compatible API, generate software specifications, take Stripe payments in an app built on pre.dev, and use the pre.dev coding agent from a terminal. Use when a task mentions pre.dev, api.pre.dev, PREDEV_API_KEY, or a project built on pre.dev.
license: Proprietary
compatibility: Needs a pre.dev API key in PREDEV_API_KEY. Examples use curl, jq, and the OpenAI SDK for Node.js or Python.
metadata:
  author: pre.dev
  version: "2.0"
---

# pre.dev

pre.dev is an AI product engineer: it plans, builds, verifies and ships software in a web workspace or a terminal. Its APIs are also usable on their own: Browser Agents, the AI Gateway (hundreds of models from every major lab through one OpenAI-compatible API), specification generation, and payments for apps built on pre.dev.

## Authenticate

- One API key per workspace, `pdk_…`. Copy it from Integrations → Built-in in the pre.dev dashboard. Projects built on pre.dev already have it as `PREDEV_API_KEY`.
- Send it as `Authorization: Bearer $PREDEV_API_KEY`. `x-api-key` also works.
- Keep it on a server. It spends the workspace's credits.

## Pick an interface

| Goal | Use |
| --- | --- |
| Read data from a website, or act on one | `POST https://api.pre.dev/browser-agent` |
| Call a model (AI Gateway): chat, embeddings, images, video, speech | `https://api.pre.dev/v1` with an OpenAI or Anthropic SDK |
| Plan software before building it | `POST https://api.pre.dev/fast-spec` or `/deep-spec`, or the `fast_spec` MCP tool |
| Give an agent pre.dev tools | Product MCP server `https://api.pre.dev/mcp` |
| Take payments in an app built on pre.dev | The Stripe SDK, pointed at `STRIPE_API_HOST` |
| Build or change code | The coding agent, on the web or in the CLI (a person signs in) |
| Search these docs | Docs MCP server `https://docs.pre.dev/mcp` (no key) |

Browser tasks and AI calls work on every plan, Free included: a Free personal account can spend 2 credits on browser tasks, and a Free workspace 5 credits on AI calls, before it needs a plan. Specifications and the MCP server need Premium, Pro, Team or Enterprise; Plus and team workspaces without a plan get 3 trial specifications.

## Recipes

### 1. Browser task over REST

```bash
ID=$(curl -s https://api.pre.dev/browser-agent \
  -H "Authorization: Bearer $PREDEV_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"async": true, "tasks": [{"url": "https://example.com", "instruction": "Return the page heading", "output": {"type": "object", "properties": {"heading": {"type": "string"}}, "required": ["heading"]}}]}' | jq -r .id)

while :; do
  RUN=$(curl -s "https://api.pre.dev/browser-agent/$ID" -H "Authorization: Bearer $PREDEV_API_KEY")
  case $(echo "$RUN" | jq -r .status) in completed|failed) break ;; esac
  sleep 5
done
echo "$RUN" | jq '.results[] | {status, data, error}'
```

The batch `status` is lowercase (`processing`, `completed`, `failed`). Each task has its own uppercase `status`; read `data` only when it is `SUCCESS`.

### 2. AI call with the OpenAI SDK

```python
import os
from openai import OpenAI

client = OpenAI(base_url="https://api.pre.dev/v1", api_key=os.environ["PREDEV_API_KEY"])
reply = client.chat.completions.create(
    model="deepseek/deepseek-v4.1-flash",
    messages=[{"role": "user", "content": "Write a one-line welcome message."}],
)
print(reply.choices[0].message.content)
```

Use model ids exactly as `GET https://api.pre.dev/v1/models` lists them. Each call is charged in credits from its metered cost; `x-predev-credits-charged` reports the charge.

### 3. Specification over MCP, headless

```bash
claude mcp add --transport http predev https://api.pre.dev/mcp \
  --header "Authorization: Bearer $PREDEV_API_KEY"
```

Then call `fast_spec` with `executiveSummary` (what to build, at least 10 characters) and optional `existingContext` and `docURLs`. If it returns before the spec is done, poll `get_spec` with the spec id every few seconds until the status is `completed` or `failed`. `get_spec` and `list_specs` use no credits. Interactive clients can add the same URL without the header and sign in with OAuth.

### 4. Payments in an app built on pre.dev

The project's environment already holds `STRIPE_SECRET_KEY` (a project-tagged pre.dev key) and `STRIPE_API_HOST`. Point the Stripe SDK at that host and use Stripe as usual, from a server route:

```ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  host: process.env.STRIPE_API_HOST,
  protocol: (process.env.STRIPE_API_PROTOCOL as 'https' | 'http') || 'https',
  ...(process.env.STRIPE_API_PORT ? { port: Number(process.env.STRIPE_API_PORT) } : {}),
});

export async function createCheckout(priceId: string, origin: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/thanks`,
    cancel_url: `${origin}/cart`,
  });
  return session.url;
}
```

Payments run in Stripe test mode while you build (card `4242 4242 4242 4242`). The preview runs the app in a frame, so open Checkout in a new tab when framed. Stripe events are delivered to `/api/stripe/webhook`, signed with `STRIPE_WEBHOOK_SECRET`.

### 5. Coding agent in a terminal

```bash
curl -fsSL https://pre.dev/install | bash
predev "add dark mode to the settings page"
```

The CLI works in the current directory, on macOS and Linux. A person signs in once in a browser; on a machine without one it prints a link to open on another device. There is no unattended mode yet, so an agent cannot start the CLI on its own. Sign-in with an API key, for unattended runs, is coming.

## Rules for long-running work

- Save every id (`id`, `specId`) as soon as you get it. A timeout or a dropped stream does not mean the work stopped: fetch it by id before submitting again.
- Poll at a bounded interval, such as every 5 seconds, and stop on a terminal status. Do not infer completion from array lengths or counters.
- Send `Idempotency-Key` on browser submissions you might retry.
- AI Gateway errors use the OpenAI error shape; branch on `error.code` (`insufficient_credits`, `subscription_required`, `rate_limit_exceeded`) and honor `Retry-After`.

## Costs

- Browser tasks: each task is charged a 0.1-credit floor at submission, and a failed task keeps it; successful tasks can cost more.
- AI calls: charged per call from the model's metered cost. Credit prices per model are in `GET /v1/models`; catalog reads are free.
- Specifications: variable, based on the work.

## References

- Guide for agents: https://docs.pre.dev/agents
- Documentation index: https://docs.pre.dev/llms.txt
- REST OpenAPI: https://docs.pre.dev/api-reference/openapi.json
- AI Gateway OpenAPI: https://docs.pre.dev/api-reference/ai-gateway.openapi.json
- Product MCP: https://api.pre.dev/mcp (tool list at https://api.pre.dev/mcp/info)
- Docs MCP: https://docs.pre.dev/mcp
