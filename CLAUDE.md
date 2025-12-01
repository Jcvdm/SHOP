# CLAUDE.md - Project Configuration

## Quick Reference: How Claude Works Here

```
┌────────────────────────────────────────────────────────────────────────┐
│  YOU ARE THE ORCHESTRATOR - DELEGATE, DON'T IMPLEMENT DIRECTLY         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. ASSESS → Is this trivial (<10 lines, 1 file)? Execute directly.   │
│              Otherwise, ALWAYS CREATE A TASK AND DELEGATE.             │
│                                                                        │
│  2. TASK   → Create task in .agent/Tasks/active/TASK_NAME.md          │
│              (Coder agent reads this for context)                      │
│                                                                        │
│  3. DELEGATE → Coder Agent: "Implement .agent/Tasks/active/X.md"      │
│                Context/Explore: For research, finding code            │
│                Planner: For complex architectural decisions            │
│                                                                        │
│  4. TRACK  → Update task status, move to completed/ when done         │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  ⚠️  CRITICAL: Even after planning, DELEGATE implementation to Coder! │
│  Do NOT implement directly just because you have a detailed plan.     │
│  The plan becomes the task document → Coder executes it.              │
├────────────────────────────────────────────────────────────────────────┤
│  CONTEXT EFFICIENCY: Don't read files to "understand" - use agents.   │
│  Task documents ARE the context. Reference, don't repeat.             │
└────────────────────────────────────────────────────────────────────────┘
```

**Outstanding Tasks**: Check `.agent/Tasks/active/` for PRDs to continue
**Documentation**: Check `.agent/README.md` for project context (87 lines)

---

## Project Info

**Supabase Project ID**: `cfblmkzleqtvtfxujikf`
**Project Name**: SVA (ClaimTech)
**Region**: eu-central-1

---

## DOCS

We keep all important docs in .agent folder with a lightweight, layered index system:

```
.agent/
├── README.md (80 lines) - Lightweight entry point
├── README/ - Focused index files
│   ├── index.md - Master navigation hub
│   ├── system_docs.md - Index of 28 System/ files
│   ├── sops.md - Index of 18 SOP/ files
│   ├── architecture_quick_ref.md - High-level overview
│   ├── database_quick_ref.md - Schema summary
│   ├── changelog.md - Recent updates
│   ├── task_guides.md - Use-case navigation
│   └── faq.md - Common questions
├── System/ - Architecture, database, security docs (28 files)
├── SOP/ - How-to guides & procedures (18 files)
└── Tasks/ - PRDs and implementation plans
```

**CRITICAL - Context-Efficient Navigation:**
1. **Start lightweight** - Read .agent/README.md (80 lines, ~150 tokens)
2. **Navigate efficiently** - Read relevant .agent/README/*.md index (200-400 lines, ~600-800 tokens)
3. **Read targeted** - Access specific System/ or SOP/ document only when needed

**Context Savings**: 90-95% reduction vs old 1,714-line README

**For AI Agents:**
- Use .agent/README.md as FIRST step (never skip this)
- Use index files (.agent/README/*.md) to FIND documentation
- Only read full System/ or SOP/ docs after locating via index
- Use quick refs for overviews, avoid reading full docs unless needed

We should always update .agent docs after implementing features to keep information current

---

## Claude Skills

Claude Skills are **domain expertise modules** that auto-invoke based on keywords and context. ClaimTech has 4 active skills that provide specialized knowledge and patterns.

### Active Skills

#### 1. **supabase-development**
**Purpose**: Supabase database operations, services, RLS policies, and storage
**Auto-invokes on**: database, queries, RLS, storage, services, schema, migrations
**Use when**:
- Creating or modifying services
- Writing database queries
- Implementing RLS policies
- Working with Supabase Storage
- Extending database schema

**Key Patterns**:
- ServiceClient injection pattern
- Three Supabase clients (browser, SSR, service role)
- Unique ID generation (CLM-2025-001, ASM-2025-001)
- Audit logging conventions
- Can leverage code execution for complex data transformations

**Resources**: `.claude/skills/supabase-development/`

---

#### 2. **claimtech-development**
**Purpose**: ClaimTech platform development workflows and patterns
**Auto-invokes on**: features, SvelteKit, migrations, auth, PDF, components, routes
**Use when**:
- Implementing new features
- Creating SvelteKit pages/routes
- Working with authentication
- Generating PDFs or reports
- Following ClaimTech conventions

**Key Workflows**:
1. Database Migration (15-30 min)
2. Service Layer Implementation (20-40 min)
3. SvelteKit Page Route (30-60 min)
4. Authentication & Authorization (20-40 min)
5. PDF Generation (30-60 min)
6. File Storage & Photos (20-40 min)

**Resources**: `.claude/skills/claimtech-development/resources/`

---

#### 3. **assessment-centric-specialist**
**Purpose**: Assessment-centric architecture and stage-based workflow
**Auto-invokes on**: assessment, stage, workflow, pipeline, transitions
**Use when**:
- Implementing stage-based features
- Adding workflow stages
- Working with assessment lifecycle
- Fixing assessment-related bugs
- Ensuring assessment-centric compliance

**Key Concepts**:
- Assessment created WITH request (not at "Start Assessment")
- One assessment per request (unique constraint)
- 10 pipeline stages (request_submitted → archived/cancelled)
- Nullable foreign keys with check constraints
- Idempotent operations
- Complete audit trail

**Resources**: `.claude/skills/assessment-centric-specialist/`

---

#### 4. **photo-component-development**
**Purpose**: Photo component patterns with inline editing, optimistic updates, and navigation tracking
**Auto-invokes on**: photo, image, label, gallery, viewer, thumbnail, carousel, inline edit, navigation tracking
**Use when**:
- Implementing photo viewer components
- Adding photo label editing
- Working with photo galleries
- Debugging photo navigation issues
- Implementing optimistic updates for photos

**Key Patterns**:
- Fixed Bottom Bar pattern (fullscreen viewers)
- Modal Footer pattern (dialog viewers)
- Thumbnail Overlay pattern (inline galleries)
- Optimistic update pattern (instant UI feedback)
- Navigation tracking (prevents "wrong photo" bugs)

**Resources**: `.claude/skills/photo-component-development/`

---

### Skill Usage Guidelines

**Skill Hierarchy**:
1. **Start with claimtech-development** for general feature work
2. **Invoke supabase-development** when working with database/services
3. **Invoke assessment-centric-specialist** for assessment workflow features
4. **Invoke photo-component-development** for photo viewer/editing features

**Skills + .agent Documentation**:
- **Skills provide HOW** - Patterns, workflows, conventions
- **.agent docs provide WHAT** - Current state, architecture, schemas
- **Use both together** - Skills for methodology, .agent for context

**Best Practices**:
- Skills auto-invoke based on keywords - use relevant terms in your requests
- Reference skill patterns when implementing features
- Update skills when establishing new patterns
- Skills complement (not replace) .agent documentation

---

## Agent Orchestration

Claude uses a **multi-agent system** optimized for cost, capability, and **context efficiency**. The Orchestrator MUST delegate to specialized agents proactively—this is not optional for qualifying tasks.

### Core Principle: Delegate, Don't Execute Directly

**The Orchestrator should NOT:**
- Read dozens of files to gather context (use Context/Explore agents)
- Implement multi-file changes directly (use Coder agent)
- Design complex features inline (use Planner agent)
- Search extensively to answer "how does X work?" (use Explore agent)

**The Orchestrator SHOULD:**
- Quickly assess task complexity
- Delegate to the right agent immediately
- Coordinate agent outputs
- Summarize results for the user

### Available Agents

| Agent | Model | Cost | Purpose | Trigger Keywords |
|-------|-------|------|---------|-----------------|
| **Explore** | Haiku | $ | Fast codebase exploration, file patterns, code search | "find", "where", "how does X work", "search" |
| **Context** | Haiku | $ | Gather comprehensive context before planning | "understand", "research", "before implementing" |
| **Planner** | Opus | $$$$ | Deep reasoning, complex plans | multi-file, architecture, ambiguous |
| **Coder** | Sonnet | $$ | Execute code changes | "implement", "fix", "add feature" |
| **Docs** | Haiku | $ | Update documentation | "update docs", after implementations |

### Decision Matrix: When to Use Each Agent

```
┌─────────────────────────────────────────────────────────────────────────┐
│ User Request                                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Is this a SEARCH/EXPLORE?   │
                    │   ("find X", "where is Y",    │
                    │    "how does Z work?")        │
                    └───────────────────────────────┘
                           │YES              │NO
                           ▼                 ▼
                    ┌─────────────┐  ┌───────────────────────────┐
                    │ EXPLORE     │  │   Is this CODE CHANGES?    │
                    │ Agent       │  └───────────────────────────┘
                    │ (Haiku)     │         │YES            │NO
                    └─────────────┘         ▼               ▼
                                    ┌─────────────┐  ┌────────────────┐
                                    │ How complex?│  │ Simple Q&A     │
                                    └─────────────┘  │ → Answer       │
                                           │         │   directly     │
                        ┌──────────────────┼─────────────────┐
                        │                  │                 │
                        ▼                  ▼                 ▼
                 ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
                 │ SIMPLE      │   │ MODERATE    │   │ COMPLEX     │
                 │ (1-2 files, │   │ (3-5 files, │   │ (5+ files,  │
                 │  clear fix) │   │  patterns)  │   │  arch, new) │
                 └─────────────┘   └─────────────┘   └─────────────┘
                        │                  │                 │
                        ▼                  ▼                 ▼
                 ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
                 │ Execute     │   │ CODER       │   │ CONTEXT →   │
                 │ directly    │   │ Agent       │   │ PLANNER →   │
                 │ (Orch)      │   │ (Sonnet)    │   │ CODER       │
                 └─────────────┘   └─────────────┘   └─────────────┘
```

### Agent Usage Guidelines

#### 1. Explore Agent (Haiku) - USE LIBERALLY
**Cost**: Very low (~$0.001 per exploration)
**When**: ANY time you need to find files, patterns, or understand code
**Trigger**: Searches that might require multiple Glob/Grep/Read operations

```
✅ USE for:
- "Where is the assessment service?"
- "Find all components that use X"
- "How does authentication work?"
- "What files handle photo uploads?"

❌ DON'T use for:
- Reading a single known file
- Simple grep for exact match
```

#### 2. Context Agent (Haiku) - USE BEFORE PLANNING
**Cost**: Very low
**When**: Before invoking Planner, or when comprehensive context needed
**Purpose**: Gather related files, patterns, DB schema efficiently

```
✅ USE for:
- Gathering context before complex features
- Understanding multiple related systems
- Research tasks with broad scope

❌ DON'T use for:
- Simple file lookups (use Explore)
- When you already have context
```

#### 3. Planner Agent (Opus) - USE FOR COMPLEXITY
**Cost**: High - but worth it for complex work
**When**: Multi-file features, architectural decisions, ambiguous requirements
**Purpose**: Deep reasoning, detailed implementation plans

```
✅ USE for:
- Features touching 5+ files
- New architectural patterns
- Unclear requirements needing analysis
- Database schema design

❌ DON'T use for:
- Bug fixes with clear cause
- Changes following existing patterns
- Simple CRUD operations
```

#### 4. Coder Agent (Sonnet) - USE FOR IMPLEMENTATION
**Cost**: Medium
**When**: Executing plans or straightforward code changes
**Purpose**: Write code, make changes, run builds

```
✅ USE for:
- Executing Planner's detailed plans
- Changes to 3+ files
- Features following existing patterns
- Bug fixes requiring multiple file changes

❌ DON'T use for:
- Trivial 1-2 line fixes
- Single file changes
```

#### 5. Document Updater (Haiku) - USE AFTER CHANGES
**Cost**: Very low
**When**: After implementing features, user request
**Purpose**: Keep .agent/ docs current

### Context Efficiency Rules

**CRITICAL: Minimize context consumption in main conversation**

1. **Delegate searches immediately** - Don't Glob/Grep/Read extensively in main thread
2. **Use agents for exploration** - They return summaries, not full file contents
3. **Read only what's necessary** - When reading files, use offset/limit for large files
4. **Trust agent summaries** - Don't re-read files agents have summarized
5. **Batch agent calls** - Launch multiple agents in parallel when independent

### Proactive Agent Usage Examples

**Bad (wasteful):**
```
User: "Add a comments feature to assessments"
Orchestrator:
  - Reads 15 files to understand current patterns
  - Reads database schema docs
  - Reads component structure
  - Then starts implementing directly
  Result: 50k+ tokens consumed before any code written
```

**Good (efficient):**
```
User: "Add a comments feature to assessments"
Orchestrator:
  1. Launch Context Agent: "Gather context for comments feature on assessments"
  2. Launch Planner Agent (with context): "Design comments feature implementation"
  3. Launch Coder Agent: "Execute the plan"
  Result: ~15k tokens, better quality code
```

### Parallel Agent Execution

When tasks are independent, launch agents in parallel:

```typescript
// Good: Launch context gathering in parallel
await Promise.all([
  Task("Explore: find assessment components"),
  Task("Context: gather database schema for assessments"),
  Task("Explore: find existing comment implementations")
]);
```

### Agent Files

Detailed prompts for each agent are in `.claude/agents/`:
- `context-agent.md` - Context gathering patterns
- `planner-agent.md` - Planning and design patterns
- `document-updater.md` - Documentation patterns
- `coder-agent.md` - Implementation patterns

---

## Workflow Guidelines

### Task-Driven Development

**CRITICAL: All significant work should be tracked in `.agent/Tasks/`**

The `.agent/Tasks/` folder is the **central task tracker and lightweight code index**:
```
.agent/Tasks/
├── README.md       - Template and guidelines
├── active/         - Current PRDs and tasks (Coder reads these)
├── completed/      - Finished tasks (reference)
├── historical/     - Archived documentation
└── future/         - Planned features
```

### The Orchestrator's Role

**You (the Orchestrator) are a TASK MANAGER, not an implementer.**

Your job is to:
1. **Create PRDs/tasks** in `.agent/Tasks/active/` for complex work
2. **Delegate implementation** to Coder agent with clear task references
3. **Coordinate** between agents (Context → Planner → Coder → Docs)
4. **Track progress** by updating task status
5. **Summarize results** to the user

### Task-First Workflow

**Step 0: Assess Complexity (ALWAYS DO THIS FIRST)**
```
Is this task:
□ TRIVIAL (1 file, <10 lines) → Execute directly
□ SIMPLE (1-2 files, clear scope) → Create brief task note, execute
□ MODERATE (3-5 files) → Create task in .agent/Tasks/active/, delegate to Coder
□ COMPLEX (5+ files, architecture) → Create PRD, use Planner, delegate to Coder
□ RESEARCH → Use Explore agent, document findings
```

### For MODERATE/COMPLEX Tasks: Create Task First

**Before any implementation, create a task document:**

```markdown
# .agent/Tasks/active/FEATURE_NAME_TASK.md

**Created**: YYYY-MM-DD
**Status**: Planning | In Progress | Completed
**Complexity**: Moderate | Complex

## Overview
What needs to be done and why.

## Files to Modify
- `path/to/file1.ts` - What changes needed
- `path/to/file2.svelte` - What changes needed

## Implementation Steps
1. Step one
2. Step two
3. Step three

## Verification
- [ ] npm run check passes
- [ ] Feature works as expected

## Notes
Any context Coder agent needs.
```

### Delegating to Coder Agent

**Always include task reference when delegating:**

```
Good: "Implement the task defined in .agent/Tasks/active/COMMENTS_FEATURE_PDR.md"
Bad: "Add a comments feature" (no task reference)
```

**Coder agent workflow:**
1. Reads the task document from `.agent/Tasks/active/`
2. Implements according to the plan
3. Runs verification steps
4. Reports completion
5. Orchestrator moves task to `completed/` or updates status

### Complete Task-Driven Flow

```
1. User: "Add feature X"
         │
         ▼
2. Orchestrator assesses: "Complex feature"
         │
         ▼
3. Orchestrator creates: .agent/Tasks/active/FEATURE_X_PDR.md
         │
         ▼
4. (If needed) Context Agent: "Gather patterns for feature X"
         │
         ▼
5. (If needed) Planner Agent: "Create detailed implementation plan"
         │
         ▼
6. Update task document with plan details
         │
         ▼
7. Coder Agent: "Implement task in .agent/Tasks/active/FEATURE_X_PDR.md"
         │
         ▼
8. Coder reports completion → Orchestrator verifies
         │
         ▼
9. Move task to .agent/Tasks/completed/
         │
         ▼
10. Document Updater: "Update .agent docs for feature X"
         │
         ▼
11. Report completion to user
```

### Working with Outstanding Tasks

**When user asks "what's outstanding?" or "continue work":**

1. **Read `.agent/Tasks/active/`** to find outstanding PRDs
2. **List tasks** with status and next steps
3. **Ask user** which task to continue, or suggest priority
4. **Delegate to Coder** with specific task reference

**Example:**
```
User: "Continue where we left off"

Orchestrator:
1. Reads .agent/Tasks/active/ directory
2. Finds: BUG_8_NEXT_ACTIONS.md (Status: In Progress)
3. Reports: "Found outstanding task: BUG_8 - SSE Streaming. Next action: Implement UI component"
4. Asks: "Should I have Coder continue with this?"
5. User: "Yes"
6. Delegates: "Coder, implement the next action in .agent/Tasks/active/BUG_8_NEXT_ACTIONS.md"
```

### Context Efficiency in Task Workflow

**CRITICAL: Don't load context into main conversation unnecessarily**

- **Task documents ARE the context** - Coder reads them directly
- **Don't duplicate** task content in your messages
- **Reference, don't repeat**: "See implementation steps in the task document"
- **Agents summarize** - Trust their summaries

### Task Status Updates

Keep task status current:
- **Planning** → Initial creation
- **In Progress** → Coder is implementing
- **Blocked** → Waiting for user input/decision
- **Completed** → Move to `completed/` folder

---

## Commands

Claude Commands are **specialized instruction files** stored in `.claude/commands/` that provide procedural guidance for common ClaimTech development tasks. They complement Skills (patterns) and .agent docs (reference).

### Available Commands

| Command | Purpose | When to Use | Workflow |
|---------|---------|-------------|----------|
| **feature-implementation.md** | Complete feature lifecycle | Implement/add/build features | 8 phases: Requirements → Research → Design → Implementation → Testing → Documentation → Review → Deployment |
| **database-migration.md** | Safe migration creation | Add table, modify schema, RLS updates | 7 phases: Planning → Create file → Write SQL → Test → Generate types → Document → Commit |
| **service-development.md** | Service layer implementation | Create service, CRUD operations | 6 phases: Design → Create file → CRUD → Business logic → Testing → Documentation |
| **testing-workflow.md** | Comprehensive testing | Test features, write tests | 6 phases: Manual → Unit → E2E → Performance → Security → Documentation |
| **code-review.md** | Quality standards review | Review code, check quality | 5 categories: Quality (25%) → Security (30%) → Performance (20%) → Maintainability (15%) → Docs (10%) |

**Command Hierarchy**:
```
feature-implementation.md (Master workflow)
    ├── database-migration.md (DB changes)
    ├── service-development.md (Data access)
    ├── testing-workflow.md (Quality assurance)
    └── code-review.md (Final check)
```

**Example Workflow**: "Add comments feature"
1. Invoke `feature-implementation.md` → 2. Invoke `database-migration.md` → 3. Invoke `service-development.md` → 4. Implement UI → 5. Invoke `testing-workflow.md` → 6. Invoke `code-review.md` → 7. Deploy

---

## Code Execution

### What is Code Execution?

ClaimTech uses **Architecture A: Two-Phase Code Execution** for efficient data processing, achieving **73-94% token reduction** for multi-step workflows.

**CRITICAL**: Code execution runs in isolated Deno sandbox and **CANNOT call MCP tools directly**.

**Two-Phase Approach**:
1. **Phase 1**: Claude calls MCP tools to fetch data
2. **Phase 2**: Claude embeds data in TypeScript code and executes processing logic

### When to Use Code Execution

**✅ Use When:**
- Complex data transformations (multiple map/filter/reduce)
- Data analysis with calculations (averages, statistics, correlations)
- Report generation with formatting (Markdown/HTML, tables)
- Cross-source correlation (combining multiple MCP results)
- JSON parsing and aggregation (JSONB columns, nested data)
- Batch validation logic (10+ records with complex rules)

**Decision Rule**: Use if you need to transform, analyze, or format data AFTER fetching it.

**❌ Don't Use When:**
- Simple single query (use MCP tool directly)
- Data already in desired format
- Need additional queries based on results (code cannot call MCP tools)
- Data too large to embed in code (filter with SQL first)

### The Pattern

**Example: Analyze Assessment Completion Times**

```typescript
// Phase 1: Fetch Data (Claude calls MCP tool)
const assessments = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT id, stage, stage_history
    FROM assessments
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `
});

// Phase 2: Process Data (Claude executes code)
const code = `
  const assessments = ${JSON.stringify(assessments)};

  // Calculate stage durations
  const stageDurations = assessments.map(a => {
    const history = JSON.parse(a.stage_history || '[]');
    const durations = {};

    for (let i = 1; i < history.length; i++) {
      const prev = new Date(history[i-1].timestamp);
      const curr = new Date(history[i].timestamp);
      const hours = (curr - prev) / (1000 * 60 * 60);
      durations[history[i].stage] = hours;
    }

    return { id: a.id, stages: durations };
  });

  // Aggregate statistics
  const stageStats = ['inspection_scheduled', 'inspection_in_progress', 'report_in_progress']
    .map(stage => {
      const times = stageDurations.map(d => d.stages[stage]).filter(t => t != null);
      return {
        stage,
        count: times.length,
        avg: times.length > 0 ? times.reduce((a,b) => a+b, 0) / times.length : 0,
        min: times.length > 0 ? Math.min(...times) : 0,
        max: times.length > 0 ? Math.max(...times) : 0
      };
    });

  console.log(JSON.stringify(stageStats, null, 2));
`;

await mcp__ide__executeCode({ code });
```

**Token Efficiency**: Traditional (5 MCP calls) ~3000 tokens → Architecture A (1 MCP + 1 code) ~850 tokens = **73% savings**

### Available MCP Servers

**Important**: MCP servers are called BY Claude in Phase 1 to fetch data. They are NOT imported or called FROM code execution.

| MCP Server | Primary Use | Key Tools |
|------------|-------------|-----------|
| **Supabase** | Database operations | execute_sql, apply_migration, list_tables, get_project |
| **GitHub** | Repository operations | get_file_contents, list_commits, search_code, list_issues |
| **Playwright** | Browser automation | navigate, screenshot (E2E testing) |
| **Svelte** | Framework guidance | analyze_component (development guidance) |
| **Chrome DevTools** | Debugging | evaluate_expression (debugging) |
| **Context7** | Documentation | search_docs (research) |

### Benefits Summary

- **73-94% token reduction** for multi-step workflows
- **Two-phase approach** (MCP fetch → code process) instead of 5-10+ tool calls
- **5-10x faster** completion times
- **Type-safe** operations with full TypeScript
- **Complex processing logic** in familiar programming patterns
- **Error handling** with try/catch in code execution
- **Secure** - Isolated, cannot access MCP tools or credentials
- **Clear separation** - MCP for data access, code for processing

### Getting Started

1. **Identify if appropriate** (see decision criteria above)
2. **Read** [Using Code Executor SOP](`.agent/SOP/using_code_executor.md`) for 5-phase workflow
3. **Choose pattern** from [Code Execution Patterns](`.agent/System/code_execution_patterns.md`)
   - Pattern 1: Data Analysis Pipeline
   - Pattern 2: Batch Validation
   - Pattern 3: Cross-Source Correlation
4. **Execute** the Two-Phase Pattern (fetch with MCP → process with code)
5. **Review** results and iterate

### Documentation

For comprehensive guides and API reference:
- **[Using Code Executor](`.agent/SOP/using_code_executor.md`)** (500+ lines) - Step-by-step workflow with decision tree
- **[Code Execution Architecture](`.agent/System/code_execution_architecture.md`)** (800+ lines) - Architecture layers and token efficiency
- **[Code Execution Patterns](`.agent/System/code_execution_patterns.md`)** (600+ lines) - 6 real-world patterns with implementations
- **[MCP Code API Reference](`.agent/System/mcp_code_api_reference.md`)** (1,200+ lines) - Complete API reference for all 6 MCP servers

---

## ClaimTech Development System Overview

This table shows how Skills, Commands, and .agent Docs work together:

| Aspect | Skills | Commands | .agent Docs |
|--------|--------|----------|-------------|
| **Purpose** | Domain patterns | Procedural workflows | Current state reference |
| **Location** | `.claude/skills/` | `.claude/commands/` | `.agent/` |
| **Activation** | Auto on keywords | Manual invoke | Manual read |
| **Context** | Shared context | Shared context | Shared context |
| **Content** | Best practices | Step-by-step guides | Reference info |
| **Example** | "Use ServiceClient injection" | "Phase 1: Do X, Phase 2: Do Y" | "Table has columns X, Y, Z" |
| **When to Use** | Implementing features | Need structured workflow | Need current system info |

---

## Best Practices

### 1. Task First, Code Second

**Before implementing anything non-trivial:**

1. **Check** `.agent/Tasks/active/` - Is there an existing task for this?
2. **Create** a task document if not - This becomes Coder's context
3. **Delegate** to Coder agent with task reference
4. **Track** progress by updating task status

**The task document IS the implementation plan AND the context.**

**IMPORTANT**: Even after Plan Mode produces a detailed plan, you MUST still delegate to the Coder agent. The plan file becomes the task document - copy/move it to `.agent/Tasks/active/` and delegate. Do NOT implement directly just because you already understand what needs to be done.

### 2. Delegate, Don't Execute Directly

**Before doing anything substantial, ask: "Should an agent do this?"**

| Task Type | Action |
|-----------|--------|
| Research ("find X", "how does Y") | → Explore agent |
| Need comprehensive context | → Context agent |
| Complex feature (5+ files) | → Create task → Planner → Coder |
| **Post-planning implementation** | → **Create task → Coder** |
| Moderate change (3-5 files) | → Create task → Coder |
| Simple fix (1-2 files) | → Execute directly |
| Trivial (<10 lines) | → Execute directly |

### 3. Context Efficiency

**Minimize tokens consumed in main conversation:**

- **Task documents ARE context** - Don't duplicate in messages
- **Reference, don't repeat**: "See .agent/Tasks/active/X.md"
- **Agents return summaries** - Trust them, don't re-read
- **Read files only when editing** - Not for exploration
- **Use offset/limit** for large files

### 4. Quality First

- Never skip code quality analysis
- Run `npm run check` after code changes
- Follow ClaimTech patterns and conventions
- Address issues before moving forward

### 5. Document After Changes

- Use Document Updater agent after implementations
- Keep `.agent/` docs current
- Move completed tasks to `completed/` folder
- Update `.agent/README.md` status line

### 6. Use Code Execution When Appropriate

- Multi-step workflows (3+ operations)
- Complex data transformations
- Batch processing operations
- Data analysis and reporting

### 7. Follow Established Patterns

- Reference Skills for domain expertise
- Use Commands for structured workflows
- Consult .agent docs for current system state
