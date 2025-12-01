# Fix Badge Count Mismatches - Assessment-Centric Architecture Alignment

**Status:** 🚧 IN PROGRESS
**Priority:** CRITICAL
**Created:** January 27, 2025
**Engineer:** ad521f89-720e-4082-8600-f523fbd26ed5
**Estimated Time:** 2-3 hours

---

## Problem Statement

Engineers are seeing **incorrect badge counts** in the sidebar that don't match the actual page data. Specifically, the Appointments badge shows **4** but the Appointments page only displays **1 appointment**.

**Reported Issue:**
- Engineer sees "Appointments: 4" badge in sidebar
- Engineer navigates to Appointments page, sees only 1 appointment
- Badge count doesn't match page count, creating confusion

**User Impact:**
- Loss of trust in the system
- Confusion about actual workload
- Engineers may miss or ignore important tasks
- Support tickets from users reporting "missing" items

---

## Root Cause Analysis

### Database Verification (Supabase MCP)

**Engineer ID:** `ad521f89-720e-4082-8600-f523fbd26ed5`

**Appointments Table Query:**
```sql
SELECT COUNT(*) FROM appointments
WHERE status = 'scheduled'
  AND engineer_id = 'ad521f89-720e-4082-8600-f523fbd26ed5';
-- Result: 4 appointments
```

**Assessments Table Query:**
```sql
SELECT COUNT(*) FROM assessments a
INNER JOIN appointments ap ON a.appointment_id = ap.id
WHERE ap.engineer_id = 'ad521f89-720e-4082-8600-f523fbd26ed5'
  AND a.stage IN ('appointment_scheduled', 'assessment_in_progress');
-- Result: 1 assessment
```

**Orphaned Appointments Found:**
4 appointments exist with `status='scheduled'` but have **NO linked assessments**:
1. `1cbef383-8095-46be-b8c0-4afa40d91f08` - Created Oct 26, 2025 (assessment_id: NULL)
2. `a0bc642f-91e3-4cc7-9508-dc1fdf2b210c` - Created Oct 25, 2025 (assessment_id: NULL)
3. `e321de0f-5580-40c1-8436-17a6164ea16d` - Created Oct 25, 2025 (assessment_id: NULL)
4. `1ffc584c-ec07-4ddd-a537-60aae4720978` - Created Oct 25, 2025 (assessment_id: NULL)

These are **pre-assessment-centric architecture** appointments created before the January 26, 2025 refactor.

---

### Architectural Mismatch

**Root Cause:** Phase 3 assessment-centric refactor (January 26, 2025) updated page queries but **forgot to update badge queries**.

**What Happened:**
1. ✅ **Phase 3 Completed**: All 7 list pages updated to query `assessments` table with stage-based filters
2. ❌ **Badge Counts NOT Updated**: Sidebar badges still query old table-centric tables with status filters
3. 🐛 **Result**: Badge counts and page counts completely disconnected

**Evidence from Network Logs:**
```
# Badge count query (XHR HEAD request)
GET /rest/v1/appointments?select=*&status=eq.scheduled&engineer_id=eq.ad521f89-720e-4082-8600-f523fbd26ed5
# Returns: 4 records (appointments table)

# Page query (would be GET request)
GET /rest/v1/assessments?select=*,appointments!inner(engineer_id)&stage=in.(appointment_scheduled,assessment_in_progress)&appointments.engineer_id=eq.ad521f89-720e-4082-8600-f523fbd26ed5
# Returns: 1 record (assessments table)
```

---

## Badge Audit Results

### Research Agent Analysis

**Comprehensive audit of all 7 badges:**

| # | Badge Name | Current Query | Page Query | Status | Priority |
|---|------------|---------------|------------|---------|----------|
| 1 | New Requests | `requests` / `status='submitted'` | `requests` / NONE | ⚠️ MISMATCH | HIGH |
| 2 | **Inspections** | `inspections` / `status='pending'` | `assessments` / `stage='inspection_scheduled'` | ❌ CRITICAL | **URGENT** |
| 3 | **Appointments** | `appointments` / `status='scheduled'` | `assessments` / `stage IN (2 stages)` | ❌ CRITICAL | **URGENT** |
| 4 | Open Assessments | `assessments` / `stage IN (3 stages)` | `assessments` / `stage IN (3 stages)` | ✅ CORRECT | N/A |
| 5 | Finalized | `assessments` / `stage='estimate_finalized'` | `assessments` / `stage='estimate_finalized'` | ✅ CORRECT | N/A |
| 6 | FRC | `assessment_frc` + `stage='frc_in_progress'` | `assessment_frc` + `stage='frc_in_progress'` | ✅ CORRECT | N/A |
| 7 | Additionals | `assessment_additionals` / No stage filter | `assessment_additionals` / No stage filter | ✅ CORRECT | N/A |

**Summary:**
- ✅ **4 badges correct**: Open Assessments, Finalized, FRC, Additionals
- ❌ **3 badges broken**: Inspections, Appointments, Requests

---

## Implementation Plan

### Phase 1: Fix Critical Badge Queries (45-60 min)

#### Task 1.1: Create This Task Document ✅
**Status:** COMPLETE
**File:** `.agent/Tasks/active/fix_badge_count_mismatches.md`

#### Task 1.2: Fix Appointments Badge (CRITICAL)
**File:** `src/lib/components/layout/Sidebar.svelte` (lines 140-150)

**Current Implementation:**
```typescript
async function loadAppointmentCount() {
    try {
        const filters: any = { status: 'scheduled' };
        if (role === 'engineer' && engineer_id) {
            filters.engineer_id = engineer_id;
        }
        appointmentCount = await appointmentService.getAppointmentCount(filters, $page.data.supabase);
    } catch (error) {
        console.error('Error loading appointment count:', error);
    }
}
```

**Problem:**
- Queries `appointments` table with `status='scheduled'`
- Returns 4 records (includes orphaned appointments)
- Page queries `assessments` table with `stage IN ('appointment_scheduled', 'assessment_in_progress')`
- Returns 1 record (only valid assessments)

**Solution:**
```typescript
async function loadAppointmentCount() {
    try {
        let query = $page.data.supabase
            .from('assessments')
            .select('*, appointments!inner(engineer_id)', { count: 'exact', head: true })
            .in('stage', ['appointment_scheduled', 'assessment_in_progress']);

        if (role === 'engineer' && engineer_id) {
            query = query.eq('appointments.engineer_id', engineer_id);
        }

        const { count, error } = await query;

        if (error) {
            console.error('Error loading appointment count:', error);
            appointmentCount = 0;
        } else {
            appointmentCount = count || 0;
        }
    } catch (error) {
        console.error('Error loading appointment count:', error);
        appointmentCount = 0;
    }
}
```

**Impact:** Badge will show 1 (matching page) instead of 4

---

#### Task 1.3: Fix Inspections Badge (CRITICAL)
**File:** `src/lib/components/layout/Sidebar.svelte` (lines 128-138)

**Current Implementation:**
```typescript
async function loadInspectionCount() {
    try {
        const filters: any = { status: 'pending' };
        if (role === 'engineer' && engineer_id) {
            filters.engineer_id = engineer_id;
        }
        inspectionCount = await inspectionService.getInspectionCount(filters, $page.data.supabase);
    } catch (error) {
        console.error('Error loading inspection count:', error);
    }
}
```

**Problem:**
- Queries `inspections` table with `status='pending'`
- Page queries `assessments` table with `stage='inspection_scheduled'`
- Complete architectural mismatch

**Solution:**
```typescript
async function loadInspectionCount() {
    try {
        let query = $page.data.supabase
            .from('assessments')
            .select('*, requests!inner(assigned_engineer_id)', { count: 'exact', head: true })
            .eq('stage', 'inspection_scheduled');

        if (role === 'engineer' && engineer_id) {
            query = query.eq('requests.assigned_engineer_id', engineer_id);
        }

        const { count, error } = await query;

        if (error) {
            console.error('Error loading inspection count:', error);
            inspectionCount = 0;
        } else {
            inspectionCount = count || 0;
        }
    } catch (error) {
        console.error('Error loading inspection count:', error);
        inspectionCount = 0;
    }
}
```

**Impact:** Badge will match inspections page query exactly

---

#### Task 1.4: Fix Requests Badge (MEDIUM PRIORITY)
**File:** `src/lib/components/layout/Sidebar.svelte` (lines 120-126)

**Current Implementation:**
```typescript
async function loadNewRequestCount() {
    try {
        newRequestCount = await requestService.getRequestCount({ status: 'submitted' }, $page.data.supabase);
    } catch (error) {
        console.error('Error loading new request count:', error);
    }
}
```

**Problem:**
- Queries `requests` table with `status='submitted'`
- Page shows ALL requests (no filter)
- Badge undercounts versus page

**Solution:**
```typescript
async function loadNewRequestCount() {
    try {
        const { count, error } = await $page.data.supabase
            .from('assessments')
            .select('*', { count: 'exact', head: true })
            .in('stage', ['request_submitted', 'request_reviewed']);

        if (error) {
            console.error('Error loading new request count:', error);
            newRequestCount = 0;
        } else {
            newRequestCount = count || 0;
        }
    } catch (error) {
        console.error('Error loading new request count:', error);
        newRequestCount = 0;
    }
}
```

**Impact:** Badge aligns with assessment-centric architecture

---

### Phase 2: Create Reusable Count Methods (30-45 min)

#### Task 2.1: Add Generic Count Methods to Assessment Service
**File:** `src/lib/services/assessment.service.ts`

**Method 1: Count by Single Stage**
```typescript
/**
 * Get count of assessments at a specific stage, optionally filtered by engineer
 */
async getCountByStage(
    client: ServiceClient,
    stage: AssessmentStage,
    engineer_id?: string | null,
    joinTable?: 'appointments' | 'requests'
): Promise<number> {
    const db = client ?? supabase;

    let query = db
        .from('assessments')
        .select(`*, ${joinTable || 'appointments'}!inner(engineer_id)`, {
            count: 'exact',
            head: true
        })
        .eq('stage', stage);

    if (engineer_id) {
        const filterColumn = joinTable === 'requests'
            ? 'requests.assigned_engineer_id'
            : 'appointments.engineer_id';
        query = query.eq(filterColumn, engineer_id);
    }

    const { count, error } = await query;

    if (error) {
        console.error(`Error counting assessments at stage ${stage}:`, error);
        return 0;
    }

    return count || 0;
}
```

**Method 2: Count by Multiple Stages**
```typescript
/**
 * Get count of assessments at multiple stages, optionally filtered by engineer
 */
async getCountByStages(
    client: ServiceClient,
    stages: AssessmentStage[],
    engineer_id?: string | null,
    joinTable?: 'appointments' | 'requests'
): Promise<number> {
    const db = client ?? supabase;

    let query = db
        .from('assessments')
        .select(`*, ${joinTable || 'appointments'}!inner(engineer_id)`, {
            count: 'exact',
            head: true
        })
        .in('stage', stages);

    if (engineer_id) {
        const filterColumn = joinTable === 'requests'
            ? 'requests.assigned_engineer_id'
            : 'appointments.engineer_id';
        query = query.eq(filterColumn, engineer_id);
    }

    const { count, error } = await query;

    if (error) {
        console.error(`Error counting assessments at stages ${stages.join(', ')}:`, error);
        return 0;
    }

    return count || 0;
}
```

**Benefits:**
- Centralized stage-based counting logic
- Reusable across all badge implementations
- Consistent engineer filtering pattern
- Handles both appointments and requests joins
- Single source of truth for count queries

---

#### Task 2.2: Refactor Badges to Use Service Methods
**File:** `src/lib/components/layout/Sidebar.svelte`

**After adding service methods, refactor badges:**

**Inspections Badge (using service method):**
```typescript
async function loadInspectionCount() {
    try {
        const engineerIdFilter = role === 'engineer' ? engineer_id : undefined;
        inspectionCount = await assessmentService.getCountByStage(
            $page.data.supabase,
            'inspection_scheduled',
            engineerIdFilter,
            'requests'  // Join via requests table
        );
    } catch (error) {
        console.error('Error loading inspection count:', error);
        inspectionCount = 0;
    }
}
```

**Appointments Badge (using service method):**
```typescript
async function loadAppointmentCount() {
    try {
        const engineerIdFilter = role === 'engineer' ? engineer_id : undefined;
        appointmentCount = await assessmentService.getCountByStages(
            $page.data.supabase,
            ['appointment_scheduled', 'assessment_in_progress'],
            engineerIdFilter,
            'appointments'  // Join via appointments table
        );
    } catch (error) {
        console.error('Error loading appointment count:', error);
        appointmentCount = 0;
    }
}
```

---

### Phase 3: Documentation (30 min)

#### Task 3.1: Create Badge Counts SOP
**File:** `.agent/SOP/implementing_badge_counts.md`

**Contents:**
- Badge count best practices
- Assessment-centric badge pattern
- How to add new badges correctly
- Common pitfalls (table-centric queries)
- Testing checklist for badge counts
- Code examples for all patterns

#### Task 3.2: Update Assessment-Centric SOP
**File:** `.agent/SOP/working_with_assessment_centric_architecture.md`

**Add section:** "Badge Count Implementation Pattern"
- Badge counts must query assessments table
- Use stage-based filters (not status)
- Engineer filtering via joins
- Example implementations
- Link to badge counts SOP

#### Task 3.3: Update README
**File:** `.agent/README.md`

**Add to Recent Updates:**
- Badge count mismatch fix completion
- Summary of 3 badges fixed
- Database verification results
- Link to task document

---

### Phase 4: Testing & Verification (20-30 min)

#### Test Scenario 1: Engineer Badge Counts
**User:** Engineer `ad521f89-720e-4082-8600-f523fbd26ed5`

**Steps:**
1. Log in as engineer
2. Check sidebar badge counts
3. Navigate to each page
4. Verify badge count matches page row count

**Expected Results:**
- ✅ Appointments badge: Shows 1 (not 4)
- ✅ Inspections badge: Shows 0 (matches page)
- ✅ Requests badge: Shows correct count
- ✅ Open Assessments badge: Shows correct count (already working)
- ✅ Finalized badge: Shows correct count (already working)
- ✅ FRC badge: Shows correct count (already working)
- ✅ Additionals badge: Shows correct count (already working)

---

#### Test Scenario 2: Admin Badge Counts
**User:** Admin user

**Steps:**
1. Log in as admin
2. Check sidebar badge counts
3. Navigate to each page
4. Verify badge count matches page row count

**Expected Results:**
- ✅ All badges show correct counts (no engineer filtering)
- ✅ Badge counts match page counts exactly
- ✅ No console errors

---

#### Test Scenario 3: Badge Polling
**Steps:**
1. Log in as engineer
2. Wait 10 seconds (badge polling interval)
3. Check console for badge count refresh
4. Verify no errors during refresh

**Expected Results:**
- ✅ Badges refresh every 10 seconds
- ✅ No console errors during refresh
- ✅ Counts remain accurate

---

#### Test Scenario 4: Edge Cases
**Steps:**
1. Create assessment with no appointment linked
2. Create assessment at 'assessment_in_progress' stage
3. Check if badges handle edge cases correctly

**Expected Results:**
- ✅ No errors for assessments without appointments
- ✅ Assessment at 'assessment_in_progress' shows in appointments badge
- ✅ Proper null handling

---

## Success Criteria

- [x] Task document created with comprehensive analysis
- [ ] Appointments badge fixed (queries assessments table)
- [ ] Inspections badge fixed (queries assessments table)
- [ ] Requests badge fixed (queries assessments table)
- [ ] Reusable count methods added to assessment service
- [ ] Badges refactored to use service methods
- [ ] Badge counts SOP created
- [ ] Assessment-centric SOP updated
- [ ] README updated with fix completion
- [ ] All test scenarios pass for admin and engineer
- [ ] Badge polling works correctly
- [ ] No console errors

---

## Files Modified

### Code Changes (2 files):
1. `src/lib/components/layout/Sidebar.svelte` - Fix 3 badge queries (lines 120-150)
2. `src/lib/services/assessment.service.ts` - Add 2 reusable count methods

### Documentation (4 files):
3. `.agent/Tasks/active/fix_badge_count_mismatches.md` - This document
4. `.agent/SOP/implementing_badge_counts.md` - New SOP (create)
5. `.agent/SOP/working_with_assessment_centric_architecture.md` - Update
6. `.agent/README.md` - Update recent updates section

---

## Related Documentation

- [Assessment-Centric Architecture Refactor](./assessment_centric_architecture_refactor.md) - Original Phase 3 refactor
- [Phase 3 Implementation](./implement_phase_3_stage_based_list_pages.md) - Phase 3 task (missed badge counts)
- [Working with Assessment-Centric Architecture SOP](../SOP/working_with_assessment_centric_architecture.md) - Architecture patterns
- [Project Architecture](../System/project_architecture.md) - Complete system overview
- [Database Schema](../System/database_schema.md) - Database structure

---

## Notes

- This fix completes the Phase 3 assessment-centric refactor that was partially implemented on January 26, 2025
- Badge counts were overlooked during Phase 3 implementation
- 4 orphaned appointments exist from pre-refactor period (can be cleaned up in separate task)
- Research agents (Research Context Gatherer + Explore) provided comprehensive audit
- Database verification performed using Supabase MCP tool

---

**Created By:** Claude Code
**Research By:** Research Context Gatherer + Explore Agents
**Database Verification:** Supabase MCP
**Implementation By:** Claude Code + User
