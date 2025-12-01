# Repository Guidelines

## Project Structure & Module Organization
`src` hosts the Svelte Kit app: page routes under `src/routes`, reusable helpers in `src/lib`, and the global stylesheet in `src/app.css`. Static assets and media live in `static`, while `scripts` and `servers/shadcn-svelte-mcp` store tooling and deployment helpers. `context-engine` is the companion Node service with its own `contexts`, `scripts`, and `.env.example`. `e2e` keeps Playwright suites, and `supabase` houses edge functions or migrations.

## Build, Test, and Development Commands
- `npm run dev` or `npm run dev -- --open` runs the Vite dev server.
- `npm run dev:mem` raises the Node heap limit when the standard dev server runs out of memory.
- `npm run build` (plus `npm run build:development`) generates production assets; `npm run preview` inspects the build locally.
- `npm run check` and `npm run check:watch` sync Svelte Kit and run `svelte-check` for type and template validation.
- `npm run lint` verifies formatting and lint rules, while `npm run format` rewrites files via Prettier.
- `npm run test:unit` runs Vitest, `npm run test:e2e` launches Playwright, and `npm run test` runs both sequentially.

## Coding Style & Naming Conventions
Tabs, single quotes, no trailing commas, and a 100-character print width come from `.prettierrc`. ESLint extends `@eslint/js`, `typescript-eslint`, and Svelte presets as configured in `eslint.config.js`; run `npm run lint` before pushing. Prefer PascalCase for components (for example, `src/lib/components/FeatureCard.svelte`), camelCase for helpers, and kebab-case for route files such as `src/routes/products/+page.svelte`.

## Testing Guidelines
Unit tests stay near their modules inside `src` or `src/lib` using `.spec.ts` or `.test.ts` naming. Playwright specs sit in `e2e/` with descriptive filenames like `e2e/user-onboarding.spec.ts`. Run `npm run test:unit` first, followed by `npm run test:e2e`; `npm run test` covers both. Keep `vitest-setup-client.ts` updated when mocking globals and describe key fixtures at the top of each test.

## Commit & Pull Request Guidelines
Summaries follow the existing style (`fix:`, `docs:`, `Settings:`) and stay under 72 characters, with optional supporting sentences. PRs should describe the problem, mention affected tickets, list commands executed (`npm run lint`, `npm run test`), and include screenshots for UI changes.

## MCP Integration & Codex Support
Use the Codex research package (see `CODEX_MCP_COMPLETE_RESEARCH_PACKAGE.md`) before onboarding MCPs. Install the Codex CLI globally, copy `codex.config.toml.example` into `~/.codex/config.toml`, and add the documented MCPs (`context7`, `github`, `playwright`, `chromedevtools`, and `supabase`) with `codex mcp add …` commands. Once configured, `codex` or `/mcp` inside the CLI launches the agent with ClaimTech-specific context; revisit `.agent/System/codex_setup.md` for environment notes and `.agent/README/CODEX_IMPLEMENTATION_CHECKLIST.md` for readiness checks.

## Security & Configuration Tips
Copy `.env.example` to `.env` and populate secrets locally; never commit secret values. Keep Supabase keys aligned with the target project and document any additional variables when editing `context-engine` or `supabase` code so reviewers can recreate the environment.
