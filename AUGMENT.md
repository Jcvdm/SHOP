# AUGMENT.md - Coding Agent Best Practices

## Overview

This document outlines best practices for Augment coding agents working on ClaimTech and similar projects. It focuses on efficient context usage, systematic workflows, and quality-first development.

---

## Core Principles

### 1. Context Efficiency
- **Start lightweight** - Read entry-point documentation first (80-150 lines, ~150 tokens)
- **Navigate precisely** - Use index files to locate specific documentation (200-400 lines, ~600-800 tokens)
- **Read targeted** - Only access full documentation after locating via index
- **Avoid redundancy** - Use quick references for overviews, avoid full docs unless needed

**Result**: 90-95% context reduction vs monolithic documentation

### 2. Information Gathering Before Editing
- Always use `codebase-retrieval` to understand code structure before making changes
- Ask for ALL symbols involved in edits at extremely low, specific level of detail
- Verify existence and signatures of classes/functions/const before using them
- Make parallel tool calls to gather information efficiently

### 3. Completeness Over Speed
- After EVERY edit, use `codebase-retrieval` to find ALL downstream changes needed
- Update all callers, implementations, tests, type definitions, imports
- Never create new test files unless explicitly requested
- Always update existing tests affected by changes

### 4. Scope Discipline
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation unless explicitly requested

---

## Workflow Patterns

### Pattern 1: Feature Implementation

1. **Understand Requirements**
   - Clarify user needs
   - Identify relevant skills/patterns
   - Create implementation plan

2. **Research Phase**
   - Check relevant skill resources
   - Read .agent documentation for current state
   - Document findings

3. **Design Phase**
   - Reference skill patterns for approach
   - Document architecture decisions

4. **Implementation Phase**
   - Follow skill workflows
   - Use skill patterns consistently
   - Track progress with task management
   - Use code execution for complex data processing

5. **Quality Assurance**
   - Verify compliance with patterns
   - Address issues found
   - Update documentation

### Pattern 2: Bug Fix with Testing

1. Gather context on the issue
2. Check database constraints and relationships
3. Implement fix following established patterns
4. Test fix across all affected scenarios
5. Update documentation

### Pattern 3: Data Processing

Use **Architecture A: Two-Phase Code Execution**:
- **Phase 1**: Fetch data using MCP tools
- **Phase 2**: Process data using code execution

**Benefits**: 73-94% token reduction, 5-10x faster completion

---

## Skills System

### 4 Active Skills

| Skill | Purpose | Auto-Invokes On | Use When |
|-------|---------|-----------------|----------|
| **supabase-development** | Database operations, RLS, services, storage | database, queries, RLS, storage, services, schema, migrations | Creating/modifying services, writing queries, implementing RLS, extending schema |
| **claimtech-development** | Platform workflows and patterns | features, SvelteKit, migrations, auth, PDF, components, routes | Implementing features, creating pages/routes, working with auth, generating PDFs |
| **assessment-centric-specialist** | Assessment workflow and stage-based pipeline | assessment, stage, workflow, pipeline, transitions | Implementing stage-based features, adding workflow stages, fixing assessment bugs |
| **photo-component-development** | Photo components with inline editing and optimistic updates | photo, image, label, gallery, viewer, thumbnail, carousel, inline edit, navigation tracking | Implementing photo viewers, adding label editing, working with galleries, debugging navigation |

**Skill Hierarchy**:
1. Start with claimtech-development for general feature work
2. Invoke supabase-development when working with database/services
3. Invoke assessment-centric-specialist for assessment workflow features
4. Invoke photo-component-development for photo viewer/editing features

---

## Documentation Navigation

### Entry Points by Task

**"I need to understand the system"**
→ `.agent/README.md` (80 lines)
→ `.agent/README/architecture_quick_ref.md` (250 lines)
→ `.agent/README/database_quick_ref.md` (250 lines)

**"I need to implement a feature"**
→ `.agent/README/task_guides.md` (find use case)
→ `.agent/README/sops.md` (find relevant SOP)
→ Specific SOP doc (500-1000 lines)

**"I need to debug an issue"**
→ `.agent/README/system_docs.md` (find bug postmortems)
→ `.agent/README/sops.md` (find debugging guide)
→ Specific troubleshooting doc

**"I need to process data efficiently"**
→ `.agent/SOP/using_code_executor.md` (decision tree)
→ `.agent/System/code_execution_patterns.md` (examples)
→ `.agent/System/mcp_code_api_reference.md` (API docs)

---

## Code Execution (Architecture A)

### When to Use
- ✅ Complex data transformations (multiple map/filter/reduce)
- ✅ Data analysis with calculations (averages, statistics)
- ✅ Report generation with formatting
- ✅ Cross-source correlation (combining multiple MCP results)
- ✅ JSON parsing and aggregation
- ✅ Batch validation logic (10+ records)

### When NOT to Use
- ❌ Simple single query (use MCP tool directly)
- ❌ Data already in desired format
- ❌ Need additional queries based on results
- ❌ Data too large to embed in code

---

## Best Practices Checklist

- [ ] Read entry-point documentation first
- [ ] Use codebase-retrieval before making edits
- [ ] Make parallel tool calls for efficiency
- [ ] Update all downstream changes after edits
- [ ] Update existing tests affected by changes
- [ ] Follow established skill patterns
- [ ] Use task management for complex work
- [ ] Mark tasks as COMPLETE immediately when done
- [ ] Avoid creating unnecessary files
- [ ] Update .agent docs after implementing features

---

## MCP Servers Available

| Server | Primary Use | Key Tools |
|--------|------------|-----------|
| **Supabase** | Database operations | execute_sql, apply_migration, list_tables |
| **GitHub** | Repository operations | get_file_contents, list_commits, search_code |
| **Playwright** | Browser automation | navigate, screenshot (E2E testing) |
| **Svelte** | Framework guidance | analyze_component |
| **Chrome DevTools** | Debugging | evaluate_expression |
| **Context7** | Documentation | search_docs |

**Critical**: Code execution runs in isolated Deno sandbox and CANNOT call MCP tools directly.

---

## Documentation Maintenance

After implementing features:
- Update relevant System/ docs if architecture changed
- Update relevant SOP/ if new patterns introduced
- Add bug postmortem if significant fix
- Update README indexes if new major documentation added

---

*Last Updated: November 2025*
*For ClaimTech and similar Augment projects*

