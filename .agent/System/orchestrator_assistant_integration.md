# Orchestrator + 4 Assistants Integration Guide

**Last Updated**: November 9, 2025
**Version**: 1.0

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Claude (Orchestrator)               │
│  - Receives user requests                                   │
│  - Breaks down complex tasks                                │
│  - Delegates to appropriate assistants                      │
│  - Coordinates multi-assistant workflows                    │
│  - Integrates results                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼────────┐ ┌──▼──────────┐ ┌──▼──────────┐
        │   Claude-1     │ │  Claude-2   │ │  Claude-3   │
        │  Database &    │ │  Feature &  │ │  Testing &  │
        │    Schema      │ │   Service   │ │   Quality   │
        └────────────────┘ └─────────────┘ └─────────────┘
                │
        ┌───────▼────────┐
        │   Claude-4     │
        │  Research &    │
        │     Docs       │
        └────────────────┘
```

---

## How Skills, Commands, and Code Execution Integrate

### Layer 1: Skills (Domain Expertise)

**Purpose**: Auto-invoked patterns and best practices

**Active Skills**:
- `supabase-development` - Database patterns, RLS, ServiceClient injection
- `claimtech-development` - SvelteKit, components, workflows
- `assessment-centric-specialist` - Assessment architecture, stages
- `photo-component-development` - Photo viewer patterns
- `code-execution` - Two-phase Architecture A pattern

**How Assistants Use Skills**:
- Claude-1 auto-invokes: supabase-development, assessment-centric-specialist, code-execution
- Claude-2 auto-invokes: claimtech-development, supabase-development, assessment-centric-specialist, code-execution
- Claude-3 auto-invokes: claimtech-development, supabase-development, code-execution
- Claude-4 auto-invokes: claimtech-development, supabase-development

### Layer 2: Commands (Procedural Workflows)

**Purpose**: Step-by-step procedures for common tasks

**Available Commands**:
- `database-migration.md` - 7-phase migration workflow
- `feature-implementation.md` - 8-phase feature workflow
- `service-development.md` - 6-phase service workflow
- `testing-workflow.md` - 6-phase testing workflow
- `code-review.md` - 5-category review workflow
- `update_doc.md` - Documentation update procedures

**How Assistants Use Commands**:
- Claude-1 follows: database-migration.md, code-review.md
- Claude-2 follows: feature-implementation.md, service-development.md, testing-workflow.md, code-review.md
- Claude-3 follows: testing-workflow.md, code-review.md
- Claude-4 follows: feature-implementation.md (research phase), update_doc.md

### Layer 3: Code Execution (Efficient Data Processing)

**Purpose**: Two-phase Architecture A for 73-94% token reduction

**Pattern**:
1. **Phase 1**: Assistant calls MCP tools to fetch data
2. **Phase 2**: Assistant embeds data in code and executes processing

**How Assistants Use Code Execution**:

**Claude-1 (Database & Schema)**
```typescript
// Phase 1: Apply migration
const result = await mcp__supabase__apply_migration({...});

// Phase 2: Validate with code execution
const code = `
  const result = ${JSON.stringify(result)};
  // Validate migration results
`;
await mcp__ide__executeCode({ code });
```

**Claude-2 (Feature & Service)**
```typescript
// Phase 1: Fetch data
const data = await mcp__supabase__execute_sql({...});

// Phase 2: Transform with code execution
const code = `
  const data = ${JSON.stringify(data)};
  // Complex transformation logic
`;
await mcp__ide__executeCode({ code });
```

**Claude-3 (Testing & Quality)**
```typescript
// Phase 1: Fetch test data
const testData = await mcp__supabase__execute_sql({...});

// Phase 2: Generate scenarios with code execution
const code = `
  const data = ${JSON.stringify(testData)};
  // Generate test scenarios
`;
await mcp__ide__executeCode({ code });
```

**Claude-4 (Research & Docs)**
```typescript
// Phase 1: Fetch documentation
const docs = await mcp__context7__get_library_docs({...});

// Phase 2: Analyze with code execution (if needed)
const code = `
  const docs = ${JSON.stringify(docs)};
  // Analyze and summarize
`;
await mcp__ide__executeCode({ code });
```

---

## Orchestration Workflow

### Step 1: Receive Request
```
User: "Add comments feature to assessments"
Orchestrator: Understand requirements
```

### Step 2: Identify Assistants Needed
```
- Claude-4: Research existing patterns
- Claude-1: Create schema + RLS
- Claude-2: Create service + UI
- Claude-3: Test + review
```

### Step 3: Delegate Sequentially
```
Orchestrator → Claude-4: "Gather context on comment patterns"
  ↓ (Claude-4 uses: codebase-retrieval, web-search)
  ↓ (Claude-4 returns: context report)

Orchestrator → Claude-1: "Create comments table + RLS"
  ↓ (Claude-1 uses: database-migration.md, code-execution)
  ↓ (Claude-1 returns: migration file, types)

Orchestrator → Claude-2: "Create service + UI components"
  ↓ (Claude-2 uses: feature-implementation.md, code-execution)
  ↓ (Claude-2 returns: service, components, routes)

Orchestrator → Claude-3: "Test + review"
  ↓ (Claude-3 uses: testing-workflow.md, code-review.md, code-execution)
  ↓ (Claude-3 returns: test results, review report)
```

### Step 4: Integrate Results
```
Orchestrator: Combine all outputs
Orchestrator: Verify completeness
Orchestrator: Deliver to user
```

---

## Decision Tree for Delegation

```
User Request
    │
    ├─ Database/Schema changes?
    │  └─ YES → Claude-1 (Database & Schema)
    │
    ├─ Feature/Service implementation?
    │  └─ YES → Claude-2 (Feature & Service)
    │
    ├─ Testing/Quality review?
    │  └─ YES → Claude-3 (Testing & Quality)
    │
    ├─ Research/Documentation?
    │  └─ YES → Claude-4 (Research & Docs)
    │
    └─ Multiple of above?
       └─ YES → Orchestrate multi-assistant workflow
```

---

## Benefits of This Structure

| Aspect | Benefit |
|--------|---------|
| **Simplicity** | 4 assistants vs 11 agents |
| **Clarity** | Clear delegation patterns |
| **Efficiency** | Code execution reduces tokens 73-94% |
| **Maintainability** | Consolidated responsibilities |
| **Scalability** | Easy to add new assistants |
| **Coordination** | Orchestrator manages workflows |
| **Quality** | Specialized expertise per assistant |

---

## Related Documentation

- **CLAUDE.md** - Complete system documentation
- **AGENT_RESTRUCTURE_GUIDE.md** - Historical: How the old agent structure worked
- **RESTRUCTURE_SUMMARY.md** - Historical: What changed during agent restructure
- `.agent/System/code_execution_architecture.md` - Code execution details
- `.agent/SOP/using_code_executor.md` - Code execution procedures

**Note**: Agent system has been removed as of November 28, 2025 to make way for new workflow engineering.

