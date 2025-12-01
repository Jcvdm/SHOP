# Fix Sidebar Badge & Stage Update Bugs - Task Document

**Status**: Active
**Priority**: CRITICAL
**Created**: January 27, 2025
**Estimated Time**: 40 minutes

---

## Problem Statement

Engineer vandermerwe.jaco194@gmail.com (Jakes) shows **ZERO assigned work** in sidebar despite being appointed to 6 inspections and 5 appointments. Investigation revealed **TWO CRITICAL BUGS** in the codebase:

### Bug #1: Sidebar Inspection Badge Query (CRITICAL)
**Location**: `src/lib/components/layout/Sidebar.svelte:147-153`

**Problem**: Sidebar badge joins with **WRONG TABLE**
```typescript
// WRONG - joins with appointments table
.select('*, appointments!inner(engineer_id)', { count: 'exact', head: true })
.eq('stage', 'inspection_scheduled');
```

**Why it fails**:
- At `inspection_scheduled` stage (stage 3), assessments have `inspection_id` set (NOT `appointment_id`)
- `appointment_id` is NULL until `appointment_scheduled` stage (stage 4)
- INNER JOIN with appointments table fails → returns 0 count

**Expected behavior**: Should join with `inspections` table since we're querying by `inspection_scheduled` stage

### Bug #2: handleStartAssessment Missing Stage Update (CRITICAL)
**Location**: `src/routes/(app)/work/appointments/[id]/+page.svelte:49-63`

**Problem**: Updates appointment status but **doesn't update assessment stage**
```typescript
// Current code - INCOMPLETE
await appointmentService.updateAppointmentStatus(data.appointment.id, 'in_progress');
goto(`/work/assessments/${data.appointment.id}`);
// Missing: Update assessment stage to 'assessment_in_progress'
```

**Why it fails**:
- Assessment stays at `appointment_scheduled` stage even after engineer starts working
- Causes assessment to remain visible in Appointments list
- Assessment doesn't appear in Open Assessments list (queries for `assessment_in_progress`)

---

## Root Cause Analysis

### Investigation Summary

Both bugs stem from **sidebar queries not aligning with the assessment-centric architecture's stage-based foreign key lifecycle**:

#### Foreign Key Lifecycle by Stage

| Stage | `inspection_id` | `appointment_id` | Sidebar Should Join |
|-------|----------------|------------------|---------------------|
| 1. request_submitted | NULL | NULL | N/A |
| 2. request_reviewed | NULL | NULL | N/A |
| 3. inspection_scheduled | **SET** ✓ | NULL ❌ | **inspections** |
| 4. appointment_scheduled | SET | **SET** ✓ | **appointments** |
| 5+ assessment_in_progress+ | SET | SET | **appointments** |

**The Mismatch:**
- Inspection badge queries stage 3 (`inspection_scheduled`) but joins with `appointments` (NULL at this stage)
- Result: INNER JOIN fails, count = 0

### Current Data State for Engineer Jakes

**Engineer Details:**
- ID: `ad521f89-720e-4082-8600-f523fbd26ed5`
- Email: vandermerwe.jaco194@gmail.com
- Name: Jakes

**Assigned Work:**
- ✅ 6 inspections assigned (INS-2025-008 through INS-2025-013)
- ✅ 5 appointments created (APT-2025-008, 009, 010, 011, 012)
- ✅ 1 assessment properly linked: ASM-2025-016 at `inspection_scheduled` stage
- ❌ Sidebar shows 0 (incorrect - should show 1)

---

## Solution Design

### Fix #1: Sidebar Inspection Badge Query

**Change sidebar to join with correct table per stage**

**File**: `src/lib/components/layout/Sidebar.svelte`
**Lines**: 147-153

**Before** (WRONG):
```typescript
async function loadInspectionCount() {
  let query = $page.data.supabase
    .from('assessments')
    .select('*, appointments!inner(engineer_id)', { count: 'exact', head: true })
    .eq('stage', 'inspection_scheduled');

  if (role === 'engineer' && engineer_id) {
    query = query.eq('appointments.engineer_id', engineer_id);
  }
```

**After** (CORRECT):
```typescript
async function loadInspectionCount() {
  let query = $page.data.supabase
    .from('assessments')
    .select('*, inspections!inner(assigned_engineer_id)', { count: 'exact', head: true })
    .eq('stage', 'inspection_scheduled');

  if (role === 'engineer' && engineer_id) {
    query = query.eq('inspections.assigned_engineer_id', engineer_id);
  }
```

**Rationale:**
- Stage `inspection_scheduled` (stage 3) has `inspection_id` set, not `appointment_id`
- Join with `inspections` table and filter by `assigned_engineer_id`
- Aligns with assessment-centric foreign key lifecycle

### Fix #2: handleStartAssessment Stage Update

**Add assessment lookup and stage update**

**File**: `src/routes/(app)/work/appointments/[id]/+page.svelte`
**Lines**: 49-63

**Before** (INCOMPLETE):
```typescript
async function handleStartAssessment() {
  loading = true;
  error = null;

  try {
    await appointmentService.updateAppointmentStatus(data.appointment.id, 'in_progress');
    goto(`/work/assessments/${data.appointment.id}`);
  } catch (err) {
    console.error('Error starting assessment:', err);
    error = err instanceof Error ? err.message : 'Failed to start assessment';
    loading = false;
  }
}
```

**After** (COMPLETE):
```typescript
async function handleStartAssessment() {
  loading = true;
  error = null;

  try {
    // Step 1: Update appointment status to in_progress
    await appointmentService.updateAppointmentStatus(data.appointment.id, 'in_progress');

    // Step 2: Find assessment by appointment_id
    const assessment = await assessmentService.getAssessmentByAppointment(
      data.appointment.id
    );

    // Step 3: Update assessment stage to assessment_in_progress
    if (assessment) {
      await assessmentService.updateStage(
        assessment.id,
        'assessment_in_progress'
      );
    } else {
      console.error('No assessment found for appointment:', data.appointment.id);
      throw new Error('Assessment not found for this appointment');
    }

    // Step 4: Navigate to assessment page
    goto(`/work/assessments/${data.appointment.id}`);
  } catch (err) {
    console.error('Error starting assessment:', err);
    error = err instanceof Error ? err.message : 'Failed to start assessment';
    loading = false;
  }
}
```

**Rationale:**
- Uses existing `getAssessmentByAppointment()` method (lines 338-352 in assessment.service.ts)
- Updates stage to `assessment_in_progress` using `updateStage()` (includes audit logging)
- Proper error handling if assessment not found
- Maintains existing appointment status update

---

## Implementation Plan

### Step 1: Fix Sidebar Inspection Badge (5 minutes)

**File**: `src/lib/components/layout/Sidebar.svelte`

1. Change line 149 from:
   ```typescript
   .select('*, appointments!inner(engineer_id)', { count: 'exact', head: true })
   ```
   To:
   ```typescript
   .select('*, inspections!inner(assigned_engineer_id)', { count: 'exact', head: true })
   ```

2. Change line 153 from:
   ```typescript
   query = query.eq('appointments.engineer_id', engineer_id);
   ```
   To:
   ```typescript
   query = query.eq('inspections.assigned_engineer_id', engineer_id);
   ```

### Step 2: Fix handleStartAssessment (10 minutes)

**File**: `src/routes/(app)/work/appointments/[id]/+page.svelte`

1. Ensure `assessmentService` is imported (already imported at line 22)

2. Replace `handleStartAssessment()` function (lines 49-63) with complete version above

### Step 3: Verify with Type Check (5 minutes)

Run type check to ensure no errors:
```bash
npm run check
```

### Step 4: Test with Engineer Account (20 minutes)

**Test Sidebar Badge:**
1. Login as vandermerwe.jaco194@gmail.com
2. Verify "Assigned Work" badge shows **1** (ASM-2025-016)
3. Click badge and verify inspection INS-2025-013 appears in list

**Test Start Assessment:**
1. Navigate to an appointment at `appointment_scheduled` stage
2. Click "Start Assessment"
3. Verify assessment moves to "Open Assessments" page
4. Verify assessment no longer appears in Appointments list
5. Verify appointment status updated to `in_progress`
6. Verify assessment stage updated to `assessment_in_progress`

---

## Expected Results

### After Fix #1 (Sidebar Badge)
- ✅ Sidebar "Assigned Work" badge shows: **1** (ASM-2025-016)
- ✅ Engineer can click badge to see inspection INS-2025-013
- ✅ Badge count accurately reflects engineer's assigned inspections

### After Fix #2 (handleStartAssessment)
- ✅ "Start Assessment" properly updates assessment stage
- ✅ Assessment moves from Appointments list to Open Assessments list
- ✅ Appointment status updated to `in_progress`
- ✅ Assessment stage updated to `assessment_in_progress`
- ✅ Audit trail logged for stage transition

### Combined Impact
- ✅ Engineer sees accurate workload in sidebar
- ✅ Assessment workflow progresses correctly through stages
- ✅ No more "disappearing" assessments
- ✅ Sidebar badges align with assessment-centric architecture

---

## Verification SQL

### Verify Sidebar Fix
```sql
-- BEFORE FIX: Current broken query (returns 0)
SELECT COUNT(*)
FROM assessments a
INNER JOIN appointments apt ON a.appointment_id = apt.id
WHERE a.stage = 'inspection_scheduled'
  AND apt.engineer_id = 'ad521f89-720e-4082-8600-f523fbd26ed5';
-- Result: 0 ❌

-- AFTER FIX: Corrected query (returns 1)
SELECT COUNT(*)
FROM assessments a
INNER JOIN inspections i ON a.inspection_id = i.id
WHERE a.stage = 'inspection_scheduled'
  AND i.assigned_engineer_id = 'ad521f89-720e-4082-8600-f523fbd26ed5';
-- Result: 1 ✅
```

### Verify Stage Update
```sql
-- Check assessment stage before and after "Start Assessment"
SELECT
  a.id,
  a.assessment_number,
  a.stage,
  a.appointment_id,
  apt.status as appointment_status
FROM assessments a
JOIN appointments apt ON a.appointment_id = apt.id
WHERE apt.id = '<appointment_id>';

-- Before: stage = 'appointment_scheduled', appointment.status = 'scheduled'
-- After: stage = 'assessment_in_progress', appointment.status = 'in_progress'
```

---

## Related Documentation

- [Assessment-Centric Architecture SOP](../../.agent/SOP/working_with_assessment_centric_architecture.md) - Updated with hybrid design rationale
- [Code Verification Report](../../.agent/Tasks/active/code_verification_report_jan27.md) - Complete verification findings
- [Assessment-Centric Architecture PRD](../../.agent/Tasks/active/assessment_centric_architecture_refactor.md) - Original architecture design
- [Database Schema](../../.agent/System/database_schema.md) - Foreign key relationships

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Type check errors | Low | Low | Already verified imports exist, methods exist |
| Other badges break | Very Low | Low | Only changing inspection badge, others use correct joins |
| Assessment not found | Very Low | Medium | Added explicit error handling with user-friendly message |
| RLS policy blocks update | Very Low | High | Service methods use ServiceClient injection (RLS compliant) |

---

## Quality Checklist

**Before committing:**
- [ ] Type check passes (`npm run check`)
- [ ] Sidebar badge shows correct count for engineer
- [ ] "Start Assessment" updates assessment stage
- [ ] Assessment moves to correct list after starting
- [ ] No console errors during workflow
- [ ] Audit logs created for stage transition

**Testing:**
- [ ] Login as engineer
- [ ] Verify sidebar badge count
- [ ] Click badge, see inspection
- [ ] Start assessment from appointment
- [ ] Verify assessment in Open Assessments
- [ ] Verify not in Appointments anymore

---

## Implementation Notes

**Estimated total time**: 40 minutes
- Fix #1 (Sidebar): 5 minutes
- Fix #2 (handleStartAssessment): 10 minutes
- Type check: 5 minutes
- Testing: 20 minutes

**Files modified**: 2
1. `src/lib/components/layout/Sidebar.svelte`
2. `src/routes/(app)/work/appointments/[id]/+page.svelte`

**Database changes**: None (code-only fixes)

**Breaking changes**: None (fixes bugs, maintains existing functionality)

---

**Created**: January 27, 2025
**Last Updated**: January 27, 2025
**Status**: Ready for implementation
