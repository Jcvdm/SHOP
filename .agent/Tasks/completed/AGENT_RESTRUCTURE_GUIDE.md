# Agent Restructure Guide: 11 Agents → 1 Orchestrator + 4 Assistants

**Date**: November 9, 2025
**Status**: Complete
**Impact**: Simplified agent management, improved coordination, better code execution integration

---

## What Changed

### Before: 11 Agents (Confusing)
- **claude-1, claude-2**: Context gatherers (duplicates)
- **claude-3, claude-4**: General assistants (duplicates)
- **database-expert**: Database migrations
- **feature-implementer**: Feature development
- **service-builder**: Service layer
- **testing-specialist**: Testing
- **code-reviewer**: Code quality
- **assessment-architect**: Assessment workflow
- **research-agent**: External research

**Problems:**
- Too many agents to manage
- Unclear delegation patterns
- Redundant roles
- Difficult to coordinate

### After: 1 Orchestrator + 4 Assistants (Clear)
- **Main Claude (Orchestrator)**: Receives requests, delegates, coordinates
- **Claude-1**: Database & Schema (consolidates database-expert + assessment-architect)
- **Claude-2**: Feature & Service (consolidates feature-implementer + service-builder)
- **Claude-3**: Testing & Quality (consolidates testing-specialist + code-reviewer)
- **Claude-4**: Research & Docs (consolidates research-agent + context gathering)

**Benefits:**
- Simpler mental model (4 assistants vs 11 agents)
- Clear delegation patterns
- Better code execution integration
- Easier to maintain

---

## How to Use the New Structure

### 1. Simple Tasks (Single Assistant)

**Example**: "Add a notes field to clients table"

```
You (Orchestrator): Understand the request
↓
Delegate to Claude-1 (Database & Schema)
↓
Claude-1: Create migration, test, update types
↓
Result: Done
```

### 2. Complex Features (Multi-Assistant)

**Example**: "Add comments feature to assessments"

```
You (Orchestrator): Break down the task
↓
Delegate to Claude-4: Gather context on existing patterns
↓
Delegate to Claude-1: Create comments table + RLS
↓
Delegate to Claude-2: Create service + UI components
↓
Delegate to Claude-3: Test + review
↓
You: Integrate results and deliver
```

### 3. Parallel Work (Efficiency)

**Example**: "Add PDF export with custom templates"

```
You (Orchestrator): Identify parallel work
↓
Parallel:
  - Claude-4: Research PDF libraries
  - Claude-1: Check storage setup
↓
Sequential:
  - Claude-2: Implement feature
  - Claude-3: Test + review
↓
You: Integrate and deliver
```

---

## Assistant Responsibilities

### Claude-1: Database & Schema Expert
**When to delegate:**
- Database migrations
- RLS policy changes
- Assessment workflow features
- Schema design
- Migration testing

**Tools:** Supabase MCP, Code Execution
**Skills:** supabase-development, assessment-centric-specialist, code-execution

### Claude-2: Feature & Service Builder
**When to delegate:**
- New features
- Service creation
- UI implementation
- Business logic
- Data processing

**Tools:** Supabase MCP, Code Execution
**Skills:** claimtech-development, supabase-development, code-execution

### Claude-3: Testing & Quality Assurance
**When to delegate:**
- Testing features
- Code review
- Security audit
- Quality assurance
- Test data generation

**Tools:** Supabase MCP, Code Execution
**Skills:** claimtech-development, testing patterns, code-execution

### Claude-4: Research & Documentation
**When to delegate:**
- External documentation research
- Codebase context gathering
- Implementation patterns
- Documentation updates
- API research

**Tools:** Context7 MCP, Web Search, Web Fetch
**Skills:** claimtech-development, supabase-development

---

## Code Execution Integration

All assistants can use **Architecture A: Two-Phase Code Execution** for efficient data processing:

**Phase 1**: Fetch data with MCP tools
**Phase 2**: Process with code execution

**Token Savings**: 73-94% reduction for multi-step workflows

### When Each Assistant Uses Code Execution

**Claude-1**: Migration testing, RLS validation, performance analysis
**Claude-2**: Data transformation, report generation, performance analysis
**Claude-3**: Test data generation, result validation, metrics analysis
**Claude-4**: Documentation analysis, summary generation, pattern correlation

---

## Migration Checklist

- [x] Backup old agents to `.claude/agents/archive/`
- [x] Redefine Claude-1 (Database & Schema)
- [x] Redefine Claude-2 (Feature & Service)
- [x] Redefine Claude-3 (Testing & Quality)
- [x] Redefine Claude-4 (Research & Docs)
- [x] Update CLAUDE.md with new pattern
- [x] Create this guide

---

## Reference

**Old agents archived at**: `.claude/agents/archive/`
**New agent definitions**: `.claude/agents/claude-1.md` through `.claude/agents/claude-4.md`
**Updated documentation**: `CLAUDE.md` (Orchestrator + 4 Assistants section)

---

## Next Steps

1. **Use the new structure** for all future tasks
2. **Reference this guide** when delegating to assistants
3. **Leverage code execution** for efficient data processing
4. **Update documentation** as new patterns emerge
5. **Archive old agents** are available for reference if needed

