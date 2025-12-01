# ClaimTech Development Skill - Implementation Plan

**Date:** October 25, 2025
**Status:** In Progress
**Priority:** High

---

## Overview

Create a Claude Code skill that encapsulates ClaimTech development patterns, SOPs, and best practices. This skill will help all agents (especially research-context-gatherer) work effectively with the ClaimTech codebase by providing systematic workflows for common development tasks.

---

## Goals

1. **Knowledge Transfer** - Encode ClaimTech patterns into reusable skill
2. **Consistency** - Ensure all agents follow same patterns
3. **Efficiency** - Progressive loading (only load what's needed)
4. **Quality** - Built-in checklists and verification steps
5. **Integration** - Work seamlessly with existing .agent/ documentation

---

## Skill Design

### Name
`claimtech-development`

### Description
```
ClaimTech vehicle assessment platform development patterns and workflows. Use when implementing features, reviewing code, or working with SvelteKit, Supabase, or ClaimTech-specific patterns. Includes database migrations, service layer patterns, authentication, PDF generation, and storage workflows.
```

### Structure
```
.claude/skills/claimtech-development/
├── SKILL.md                    # Core workflows (lean)
├── resources/
│   ├── database-patterns.md    # Database & migration patterns
│   ├── service-patterns.md     # Service layer templates
│   ├── auth-patterns.md        # Authentication workflows
│   ├── component-patterns.md   # Svelte 5 component patterns
│   └── pdf-storage-patterns.md # PDF & storage workflows
└── README.md                   # Skill documentation
```

---

## SKILL.md Workflows

### 1. Database Migration Workflow
**When:** Adding/modifying database tables
**Time:** 15-30 minutes
**Triggers:** "database", "migration", "schema", "table"

**Steps:**
1. Review existing schema in `.agent/System/database_schema.md`
2. Create idempotent migration with proper naming
3. Include indexes, RLS policies, triggers
4. Test migration locally
5. Update TypeScript types
6. Update database documentation

**Quality Checks:**
- [ ] Migration is idempotent (IF NOT EXISTS)
- [ ] RLS enabled and policies created
- [ ] Indexes on foreign keys
- [ ] updated_at trigger added
- [ ] Documentation updated

### 2. Service Layer Implementation
**When:** Creating data access layer
**Time:** 20-40 minutes
**Triggers:** "service", "data access", "CRUD"

**Steps:**
1. Create service file in `src/lib/services/`
2. Use ServiceClient injection pattern
3. Implement CRUD operations
4. Add error handling
5. Export service instance

**Quality Checks:**
- [ ] ServiceClient injected (not created)
- [ ] Error handling on all DB calls
- [ ] TypeScript types for all returns
- [ ] Service exported as singleton

### 3. Authentication Flow
**When:** Implementing auth-protected features
**Time:** 10-20 minutes
**Triggers:** "auth", "login", "logout", "protect"

**Steps:**
1. Check auth in hooks.server.ts
2. Use form actions (NOT API routes)
3. Implement RLS policies
4. Add role-based checks (admin/engineer)
5. Handle redirects properly

**Quality Checks:**
- [ ] Form actions used for mutations
- [ ] RLS policies protect data
- [ ] Role checks implemented
- [ ] Redirects to login when needed

### 4. Page Route Creation
**When:** Adding new UI pages
**Time:** 15-30 minutes
**Triggers:** "page", "route", "UI"

**Steps:**
1. Create +page.svelte and +page.server.ts
2. Use ServiceClient in load function
3. Implement Svelte 5 runes ($state, $derived)
4. Add TypeScript types
5. Update navigation if needed

**Quality Checks:**
- [ ] ServiceClient used in server load
- [ ] Svelte 5 runes (not stores)
- [ ] TypeScript types complete
- [ ] Error boundaries added

### 5. PDF Generation
**When:** Creating reports/documents
**Time:** 30-60 minutes
**Triggers:** "PDF", "report", "document generation"

**Steps:**
1. Create HTML template in `src/lib/templates/`
2. Create API endpoint in `src/routes/api/generate-*/`
3. Use pdf-generator.ts utility
4. Upload to documents bucket
5. Return signed URL via proxy

**Quality Checks:**
- [ ] Template uses Tailwind for styling
- [ ] Puppeteer configured correctly
- [ ] File uploaded to storage
- [ ] Proxy endpoint returns signed URL

### 6. Storage & Photos
**When:** Handling file uploads
**Time:** 20-30 minutes
**Triggers:** "upload", "photo", "storage", "file"

**Steps:**
1. Use storage.service.ts
2. Upload to correct bucket (documents vs SVA Photos)
3. Create proxy endpoint for signed URLs
4. Never expose signed URLs directly
5. Handle file deletion

**Quality Checks:**
- [ ] Correct bucket used
- [ ] Proxy endpoint created
- [ ] No direct signed URL exposure
- [ ] Deletion handled

---

## Resources Files

### database-patterns.md
- Migration templates
- RLS policy patterns
- Index strategies
- Trigger examples
- JSONB usage (estimates architecture)

### service-patterns.md
- ServiceClient injection
- CRUD templates
- Error handling patterns
- Type safety examples

### auth-patterns.md
- Form action patterns
- RLS policy templates
- Role-based access
- Redirect strategies

### component-patterns.md
- Svelte 5 runes ($state, $derived, $effect)
- Component composition
- TypeScript integration
- UI component library usage

### pdf-storage-patterns.md
- PDF generation templates
- Storage upload patterns
- Signed URL proxy
- File organization

---

## Integration with .agent/

### Skill Provides: HOW
- Step-by-step workflows
- Quality checklists
- Common patterns
- Quick templates

### .agent/ Provides: WHAT/WHERE
- System architecture
- Database schema
- Tech stack details
- Project structure

### Together:
- Skill: "Follow these steps"
- .agent/: "Here's the current state"
- Result: Complete development workflow

---

## Agent Integration

### Update CLAUDE.md

Add to "SPECIALIZED AGENTS" section:

```markdown
#### ClaimTech Development Skill
**When:** Implementing any ClaimTech feature
**Auto-invoked:** Database, service, auth, PDF, storage keywords

This skill provides systematic workflows for:
- Database migrations with RLS
- Service layer implementation
- Authentication patterns
- Page route creation
- PDF generation
- Storage handling

Agents should reference this skill when working on ClaimTech-specific implementations.
```

### Research Context Gatherer
- Use skill for systematic code exploration
- Follow patterns when suggesting implementations
- Reference skill workflows in recommendations

### Supabase Specialist
- Combine with skill's database-patterns
- Use RLS templates from skill
- Follow migration workflow

### Svelte Implementer
- Use component-patterns from skill
- Follow Svelte 5 runes patterns
- Reference TypeScript integration

---

## Success Criteria

### Skill Works When:
1. ✅ Claude auto-invokes on relevant keywords
2. ✅ Workflows are clear and actionable
3. ✅ Quality checklists prevent common mistakes
4. ✅ Integration with .agent/ is seamless
5. ✅ Agents produce consistent code

### Metrics:
- Code follows patterns automatically
- Fewer common mistakes (RLS, auth, etc.)
- Faster implementation time
- Better documentation compliance

---

## Implementation Steps

### Phase 1: Core Skill (30 min)
1. Create skill directory structure
2. Write SKILL.md with 6 core workflows
3. Add clear descriptions and triggers
4. Include quality checklists

### Phase 2: Resources (45 min)
5. Create database-patterns.md
6. Create service-patterns.md
7. Create auth-patterns.md
8. Create component-patterns.md
9. Create pdf-storage-patterns.md

### Phase 3: Integration (15 min)
10. Update CLAUDE.md
11. Test skill with sample queries
12. Verify auto-invocation

### Phase 4: Documentation (15 min)
13. Update .agent/README.md
14. Add skill to documentation structure
15. Create usage examples

**Total Time:** ~2 hours

---

## Testing Plan

### Test Queries:
1. "How do I add a database table in ClaimTech?"
2. "Create a service for managing requests"
3. "How do I protect a page with authentication?"
4. "Generate a PDF report in ClaimTech"
5. "Upload photos to storage"

### Expected Behavior:
- Skill auto-invokes
- Provides step-by-step workflow
- References .agent/ documentation
- Includes quality checklist
- Uses ClaimTech patterns

---

## Future Enhancements

### V1.1:
- Add testing workflow
- Include deployment checklist
- Add performance patterns

### V1.2:
- Executable scripts for common tasks
- Auto-documentation update scripts
- Code quality verification scripts

### V1.3:
- Integration with MCP tools
- Auto-migration generation
- RLS policy generator

---

## Related Documentation

- [Skill Setup](../../../Skill%20setup.md) - How skills work
- [Database Schema](../../System/database_schema.md) - Current schema
- [Project Architecture](../../System/project_architecture.md) - System overview
- [Adding Migrations SOP](../../SOP/adding_migration.md) - Migration details
- [Service Layer SOP](../../SOP/working_with_services.md) - Service patterns
- [CLAUDE.md](../../../CLAUDE.md) - Agent configuration

---

**Status:** Ready to implement
**Next Step:** Create SKILL.md
**Owner:** Development Team
**Version:** 1.0.0