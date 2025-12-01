# ClaimTech Documentation

**Project**: ClaimTech (SVA - SvelteKit Validation App)
**Last Updated**: November 29, 2025 (Logo UI Enhancements - Size Increase & Modern Animations ✅ | Audit Trail User Context Feature ✅ | Additionals Letter Notes Section ✅ | PDF Generation Enhancements: Damage Report + Estimate + Photos ✅ | Tyre Position Order & Additionals Assessor Fix ✅ | Damage Inspection Report Enhancements ✅ | Accessories Report Integration ✅)
**Status**: ✅ Svelte 5 Migration Complete - 0 Errors, 12 Warnings (All Intentional) | ✅ Accessories in Report PDF | ✅ C001: Vehicle Location Capturing (Google Places autocomplete with fallback) | ✅ Photo Compression Live (60-75% storage reduction) | ✅ Slate Theme Migration (Phases 1-5 complete, rose accents preserved)

---

## Project Overview

- **Frontend**: SvelteKit 5 + TypeScript + Tailwind CSS 4
- **Backend**: SvelteKit SSR + Supabase PostgreSQL
- **Auth**: Supabase Auth with 100% RLS coverage
- **Architecture**: Assessment-centric (10-stage pipeline)
- **Documentation**: 42 System docs, 19 SOPs, 31 database tables
- **Deployment**: ✅ Live on Vercel (https://claimtech.vercel.app)
- **Type Safety**: ✅ Full Supabase type generation with PostgrestFilterBuilder inference working

---

## Quick Start

- **New to project?** → [Getting Started Guide](./README/index.md#getting-started)
- **Need specific info?** → [Master Index](./README/index.md)
- **How do I...?** → [Task Guides](./README/task_guides.md)
- **Architecture overview?** → [Architecture Quick Ref](./README/architecture_quick_ref.md)
- **Database info?** → [Database Quick Ref](./README/database_quick_ref.md)
- **What changed recently?** → [Changelog](./README/changelog.md)

---

## Documentation Categories

### 📚 [System Documentation](./README/system_docs.md)
Complete index of architecture, database, security, UI patterns, and bug postmortems (30 files).

### 🌹 Shadcn UI Playbook (.agent/shadcn)
- **pdr.md** – Project Development Report tracking Svelte 5 migration progress (449 → 0 errors ✅, Session 4: 24 → 9 warnings via accessibility/deprecation/reactivity fixes)
- **svelte5-error-patterns.md** – Comprehensive guide to Svelte 5 error patterns and fixes
- **sidebar-modernization.md** – notes on modernizing the dashboard sidebar with shadcn-svelte primitives and rose token theming.
- **top-bar-research.md** – captures the comparison with shadcn/ui’s header and the rose gradient update we applied in the layout.
- **login-modernization.md** – planning doc for the hero-driven login card and rose-accent form styles.
- **date-picker.md** – explains why Incident date selection now uses `Popover` + `Calendar` for Svelte 5 compatibility.
- **requests-flow-alignment.md** – records the tabs/alert/dialog alignment for the Requests list and New Request form.
- **svelte5-upgrade-checklist.md** – end-to-end plan for moving from bits-ui v2 to Svelte 5-native shadcn components.

### 🎨 Slate Theme Migration (.agent/System)
- **slate_theme_migration_checklist.md** – Detailed checklist of all 40+ components updated
- **slate_theme_detailed_components.md** – Component-by-component guide with line numbers
- **slate_theme_implementation_summary.md** – Phase-by-phase implementation plan
- **slate_theme_visual_reference.md** – Color palette reference and visual guide
- **slate_theme_complete_file_list.md** – Complete file inventory organized by tier

### 📝 [Standard Operating Procedures](./README/sops.md)
Step-by-step guides for database operations, services, authentication, UI features, and debugging (19 files).

### 🎯 [Task Guides](./README/task_guides.md)
Use-case based navigation: "I want to add a feature", "I want to fix a bug", etc.

### ❓ [FAQ](./README/faq.md)
Common questions and troubleshooting.

---

## For AI Agents

### Quick Entry Points
- **research-analyst** → Start with [system_docs.md](./README/system_docs.md)
- **backend-api-dev** → Check [database_quick_ref.md](./README/database_quick_ref.md) + [Supabase MCP](#supabase-mcp-integration)
- **system-architect** → Read [architecture_quick_ref.md](./README/architecture_quick_ref.md)
- **implementation-coder** → Use [task_guides.md](./README/task_guides.md) + [sops.md](./README/sops.md)
- **code-quality-analyzer** → Review [system_docs.md](./README/system_docs.md) for standards
- **All agents** → See [Master Index](./README/index.md) for complete navigation

### Navigation Pattern (Context-Efficient)
1. **Start here** - Read this file (87 lines, ~150 tokens)
2. **Find category** - Read relevant index file (200-400 lines, ~600-800 tokens)
3. **Read document** - Access specific System/ or SOP/ file

**Context Savings**: 90-95% vs reading old 1,714-line README

---

## Supabase Integration

### Supabase CLI
Command-line tool for managing database migrations, generating types, and working with branches.

**Quick Start**:
```bash
npm run generate:types  # Generate TypeScript types from database
supabase db diff -f migration_name  # Create migration
supabase db push  # Apply migrations to remote
```

**Documentation**: [System/supabase_cli.md](./System/supabase_cli.md)
**Workflow Guide**: [SOP/supabase_cli_workflow.md](./SOP/supabase_cli_workflow.md)

### Supabase MCP Integration

Supabase MCP server is configured for direct database access during development:

**Capabilities**:
- Query tables and schemas via MCP tools
- Execute SQL directly for testing
- List all tables and relationships
- Apply migrations during development
- Verify RLS policies

**For backend-api-dev agent**: Use MCP for investigation and testing, not production code.

**Setup Guide**: [System/mcp_setup.md](./System/mcp_setup.md)

---

## Complete Navigation

**→ [Master Index](./README/index.md)** - Comprehensive navigation hub

---

*This README is intentionally lightweight (87 lines). For detailed information, navigate to specific documentation via the links above.*
