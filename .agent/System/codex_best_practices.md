# CODEX.md - Coding Agent Best Practices

## Overview

This guide mirrors the Augment playbook for Codex agents working inside ClaimTech. Keep it close while collaborating so you stay aligned with the same standards. Start with `.agent/README.md` for app-level context, then use this file to drive day-to-day execution.

---

## Core Principles

### 1. Context Efficiency
- **Entry points first** – scan `.agent/README.md` (80 lines) before deep dives.
- **Use the README index** – `.agent/README/index.md` and `.agent/README/task_guides.md` tell you which doc to open next.
- **Targeted reads** – jump directly to the SOP/bug doc you need; avoid loading entire directories into context.
- **Avoid duplication** – if Augment already summarized something, point to it instead of re-reading.

**Goal:** match Augment’s 90-95% reduction in wasted tokens.

### 2. Information Gathering Before Editing
- Run lightweight codebase searches (`rg`, `ls`, `tree`) to understand structure.
- Confirm every symbol (functions, stores, endpoints) before using it.
- Use `.agent/System/mcp_code_api_reference.md` when reaching for MCP tooling; Codex can call the same APIs.
- Parallelize discovery commands to keep latency low.

### 3. Completeness Over Speed
- After editing, search for downstream references (imports, callers, tests) and update them immediately.
- Prefer augmenting existing tests; never create new suites unless the user explicitly orders it.
- When touching database code, sync with `.agent/SOP/*` patterns to avoid regressions.

### 4. Scope Discipline
- Deliver exactly what the user requested—no bonus files or unsanctioned refactors.
- Reuse existing documentation; only add new docs when the user asks for Codex-owned material (like this file).
- Respect the skill hierarchy (see below) and don’t bypass workflows defined in `.agent/README/sops.md`.

---

## Workflow Patterns

### Pattern 1: Feature Implementation
1. **Requirements** – restate the user’s need and map it to `.agent/README/task_guides.md`.
2. **Research** – read the relevant SOP or system doc before writing code.
3. **Design** – outline the approach referencing ClaimTech skill docs.
4. **Implementation** – follow the prescribed steps; when data access is needed, plan for code execution.
5. **QA & Documentation** – verify behavior, update impacted docs, link back to `.agent/README.md` sections.

### Pattern 2: Bug Fix with Testing
1. Capture context (logs, SOP guidance, related bug postmortems).
2. Validate constraints (database schema, services, client components).
3. Apply fix strictly within scope.
4. Update unit/integration tests touched by the change.
5. Document findings if the fix alters architecture or SOPs.

### Pattern 3: Data Processing (Architecture A)
- **Phase 1**: Fetch data via MCP (Supabase, GitHub, Files).
- **Phase 2**: Process inside the Codex code executor (TypeScript/Deno).
- Benefits mirror Augment’s stats: 73-94% token savings and 5-10x faster workflows.

Use Architecture A for complex transforms, report generation, and cross-source joins; skip it for single SQL queries or when new queries depend on previous results.

---

## Skills System

Follow the same skill cadence Augment uses:

| Skill | Purpose | Trigger Keywords | Notes |
| --- | --- | --- | --- |
| `claimtech-development` | Feature patterns, routes, auth, PDFs | feature, route, auth, pdf | Primary entry point for most tasks |
| `supabase-development` | Database schema, RLS, services | database, schema, rls, migrations | Use when touching backend data |
| `assessment-centric-specialist` | Assessment stages/pipelines | assessment, stage, workflow | Guards against regressions in the pipeline |
| `photo-component-development` | Photo viewer + inline editing | photo, image, gallery, labels | Covers realtime UI and optimistic updates |

Always start with `claimtech-development`, then layer additional skills as the problem domain narrows.

---

## Documentation Navigation

| Need | Read This |
| --- | --- |
| System overview | `.agent/README.md`, `.agent/README/architecture_quick_ref.md` |
| Feature flow | `.agent/README/task_guides.md`, `.agent/README/sops.md` |
| Bug history | `.agent/README/system_docs.md`, bug postmortems under `.agent/System/` |
| Code execution help | `.agent/SOP/using_code_executor.md`, `.agent/System/code_execution_patterns.md` |
| MCP APIs | `.agent/System/mcp_code_api_reference.md`, `.agent/System/mcp_setup.md` |

---

## Code Execution Checklist

Use code execution when:
- You need multiple transforms (map/filter/reduce) after fetching via MCP.
- The output is a report or formatted table.
- You’re joining results from multiple MCP servers.

Avoid code execution when:
- A single MCP call already returns the final answer.
- The dataset is so large you can’t safely embed it in the executor.

---

## Best Practices Recap

- [ ] Start with `.agent/README.md` for context.
- [ ] Gather code references before editing.
- [ ] Make parallel, targeted discovery calls.
- [ ] Update all downstream usages/tests.
- [ ] Stay within scope and follow SOPs.
- [ ] Use Architecture A for heavy data workflows.
- [ ] Mark tasks complete once the requested work ships.
- [ ] Document only when explicitly asked (Codex docs like this file are the exception).

---

*Last updated: November 21, 2025*  
*Maintainer: Codex agent team (mirrors Augment rulebook)*
