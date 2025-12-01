# Fix: 500 Error When Clicking Inspections

**Created:** January 27, 2025
**Priority:** Critical
**Status:** In Progress
**Estimated Time:** 10 minutes

## Problem Statement

Users get a 500 error when clicking on inspections from the `/work/inspections` list page. This affects both admin and engineer users for assessment ASM-2025-016 and any other assessment at `inspection_scheduled` stage without an appointment.

**Error Details:**
- **URL Accessed:** `/work/assessments/1155d8bb-c381-404c-98f7-916576a73fb0`
- **Expected:** Inspection detail page
- **Actual:** 500 error with "Failed to load assessment"
- **Supabase Error:** HTTP 406 when querying appointments table with assessment UUID

## Root Cause Analysis

### The Bug
**File:** `src/routes/(app)/work/inspections/+page.svelte` (line 105)

```typescript
function handleOpenReport() {
  if (selectedAssessment) {
    // BUG: Uses appointment_id which is NULL at inspection_scheduled stage
    goto(`/work/assessments/${selectedAssessment.appointment_id || selectedAssessment.id}`);
  }
}
```

### Why It Fails

1. **ASM-2025-016 State:**
   - Stage: `inspection_scheduled`
   - `appointment_id`: **NULL** (no appointment created yet)
   - `inspection_id`: Populated
   - `assessment.id`: `1155d8bb-c381-404c-98f7-916576a73fb0`

2. **Navigation Logic:**
   - Tries to use `appointment_id` (NULL)
   - Falls back to `assessment.id`
   - Routes to: `/work/assessments/{assessment-uuid}`

3. **Route Expectation:**
   - Route `/work/assessments/[appointment_id]` expects **appointment UUID**
   - Receives **assessment UUID** instead
   - Server queries: `SELECT * FROM appointments WHERE id = '{assessment-uuid}'`
   - No appointment found → 404/500 error

### Architectural Context

The assessment-centric refactor (January 2025) changed the data flow:

**Old Model:**
1. Request → Appointment created → Assessment started
2. Assessments always had `appointment_id` from creation
3. Navigation via `appointment_id` worked

**New Model:**
1. Request → **Assessment created immediately**
2. Inspection scheduled → `inspection_id` populated, `appointment_id` still NULL
3. Appointment scheduled → `appointment_id` populated
4. **Navigation logic not updated for NULL appointment_id case**

## Solution

### Fix Navigation Logic

**File:** `src/routes/(app)/work/inspections/+page.svelte` (line 105)

**Change from:**
```typescript
function handleOpenReport() {
  if (selectedAssessment) {
    goto(`/work/assessments/${selectedAssessment.appointment_id || selectedAssessment.id}`);
  }
}
```

**Change to:**
```typescript
function handleOpenReport() {
  if (selectedAssessment) {
    // Route based on appointment existence
    // Assessments at inspection_scheduled stage don't have appointments yet
    if (!selectedAssessment.appointment_id) {
      // No appointment - use inspection detail page (assessment-centric)
      goto(`/work/inspections/${selectedAssessment.id}`);
    } else {
      // Has appointment - use assessment detail page
      goto(`/work/assessments/${selectedAssessment.appointment_id}`);
    }
  }
}
```

### Why This Works

1. **Checks appointment existence:** `if (!selectedAssessment.appointment_id)`
2. **Routes to correct page:**
   - NULL appointment → `/work/inspections/{assessment_id}` (inspection detail - assessment-centric)
   - Has appointment → `/work/assessments/{appointment_id}` (assessment detail)
3. **Leverages existing fix:** The inspection detail page was already converted to assessment-centric architecture
4. **Clean separation:** Inspection stage vs assessment stage navigation

## Implementation Steps

### Step 1: Update Navigation Logic (3 min)
- [x] Read current `handleOpenReport()` function
- [x] Update navigation logic with appointment_id check
- [x] Add comment explaining the routing logic

### Step 2: Test Admin Access (2 min)
- [ ] Log in as admin (jaco@claimtech.co.za)
- [ ] Navigate to `/work/inspections`
- [ ] Click ASM-2025-016
- [ ] Verify inspection detail page loads (no 500 error)
- [ ] Verify all data displays correctly

### Step 3: Test Engineer Access (2 min)
- [ ] Log in as engineer (vandermerwe.jaco194@gmail.com / Jakes)
- [ ] Navigate to `/work/inspections`
- [ ] Verify ASM-2025-016 appears in list
- [ ] Click ASM-2025-016
- [ ] Verify inspection detail page loads (no 500 error)

### Step 4: Test Appointment Flow (3 min)
- [ ] From inspection detail page
- [ ] Click "Schedule Appointment"
- [ ] Create appointment
- [ ] Verify navigation after appointment created
- [ ] Click assessment from list (now has appointment)
- [ ] Verify routes to `/work/assessments/{appointment_id}`

## Acceptance Criteria

### Functional
- [ ] Admin can click inspections without 500 error
- [ ] Engineer can click inspections without 500 error
- [ ] Inspection detail page loads for assessments without appointments
- [ ] Assessment detail page loads for assessments with appointments
- [ ] No regression on existing appointment-based navigation

### Technical
- [ ] Navigation logic checks appointment_id existence
- [ ] Correct route used based on assessment state
- [ ] No console errors or warnings
- [ ] RLS policies allow access (already verified)

## Files Modified

**1. `src/routes/(app)/work/inspections/+page.svelte`**
- Line 105: `handleOpenReport()` function
- Change: Add conditional routing based on `appointment_id` existence
- Lines changed: ~10 (replacing 1 line with ~10 line conditional)

## Testing Checklist

### Test Case 1: Admin Access
**User:** jaco@claimtech.co.za
**Steps:**
1. Navigate to `/work/inspections`
2. Click ASM-2025-016

**Expected:**
- ✅ No 500 error
- ✅ Routes to `/work/inspections/1155d8bb-c381-404c-98f7-916576a73fb0`
- ✅ Inspection detail page loads
- ✅ All assessment data displays
- ✅ "Schedule Appointment" button visible

### Test Case 2: Engineer Access
**User:** vandermerwe.jaco194@gmail.com
**Steps:**
1. Navigate to `/work/inspections`
2. Verify ASM-2025-016 visible
3. Click ASM-2025-016

**Expected:**
- ✅ ASM-2025-016 appears in list (RLS working)
- ✅ No 500 error on click
- ✅ Routes to `/work/inspections/{uuid}`
- ✅ Detail page loads
- ✅ Can schedule appointment

### Test Case 3: Assessment with Appointment
**Setup:** Assessment that has `appointment_id` populated
**Steps:**
1. Click assessment from inspections list

**Expected:**
- ✅ Routes to `/work/assessments/{appointment_id}`
- ✅ Assessment detail page loads
- ✅ No regression on existing functionality

### Test Case 4: Appointment Scheduling
**Steps:**
1. From inspection detail page (ASM-2025-016)
2. Schedule appointment
3. After creation, click assessment again

**Expected:**
- ✅ Appointment created successfully
- ✅ `assessment.appointment_id` populated
- ✅ Next click routes to assessment detail page
- ✅ No errors in workflow

## Related Issues

### Fixed in Same Session
- Assessment-centric detail page conversion
- RLS policy for inspection-based access
- Engineer filtering in list page
- Appointment creation validation

### This Fix Completes
The assessment-centric migration for the inspection workflow by ensuring navigation logic matches the new architecture where assessments exist before appointments.

## Rollback Plan

If issues arise:

```bash
# Revert the change
git diff src/routes/(app)/work/inspections/+page.svelte
git checkout src/routes/(app)/work/inspections/+page.svelte
```

**Note:** This will restore the old behavior (500 error), but may be needed if the fix causes unexpected issues with other navigation paths.

## Success Metrics

**Immediate:**
- ✅ Zero 500 errors when clicking inspections
- ✅ Admin and engineer can access inspection details
- ✅ Correct route used for each assessment state

**Long-term:**
- ✅ Navigation logic aligns with assessment-centric architecture
- ✅ Clean separation between inspection and assessment routes
- ✅ No confusion about which route handles which stage

## Related Documentation

- **Assessment-Centric Architecture:** `.agent/SOP/working_with_assessment_centric_architecture.md`
- **Previous Fix:** `.agent/Tasks/active/fix_inspection_detail_and_engineer_visibility.md`
- **Implementation Complete:** `.agent/Tasks/active/IMPLEMENTATION_COMPLETE_Jan27_2025.md`

---

**Status:** Ready for implementation
**Estimated Time:** 10 minutes
**Impact:** Unblocks inspection workflow for all users
