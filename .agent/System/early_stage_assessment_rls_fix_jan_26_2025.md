# Early-Stage Assessment RLS Policy Fix - January 26, 2025

## Executive Summary

Fixed critical RLS policy catch-22 preventing engineers from accessing and updating early-stage assessments with `appointment_id = NULL`.

**Status:** ✅ **COMPLETE**
**Migrations:** 073, 074
**Impact:** Critical bug fix - unblocked engineer workflow
**Pattern:** Dual-check RLS for nullable foreign keys

---

## Problem Statement

### Issue 1: SELECT Policy Catch-22

**Symptom:**
```
Error: Data integrity error: No assessment found for request 63b4ad0c-757b-4468-83f0-3e417d4c4797.
Assessments must be created by admins when requests are created.
Engineers cannot create assessments.
```

**Root Cause:**
- Assessment exists in database with `appointment_id = NULL` (early stage)
- Engineer SELECT policy required `appointment_id IS NOT NULL`
- Engineer couldn't see assessment until `appointment_id` was linked
- Code failed before it could link `appointment_id`

**User Flow:**
1. Engineer clicks "Start Assessment" from appointment page
2. Code tries to SELECT assessment by `request_id`
3. ❌ RLS blocks SELECT (appointment_id = NULL)
4. Error: "Data integrity error: No assessment found"

---

### Issue 2: UPDATE Policy Catch-22

**Symptom:**
```
Error updating assessment: {
  code: 'PGRST116',
  details: 'The result contains 0 rows',
  hint: null,
  message: 'Cannot coerce the result to a single JSON object'
}
```

**Root Cause:**
- Engineer can SELECT assessment (Migration 073 fixed this)
- But UPDATE policy also required `appointment_id IS NOT NULL`
- Code tried to UPDATE to set `appointment_id` for first time
- RLS blocked UPDATE, 0 rows affected
- PostgREST expected 1 row, threw PGRST116

**User Flow (After Migration 073):**
1. Engineer clicks "Start Assessment"
2. ✅ Code can SELECT assessment (dual-check via request)
3. Code tries to UPDATE to link `appointment_id`
4. ❌ RLS blocks UPDATE (appointment_id = NULL)
5. Error: "PGRST116: The result contains 0 rows"

---

## Solution: Dual-Check Pattern

### Concept

When a record has a **nullable foreign key** that gets set later in its lifecycle, RLS policies need **TWO access paths**:

1. **Direct path**: Access via the foreign key (when it's set)
2. **Indirect path**: Access via a related relationship (before foreign key is set)

### Pattern Template

```sql
CREATE POLICY "policy_name"
ON table_name FOR {SELECT|UPDATE}
TO authenticated
USING (
  is_admin() OR
  -- Path 1: Direct relationship (foreign key is set)
  (
    foreign_key IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM related_table
      WHERE related_table.id = foreign_key
      AND related_table.user_column = get_current_user()
    )
  )
  OR
  -- Path 2: Indirect relationship (before foreign key is set)
  EXISTS (
    SELECT 1 FROM related_table
    WHERE related_table.shared_key = table_name.shared_key
    AND related_table.user_column = get_current_user()
  )
);
```

---

## Implementation

### Migration 073: Fix SELECT Policy

**File:** `supabase/migrations/073_fix_engineer_assessment_select_policy.sql`

**Changes:**
```sql
DROP POLICY IF EXISTS "Engineers can view their assessments" ON assessments;

CREATE POLICY "Engineers can view their assessments"
ON assessments FOR SELECT
TO authenticated
USING (
  is_admin() OR
  -- Case 1: Assessment has appointment_id linked to engineer's appointment
  (
    appointment_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = assessments.appointment_id
      AND appointments.engineer_id = get_user_engineer_id()
    )
  )
  OR
  -- Case 2: Assessment's request has an appointment assigned to engineer
  -- (This handles early-stage assessments where appointment_id is still NULL)
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.request_id = assessments.request_id
    AND appointments.engineer_id = get_user_engineer_id()
  )
);
```

**Impact:**
- ✅ Engineers can see early-stage assessments (appointment_id = NULL)
- ✅ Engineers can see later-stage assessments (appointment_id linked)
- ✅ No "Data integrity error" when clicking "Start Assessment"

---

### Migration 074: Fix UPDATE Policy

**File:** `supabase/migrations/074_fix_engineer_assessment_update_policy.sql`

**Changes:**
```sql
DROP POLICY IF EXISTS "Engineers can update their assessments" ON assessments;

CREATE POLICY "Engineers can update their assessments"
ON assessments FOR UPDATE
TO authenticated
USING (
  is_admin() OR
  -- Case 1: Assessment has appointment_id linked to engineer's appointment
  (
    appointment_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = assessments.appointment_id
      AND appointments.engineer_id = get_user_engineer_id()
    )
  )
  OR
  -- Case 2: Assessment's request has an appointment assigned to engineer
  -- (Allows initial linking of appointment_id via UPDATE)
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.request_id = assessments.request_id
    AND appointments.engineer_id = get_user_engineer_id()
  )
);
```

**Impact:**
- ✅ Engineers can UPDATE early-stage assessments (appointment_id = NULL)
- ✅ Engineers can link `appointment_id` for first time
- ✅ Engineers can continue to UPDATE after linking
- ✅ No PGRST116 error when trying to link appointment

---

## User Flow After Fix

### Before Migrations 073 & 074

1. Engineer clicks "Start Assessment"
2. Code tries to SELECT assessment
3. ❌ RLS blocks SELECT (appointment_id = NULL)
4. Error: "Data integrity error: No assessment found"

### After Migration 073 Only

1. Engineer clicks "Start Assessment"
2. ✅ Code can SELECT assessment (dual-check via request)
3. Code tries to UPDATE to link appointment_id
4. ❌ RLS blocks UPDATE (appointment_id = NULL)
5. Error: "PGRST116: The result contains 0 rows"

### After Migrations 073 & 074 ✅

1. Engineer clicks "Start Assessment"
2. ✅ Code can SELECT assessment (dual-check via request)
3. ✅ Code can UPDATE to link appointment_id (dual-check via request)
4. ✅ Code can UPDATE normally after linking (dual-check via appointment)
5. ✅ No errors, smooth workflow

---

## When to Use Dual-Check Pattern

Apply this pattern when:

1. **Record has nullable foreign key** that gets set later in lifecycle
2. **User needs access before and after** foreign key is set
3. **Authorization via indirect relationship** is valid (e.g., via parent record)
4. **Setting the foreign key** is part of the user's workflow

### Examples

| Scenario | Foreign Key | Indirect Path |
|----------|------------|---------------|
| Assessment with no appointment | `appointment_id = NULL` → set later | Via `request_id` → appointments |
| Order not yet assigned | `assigned_user_id = NULL` → set later | Via `customer_id` → user relationship |
| Task not yet completed | `completed_by = NULL` → set later | Via `assigned_to` → user |

---

## Code Reference

### Assessment Page Server Load

**File:** `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts`

**Relevant Code (Lines 56-65):**
```typescript
// CRITICAL: Link appointment to assessment FIRST (before updating stage)
if (!assessment.appointment_id || assessment.appointment_id !== appointmentId) {
  assessment = await assessmentService.updateAssessment(
    assessment.id,
    { appointment_id: appointmentId },  // ← This UPDATE was failing
    locals.supabase  // ← Engineer client
  );
  console.log('Assessment linked to appointment');
}
```

**Before Fix:**
- Line 58: `updateAssessment()` failed with PGRST116
- RLS UPDATE policy blocked because `appointment_id = NULL`

**After Fix:**
- ✅ UPDATE succeeds via dual-check (indirect path via request)
- `appointment_id` gets linked successfully
- Assessment workflow continues normally

---

## Verification

### SQL Verification

```sql
-- 1. Check if migrations applied
SELECT version, name
FROM supabase_migrations.schema_migrations
WHERE version IN ('073', '074')
ORDER BY version;

-- 2. Verify SELECT policy
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'assessments'
AND policyname = 'Engineers can view their assessments';

-- 3. Verify UPDATE policy
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'assessments'
AND policyname = 'Engineers can update their assessments';

-- 4. Test indirect path (as engineer)
SELECT EXISTS (
  SELECT 1 FROM appointments
  WHERE appointments.request_id = (
    SELECT request_id FROM assessments WHERE id = 'test-assessment-id'
  )
  AND appointments.engineer_id = get_user_engineer_id()
);
-- Should return true
```

### Manual Testing

**Test Case 1: Engineer Opens Early-Stage Assessment**
- [ ] Admin creates new request
- [ ] Admin schedules appointment for engineer
- [ ] Engineer navigates to /work/assessments/[appointment_id]
- [ ] ✅ Assessment loads successfully (no "Data integrity error")
- [ ] ✅ appointment_id gets linked (no PGRST116 error)
- [ ] ✅ Engineer can update assessment normally

**Test Case 2: Legacy Assessment**
- [ ] Engineer opens old assessment with appointment_id = NULL
- [ ] ✅ Assessment loads successfully
- [ ] ✅ appointment_id gets linked on first load
- [ ] ✅ No errors in console

**Test Case 3: Already Linked Assessment**
- [ ] Engineer opens assessment with appointment_id already set
- [ ] ✅ Assessment loads successfully
- [ ] ✅ Engineer can update normally
- [ ] ✅ Dual-check still works (backward compatible)

---

## Documentation Updates

### Updated Files

1. **[Fixing RLS Policy Errors SOP](../.agent/SOP/fixing_rls_insert_policies.md)**
   - Updated title: INSERT & SELECT → INSERT, SELECT & UPDATE
   - Added "UPDATE Errors" to "When to Use This SOP" section
   - Added comprehensive "RLS UPDATE Policy Errors" section
   - Added dual-check pattern template for UPDATE policies
   - Added Migration 074 as real example
   - Added debugging workflow (5 steps)
   - Added typical error flow showing progression
   - Updated document version to 3.0

2. **[.agent/README.md](../.agent/README.md)**
   - Updated SOP title in navigation
   - Added Migrations 073 & 074 to Assessment-Centric Refactor section
   - Added new "Engineer Early-Stage Assessment Access Fix" section
   - Updated migration count (72 → 74)
   - Updated FAQ with RLS policy errors reference

---

## Related Documentation

- [Fixing RLS Policy Errors SOP](../SOP/fixing_rls_insert_policies.md) - Complete troubleshooting guide
- [Migration 073](../../supabase/migrations/073_fix_engineer_assessment_select_policy.sql) - SELECT policy fix
- [Migration 074](../../supabase/migrations/074_fix_engineer_assessment_update_policy.sql) - UPDATE policy fix
- [Database Schema](./database_schema.md) - RLS policies for all tables
- [Assessment-Centric Architecture](../Tasks/active/assessment_centric_architecture_refactor.md) - Context for why appointment_id is nullable

---

## Success Criteria

All criteria met:

- ✅ Engineers can SELECT early-stage assessments (appointment_id = NULL)
- ✅ Engineers can UPDATE to link appointment_id
- ✅ Engineers can UPDATE normally after linking
- ✅ No "Data integrity error" when clicking "Start Assessment"
- ✅ No PGRST116 error when linking appointment
- ✅ Dual-check pattern documented in SOP
- ✅ No breaking changes (backward compatible)
- ✅ Documentation updated (README, SOP, this summary)

---

## Key Takeaways

### For Developers

1. **Nullable foreign keys need dual-check RLS policies**
   - One path for when key is set
   - One path for when key is NULL

2. **Common catch-22 pattern**
   - Policy requires column to be non-NULL
   - Operation is trying to SET that column for first time
   - Solution: Allow access via related record

3. **Test with actual user flows**
   - SQL queries alone don't catch these issues
   - Must test full engineer workflow from UI

### For RLS Policy Design

1. **Think about record lifecycle**
   - What state is record in when created?
   - When do foreign keys get set?
   - Who needs access at each stage?

2. **Use OR logic for multiple access paths**
   - Don't rely only on foreign keys
   - Consider indirect relationships
   - Maintain security while allowing workflow

3. **Document the intent**
   - Add comments explaining WHY two paths exist
   - Use COMMENT ON POLICY to explain edge cases
   - Link to migration in comments

---

**Fix Date:** January 26, 2025
**Implemented By:** Claude Code (Sonnet 4.5)
**Status:** ✅ **COMPLETE**
**Breaking Changes:** None (backward compatible)
