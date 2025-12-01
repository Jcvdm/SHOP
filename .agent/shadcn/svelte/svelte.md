# shadcn-svelte MCP Guide

Mastra's `shadcn-svelte-mcp` server gives any MCP-capable editor first-class access to shadcn-svelte docs, install guides, and Lucide icon search. This page tracks how ClaimTech uses it and how to stay aligned with the Svelte-specific guidance.

## Quick Facts
- **Primary endpoint (Mastra Cloud, zero cold start)**: `https://shadcn-svelte.mastra.cloud/api/mcp/shadcn/sse`
- **HTTP fallback**: replace `/sse` with `/mcp`
- **Secondary host (Railway, cold start <2s)**: `https://shadcn-svelte-mcp.up.railway.app/api/mcp/shadcn/{sse|mcp}`
- **Source repo**: `servers/shadcn-svelte-mcp` (cloned 2025-11-21 for reference)
- **Reminder**: This server is ONLY for shadcn-svelte (Svelte/SvelteKit). Never suggest React/JSX APIs like `asChild`, `children`, or hooks.

## Access from Claude Desktop
- Config file: `C:\Users\Jcvdm\AppData\Roaming\Claude\claude_desktop_config.json`
- Entry already added:

```json
"shadcn-svelte": {
  "command": "npx",
  "args": [
    "-y",
    "mcp-remote",
    "https://shadcn-svelte.mastra.cloud/api/mcp/shadcn/sse"
  ]
}
```

Claude requires a restart after edits. Use `/permissions` if Claude prompts for tool access.

## Other Client Config Snippets
- **OpenAI Codex CLI**
  ```bash
  codex mcp add shadcn-svelte --url https://shadcn-svelte.mastra.cloud/api/mcp/shadcn/sse
  codex mcp list
  ```
- **Cursor (`settings.json` -> MCP)**
  ```json
  "shadcn-svelte": {
    "type": "sse",
    "url": "https://shadcn-svelte.mastra.cloud/api/mcp/shadcn/sse"
  }
  ```
  Swap the URL with the Railway host if Mastra Cloud is ever down.
- **Windsurf (`~/.codeium/windsurf/mcp_config.json`)**
  ```json
  "mcpServers": {
    "shadcn-svelte": {
      "url": "https://shadcn-svelte.mastra.cloud/api/mcp/shadcn/sse",
      "transport": "sse"
    }
  }
  ```
- **Zed (`~/.config/zed/settings.json`)**
  ```json
  "context_servers": {
    "shadcn-svelte": {
      "source": "custom",
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://shadcn-svelte.mastra.cloud/api/mcp/shadcn/sse"
      ]
    }
  }
  ```

## Tool Catalogue
Each tool is discoverable once the server is running:

| Tool ID | Purpose | Use When | Sample Prompt |
| --- | --- | --- | --- |
| `shadcnSvelteListTool` | Lists every component, block, chart, doc section scraped from shadcn-svelte.com. | Need to explore what's available or confirm naming. | "List all chart components in shadcn-svelte." |
| `shadcnSvelteSearchTool` | Fuzzy search (typo tolerant) that ranks components, blocks, docs, and charts. Includes install commands in results. | You have a keyword but not the exact slug. | "Search shadcn-svelte for 'combobox' examples." |
| `shadcnSvelteGetTool` | Fetches the latest markdown for a specific component/doc/block/chart. Adds install commands + metadata. | Ready to implement something specific. Always run to verify before writing guidance. | "Get docs for the dialog component." |
| `shadcnSvelteIconsTool` | Lucide icon search/browse with filters by tag/name. | Need icons that match a concept or want quick copyable SVG snippets. | "Find Lucide icons related to onboarding." |

### Guided Prompts baked into the server
The Mastra server ships pre-built workflows (MCP prompts) that show up inside Claude/Cursor when choosing a tool:
1. **Install shadcn-svelte Component** - takes a component name + package manager (`npm`, `pnpm`, `yarn`). It will auto-call `shadcnSvelteGetTool` to confirm availability, then emit the correct CLI command (`pnpm dlx shadcn-svelte@latest add <component>` format) and wiring steps.
2. **Custom Theming / CSS Variables Guide** - fetches docs plus instructions for editing `app.postcss` / tokens.
3. **CLI Usage Deep Dive** - always re-fetches the CLI docs to avoid hallucinating commands.
4. **New Project Bootstrap** - step-by-step SvelteKit + shadcn-svelte setup.

When building instructions for teammates, explicitly call out that the prompts are available so future copilots can reuse them instead of free-text answers.

## Recommended Workflow
1. **Discover** with `List` or `Search` to make sure a component exists (this prevents getting React-only components stuck in responses).
2. **Verify** with `Get` even when you already "know" something - docs are scraped live and change frequently.
3. **Icons** - run after `Get` if the UI story needs supporting icons; results include `pnpm dlx lucide-svelte` install hints.
4. **Installation command** - always echo the CLI command from docs (pnpm preferred). Never invent `npx shadcn-svelte add`.
5. **Link back** - the `Get` response includes canonical URLs; keep those in final answers for easy navigation.

## Testing & Troubleshooting
- Quick connection test (already verified):
  ```bash
  npx mcp-remote https://shadcn-svelte.mastra.cloud/api/mcp/shadcn/mcp
  ```
  Expect `Proxy established successfully...`.
- If Mastra Cloud is slow or tools do not appear, retry once (Railway cold start). Use the Railway host when Mastra is down.
- A `403` or `404` usually means the component slug is wrong. Fall back to `shadcnSvelteListTool` to inspect naming, then re-run `Get`.
- For Claude, ensure `/permissions` allows the new server if it prompts about tools.

## Local Development (Optional)
- Repo path: `servers/shadcn-svelte-mcp`
- Install deps with preferred package manager (`npm install`, `pnpm install`, or `bun install`).
- Smoke test with `npm run dev` (Mastra boot + quick tool initialization check, ~15s).
- Build/start commands:
  - `npm run build`
  - `npm run start`
- Useful scripts: `npm run check-versions`, `npm run sync-versions`, `npm run sync-versions-auto`.

Local runs require Node >= 20.9 and valid Firecrawl credentials for the advanced scraping modes (set env vars before running).

## Operational Notes
- Restart any MCP client after modifying its config file.
- Treat this as a reference server - do not edit upstream code unless contributing back to the public repo.
- Keep instructions Svelte-specific; prefer `.svelte` snippets, `<script lang="ts">`, `export let`, stores, etc.
- Update this guide whenever endpoints change or Mastra/Railway deployments move.

_Last updated: 2025-11-21_
