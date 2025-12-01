# Supabase Development Skill Implementation

## Task Overview

Create a focused Agent Skill for Supabase development patterns specific to ClaimTech project. This skill will help maintain consistency across the codebase and speed up Supabase-related development.

## Implementation Date
January 25, 2025

## Research Completed

Comprehensive analysis completed by supabase-specialist agent covering:
- Database architecture (50+ tables, 60+ migrations)
- Row Level Security (RLS) implementation and evolution
- Storage architecture (private buckets with proxy endpoints)
- Authentication & authorization patterns
- Service layer patterns (27+ services with ServiceClient injection)
- Type safety and TypeScript integration
- Common operations and reusable patterns

## Implementation Plan

### File Structure
```
.claude/skills/supabase-development/
├── SKILL.md (main skill file - quick reference)
├── PATTERNS.md (detailed pattern explanations)
├── SECURITY.md (RLS and security patterns)
└── EXAMPLES.md (real code examples from codebase)
```

### SKILL.md Specification

**Frontmatter:**
```yaml
---
name: supabase-development
description: Implement Supabase database operations, services, RLS policies, and storage for ClaimTech. Use when creating services, writing database queries, implementing RLS policies, working with storage, or extending the database schema. Follows ClaimTech's ServiceClient injection pattern, audit logging conventions, and security-first approach.
allowed-tools: Read, Edit, Write, Grep, Glob
---
```

**Content Sections:**
1. Quick Start - Common patterns at a glance
2. ServiceClient Pattern - Optional injection used in all services
3. Standard CRUD Operations - Template for new services
4. Unique ID Generation - CLM-2025-001 pattern
5. RLS Helper Functions - is_admin(), get_user_engineer_id()
6. Storage Patterns - Proxy endpoints, file uploads
7. Audit Logging - When and how to log changes
8. Common Pitfalls - What to avoid

### Supporting Files

**PATTERNS.md:**
- ServiceClient injection pattern details
- Migration best practices (idempotency, naming)
- Type safety patterns
- Query optimization (avoiding N+1)
- Performance patterns (caching, indexes)
- Database conventions (timestamps, triggers, UUIDs)

**SECURITY.md:**
- RLS policy templates
- SECURITY DEFINER STABLE functions
- Multi-policy pattern (admin + engineer)
- Storage RLS policies
- Path-based vs bucket-level policies
- Authentication patterns (3 client types)
- Common security gaps

**EXAMPLES.md:**
- Service class template (complete CRUD)
- Unique ID generation examples
- RLS policy examples from codebase
- Proxy endpoint pattern (photo/document)
- Migration file template
- Audit logging integration
- Complex query examples (joins, nested selects)

## Key Design Decisions

### 1. Focused Scope
- Specifically for ClaimTech Supabase patterns
- Not generic Supabase documentation
- Based on actual codebase analysis

### 2. Model-Invoked Triggers
Description includes specific triggers:
- "creating services"
- "database queries"
- "RLS policies"
- "working with storage"
- "extending database schema"

### 3. Tool Permissions
Restricted to: Read, Edit, Write, Grep, Glob
- Prevents accidental Bash commands
- Prevents running migrations without review
- Safe for code generation and editing

### 4. Progressive Disclosure
- SKILL.md: Concise quick reference
- Supporting files: Detailed explanations
- Examples: Copy-paste ready code

### 5. Real Examples
All examples from actual ClaimTech codebase:
- assessment.service.ts patterns
- storage.service.ts patterns
- RLS policies from migrations
- Proxy endpoint implementations

## Implementation Checklist

- [ ] Create directory: `.claude/skills/supabase-development/`
- [ ] Write SKILL.md with frontmatter and core content
- [ ] Create PATTERNS.md with detailed patterns
- [ ] Create SECURITY.md with RLS templates
- [ ] Create EXAMPLES.md with real code snippets
- [ ] Test skill activation with Supabase questions
- [ ] Update .agent/README.md to reference the new skill
- [ ] Commit to git for team sharing

## Expected Benefits

1. **Consistency**: All new services follow established patterns
2. **Speed**: Copy-paste templates for common operations
3. **Quality**: Prevents common mistakes (e.g., exposed service keys)
4. **Security**: Enforces RLS and security patterns
5. **Maintainability**: Documents tribal knowledge
6. **Team Alignment**: Shared conventions via git

## Testing Plan

After implementation, test by asking:
1. "Create a new service for vehicle valuation"
2. "Add RLS policy for the assessments table"
3. "Implement photo upload for damage records"
4. "How do I query assessments with nested data?"
5. "Create a migration to add a new column"

Verify that Claude:
- Uses the supabase-development skill
- Follows ServiceClient pattern
- Includes audit logging
- Uses proper RLS patterns
- Follows naming conventions

## Related Documentation

- `.agent/System/database_schema.md` - Database schema reference
- `.agent/System/project_architecture.md` - Overall architecture
- `.agent/SOP/adding_migration.md` - Migration procedures
- Research output from supabase-specialist agent

## Success Criteria

✅ Skill loads without errors
✅ Claude uses skill for Supabase questions
✅ Generated code matches existing patterns
✅ RLS policies follow security conventions
✅ Services use ServiceClient injection
✅ Unique IDs follow CLM-2025-001 format
✅ Audit logging integrated correctly

---

**Status**: Implementation in progress
**Created**: January 25, 2025
**Owner**: Development Team
