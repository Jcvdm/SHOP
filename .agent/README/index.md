# ClaimTech Documentation Master Index

**Last Updated**: November 28, 2025 (C001: Vehicle Location Capturing - Address Features)
**Total Documentation**: 33 System docs + 21 SOPs + Task/Historical files

---

## Getting Started

**For New Engineers:**
1. Read [Architecture Quick Ref](./architecture_quick_ref.md) - High-level system overview
2. Read [Database Quick Ref](./database_quick_ref.md) - Schema and relationships
3. Check [Task Guides](./task_guides.md) - "I want to..." navigation
4. Follow relevant [SOPs](./sops.md) for implementation

**For Specific Tasks:**
- Use [Task Guides](./task_guides.md) for use-case based navigation
- Browse [SOP Index](./sops.md) for how-to guides
- Check [System Docs Index](./system_docs.md) for architecture details

**Recent Changes:**
- See [Changelog](./changelog.md) for detailed update history
 - See [Bugs & Issues](../Tasks/bugs.md) for current open/resolved bugs

---

## System Documentation

**📚 [Complete System Docs Index](./system_docs.md)** - 41 files organized by category

### Core Architecture (MUST READ)
- **[Project Architecture](../System/project_architecture.md)** (977 lines) - Complete tech stack, 10-stage pipeline, security patterns
- **[Database Schema](../System/database_schema.md)** (1,420 lines) - All 28 tables, RLS policies, relationships
- **[Tech Stack](../System/tech-stack.md)** - Technology choices and versions

### Security & Authentication (CRITICAL)
- **[Session Management & Security](../System/session_management_security.md)** (751 lines) - Session architecture, JWT, cookies
- **[Security Recommendations](../System/security_recommendations.md)** - 100% RLS coverage achieved
- **[Database Verification Report](../System/database_verification_report.md)** (605 lines) - Historical security findings

### Development & Tooling
- **[Development Guide](../System/development_guide.md)** - npm scripts, environment setup
- **[MCP Setup](../System/mcp_setup.md)** - 6 MCP servers, code execution pattern
- **[Table Utilities Reference](../System/table_utilities.md)** (540 lines) - UI formatting helpers
- **[Audit Logging System](../System/audit_logging_system.md)** - Complete audit trail documentation

### Code Execution (MCP-as-Code-API) ⭐ NEW
- **[Code Execution Architecture](../System/code_execution_architecture.md)** (800+ lines) - Token efficiency (88-98% reduction), MCP server layers
- **[MCP Code API Reference](../System/mcp_code_api_reference.md)** (1,200+ lines) - Complete API reference for all 6 MCP servers
- **[Code Execution Patterns](../System/code_execution_patterns.md)** (600+ lines) - 6 comprehensive patterns for data workflows

### UI & Loading Patterns
- **[UI Loading Patterns](../System/ui_loading_patterns.md)** (690 lines) - All 3 loading patterns, complete guide
- **[Loading State Pattern Documentation](../System/loading_state_pattern_documentation_jan_30_2025.md)** - Latest patterns
- **[Photo Labeling Implementation](../System/photo_labeling_implementation_nov_6_2025.md)** - Photo editing UI, optimistic updates, keyboard shortcuts

### Bug Postmortems & Implementation History (17 files)
- **Recent Critical Fixes** (Jan 2025) - FRC transitions, badge counts, RLS policies
- **See [System Docs Index](./system_docs.md#bug-postmortems)** for complete list

---

## Standard Operating Procedures

**📝 [Complete SOP Index](./sops.md)** - 21 guides organized by category

### Database Operations
- **[Adding Database Migrations](../SOP/adding_migration.md)** (543 lines) - Migration workflow, templates
- **[Adding Page Routes](../SOP/adding_page_route.md)** (742 lines) - SvelteKit routing patterns

### Service & Data Layer
- **[Working with Services](../SOP/working_with_services.md)** (859 lines) - Service layer architecture, CRUD patterns
- **[Working with Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md)** (1,081 lines) - Core patterns, stage-based workflows
- **[Service Client Authentication](../SOP/service_client_authentication.md)** (333 lines) - ServiceClient injection for RLS

### Authentication & Security
- **[Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md)** (1,191 lines) - Auth patterns, form actions
- **[Fixing RLS Policies](../SOP/fixing_rls_insert_policies.md)** (947 lines) - Debug RLS INSERT/SELECT/UPDATE
- **[Fixing RLS Recursion](../SOP/fixing_rls_recursion.md)** (935 lines) - JWT claims pattern
- **[Password Reset Flow](../SOP/password_reset_flow.md)** (761 lines) - Two-step reset flow

### UI & Features
- **[Photo Labeling Patterns](../SOP/photo_labeling_patterns.md)** - Reusable photo editing patterns, optimistic updates
- **[Implementing Role-Based Filtering](../SOP/implementing_role_based_filtering.md)** (885 lines) - Engineer vs admin filtering
- **[Implementing Badge Counts](../SOP/implementing_badge_counts.md)** (803 lines) - Assessment-centric badges
- **[Creating Components](../SOP/creating-components.md)** (796 lines) - Svelte 5 runes, TypeScript
- **[Navigation-Based State Transitions](../SOP/navigation_based_state_transitions.md)** (591 lines) - Server-side state changes

### Code Execution & Data Processing ⭐ NEW
- **[Using Code Executor](../SOP/using_code_executor.md)** (500+ lines) - Step-by-step guide for executing TypeScript code via MCP servers

### Debugging & Testing
- Various debugging guides for auth hooks, race conditions, testing patterns
- **See [SOP Index](./sops.md#debugging-testing)** for complete list

---

## Task-Based Navigation

**🎯 [Complete Task Guides](./task_guides.md)** - Use-case based navigation

**Quick Links:**
- **I want to add a feature** → [Task Guides: New Feature](./task_guides.md#new-feature)
- **I want to fix a bug** → [Task Guides: Debugging](./task_guides.md#debugging)
- **I want to add a database table** → [Task Guides: Database](./task_guides.md#database)
- **I want to implement authentication** → [Task Guides: Auth](./task_guides.md#auth)
- **I want to create a new page** → [Task Guides: Pages](./task_guides.md#pages)

---

## Quick References

### High-Level Overviews
- **[Architecture Quick Ref](./architecture_quick_ref.md)** (200-300 lines) - Tech stack, pipeline, principles
- **[Database Quick Ref](./database_quick_ref.md)** (200-300 lines) - Tables, relationships, RLS patterns

### Historical & Maintenance
- **[Changelog](./changelog.md)** (500-800 lines) - Recent updates and bug fixes
- **[FAQ](./faq.md)** (200-300 lines) - Common questions and troubleshooting

---

## Recent Docs
- System: [FRC Mechanics](../System/frc_mechanics.md)
- SOP: [FRC Refresh Snapshot](../SOP/frc_refresh.md), [FRC Decisions](../SOP/frc_decisions.md)
- Task: [FRC UI & Logic Refinement](../Tasks/FRC_UI_logic_refinement.md)
- System: [FRC Alignment Implementation](../System/frc_alignment_implementation_nov_20_2025.md) (NEW)
- System: [Fix FRC Report Line Items for Removed Lines](../System/frc_report_removed_lines_update_nov_20_2025.md) (NEW)


## Agent-Specific Entry Points

### research-analyst
**Start with**: [System Docs Index](./system_docs.md)
- Use for architecture research, bug postmortem analysis, implementation history

### backend-api-dev
**Start with**: [Database Quick Ref](./database_quick_ref.md)
- Then: [SOPs](./sops.md) for services, migrations, RLS
- **Code Execution**: Use [Using Code Executor](../SOP/using_code_executor.md) for multi-step data workflows

### system-architect
**Start with**: [Architecture Quick Ref](./architecture_quick_ref.md)
- Then: [System Docs](./system_docs.md) for full architecture details
- Check: [Changelog](./changelog.md) for recent design changes

### implementation-coder
**Start with**: [Task Guides](./task_guides.md)
- Then: [SOP Index](./sops.md) to find relevant how-to guides
- Reference: [System Docs](./system_docs.md) for context

### code-quality-analyzer
**Start with**: [System Docs](./system_docs.md)
- Review: Architecture patterns, security standards, service layer design
- Check: [SOPs](./sops.md) for best practices

---

## Documentation Structure Summary

```
.agent/
├── README.md (80 lines) ← You started here
├── README/
│   ├── index.md (THIS FILE) ← Master navigation
│   ├── system_docs.md ← Index of 34 System/ files
│   ├── sops.md ← Index of 21 SOP/ files
│   ├── architecture_quick_ref.md ← High-level overview
│   ├── database_quick_ref.md ← Schema summary
│   ├── changelog.md ← Recent updates
│   ├── task_guides.md ← Use-case navigation
│   └── faq.md ← Common questions
├── System/ (34 files)
│   ├── Core Architecture (3 files)
│   ├── Security & Auth (3 files)
│   ├── Development Guides (4 files)
│   ├── Code Execution (3 files) ⭐ NEW
│   ├── UI & Loading Patterns (3 files)
│   └── Bug Postmortems (18 files)
├── SOP/ (21 files)
│   ├── Database Operations (2 files)
│   ├── Service & Data Layer (3 files)
│   ├── Authentication & Security (4 files)
│   ├── UI & Features (5 files)
│   ├── Code Execution (1 file) ⭐ NEW
│   └── Debugging & Testing (6 files)
└── Tasks/
    ├── active/ (17 files) - Reference docs only
    ├── completed/ (36 files) - Recently finished tasks
    ├── historical/ (64 files) - Long-term archive
    ├── future/ (1 file)
    └── scan_reports/
```

---

## Navigation Best Practices

### For Efficient Context Usage
1. **Start lightweight** - Read this index (200 lines, ~400 tokens)
2. **Navigate precisely** - Use category indexes to find specific doc
3. **Read targeted** - Only read the documentation you need
4. **Use quick refs** - For overviews, avoid full docs

### Typical Navigation Paths

**"I need to understand the system"**
→ [Architecture Quick Ref](./architecture_quick_ref.md) (250 lines)
→ [Database Quick Ref](./database_quick_ref.md) (250 lines)
→ Specific System docs as needed

**"I need to implement a feature"**
→ [Task Guides](./task_guides.md) (find use case)
**Maintained by**: ClaimTech Engineering Team
