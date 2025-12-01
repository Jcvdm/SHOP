# Assessment-Centric Specialist Skill Implementation

## Status
✅ **COMPLETE** - Comprehensive skill created (January 26, 2025)

## Overview

Created a specialized Claude Code skill for implementing and maintaining ClaimTech's assessment-centric architecture. This skill provides comprehensive expertise for working with assessments as the canonical "case" record throughout the entire workflow.

---

## What Was Created

### 1. Core Skill Documentation

**File:** `.claude/skills/assessment-centric-specialist/SKILL.md`
**Size:** ~40KB (comprehensive documentation)

**Contents:**
- Skill metadata (name, description, auto-invoke triggers)
- Overview and key concepts
- 7 core skills with step-by-step instructions
- 2 complete workflows with quality checklists
- Common mistakes to avoid
- Testing requirements
- Success criteria
- Resource references
- Agent behavior guidelines

### 2. Quick Reference Guide

**File:** `.claude/skills/assessment-centric-specialist/README.md`

**Contents:**
- Skill overview and purpose
- Auto-invoke keywords
- Core skills summary
- Key principles
- Critical patterns (operation order, idempotent child records)
- Quality standards
- Quick start guide

### 3. Documentation Updates

**Files Updated:**
- `CLAUDE.md` - Added Assessment-Centric Specialist section
- `.agent/README.md` - Added skill to Claude Code Skills section

---

## Core Skills Provided

### Skill 1: Implement Stage-Based List Page
**Time:** 15-30 minutes per page
**Purpose:** Convert status-based queries to stage-based queries

**Key Steps:**
1. Read existing page load function
2. Map status to equivalent stage(s)
3. Update query to filter by stage
4. Apply role-based filtering
5. Test with different user roles
6. Update sidebar badge if applicable
7. Verify RLS still enforced

**Quality Checklist:**
- Uses `stage` field not `status`
- Includes proper RLS filters
- Fetches related data efficiently (joins)
- Pagination works correctly
- Counts are accurate

---

### Skill 2: Add New Assessment Stage
**Time:** 60-90 minutes
**Purpose:** Add new workflow step to pipeline

**Key Steps:**
1. Update assessment_stage enum (ALTER TYPE ADD VALUE)
2. Update TypeScript AssessmentStage type
3. Update stage transition logic
4. Update check constraint if needed
5. Update relevant list pages
6. Update sidebar badges
7. Add new page for stage if needed
8. Test stage transitions
9. Verify audit logging

**Quality Checklist:**
- Enum value added in correct order
- TypeScript types match database
- Constraint logic updated if needed
- Audit logging tracks transition
- Backward compatible with existing data

---

### Skill 3: Fix Assessment-Related Bug
**Time:** 30-120 minutes (variable)
**Purpose:** Diagnose and fix common assessment issues

**Common Issues Covered:**
1. **Constraint Violation** - appointment_id required
2. **Duplicate Assessment** - unique constraint violation
3. **Duplicate Child Records** - idempotency issues
4. **RLS Permission Error** - authenticated client not passed
5. **Stage Transition Error** - invalid transitions

**Diagnostic Workflow:**
1. Read error message carefully
2. Identify which constraint or stage involved
3. Check operation order
4. Verify authenticated client passed
5. Check idempotency maintained
6. Review audit logs for clues

---

### Skill 4: Migrate Status to Stage
**Time:** 20-40 minutes per component
**Purpose:** Update legacy code from status-based to stage-based

**Key Steps:**
1. Find all status-based queries
2. Map status values to stage values
3. Update queries to use stage
4. Update TypeScript types if needed
5. Test all user flows
6. Remove unused status references
7. Update documentation

**Quality Checklist:**
- All status references replaced
- Backward compatible (old assessments work)
- Tests updated
- No breaking changes

---

### Skill 5: Create Idempotent Child Record Service
**Time:** 30-45 minutes
**Purpose:** Implement truly idempotent child record creation

**Pattern A: Check-then-create** (1:1 relationship)
```typescript
async createDefault(assessmentId: string, client?: ServiceClient) {
  const existing = await this.getByAssessment(assessmentId, client);
  if (existing) return existing;
  return this.create({ assessment_id: assessmentId }, client);
}
```

**Pattern B: Upsert** (1:N with compound key)
```typescript
await db.from('assessment_tyres').upsert(
  records,
  { onConflict: 'assessment_id,position' }
);
```

**Quality Checklist:**
- Unique constraint exists in database
- Service method is truly idempotent
- Returns existing record if found
- Handles errors gracefully
- Uses authenticated client

---

### Skill 6: Update Assessment Stage Safely
**Time:** 10-15 minutes
**Purpose:** Implement stage transitions correctly

**Critical Pattern:**
```typescript
// ALWAYS follow this order:

// 1) Link foreign keys FIRST
if (!assessment.appointment_id && requiresAppointment(newStage)) {
  assessment = await updateAssessment(id, { appointment_id }, client);
}

// 2) THEN update stage
assessment = await updateStage(id, newStage, client);

// 3) Create child records
if (newStage === 'assessment_in_progress') {
  await createChildRecords(id, client);
}
```

**Quality Checklist:**
- Foreign keys set before stage update
- Uses `updateStage()` not `updateAssessment()`
- Passes authenticated client
- Checks current stage before updating
- Audit log created

---

### Skill 7: Query Assessments Efficiently
**Time:** 10-20 minutes
**Purpose:** Build optimized stage-based queries

**Efficient Query Pattern:**
```typescript
const { data: assessments } = await locals.supabase
  .from('assessments')
  .select(`
    *,
    request:requests!inner(*, client:clients(*)),
    appointment:appointments(*, engineer:engineers(*))
  `)
  .eq('stage', 'assessment_in_progress')
  .order('updated_at', { ascending: false });
```

**Optimization Techniques:**
- Use stage index for filtering
- Fetch related data in single query (no N+1)
- Apply RLS filters based on user role
- Order results appropriately
- Handle pagination if needed

---

## Key Workflows

### Workflow 1: Implement Phase 3 - Stage-Based List Pages
**Goal:** Replace status-based queries with stage-based queries across all list pages
**Time:** 6-8 hours (all pages)

**Pages to Update:**
1. Requests (`/requests`) - `['request_submitted', 'request_accepted']`
2. Inspections (`/work/inspections`) - `'request_accepted'`
3. Appointments (`/work/appointments`) - `'inspection_scheduled'`
4. Open Assessments (`/work/assessments`) - `'assessment_in_progress'`
5. Finalized (`/work/finalized`) - `'estimate_finalized'`
6. FRC (`/work/frc`) - `['frc_in_progress', 'frc_completed']`
7. Archive (`/archive`) - `['archived', 'cancelled']`

**Quality Checklist:**
- All 7 list pages updated
- Sidebar badges use stage field
- Engineer filtering works correctly
- Backward compatible with old data
- All manual tests passed

---

### Workflow 2: Add Quality Review Stage (Example)
**Goal:** Add "quality_review" stage between assessment_completed and estimate_finalized
**Time:** 60-90 minutes

**Steps:**
1. Create migration (ALTER TYPE ADD VALUE)
2. Update TypeScript types
3. Add transition logic
4. Create quality review page
5. Add QR approval/reject actions
6. Update sidebar badge
7. Test transitions
8. Document new stage

**Quality Checklist:**
- Migration applied successfully
- TypeScript types updated
- Transition logic implemented
- New page created
- Sidebar badge shows count
- Audit logging works
- Documentation updated

---

## Core Principles Documented

### Assessment-Centric Architecture

1. **Assessment created WITH request** - Not at "Start Assessment"
2. **One assessment per request** - Enforced by unique constraint
3. **10 pipeline stages** - request_submitted → archived/cancelled
4. **Nullable foreign keys** - appointment_id, inspection_id can be null initially
5. **Check constraint** - appointment_id required for later stages
6. **Idempotent operations** - All creation methods safe to call multiple times
7. **Audit trail** - Stage transitions logged

### Critical Patterns

**Operation Order:**
```
1) Link foreign keys FIRST
2) THEN update stage
3) Create child records
```

**Idempotency Patterns:**
- Check-then-create (1:1 relationships)
- Upsert (1:N with compound keys)

---

## Common Mistakes Documented

### Critical Errors to Avoid

1. ❌ Updating stage before linking appointment_id
2. ❌ Using status instead of stage for new features
3. ❌ Creating assessment at "Start Assessment"
4. ❌ Not passing authenticated client
5. ❌ Making non-idempotent child record creation
6. ❌ Using createAssessment() instead of findOrCreateByRequest()
7. ❌ Forgetting to update audit logs for stage transitions

---

## Testing Requirements

### Unit Tests
- findOrCreateByRequest is idempotent
- updateStage enforces appointment_id constraint
- Child record creation is idempotent

### Integration Tests
- Complete workflow: request → assessment → appointment → complete
- Stage transitions enforce constraints
- RLS policies work for admin and engineer users

### Manual Tests
- Create request → verify assessment created
- Start Assessment → verify stage updated
- Page refresh → verify no duplicates
- Double-click → verify idempotency
- Role-based access → verify filtering

---

## Success Criteria

**Feature is Complete When:**
- [ ] Zero constraint violations
- [ ] All operations are idempotent
- [ ] Stage transitions logged
- [ ] RLS properly enforced
- [ ] No duplicate records created
- [ ] Backward compatible with old data
- [ ] Performance is acceptable (uses indexes)

---

## Integration with Other Skills

**Works alongside:**
- **Supabase Specialist** - For RLS policies, migrations, complex queries
- **ClaimTech Development** - For general workflow patterns
- **Research Context Gatherer** - For understanding existing system

**Handoff to Supabase Specialist when:**
- Creating complex RLS policies for new stages
- Optimizing database queries
- Debugging constraint violations at database level

**Handoff to ClaimTech Development when:**
- Need general service layer patterns
- Creating new pages or components
- Implementing auth flows

---

## Auto-Invoke Triggers

The skill automatically invokes when detecting these keywords:
- "assessment stage"
- "stage transition"
- "assessment-centric"
- "idempotent"
- "constraint violation"
- "duplicate assessment"
- "findOrCreateByRequest"
- "updateStage"

---

## Documentation Structure

```
.claude/skills/assessment-centric-specialist/
├── SKILL.md                    # Complete skill documentation (~40KB)
│   ├── Overview & Key Concepts
│   ├── 7 Core Skills (step-by-step)
│   ├── 2 Key Workflows (complete implementations)
│   ├── Common Mistakes to Avoid
│   ├── Testing Requirements
│   ├── Success Criteria
│   └── Resources & Integration
└── README.md                   # Quick reference guide
    ├── Overview & Purpose
    ├── Core Skills Summary
    ├── Key Principles
    ├── Critical Patterns
    └── Quick Start Guide
```

---

## Related Documentation

**Core References:**
- [Assessment-Centric Architecture PRD](./assessment_centric_architecture_refactor.md)
- [All Fixes Complete](./assessment_centric_fixes_complete.md)
- [Working with Assessment-Centric Architecture SOP](../../SOP/working_with_assessment_centric_architecture.md)
- [Database Schema](../../System/database_schema.md)

**Database Migrations:**
- `supabase/migrations/068_add_assessment_stage.sql` - Stage enum and constraints
- `supabase/migrations/069_add_child_record_unique_constraints.sql` - Idempotency

**Key Services:**
- `src/lib/services/assessment.service.ts` - Core assessment methods
- `src/lib/services/request.service.ts` - Request creation with assessment
- All child record services (tyres, damage, estimate, etc.)

---

## Implementation Notes

### Design Decisions

1. **Comprehensive Coverage** - Skill covers all aspects of assessment-centric architecture
2. **Step-by-Step Instructions** - Each skill includes detailed steps and examples
3. **Quality Checklists** - Every skill has verification checklist
4. **Real Code Examples** - All examples from actual ClaimTech codebase
5. **Common Mistakes** - Documents pitfalls to avoid
6. **Testing Requirements** - Unit, integration, and manual tests specified
7. **Integration** - Works alongside other skills and agents

### Structure Matches Existing Skills

- Follows same format as ClaimTech Development and Supabase Development skills
- Uses consistent SKILL.md + README.md pattern
- Includes metadata header for auto-invocation
- Quality checklists for every workflow
- Time estimates for planning

### Documentation Integration

- Updated CLAUDE.md with new skill section
- Added to .agent/README.md Claude Code Skills section
- Cross-referenced with related documentation
- Maintains consistency with project documentation standards

---

## Files Created/Modified

**Created (3 files):**
1. `.claude/skills/assessment-centric-specialist/SKILL.md` - Core skill documentation (~40KB)
2. `.claude/skills/assessment-centric-specialist/README.md` - Quick reference
3. `.agent/Tasks/active/assessment_centric_specialist_skill_implementation.md` - This file

**Modified (2 files):**
1. `CLAUDE.md` - Added Assessment-Centric Specialist section
2. `.agent/README.md` - Added skill to Claude Code Skills list

---

## Usage Examples

### Example 1: Convert List Page to Stage-Based
```
User: "I need to update the appointments page to use stage-based queries"

Agent: Auto-invokes assessment-centric-specialist skill
       → Provides Skill 1: Implement Stage-Based List Page
       → Step-by-step instructions with code examples
       → Quality checklist for verification
```

### Example 2: Add New Stage to Pipeline
```
User: "We need to add a quality review stage for assessments"

Agent: Auto-invokes assessment-centric-specialist skill
       → Provides Skill 2: Add New Assessment Stage
       → Complete workflow (migration, types, pages, transitions)
       → Time estimate: 60-90 minutes
       → Quality checklist included
```

### Example 3: Fix Constraint Violation
```
User: "Getting error: violates check constraint 'require_appointment_when_scheduled'"

Agent: Auto-invokes assessment-centric-specialist skill
       → Provides Skill 3: Fix Assessment-Related Bug
       → Identifies Issue 1: Constraint Violation
       → Provides diagnostic steps and solution
       → Shows correct operation order
```

### Example 4: Ensure Idempotency
```
User: "I'm getting duplicate tyre records when refreshing the assessment page"

Agent: Auto-invokes assessment-centric-specialist skill
       → Provides Skill 5: Create Idempotent Child Record Service
       → Shows check-then-create vs upsert patterns
       → Explains unique constraints needed
       → Provides complete code examples
```

---

## Benefits

### For Developers

1. **Faster Implementation** - Step-by-step instructions reduce guesswork
2. **Fewer Errors** - Common mistakes documented and avoided
3. **Consistent Patterns** - All assessment code follows same patterns
4. **Quality Assurance** - Checklists ensure nothing is missed
5. **Better Understanding** - Comprehensive documentation of architecture

### For the Project

1. **Maintainability** - Consistent code patterns across codebase
2. **Reliability** - Idempotent operations prevent data corruption
3. **Performance** - Optimized queries use proper indexes
4. **Security** - RLS enforcement patterns built-in
5. **Scalability** - Well-documented architecture enables growth

### For ClaimTech

1. **Production Ready** - All patterns tested and verified
2. **Backward Compatible** - Works with existing data
3. **Future-Proof** - Easy to add new stages and features
4. **Audit Trail** - Complete logging of stage transitions
5. **Data Integrity** - Constraints prevent invalid states

---

## Next Steps

### Immediate (Complete)
- [x] Create comprehensive SKILL.md
- [x] Create README.md quick reference
- [x] Update CLAUDE.md with skill section
- [x] Update .agent/README.md with skill reference
- [x] Document all 7 core skills
- [x] Document 2 key workflows
- [x] Add testing requirements
- [x] Add success criteria

### Short-term (1-2 weeks)
- [ ] Use skill to implement Phase 3 (stage-based list pages)
- [ ] Gather feedback from developers using skill
- [ ] Add more real-world examples as needed
- [ ] Update with any new patterns discovered

### Long-term (1-3 months)
- [ ] Create video walkthrough of key workflows
- [ ] Add troubleshooting section with more edge cases
- [ ] Consider adding interactive examples
- [ ] Update as new stages added to pipeline

---

## Maintenance

### When to Update Skill

**Update skill when:**
- New assessment stages added to pipeline
- New constraint types discovered
- New idempotency patterns needed
- Performance optimizations found
- Developer feedback suggests improvements

**How to Update:**
1. Update SKILL.md with new patterns
2. Add examples to appropriate skill sections
3. Update quality checklists if needed
4. Add to common mistakes if applicable
5. Update testing requirements
6. Increment version number
7. Document changes in skill commit message

---

## Conclusion

Successfully created a comprehensive assessment-centric specialist skill that:

✅ **Covers all aspects** of assessment-centric architecture
✅ **Provides step-by-step guidance** for common tasks
✅ **Documents critical patterns** for correct implementation
✅ **Includes quality checklists** for verification
✅ **Shows real code examples** from ClaimTech codebase
✅ **Integrates with other skills** and documentation
✅ **Auto-invokes** based on relevant keywords
✅ **Maintains consistency** with project standards

The skill is **production-ready** and will significantly accelerate implementation of Phase 3 (stage-based list pages) and future assessment-centric features.

**Ready for use immediately!** 🚀

---

**Implementation Date:** January 26, 2025
**Implemented By:** Claude Code (Sonnet 4.5)
**Status:** ✅ **COMPLETE**
**Version:** 1.0.0