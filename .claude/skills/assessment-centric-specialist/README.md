# Assessment-Centric Specialist Skill

## Overview

Specialized skill for implementing and maintaining ClaimTech's assessment-centric architecture where assessments serve as the canonical "case" record from request creation through completion.

## Purpose

This skill provides comprehensive expertise for:
- Implementing stage-based workflow features
- Adding new pipeline stages
- Fixing assessment-related bugs
- Ensuring idempotency and constraint compliance
- Migrating from status-based to stage-based queries

## When to Use

**Auto-invokes on keywords:**
- "assessment stage"
- "stage transition"
- "assessment-centric"
- "idempotent"
- "constraint violation"
- "duplicate assessment"

**Explicitly invoke when:**
- Implementing Phase 3 (stage-based list pages)
- Adding new workflow stages to the pipeline
- Debugging constraint violations related to appointments
- Ensuring backward compatibility with old requests
- Fixing race conditions in assessment creation

## Core Skills Provided

### 1. Implement Stage-Based List Page
Convert status-based queries to stage-based queries for list pages.

### 2. Add New Assessment Stage
Comprehensive workflow for adding new pipeline stages (enum, types, constraints, pages).

### 3. Fix Assessment-Related Bug
Diagnostic workflows for common issues: constraint violations, duplicates, RLS errors.

### 4. Migrate Status to Stage
Systematically replace status references with stage references.

### 5. Create Idempotent Child Record Service
Patterns for truly idempotent child record creation (check-then-create, upsert).

### 6. Update Assessment Stage Safely
Critical pattern: foreign keys → stage → child records.

### 7. Query Assessments Efficiently
Optimized query patterns with indexes, joins, and RLS filtering.

## Key Workflows

### Workflow 1: Implement Phase 3 - Stage-Based List Pages
Complete guide to converting all 7 list pages to stage-based queries.

### Workflow 2: Add Quality Review Stage
Example of adding a new stage with migrations, types, pages, and transitions.

## Documentation

- **SKILL.md** - Complete skill documentation with all patterns and examples
- **README.md** - This file (overview and quick reference)

## Related Documentation

- [Assessment-Centric Architecture PRD](../../../.agent/Tasks/active/assessment_centric_architecture_refactor.md)
- [All Fixes Complete](../../../.agent/Tasks/active/assessment_centric_fixes_complete.md)
- [Working with Assessment-Centric Architecture SOP](../../../.agent/SOP/working_with_assessment_centric_architecture.md)
- [Database Schema](../../../.agent/System/database_schema.md)

## Key Principles

1. Assessment created WITH request (not at "Start Assessment")
2. One assessment per request (unique constraint enforced)
3. 10 pipeline stages (request_submitted → archived/cancelled)
4. Nullable foreign keys (appointment_id, inspection_id can be null initially)
5. Check constraint requires appointment_id for later stages
6. All child record creation is idempotent
7. Stage transitions are logged in audit trail

## Critical Patterns

### Operation Order
```typescript
// ALWAYS follow this order:
// 1) Link foreign keys FIRST
await updateAssessment(id, { appointment_id }, client);

// 2) THEN update stage
await updateStage(id, 'assessment_in_progress', client);

// 3) Create child records
await createChildRecords(id, client);
```

### Idempotent Child Records
```typescript
// Check-then-create (1:1 relationship)
async createDefault(assessmentId: string, client?: ServiceClient) {
  const existing = await this.getByAssessment(assessmentId, client);
  if (existing) return existing;
  return this.create({ assessment_id: assessmentId }, client);
}

// Upsert (1:N relationship with compound key)
await db.from('assessment_tyres').upsert(
  records,
  { onConflict: 'assessment_id,position' }
);
```

## Quality Standards

All implementations must:
- [ ] Use authenticated client (`locals.supabase`)
- [ ] Maintain idempotency (safe to call multiple times)
- [ ] Enforce constraints (appointment_id for later stages)
- [ ] Log stage transitions in audit trail
- [ ] Support backward compatibility with old data
- [ ] Pass all quality checklists
- [ ] Include manual testing verification

## Version

**Version:** 1.0.0
**Last Updated:** January 26, 2025
**Status:** Production ready (Phase 0-2 complete, Phase 3 pending)

## Quick Start

1. Read `SKILL.md` for complete documentation
2. Review `.agent/SOP/working_with_assessment_centric_architecture.md`
3. Check `.agent/Tasks/active/assessment_centric_fixes_complete.md` for context
4. Use quality checklists before marking implementations complete
5. Always test with both admin and engineer users
6. Verify backward compatibility with old requests

## Support

For questions or issues with this skill:
1. Review the complete SKILL.md documentation
2. Check related SOPs and documentation
3. Verify against quality checklists
4. Consult assessment-centric PRD for architecture decisions
