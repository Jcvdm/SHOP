# Bug Post-Mortem: Appointment Stage Transition Failure

**Date**: January 29, 2025
**Severity**: Critical
**Status**: Fixed
**Bug ID**: ASM-2025-STAGE-TRANSITION-001

---

## Executive Summary

Engineers clicking "Start Assessment" on appointments were unable to move assessments from the Appointments list to the Open Assessments list. The root cause was a missing stage (`appointment_scheduled`) in the server-side stage transition logic.

**Impact**: Core assessment workflow broken for all engineers
**Duration**: Unknown (discovered January 29, 2025)
**Fix Time**: 20 minutes (research) + 5 minutes (implementation)
**Users Affected**: All engineers using appointment workflow

---

## Timeline

**2025-10-29 ~06:00** - User reports appointments not moving to Open Assessments after "Start Assessment" clicked
**2025-10-29 06:10** - Initial diagnosis: Client-side `assessmentService is not defined` error found and fixed
**2025-10-29 06:15** - User tests fix, reports appointments still not moving to Open Assessments
**2025-10-29 06:20** - Deep dive research using research-context-gatherer and code-quality-validator agents
**2025-10-29 06:25** - Root cause identified: Missing `'appointment_scheduled'` in stage transition array (line 68)
**2025-10-29 06:26** - Fix applied: Added missing stage to array
**2025-10-29 06:26** - User tested successfully: Appointments now move to Open Assessments correctly
**2025-10-29 06:30** - Database state verified: Stage transitions working correctly
**2025-10-29 06:40** - Documentation updated and post-mortem created

---

## What Happened

### User Report
"When I click 'Start Assessment' on an appointment, it navigates to the assessment page correctly, but when I go back to the Appointments list, the appointment is still there. It should have moved to Open Assessments."

### Expected Behavior
1. Engineer clicks "Start Assessment" on appointment (at `appointment_scheduled` stage)
2. Assessment page loads
3. Server automatically transitions assessment from `appointment_scheduled` → `assessment_in_progress`
4. Appointment disappears from Appointments list (filtered by `appointment_scheduled` stage)
5. Assessment appears in Open Assessments list (filtered by `assessment_in_progress`, `estimate_review`, `estimate_sent`)

### Actual Behavior
1. Engineer clicks "Start Assessment" on appointment ✅
2. Assessment page loads ✅
3. Server **SKIPS** stage transition (stage remains `appointment_scheduled`) ❌
4. Appointment **STAYS** in Appointments list ❌
5. Assessment **NEVER APPEARS** in Open Assessments list ❌

---

## Root Cause Analysis

### Primary Cause

**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts`
**Line**: 68
**Issue**: Missing `'appointment_scheduled'` from stage transition conditional array

**Code:**
```typescript
// ❌ BROKEN CODE (before fix)
if (['request_submitted', 'request_accepted', 'inspection_scheduled'].includes(assessment.stage)) {
    const oldStage = assessment.stage;
    assessment = await assessmentService.updateStage(
        assessment.id,
        'assessment_in_progress',
        locals.supabase
    );
    console.log(`Assessment stage updated from ${oldStage} to assessment_in_progress`);
}
```

**What Happened:**
- When engineer navigates to `/work/assessments/{appointment_id}`, server load function runs
- Assessment is at `appointment_scheduled` stage
- Line 68 conditional: `['request_submitted', 'request_accepted', 'inspection_scheduled'].includes('appointment_scheduled')` → **FALSE**
- Stage transition block is skipped
- Assessment remains at `appointment_scheduled` stage
- Appointments list query `.eq('stage', 'appointment_scheduled')` still matches → appointment stays visible
- Open Assessments list query `.in('stage', ['assessment_in_progress', 'estimate_review', 'estimate_sent'])` doesn't match → assessment not visible

### Contributing Factors

1. **Hard-coded Stage Arrays**: Stage transition logic uses inline arrays instead of centralized constants
2. **No Integration Tests**: No automated tests covering full appointment → assessment workflow
3. **Incomplete Migration**: When `appointment_scheduled` stage was added to pipeline, not all transition checks were updated
4. **Silent Failure**: No error logged when stage transition is skipped (works as designed, but design was incomplete)

---

## Investigation Process

### Tools Used
1. **research-context-gatherer agent**: Analyzed query patterns across appointments and assessments pages
2. **code-quality-validator agent**: Reviewed stage transition logic for completeness
3. **Supabase MCP**: Verified database state before/after fix

### Key Findings

**Appointments Page Query** (`src/routes/(app)/work/appointments/+page.server.ts:24`):
```typescript
.eq('stage', 'appointment_scheduled')  // ✅ Correct query
```

**Open Assessments Page Query** (`src/routes/(app)/work/assessments/+page.server.ts`):
```typescript
.in('stage', ['assessment_in_progress', 'estimate_review', 'estimate_sent'])  // ✅ Correct query
```

**Assessment Detail Page Transition** (`src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts:68`):
```typescript
if (['request_submitted', 'request_accepted', 'inspection_scheduled'].includes(assessment.stage)) {
    // ❌ Missing 'appointment_scheduled'
```

**Conclusion**: Queries were correct. Stage transition logic was incomplete.

---

## The Fix

### Code Change

**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts`
**Line**: 68

**Before**:
```typescript
if (['request_submitted', 'request_accepted', 'inspection_scheduled'].includes(assessment.stage)) {
```

**After**:
```typescript
if (['request_submitted', 'request_accepted', 'inspection_scheduled', 'appointment_scheduled'].includes(assessment.stage)) {
```

**Change**: Added `'appointment_scheduled'` to the array

### Testing Results

**Test Case**: APT-2025-014 / ASM-2025-017

**Before Fix**:
- Appointment status: `scheduled`
- Assessment stage: `appointment_scheduled`
- Clicked "Start Assessment" → Assessment stage remained `appointment_scheduled`
- Appointment stayed in Appointments list
- Assessment not visible in Open Assessments list

**After Fix**:
- Appointment status: `scheduled` → `in_progress` ✅
- Assessment stage: `appointment_scheduled` → `assessment_in_progress` ✅
- Clicked "Start Assessment" → Assessment stage updated correctly
- Appointment disappeared from Appointments list ✅
- Assessment appeared in Open Assessments list ✅

**Database Verification**:
```sql
SELECT
  a.appointment_number,
  a.status as appointment_status,
  asm.assessment_number,
  asm.stage as assessment_stage
FROM appointments a
LEFT JOIN assessments asm ON asm.appointment_id = a.id
WHERE a.appointment_number = 'APT-2025-014';

-- Result after fix:
-- appointment_status: in_progress
-- assessment_stage: assessment_in_progress
```

---

## Impact Assessment

### Severity: Critical

**Why Critical:**
- Blocks core engineer workflow (starting assessments)
- 100% of engineers affected when using appointment workflow
- No workaround available (engineers couldn't proceed with assessments)
- Data integrity maintained (no corruption), but workflow completely broken

### Business Impact
- Engineers unable to start assessments from appointments
- Assessments stuck in "Appointments" queue instead of "Open Assessments" work queue
- Workflow bottleneck preventing assessment completion
- Potential SLA violations if appointments not processed

### Technical Impact
- Assessment-centric architecture stage transitions broken for one critical stage
- List page filters working correctly, but data not transitioning between stages
- No data loss or corruption (just workflow stuck)

---

## Prevention Measures

### Immediate Actions (Completed)

1. ✅ **Fix Applied**: Added missing stage to transition array
2. ✅ **Testing**: Verified fix works end-to-end
3. ✅ **Documentation**: Updated assessment-centric SOP with "Common Bugs" section
4. ✅ **Post-Mortem**: Created this document

### Short-Term Prevention (Next Sprint)

1. **Centralize Stage Constants**: Create `src/lib/constants/assessment-stages.ts`
   ```typescript
   export const STAGES_ELIGIBLE_FOR_IN_PROGRESS = [
       'request_submitted',
       'request_accepted',
       'inspection_scheduled',
       'appointment_scheduled'
   ] as const;
   ```

2. **Code Search Audit**: Search codebase for other hard-coded stage arrays
   ```bash
   grep -r "includes.*assessment.stage" src/
   ```

3. **Add Integration Tests**: Test full workflow from appointment → assessment
   ```typescript
   test('Appointment moves to Open Assessments after Start Assessment', async () => {
       // Create appointment at appointment_scheduled stage
       // Click "Start Assessment"
       // Verify assessment at assessment_in_progress stage
       // Verify appointment not in Appointments list
       // Verify assessment in Open Assessments list
   });
   ```

### Long-Term Prevention (Future)

1. **Stage Transition Framework**: Create centralized stage transition logic
   ```typescript
   // Single source of truth for all stage transitions
   export const STAGE_TRANSITIONS = {
       to_assessment_in_progress: ['request_submitted', 'request_accepted', 'inspection_scheduled', 'appointment_scheduled'],
       to_estimate_review: ['assessment_in_progress'],
       // ... etc
   };
   ```

2. **Automated Migration Checks**: When adding new stages, automated checks for:
   - All server load functions with stage conditionals
   - All service methods with stage filters
   - All list page queries with stage filters

3. **Better Logging**: Add warnings when stage transitions are skipped
   ```typescript
   if (STAGES_ELIGIBLE_FOR_IN_PROGRESS.includes(assessment.stage)) {
       // Transition
   } else {
       console.log(`Stage transition to in_progress skipped for stage: ${assessment.stage}`);
   }
   ```

4. **Code Review Checklist**: Add item to checklist:
   - [ ] When adding new stages, search for all hard-coded stage arrays and update

---

## Lessons Learned

### What Went Well

1. **Fast Diagnosis**: Research agents quickly identified root cause
2. **Minimal Code Change**: One-line fix, low risk
3. **Idempotent Design**: Even though transition was missed, no data corruption
4. **Good Architecture**: Assessment-centric patterns made diagnosis straightforward
5. **Quick Testing**: User able to test immediately and confirm fix

### What Could Be Improved

1. **Testing Gap**: No integration tests covering appointment → assessment workflow
2. **Hard-Coded Values**: Stage transition logic uses inline arrays instead of constants
3. **Silent Skips**: Stage transitions skip silently without logging
4. **Documentation Gap**: Pipeline stage additions not documented with affected files
5. **Code Search**: Could have prevented by searching for stage arrays during stage addition

### Action Items

| Action | Owner | Priority | Status |
|--------|-------|----------|--------|
| Create stage constants file | Dev Team | High | Pending |
| Add integration tests | Dev Team | High | Pending |
| Audit codebase for hard-coded stages | Dev Team | Medium | Pending |
| Add logging for skipped transitions | Dev Team | Low | Pending |
| Update code review checklist | Dev Team | High | Pending |

---

## Related Documentation

- **SOP**: [Working with Assessment-Centric Architecture](../SOP/working_with_assessment_centric_architecture.md) - Updated with "Common Bugs" section
- **SOP**: [Navigation-Based State Transitions](../SOP/navigation_based_state_transitions.md) - Related pattern documentation
- **Architecture**: [Assessment-Centric Architecture PRD](../Tasks/active/assessment_centric_architecture_refactor.md)
- **Fix Commit**: January 29, 2025 - "fix: add appointment_scheduled to stage transition check"

---

## Conclusion

A critical bug in the assessment workflow was quickly identified and fixed. The issue was caused by incomplete migration when the `appointment_scheduled` stage was added to the pipeline. The fix was simple (adding one string to an array), but the impact was significant (core workflow broken).

Key takeaway: When modifying pipeline stages, audit ALL locations that check `assessment.stage` to ensure complete coverage. Centralized stage constants and better integration testing would have prevented this issue.

**Status**: ✅ Fixed and Deployed
**Verification**: ✅ Tested successfully with APT-2025-014
**Documentation**: ✅ Complete

---

**Created**: January 29, 2025
**Last Updated**: January 29, 2025
**Author**: Claude Code (Sonnet 4.5)
**Reviewed By**: User (manual testing)
