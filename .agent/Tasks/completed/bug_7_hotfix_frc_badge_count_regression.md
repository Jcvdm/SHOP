# Bug #7 Hotfix: FRC Badge Count Regression

**Date**: 2025-01-12  
**Status**: ✅ **RESOLVED**  
**Severity**: High  
**Type**: Regression (Bug #7 optimization broke previous fix)

---

## Issue Summary

After applying the Bug #7 optimization (connection timeout fix), the FRC badge started showing **2 records** when only **1 active FRC** existed. The optimization inadvertently reverted a previous fix from Jan 29, 2025.

---

## Root Cause

### The Timeline

1. **Jan 29, 2025**: Fixed FRC badge count to filter by assessment stage and engineer assignment
   - Changed query from `assessment_frc` table to `assessments` table with joins
   - Properly filtered by `stage = 'estimate_finalized'` and engineer assignment
   - Documented in `.agent/System/bug_postmortem_badge_rls_filter_fixes_jan_29_2025.md`

2. **Jan 12, 2025 (Bug #7 Fix)**: Optimized query for performance
   - Changed back to direct query on `assessment_frc` table
   - **Removed stage filtering** to simplify query
   - Assumed RLS policies would handle filtering (they don't)
   - **Regression**: Broke the previous fix

### The Problem

**Bug #7 Optimized Query** (BROKEN):
```typescript
const { count, error } = await db
  .from('assessment_frc')
  .select('id', { count: 'exact', head: true })
  .eq('status', status);
```

**Issues**:
- ❌ No filtering by assessment stage
- ❌ Counts FRC from archived assessments
- ❌ RLS policy on `assessment_frc` has `qual = "true"` (no filtering)
- ❌ No engineer assignment filtering

**Database Evidence**:
```sql
-- 2 FRC records with status 'in_progress':
1. ASM-2025-021 - stage: 'estimate_finalized' (ACTIVE - should count)
2. ASM-2025-005 - stage: 'archived' (ARCHIVED - should NOT count)
```

---

## Solution

### Restored Working Query with Optimization

**File**: `src/lib/services/frc.service.ts` (lines 934-982)

**Fixed Query**:
```typescript
// Engineer view - filter by stage AND engineer assignment
const { count, error } = await db
  .from('assessments')
  .select('id, appointments!inner(engineer_id), assessment_frc!inner(status)',
          { count: 'exact', head: true })
  .eq('stage', 'estimate_finalized')  // Only active assessments
  .eq('appointments.engineer_id', engineer_id)
  .eq('assessment_frc.status', status);

// Admin view - filter by stage only
const { count, error } = await db
  .from('assessments')
  .select('id, assessment_frc!inner(status)', { count: 'exact', head: true })
  .eq('stage', 'estimate_finalized')  // Only active assessments
  .eq('assessment_frc.status', status);
```

**Benefits**:
- ✅ Filters by assessment stage (`estimate_finalized` only)
- ✅ Filters by engineer assignment (for engineers)
- ✅ Excludes archived assessments
- ✅ Still optimized (2-table join vs original 3-table join)
- ✅ Uses existing indexes from Bug #7 migration

---

## Verification

### Database Query Tests

**Admin Count** (all active FRC):
```sql
SELECT COUNT(*) FROM assessments
INNER JOIN assessment_frc ON assessments.id = assessment_frc.assessment_id
WHERE assessments.stage = 'estimate_finalized'
  AND assessment_frc.status = 'in_progress';
-- Result: 1 ✅
```

**Engineer Count** (engineer-specific active FRC):
```sql
SELECT COUNT(*) FROM assessments
INNER JOIN appointments ON assessments.appointment_id = appointments.id
INNER JOIN assessment_frc ON assessments.id = assessment_frc.assessment_id
WHERE assessments.stage = 'estimate_finalized'
  AND appointments.engineer_id = 'c7865f47-18fe-4fb0-90b9-c2ebfb68268f'
  AND assessment_frc.status = 'in_progress';
-- Result: 1 ✅
```

**Before Fix**: Both queries returned 2 (included archived assessment)  
**After Fix**: Both queries return 1 (correctly excludes archived assessment)

---

## Related Documentation

- **Original Fix**: `.agent/System/bug_postmortem_badge_rls_filter_fixes_jan_29_2025.md`
- **Bug #7 Fix**: `.agent/Tasks/completed/bug_7_finalize_force_click_timeout_fix.md`
- **Badge Count SOP**: `.agent/SOP/implementing_badge_counts.md`

---

## Lessons Learned

1. **Always check for previous fixes** before optimizing queries
2. **RLS policies don't always filter** - verify policy conditions
3. **Stage filtering is critical** for badge counts (active vs archived)
4. **Performance optimization shouldn't break correctness** - balance both
5. **Document regressions** to prevent future issues

---

## Status

✅ **RESOLVED** - FRC badge now correctly shows 1 active record

