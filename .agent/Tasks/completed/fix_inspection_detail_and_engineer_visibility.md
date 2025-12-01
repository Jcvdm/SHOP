# Fix Inspection Detail Page & Engineer Visibility Issues

**Created:** January 27, 2025
**Status:** In Progress
**Priority:** Critical
**Affected Assessment:** ASM-2025-016 (and 4 others)

## Problem Statement

Assessment ASM-2025-016 exhibits four critical issues that prevent proper workflow functionality:

1. **500 Error on Detail Page (Admin)** - Admin user can see ASM-2025-016 in inspections list but gets 500 error when clicking to view details
2. **Invisible to Engineer** - Engineer Jakes is assigned to the inspection but cannot see the assessment in their work list
3. **Cannot Schedule Appointment** - Page crashes before appointment scheduling UI can be accessed
4. **Systematic Workflow Gap** - Multiple assessments (5 total) have orphaned appointments not linked to assessment records

### Impact

- **Admins**: Cannot view or manage inspection details
- **Engineers**: Cannot see assigned work, breaking entire workflow
- **Business Process**: Inspection pipeline blocked at stage 3
- **Data Integrity**: 5 assessments with broken appointment linkage

## Root Cause Analysis

### Issue 1: Architectural Inconsistency

**The Problem:**
Inspection detail page (`/work/inspections/[id]`) uses **table-centric architecture** while the list page uses **assessment-centric architecture**.

**Current Code Path:**
```
User clicks ASM-2025-016 →
  Navigate to /work/inspections/{assessment_uuid} →
    getInspection(assessment_uuid) →
      SELECT * FROM inspections WHERE id = {assessment_uuid} →
        No record found (inspection has different UUID) →
          throw error(404, 'Inspection not found') →
            500 Error displayed
```

**Why It Happens:**
- List page: Queries `assessments` table, passes `assessment.id` to detail route
- Detail page: Expects `inspection.id`, tries to load from `inspections` table
- Assessment ID ≠ Inspection ID (different UUIDs)
- Mismatch causes record not found error

**Location:** [src/routes/(app)/work/inspections/[id]/+page.server.ts:12](../../../src/routes/(app)/work/inspections/[id]/+page.server.ts#L12)

### Issue 2: Missing Appointment Linkage

**The Problem:**
Assessment ASM-2025-016 has `appointment_id = NULL` despite being at `inspection_scheduled` stage with an assigned engineer.

**Database State:**
```
Assessment: ASM-2025-016
  - Stage: inspection_scheduled
  - inspection_id: 564278a8-971f-4a8c-adf9-c26def287dcb ✅
  - appointment_id: NULL ❌

Inspection: INS-2025-013
  - assigned_engineer_id: ad521f89-720e-4082-8600-f523fbd26ed5 (Jakes) ✅

Request: CLM-2025-015
  - assigned_engineer_id: ad521f89-720e-4082-8600-f523fbd26ed5 (Jakes) ✅

Appointment: DOES NOT EXIST ❌
```

**RLS Policy Impact:**
Engineer can view assessments only when:
1. Admin user, OR
2. `appointment_id` links to their appointment, OR
3. An appointment exists for the `request_id` linked to them

Since no appointment exists and `appointment_id` is NULL, engineer is blocked by RLS.

**Location:** RLS policies on `assessments` table (Migrations 073-074)

### Issue 3: Wrong Engineer Filter

**The Problem:**
List page filters engineers by `request.assigned_engineer_id` instead of `inspections.assigned_engineer_id`.

**Current Code:**
```typescript
if (isEngineer && engineer_id) {
  query = query.eq('request.assigned_engineer_id', engineer_id);
}
```

**Why It's Wrong:**
- At `inspection_scheduled` stage, work is assigned via `inspection.assigned_engineer_id`
- Request assignment (`request.assigned_engineer_id`) may differ from inspection assignment
- Filter should check who is assigned to the **inspection**, not the request

**Location:** [src/routes/(app)/work/inspections/+page.server.ts:24-26](../../../src/routes/(app)/work/inspections/+page.server.ts#L24-L26)

### Issue 4: Systemic Workflow Gap

**The Problem:**
Stage transition to `inspection_scheduled` doesn't create or link appointments properly.

**Evidence:**
Database query revealed 5 assessments with NULL `appointment_id` despite appointments existing:
- ASM-2025-009 (APT-2025-012 exists but not linked)
- ASM-2025-010 (APT-2025-010 exists but not linked)
- ASM-2025-011 (APT-2025-009 exists but not linked)
- ASM-2025-012 (APT-2025-008 exists but not linked)
- ASM-2025-016 (NO appointment exists)

**Workflow Gap:**
The appointment creation code in inspection detail page exists and is correct, but:
1. Page can't load due to Issue 1 (500 error prevents UI from rendering)
2. Even if fixed, appointment creation may not properly link to assessment
3. No validation ensures appointment exists before leaving stage 3

## Technical Requirements

### Requirement 1: Assessment-Centric Detail Page

**Must:**
- Load assessment by ID (not inspection by ID)
- Join with inspection via `assessment.inspection_id` foreign key
- Handle NULL `inspection_id` gracefully (backward compatibility)
- Preserve all existing functionality (appointment scheduling, engineer assignment, audit logs)
- Display correct data for all assessment stages

**Files to Modify:**
- `src/routes/(app)/work/inspections/[id]/+page.server.ts` (server load function)
- `src/routes/(app)/work/inspections/[id]/+page.svelte` (component props)

**Acceptance Criteria:**
- [ ] Admin can view ASM-2025-016 without 500 error
- [ ] All assessment data displays correctly
- [ ] Related inspection data displays correctly
- [ ] Appointment scheduling button visible when appropriate
- [ ] Audit logs load correctly
- [ ] No breaking changes to existing assessments

### Requirement 2: Inspection-Based RLS Access

**Must:**
- Add fallback RLS policy allowing engineers to see assessments via inspection assignment
- Maintain existing dual-check pattern for appointment-based access
- Ensure policy is secure (engineer must be assigned to inspection)
- Work for all stages where `inspection_id` is populated (stage 3+)

**Files to Create:**
- `supabase/migrations/YYYYMMDDHHMMSS_add_inspection_based_assessment_access.sql`

**Acceptance Criteria:**
- [ ] Engineer Jakes can see ASM-2025-016 immediately
- [ ] RLS policy doesn't create security holes
- [ ] Works alongside existing appointment-based access
- [ ] No performance degradation on assessments queries

### Requirement 3: Correct Engineer Filtering

**Must:**
- Filter engineers by `inspections.assigned_engineer_id` (not request)
- Use proper join with inspections table
- Maintain performance (no N+1 queries)
- Return accurate count for engineer's assigned work

**Files to Modify:**
- `src/routes/(app)/work/inspections/+page.server.ts` (lines 24-26)

**Acceptance Criteria:**
- [ ] Engineer sees all assessments assigned to their inspections
- [ ] Count matches actual database state
- [ ] Query is performant
- [ ] No regressions for admin users

### Requirement 4: Link Existing Appointments

**Must:**
- Find all assessments with NULL `appointment_id` at stage 3+
- Match with existing appointments by `request_id` or `inspection_id`
- Update `assessment.appointment_id` to link records
- Create appointment if none exists but inspection is assigned
- Log all changes for audit trail
- Be idempotent (safe to run multiple times)

**Files to Create:**
- `scripts/link-appointments-to-assessments.ts` (investigation/execution script)
- `supabase/migrations/YYYYMMDDHHMMSS_link_existing_appointments.sql` (data migration)

**Acceptance Criteria:**
- [ ] ASM-2025-016 linked to appointment (create if needed)
- [ ] ASM-2025-009, 010, 011, 012 linked to existing appointments
- [ ] No duplicate appointments created
- [ ] All changes logged in audit trail
- [ ] Migration is idempotent

### Requirement 5: Fix Appointment Creation Workflow

**Must:**
- Ensure appointment creation ALWAYS links to assessment
- Update stage transition logic to validate appointment linkage
- Make workflow idempotent (safe to call multiple times)
- Add error handling for missing assessment links
- Prevent future appointment orphaning

**Files to Investigate/Modify:**
- `src/routes/(app)/work/inspections/[id]/+page.svelte` (appointment creation handler)
- Any stage transition logic for `inspection_scheduled`

**Acceptance Criteria:**
- [ ] New appointments automatically link to assessments
- [ ] Stage transitions validate appointment existence
- [ ] Workflow doesn't break engineer visibility
- [ ] No regression on existing functionality
- [ ] Error messages are clear and actionable

## Implementation Approach

### Phase 1: RLS Policy Fix (Quick Win - 10-15 min)

**Priority:** CRITICAL - Immediately unblocks engineer visibility

Create migration to add inspection-based access:
```sql
-- Add to existing "Engineers can view their assessments" policy
OR EXISTS (
  SELECT 1 FROM inspections
  WHERE inspections.id = assessments.inspection_id
  AND inspections.assigned_engineer_id = get_user_engineer_id()
)
```

**Impact:** Engineer Jakes can immediately see ASM-2025-016

### Phase 2: Inspection Detail Page Refactor (60-90 min)

**Priority:** CRITICAL - Fixes 500 error

**Server Side Changes:**
1. Change from `getInspection(params.id)` to `getAssessment(params.id)`
2. Load inspection via `assessment.inspection_id` if not null
3. Handle null inspection gracefully (early-stage assessments)
4. Load all related data using assessment/inspection IDs correctly
5. Preserve appointment loading logic

**Client Side Changes:**
1. Update component to expect `data.assessment` instead of `data.inspection`
2. Conditionally render inspection-specific sections
3. Update appointment scheduling to use `data.assessment.id`
4. Ensure all UI elements work with new data structure

**Backward Compatibility:**
- Early-stage assessments (stage 1-2) have NULL `inspection_id`
- Page should handle this gracefully (show assessment info, hide inspection sections)

### Phase 3: Engineer Filter Fix (15-20 min)

**Priority:** HIGH - Ensures accurate work list

Replace request-based filter with inspection-based filter:
```typescript
if (isEngineer && engineer_id) {
  query = query
    .select('*, inspections!inner(assigned_engineer_id)')
    .eq('inspections.assigned_engineer_id', engineer_id);
}
```

**Note:** May need to adjust select clause to avoid duplicate joins

### Phase 4: Link Existing Appointments (20-30 min)

**Priority:** HIGH - Data cleanup

**Steps:**
1. Create investigation script to identify all orphaned appointments
2. For each assessment with NULL `appointment_id`:
   - Find appointment by `request_id` match
   - If found, link appointment to assessment
   - If not found and inspection assigned, create appointment
3. Log all changes
4. Create migration with UPDATE statements

**Safety:**
- Run in transaction
- Include rollback mechanism
- Validate foreign key constraints before updating

### Phase 5: Workflow Code Fix (30-45 min)

**Priority:** MEDIUM - Prevents recurrence

**Investigation Points:**
1. Where is `inspection_scheduled` stage set?
2. Does it create/link appointment?
3. Where is "Schedule Appointment" button logic?
4. Does it properly update `assessment.appointment_id`?

**Fixes:**
1. Ensure appointment creation updates assessment record
2. Add validation before stage transition (appointment must exist)
3. Make idempotent (check if appointment exists before creating)
4. Add error handling with clear messages

## Testing Requirements

### Test Case 1: Admin Views ASM-2025-016
**Steps:**
1. Log in as jaco@claimtech.co.za
2. Navigate to `/work/inspections`
3. Click ASM-2025-016

**Expected:**
- ✅ No 500 error
- ✅ Detail page loads correctly
- ✅ Assessment info displays
- ✅ Inspection info displays (if linked)
- ✅ Appointment scheduling button visible

### Test Case 2: Engineer Views Assigned Work
**Steps:**
1. Log in as vandermerwe.jaco194@gmail.com (Jakes)
2. Navigate to `/work/inspections`
3. Check sidebar badge count

**Expected:**
- ✅ ASM-2025-016 appears in list
- ✅ Sidebar shows count ≥ 1
- ✅ Can click and view details
- ✅ Can schedule appointment (if appropriate)

### Test Case 3: Appointment Scheduling
**Steps:**
1. Log in as admin
2. View ASM-2025-016 detail
3. Click "Schedule Appointment"
4. Fill form and submit

**Expected:**
- ✅ Appointment created successfully
- ✅ `assessment.appointment_id` updated
- ✅ Stage transitions to `appointment_scheduled`
- ✅ Engineer can still see assessment
- ✅ No duplicate appointments

### Test Case 4: Early Stage Assessment
**Steps:**
1. Create new request (stage 1)
2. View assessment detail

**Expected:**
- ✅ Page loads (no 500 error)
- ✅ Assessment info displays
- ✅ No inspection section (gracefully handled)
- ✅ No appointment section
- ✅ Can proceed through workflow

### Test Case 5: Data Migration Results
**Steps:**
1. Run data migration
2. Query affected assessments

**Expected:**
- ✅ ASM-2025-009 linked to APT-2025-012
- ✅ ASM-2025-010 linked to APT-2025-010
- ✅ ASM-2025-011 linked to APT-2025-009
- ✅ ASM-2025-012 linked to APT-2025-008
- ✅ ASM-2025-016 has appointment created/linked
- ✅ All engineers can see their assessments

## Acceptance Criteria

### Functional Requirements
- [ ] Admin can view ASM-2025-016 without error
- [ ] Engineer Jakes can see ASM-2025-016 in work list
- [ ] Sidebar badge shows correct count for engineers
- [ ] Appointment scheduling works end-to-end
- [ ] All 5 affected assessments now visible to engineers
- [ ] No duplicate appointments created

### Technical Requirements
- [ ] Detail page uses assessment-centric architecture
- [ ] RLS policies secure and performant
- [ ] Engineer filtering uses correct table join
- [ ] All appointments linked to assessments
- [ ] Workflow prevents future orphaning
- [ ] Migration is idempotent
- [ ] Backward compatible with early-stage assessments

### Code Quality
- [ ] Follows assessment-centric patterns from SOP
- [ ] No hardcoded IDs or magic values
- [ ] Proper error handling with clear messages
- [ ] TypeScript types updated correctly
- [ ] No console errors or warnings
- [ ] Code reviewed by code-quality-validator agent

## Related Documentation

- [Assessment-Centric Architecture SOP](../SOP/working_with_assessment_centric_architecture.md)
- [Fix Sidebar and Stage Update Bugs](fix_sidebar_and_stage_update_bugs.md)
- [Early Stage Assessment RLS Fix](../System/early_stage_assessment_rls_fix_jan_26_2025.md)
- [Database Schema](../System/database_schema.md)

## Research Reports

### Database Investigation (Jan 27, 2025)
**Key Findings:**
- ASM-2025-016: `appointment_id = NULL`, `inspection_id` populated
- Inspection INS-2025-013 assigned to engineer Jakes
- Request CLM-2025-015 assigned to engineer Jakes
- NO appointment record exists for this request/inspection
- RLS blocks engineer because no appointment link exists
- 4 other assessments have orphaned appointments

### Code Architecture Analysis (Jan 27, 2025)
**Key Findings:**
- List page: Assessment-centric (queries `assessments` table) ✅
- Detail page: Table-centric (queries `inspections` table) ❌
- ID mismatch causes 404/500 error
- Engineer filter uses wrong table join
- Appointment creation code exists but unreachable due to 500 error
- Dual-check RLS pattern (Migrations 073-074) works correctly

## Timeline

**Estimated:** 2.5-3.5 hours total
- Phase 1 (RLS): 10-15 min
- Phase 2 (Detail Page): 60-90 min
- Phase 3 (Filter): 15-20 min
- Phase 4 (Data Migration): 20-30 min
- Phase 5 (Workflow): 30-45 min
- Testing: 30-45 min

**Started:** January 27, 2025
**Target Completion:** January 27, 2025

## Rollback Plan

### Code Changes
- All changes in version control (git)
- Can revert commits if issues occur
- Backward compatible (handles null foreign keys)

### Database Changes
- Migration creates new policy alongside existing
- Can drop new policy if issues occur
- Data migration logged for manual rollback
- Original data state documented in this PRD

### Emergency Rollback
```sql
-- Revert RLS policy
DROP POLICY IF EXISTS "Engineers can view assessments via inspection" ON assessments;

-- Revert appointment linkage (if needed)
UPDATE assessments SET appointment_id = NULL
WHERE assessment_number IN ('ASM-2025-009', 'ASM-2025-010', 'ASM-2025-011', 'ASM-2025-012', 'ASM-2025-016');
```

## Success Metrics

**Immediate:**
- ✅ Zero 500 errors on inspection detail page
- ✅ Engineer can see all assigned work
- ✅ Sidebar badge accuracy = 100%

**Long-term:**
- ✅ No orphaned appointments created
- ✅ Workflow completion rate improves
- ✅ Engineer satisfaction (can see assigned work)

---

**Status Updates:**

*January 27, 2025 - PRD Created*
- Research completed by research-context-gatherer agent
- Database investigation completed
- All issues identified and documented
- Implementation plan approved

*January 27, 2025 - Implementation Complete*
- ✅ Server-side detail page converted to assessment-centric architecture
- ✅ Client-side detail page updated with $derived helper and validation
- ✅ List page engineer filtering fixed with proper INNER JOIN
- ✅ RLS policy migration applied with secure Path 4 (inspection-based access)
- ✅ Critical security vulnerability fixed (cross-engineer access prevented)
- ✅ Performance indexes created for RLS policies
- ✅ Appointment creation validation added (prevents null/mismatch errors)
- ✅ Stage update order fixed (clear FKs before stage transition)
- ✅ All critical and warning issues from code review addressed

*Deployment Status:*
- Database migrations applied to SVA project (cfblmkzleqtvtfxujikf)
- Code changes committed and ready for testing
- Ready for end-to-end testing with engineer and admin accounts

*Next Steps:*
1. Test engineer visibility (log in as Jakes, verify ASM-2025-016 appears)
2. Test admin detail page (no 500 error)
3. Test appointment scheduling workflow
4. Run security test (verify no cross-engineer access)
5. Deploy to production after successful testing
