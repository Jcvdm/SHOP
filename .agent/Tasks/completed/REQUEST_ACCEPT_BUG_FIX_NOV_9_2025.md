# Request Accept Workflow Bug Fix - November 9, 2025

**Status**: ✅ COMPLETE
**Severity**: HIGH - Blocked engineer appointment workflow
**Root Cause**: Navigation ID mismatch (inspection.id vs assessment.id)
**Fix Applied**: Single-line change + explanatory comments

---

## The Bug

When user clicked "Accept" on a request detail page:
1. ✅ Inspection created successfully
2. ✅ Alert showed "Request accepted! You can now appoint an engineer"
3. ❌ **Navigation failed** - tried to load inspection with wrong ID
4. ❌ **Error**: `Cannot read properties of null (reading 'indexOf')`

**Root Cause**: Code navigated to `/work/inspections/${inspection.id}` but the inspection detail page expected `/work/inspections/${assessment.id}`.

---

## Why This Happened

**Assessment-Centric Architecture Principle**:
- Assessment is the canonical record (primary entity)
- Inspection is a child record (linked via foreign key)
- URL routing should use assessment IDs, not inspection IDs
- Inspection detail page loads assessment first, then inspection via FK

**The Mismatch**:
```
Request Accept Flow:
  1. Creates inspection (inspection.id = UUID-1)
  2. Creates assessment (assessment.id = UUID-2)
  3. Links inspection to assessment (assessment.inspection_id = UUID-1)
  4. ❌ Navigates to /work/inspections/${UUID-1} (WRONG)
  5. Inspection detail page tries: assessmentService.getAssessment(UUID-1)
  6. Lookup fails (UUID-1 ≠ UUID-2)
  7. data.assessment = null
  8. Page crashes
```

---

## The Fix

**File**: `src/routes/(app)/requests/[id]/+page.svelte`

**Lines 143-145** (was line 144):

```typescript
// BEFORE
goto(`/work/inspections/${inspection.id}`);

// AFTER
// Navigate to inspection detail page using assessment ID (assessment-centric architecture)
// The inspection detail page expects assessment ID as route parameter, not inspection ID
goto(`/work/inspections/${assessment.id}`);
```

**Why This Works**:
- Assessment ID is the primary key for inspection detail page
- Inspection detail page loads assessment first (line 14 of +page.server.ts)
- Assessment has inspection_id foreign key to link to inspection
- All downstream data loads correctly

---

## Verification

### Code Changes Applied
✅ Line 143-145: Navigation updated to use `assessment.id`
✅ Comments added explaining assessment-centric architecture
✅ No TypeScript errors
✅ Aligns with existing patterns in codebase

### Related Code Verified
✅ `src/routes/(app)/work/inspections/+page.svelte` (line 148) - Already correct
✅ `src/routes/(app)/work/inspections/[id]/+page.svelte` (line 221) - Already correct
✅ No other instances of incorrect `inspection.id` navigation found

### Testing Checklist
⏳ Create a new request
⏳ Click "Accept" button
⏳ Verify: Alert shows inspection created ✅
⏳ Verify: Navigates to inspection detail page ✅
⏳ Verify: "Appoint Engineer" button appears ✅
⏳ Verify: No console errors ✅
⏳ Verify: Can click back and request is gone from requests list ✅

---

## Architecture Context

### Assessment-Centric Principles (from Skills)
1. Assessment created WITH request (not at "Start Assessment")
2. One assessment per request (unique constraint)
3. 10 pipeline stages (request_submitted → archived/cancelled)
4. Nullable foreign keys (appointment_id, inspection_id can be null initially)
5. Check constraint enforces relationships
6. All operations are idempotent
7. Stage transitions are logged

### Stage-Based Foreign Key Lifecycle
| Stage | inspection_id | appointment_id | Query Should Join |
|-------|--------------|----------------|-------------------|
| 1-2 | NULL | NULL | requests |
| 3 | **SET** ✓ | NULL | **inspections** |
| 4+ | SET ✓ | **SET** ✓ | **appointments** |

---

## Related Documentation

- **Analysis**: `.agent/Tasks/active/REQUEST_ACCEPT_WORKFLOW_BUG_ANALYSIS.md`
- **Context**: `.agent/Tasks/active/REQUEST_ACCEPT_BUG_CONTEXT_AND_PATTERNS.md`
- **Skill**: `.claude/skills/assessment-centric-specialist/SKILL.md`
- **SOP**: `.agent/SOP/working_with_assessment_centric_architecture.md`
- **Schema**: `.agent/System/database_schema.md`

---

## Implementation Details

**Skill Used**: Assessment-Centric Specialist
**Pattern Applied**: Assessment-centric URL routing
**Operation Order**: Followed correct FK → stage → child record pattern
**Code Quality**: Added explanatory comments for future maintainers

---

## Next Steps

1. **Manual Testing** - User to test the workflow end-to-end
2. **Verify No Regressions** - Check other request workflows still work
3. **Monitor Logs** - Watch for any related errors in production
4. **Update Documentation** - If any new patterns discovered

---

**Fix Completed**: November 9, 2025
**Implemented By**: Claude (Assessment-Centric Specialist)
**Status**: Ready for testing

