# Claude Sub-Agents Implementation

**Date**: 2025-11-03
**Status**: ✅ Complete
**Location**: `.claude/agents/`

---

## Overview

Created 7 specialized Claude sub-agents for ClaimTech that provide domain expertise with their own context windows, tools, and system prompts. Sub-agents automatically delegate based on keywords and leverage Skills + Commands for their work.

---

## Sub-Agents Created

### 1. **database-expert.md** (300 lines)
**Purpose**: Database migrations, RLS policies, schema design, Supabase configurations

**Auto-invokes on**: migration, database, schema, RLS, policy, SQL, table, index, Supabase

**Tools**: Read, Write, Bash, Supabase MCP tools

**Skills Used**: 
- supabase-development
- assessment-centric-specialist

**Commands Used**:
- database-migration.md
- code-review.md

**Key Capabilities**:
- Creates safe, idempotent migrations
- Reviews RLS policies for security
- Ensures proper indexing
- Designs normalized schemas
- Generates TypeScript types

**Quality Standards**:
- Security score ≥ 8/10
- All tables have RLS enabled
- All foreign keys have indexes
- Migrations are idempotent

---

### 2. **feature-implementer.md** (300 lines)
**Purpose**: Complete feature development from requirements to deployment

**Auto-invokes on**: feature, implement, build, create, add functionality, new component, page, route

**Tools**: Read, Write, Bash, Supabase MCP tools

**Skills Used**:
- claimtech-development
- supabase-development
- assessment-centric-specialist

**Commands Used**:
- feature-implementation.md (master workflow)
- database-migration.md
- service-development.md
- testing-workflow.md
- code-review.md

**Key Capabilities**:
- Implements complete features (8-phase workflow)
- Creates SvelteKit pages and components
- Integrates with Supabase services
- Ensures role-based access control
- Coordinates with other sub-agents

**8-Phase Workflow**:
1. Requirements Clarification (5-10 min)
2. Research & Context Gathering (10-15 min)
3. Design & Planning (15-20 min)
4. Implementation (varies)
5. Testing (20-40 min)
6. Documentation (10-20 min)
7. Code Review (10-15 min)
8. Deployment Preparation (5-10 min)

---

### 3. **code-reviewer.md** (300 lines)
**Purpose**: Code quality, security, and ClaimTech standards compliance

**Auto-invokes on**: review, quality, check, standards, security, audit, verify, validate

**Tools**: Read, Bash

**Skills Used**:
- claimtech-development
- supabase-development
- assessment-centric-specialist

**Commands Used**:
- code-review.md

**Key Capabilities**:
- Reviews code for quality and security
- Generates comprehensive review reports
- Provides weighted scoring (0-10)
- Identifies issues with severity ratings
- Verifies acceptance criteria

**Scoring System** (Weighted):
- Code Quality: 25%
- Security: 30%
- Performance: 20%
- Maintainability: 15%
- Documentation: 10%

**Score Interpretation**:
- 9-10: Excellent - Ready to merge
- 7-8: Good - Minor improvements needed
- 5-6: Acceptable - Significant improvements needed
- < 5: Needs work - Major issues to address

---

### 4. **testing-specialist.md** (300 lines)
**Purpose**: Comprehensive testing (manual, unit, E2E, performance, security)

**Auto-invokes on**: test, testing, verify, validate, E2E, unit test, performance, security, QA

**Tools**: Read, Write, Bash

**Skills Used**:
- claimtech-development
- supabase-development
- assessment-centric-specialist

**Commands Used**:
- testing-workflow.md

**Key Capabilities**:
- Designs comprehensive test plans
- Writes unit tests (Vitest)
- Writes E2E tests (Playwright)
- Tests across user roles
- Verifies accessibility

**6-Phase Testing**:
1. Manual Testing (15-20 min) - Functionality, roles, browsers, accessibility
2. Unit Testing (20-30 min) - Vitest for services/components
3. E2E Testing (30-45 min) - Playwright for user flows
4. Performance Testing (10-15 min) - Page load, queries, bundle size
5. Security Testing (10-15 min) - RLS, auth, input validation
6. Test Documentation (5-10 min) - Test report and cases

---

### 5. **service-builder.md** (300 lines)
**Purpose**: Service layer implementation with proper patterns

**Auto-invokes on**: service, data access, CRUD, business logic, database operations, queries

**Tools**: Read, Write, Bash, Supabase MCP tools

**Skills Used**:
- supabase-development
- claimtech-development

**Commands Used**:
- service-development.md

**Key Capabilities**:
- Creates service classes with ServiceClient injection
- Implements CRUD operations
- Writes business logic and custom queries
- Ensures type safety with TypeScript
- Documents with JSDoc

**6-Phase Workflow**:
1. Service Design (5-10 min)
2. Create Service File (5-10 min)
3. Implement CRUD Operations (15-25 min)
4. Add Business Logic (15-30 min)
5. Testing (15-25 min)
6. Documentation (5-10 min)

---

### 6. **assessment-architect.md** (300 lines)
**Purpose**: Assessment-centric architecture and stage-based workflow

**Auto-invokes on**: assessment, request, stage, workflow, pipeline, transition, lifecycle

**Tools**: Read, Write, Bash, Supabase MCP tools

**Skills Used**:
- assessment-centric-specialist
- claimtech-development
- supabase-development

**Commands Used**:
- feature-implementation.md
- database-migration.md

**Key Capabilities**:
- Ensures assessment-centric compliance
- Implements stage-based workflow features
- Manages assessment lifecycle
- Enforces one-assessment-per-request
- Designs idempotent operations

**Core Principles**:
1. Assessment is canonical record
2. Stage-based workflow (10 stages)
3. Nullable foreign keys with check constraints
4. Idempotent operations
5. Complete audit trail

---

### 7. **research-agent.md** (300 lines)
**Purpose**: Research documentation, libraries, APIs, and implementation patterns

**Auto-invokes on**: research, documentation, library, API, how to, example, implementation, best practice, guide

**Tools**: Read, Write, Context7 MCP, web-search, web-fetch

**Skills Used**:
- claimtech-development
- supabase-development

**Commands Used**:
- feature-implementation.md (research phase)

**Key Capabilities**:
- Researches library documentation (Context7)
- Searches web for examples and guides
- Fetches API documentation
- Finds best practices and patterns
- Documents research findings

**Research Strategies**:
1. Library/Framework Research (Context7 + web search)
2. Implementation Pattern Research (official docs + examples)
3. Problem-Solving Research (web search + GitHub issues)
4. Comparison Research (compare multiple options)

---

## Sub-Agent Hierarchy

```
Main Claude (Orchestrator)
    ├── feature-implementer (Master coordinator)
    │   ├── database-expert (Schema changes)
    │   ├── service-builder (Data access)
    │   ├── testing-specialist (Quality assurance)
    │   └── code-reviewer (Final check)
    ├── assessment-architect (Assessment features)
    │   ├── database-expert (Assessment schema)
    │   └── feature-implementer (Implementation)
    └── research-agent (External knowledge)
        └── feature-implementer (Apply findings)
```

---

## How Sub-Agents Work

### **Automatic Delegation**
Sub-agents auto-invoke based on keywords in their description:

**Example 1**: "Create a migration for comments table"
→ Auto-invokes `database-expert` (keywords: migration, table)

**Example 2**: "Test the new feature across all roles"
→ Auto-invokes `testing-specialist` (keywords: test, roles)

**Example 3**: "Research best practices for PDF generation"
→ Auto-invokes `research-agent` (keywords: research, best practices)

### **Explicit Delegation**
You can also explicitly request a specific sub-agent:

**Example**: "Have the code-reviewer check my changes"
→ Explicitly invokes `code-reviewer`

### **Sub-Agent Coordination**
Sub-agents work together on complex tasks:

**Example**: "Implement a comments feature"
1. `feature-implementer` coordinates the work
2. Delegates to `database-expert` for migration
3. Delegates to `service-builder` for CommentService
4. Implements UI components itself
5. Delegates to `testing-specialist` for testing
6. Delegates to `code-reviewer` for final check

---

## Sub-Agents vs Skills vs Commands

| Aspect | Sub-Agents | Skills | Commands |
|--------|------------|--------|----------|
| **Purpose** | Specialized AI personality | Domain patterns | Procedural workflows |
| **Location** | `.claude/agents/` | `.claude/skills/` | `.claude/commands/` |
| **Activation** | Auto on keywords | Auto on keywords | Manual invoke |
| **Context** | Own context window | Shared context | Shared context |
| **Content** | System prompt + tools | Best practices | Step-by-step guides |
| **Example** | "I am a database expert..." | "Use ServiceClient injection" | "Phase 1: Do X, Phase 2: Do Y" |

---

## Benefits of Sub-Agents

1. **Context Preservation**: Each sub-agent has its own context window, preventing context overflow
2. **Specialized Expertise**: Each sub-agent is an expert in its domain
3. **Parallel Work**: Multiple sub-agents can work simultaneously
4. **Reusability**: Sub-agents can be invoked multiple times across conversations
5. **Flexible Permissions**: Each sub-agent has specific tools it can use
6. **Quality Consistency**: Sub-agents always follow the same patterns and standards

---

## Documentation Updated

- ✅ **CLAUDE.md** - Added comprehensive Sub-Agents section (~280 lines)
- ✅ **7 Sub-Agent Files** - Created in `.claude/agents/` (300 lines each)
- ✅ **Implementation Doc** - This file documenting the complete implementation

---

## Example Usage Scenario

**User Request**: "Add a comments feature to assessments"

**Claude's Workflow**:

1. **feature-implementer** (auto-invokes on "add" keyword)
   - Clarifies requirements
   - Creates implementation plan
   - Coordinates other sub-agents

2. **database-expert** (delegated by feature-implementer)
   - Creates `comments` table migration
   - Adds RLS policies
   - Creates indexes
   - Generates TypeScript types

3. **service-builder** (delegated by feature-implementer)
   - Creates `CommentService` class
   - Implements CRUD operations
   - Adds business logic

4. **feature-implementer** (continues)
   - Creates `CommentsTab` component
   - Adds route at `/assessments/[id]`
   - Implements forms with Superforms + Zod

5. **testing-specialist** (delegated by feature-implementer)
   - Manual testing across roles
   - Writes unit tests for CommentService
   - Writes E2E tests for comment creation
   - Verifies RLS policies

6. **code-reviewer** (delegated by feature-implementer)
   - Reviews all code changes
   - Generates review report
   - Provides weighted score
   - Identifies any issues

7. **feature-implementer** (completes)
   - Updates documentation
   - Commits changes
   - Ready for deployment

**Result**: Complete, tested, reviewed, documented comments feature ready for production

---

## Next Steps

Sub-agents are now ready to use! When you ask Claude to perform tasks, it will automatically delegate to the appropriate sub-agents based on keywords in your request.

**Tips for Using Sub-Agents**:
- Use relevant keywords to trigger auto-invocation
- Explicitly request sub-agents when needed
- Let sub-agents coordinate on complex tasks
- Trust the sub-agent hierarchy for quality

**All 7 sub-agents are active and ready to assist with ClaimTech development!** 🚀

