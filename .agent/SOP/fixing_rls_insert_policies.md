# SOP: Fixing RLS Policy Errors (INSERT, SELECT & UPDATE)

**Created:** January 25, 2025
**Last Updated:** January 26, 2025
**Estimated Time:** 15-30 minutes
**Complexity:** Intermediate
**Prerequisites:** Understanding of PostgreSQL RLS, Supabase access, migration workflow

---

## When to Use This SOP

Use this procedure when encountering RLS policy violations:

**INSERT Errors:**
- `new row violates row-level security policy for table "X"`
- Error code `42501` during record creation
- INSERT operations fail for authenticated users who should have access
- Engineers/users cannot create records they should be able to create
- Policy works for SELECT/UPDATE but fails for INSERT

**SELECT Errors:**
- "Data integrity error: No [record] found"
- Records exist but RLS blocks SELECT query
- User should have access but gets empty result set
- Policy works for INSERT/UPDATE but fails for SELECT

**UPDATE Errors:**
- `PGRST116: Cannot coerce the result to a single JSON object`
- `PGRST116: The result contains 0 rows`
- UPDATE operations return 0 rows when expecting 1
- User can SELECT record but cannot UPDATE it
- Trying to set a foreign key that's currently NULL but policy requires it to be non-NULL

---

## Overview

Row Level Security (RLS) INSERT policies control who can create new rows in a table. A common bug occurs when policies reference columns or values that **don't exist during INSERT**, causing all INSERT operations to fail.

**Common Mistakes:**
1. Referencing the new row's `id` (doesn't exist yet during INSERT)
2. Using wrong column names from the NEW row
3. Checking relationships that haven't been established yet
4. Not understanding the difference between INSERT context vs SELECT/UPDATE context

---

## Debugging Workflow

### Phase 1: Identify the Failing Policy (5 min)

**Step 1.1: Capture the Error**

Look for the specific error in logs:
```
Error creating assessment: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "assessments"'
}
```

**Key Information:**
- Error code: `42501` = RLS violation
- Table name: `assessments`
- Operation: INSERT (from context)

**Step 1.2: Identify Which Policy is Failing**

Find all INSERT policies for the table:

```sql
-- Query to find INSERT policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'assessments'
  AND cmd = 'INSERT';
```

**Using Supabase MCP:**
```typescript
supabase({
  summary: "List INSERT policies for assessments table",
  method: "POST",
  path: "/v1/projects/{project_id}/database/query",
  data: {
    query: "SELECT * FROM pg_policies WHERE tablename = 'assessments' AND cmd = 'INSERT';"
  }
})
```

---

### Phase 2: Analyze the Policy Logic (10 min)

**Step 2.1: Review the Policy Definition**

Find the policy in your migrations:

```bash
# Search for the policy in migrations
grep -r "CREATE POLICY.*INSERT.*assessments" supabase/migrations/
```

**Example Buggy Policy:**
```sql
-- ❌ WRONG: References assessment_id which doesn't exist during INSERT
CREATE POLICY "Engineers can insert their assessments"
ON assessments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.id = assessment_id  -- ❌ BUG: assessment_id is NULL!
    AND appointments.engineer_id = get_user_engineer_id()
  )
);
```

**Step 2.2: Understand INSERT Context**

During INSERT, the new row:
- ✅ **HAS**: All columns being inserted (from INSERT statement)
- ❌ **DOESN'T HAVE**: Auto-generated `id` (created after policy check)
- ❌ **DOESN'T HAVE**: Default values not yet applied
- ❌ **DOESN'T HAVE**: Trigger-generated values

**Available in WITH CHECK:**
- Column values from the INSERT statement
- Foreign key values being inserted
- User context (auth.uid(), custom functions)

**Step 2.3: Identify the Bug**

Common bugs in INSERT policies:

| Bug Pattern | Why It Fails | Fix |
|-------------|--------------|-----|
| `WHERE table.id = id` | `id` doesn't exist yet | Use foreign key column instead |
| `WHERE table.id = NEW.id` | `NEW.id` is NULL | Use foreign key from INSERT data |
| `WHERE created_by = auth.uid()` | `created_by` not in INSERT | Add to INSERT or use trigger |
| Complex joins on new row | New row not in DB yet | Simplify to foreign keys only |

---

### Phase 3: Fix the Policy (10 min)

**Step 3.1: Determine the Correct Column Reference**

For the assessments example:
- ❌ Can't use: `assessment_id` (doesn't exist)
- ✅ Can use: `appointment_id` (being inserted)

**Step 3.2: Create Migration**

Create a new migration file:

```bash
# Naming convention: XXX_fix_[table]_insert_policy.sql
supabase/migrations/066_fix_assessment_insert_policy.sql
```

**Migration Template:**
```sql
-- Fix RLS policy for [table] INSERT operations
-- Bug: Policy referenced [wrong_column] instead of [correct_column]
-- This caused RLS violations because [wrong_column] doesn't exist during INSERT

-- Drop the incorrect policy
DROP POLICY IF EXISTS "[policy_name]" ON [table];

-- Create correct policy
CREATE POLICY "[policy_name]"
ON [table] FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM [related_table]
    WHERE [related_table].id = [correct_foreign_key_column]  -- ✅ Fixed
    AND [related_table].[user_column] = get_user_engineer_id()
  )
);
```

**Real Example 1: Assessment Creation**
```sql
-- Fix RLS policy for engineer assessment creation
-- Bug: Policy referenced assessment_id instead of appointment_id during INSERT
-- This caused RLS violations because assessment_id doesn't exist during INSERT

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Engineers can insert their assessments" ON assessments;

-- Create correct policy
CREATE POLICY "Engineers can insert their assessments"
ON assessments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.id = appointment_id  -- ✅ Fixed: Use appointment_id from INSERT
    AND appointments.engineer_id = get_user_engineer_id()
  )
);
```

**Real Example 2: Vehicle Values Creation**
```sql
-- Fix RLS policy for engineer vehicle values creation
-- Bug: Policy used table-qualified column reference during INSERT
-- assessment_vehicle_values.assessment_id doesn't work in INSERT context

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Engineers can insert assessment_vehicle_values" ON assessment_vehicle_values;

-- Create correct policy
CREATE POLICY "Engineers can insert assessment_vehicle_values"
ON assessment_vehicle_values FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assessments
    JOIN appointments ON assessments.appointment_id = appointments.id
    WHERE assessments.id = assessment_id  -- ✅ Fixed: Use bare column name from INSERT
    AND appointments.engineer_id = get_user_engineer_id()
  )
);
```

**Step 3.3: Apply Migration**

**Option A: Using Supabase MCP (Recommended for Quick Fixes)**
```typescript
supabase({
  summary: "Fix RLS INSERT policy for assessments table",
  method: "POST",
  path: "/v1/projects/{project_id}/database/query",
  data: {
    query: "DROP POLICY IF EXISTS \"Engineers can insert their assessments\" ON assessments; CREATE POLICY ..."
  }
})
```

**Option B: Using Supabase CLI**
```bash
# Apply migration
supabase db push

# Or apply specific migration
supabase migration up
```

---

### Phase 4: Verify the Fix (5 min)

**Step 4.1: Test INSERT Operation**

Try the operation that was failing:

```typescript
// Example: Create assessment
const { data, error } = await supabase
  .from('assessments')
  .insert({
    appointment_id: 'some-uuid',
    inspection_id: 'some-uuid',
    request_id: 'some-uuid'
  })
  .select()
  .single();

if (error) {
  console.error('Still failing:', error);
} else {
  console.log('Success!', data);
}
```

**Step 4.2: Verify Policy Logic**

Test that the policy correctly:
- ✅ Allows authorized users to INSERT
- ❌ Blocks unauthorized users from INSERT

**Test Cases:**
1. **Engineer with assigned appointment** → Should succeed
2. **Engineer without assigned appointment** → Should fail with RLS error
3. **Admin user** → Should succeed (if admin policy exists)
4. **Unauthenticated user** → Should fail

**Step 4.3: Check for Side Effects**

Verify other operations still work:
- SELECT queries return expected results
- UPDATE operations work correctly
- DELETE operations work correctly

---

## Common Patterns & Solutions

### Pattern 1: User-Owned Records

**Scenario:** Users can only insert records they own

**Wrong:**
```sql
WITH CHECK (user_id = auth.uid())  -- ❌ Assumes user_id is in INSERT
```

**Right:**
```sql
-- Option A: If user_id is in INSERT statement
WITH CHECK (user_id = auth.uid())  -- ✅ Works if explicitly inserted

-- Option B: Use trigger to set user_id
-- Migration:
CREATE TRIGGER set_user_id_on_insert
BEFORE INSERT ON my_table
FOR EACH ROW
EXECUTE FUNCTION set_user_id();

-- Policy:
WITH CHECK (true)  -- ✅ Trigger handles it
```

---

### Pattern 2: Related Record Ownership

**Scenario:** Users can insert if they own a related record

**Wrong:**
```sql
WITH CHECK (
  EXISTS (
    SELECT 1 FROM parent_table
    WHERE parent_table.id = id  -- ❌ Which id? New row's id doesn't exist!
    AND parent_table.user_id = auth.uid()
  )
)
```

**Right:**
```sql
WITH CHECK (
  EXISTS (
    SELECT 1 FROM parent_table
    WHERE parent_table.id = parent_id  -- ✅ Foreign key from INSERT
    AND parent_table.user_id = auth.uid()
  )
)
```

---

### Pattern 3: Role-Based with Relationship Check

**Scenario:** Engineers can insert for their assigned work

**Wrong:**
```sql
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.assessment_id = id  -- ❌ New row's id doesn't exist!
    AND appointments.engineer_id = get_user_engineer_id()
  )
)
```

**Right:**
```sql
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.id = appointment_id  -- ✅ Foreign key from INSERT
    AND appointments.engineer_id = get_user_engineer_id()
  )
)
```

---

### Pattern 4: Admin Override

**Scenario:** Admins can insert anything, users have restrictions

**Solution:**
```sql
-- Policy 1: Admins can insert
CREATE POLICY "Admins can insert [table]"
ON [table] FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Policy 2: Users can insert their own
CREATE POLICY "Users can insert their [table]"
ON [table] FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM [related_table]
    WHERE [related_table].id = [foreign_key]
    AND [related_table].user_id = auth.uid()
  )
);
```

---

## Troubleshooting

### Issue: Policy Still Fails After Fix

**Possible Causes:**
1. Migration not applied
2. Wrong policy dropped/created
3. Multiple policies conflicting
4. Function (like `get_user_engineer_id()`) returning NULL

**Debug Steps:**
```sql
-- 1. Verify policy exists
SELECT * FROM pg_policies WHERE tablename = 'your_table' AND cmd = 'INSERT';

-- 2. Test the policy logic manually
SELECT EXISTS (
  SELECT 1 FROM appointments
  WHERE appointments.id = 'test-appointment-id'
  AND appointments.engineer_id = get_user_engineer_id()
);

-- 3. Check if helper function works
SELECT get_user_engineer_id();  -- Should return UUID, not NULL
```

---

### Issue: Policy Works for Some Users, Not Others

**Possible Causes:**
1. User missing required profile/role
2. Related records not properly linked
3. Function returns NULL for some users

**Debug Steps:**
```sql
-- Check user's engineer record
SELECT * FROM engineers WHERE auth_user_id = auth.uid();

-- Check if appointment is assigned to user
SELECT 
  a.*,
  e.name as engineer_name
FROM appointments a
LEFT JOIN engineers e ON a.engineer_id = e.id
WHERE a.id = 'test-appointment-id';
```

---

## Prevention Checklist

When writing INSERT policies:

- [ ] Never reference the new row's `id` column
- [ ] Only reference columns that are in the INSERT statement
- [ ] Test with actual INSERT data, not just SELECT queries
- [ ] Verify helper functions return expected values
- [ ] Test with different user roles (admin, engineer, etc.)
- [ ] Document which columns the policy expects in INSERT
- [ ] Consider using triggers for auto-populated fields

---

## Summary

**Key Takeaways:**
1. INSERT policies can only check columns being inserted, not auto-generated values
2. Never reference the new row's `id` - it doesn't exist yet
3. Use foreign key columns from the INSERT statement
4. Test policies with actual INSERT operations, not just theory
5. Use Supabase MCP for quick policy fixes

**Common Fix Pattern:**
```sql
-- ❌ WRONG: References new row's id
WHERE related_table.id = id

-- ✅ RIGHT: References foreign key being inserted
WHERE related_table.id = foreign_key_column
```

**Time-Saving Tips:**
- Search migrations for similar policies to use as templates
- Test policy logic manually before creating migration
- Use Supabase MCP for faster iteration than CLI
- Keep a checklist of columns available during INSERT

---

## RLS SELECT Policy Errors (Added Jan 26, 2025)

### Symptom: "Data Integrity Error: No Record Found"

When engineers get "Data integrity error" but the record EXISTS in the database, it's usually an RLS SELECT policy that's too restrictive.

### Example Case: Assessment-Centric Architecture

**Problem:**
```
Error: Data integrity error: No assessment found for request 63b4ad0c-...
Assessments must be created by admins when requests are created.
```

**Root Cause:**
- Assessment exists with `appointment_id = NULL` (early stage)
- Engineer SELECT policy requires `appointment_id IS NOT NULL`
- Engineer can't see assessment until `appointment_id` is linked
- Code fails before it can link `appointment_id`

**Diagnosis:**
```sql
-- Check if record exists
SELECT * FROM assessments WHERE request_id = '63b4ad0c-...';
-- Returns data ✅

-- Check engineer SELECT policy
SELECT qual FROM pg_policies
WHERE tablename = 'assessments'
AND policyname = 'Engineers can view their assessments';
-- Shows: appointment_id IS NOT NULL requirement ❌
```

### Solution Pattern: Dual-Check for Related Records

When records can be accessed via multiple paths (e.g., direct link OR via related record), use OR logic:

```sql
-- ❌ WRONG: Too restrictive
CREATE POLICY "Engineers can view their assessments"
ON assessments FOR SELECT
TO authenticated
USING (
  is_admin() OR
  (
    appointment_id IS NOT NULL  -- ❌ Blocks early-stage access
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = assessments.appointment_id
      AND appointments.engineer_id = get_user_engineer_id()
    )
  )
);

-- ✅ RIGHT: Dual-check pattern
CREATE POLICY "Engineers can view their assessments"
ON assessments FOR SELECT
TO authenticated
USING (
  is_admin() OR
  -- Case 1: Direct link (appointment_id set)
  (
    appointment_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = assessments.appointment_id
      AND appointments.engineer_id = get_user_engineer_id()
    )
  )
  OR
  -- Case 2: Indirect link (via request's appointments)
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.request_id = assessments.request_id
    AND appointments.engineer_id = get_user_engineer_id()
  )
);
```

### When to Use Dual-Check Pattern

Use this pattern when:
1. Record can be accessed via multiple relationships
2. One relationship may not be established yet (e.g., foreign key is NULL)
3. User should see record at different stages of its lifecycle
4. Record transitions from one access pattern to another

**Examples:**
- Assessment with `appointment_id = NULL` initially, set later
- Order with `assigned_user_id = NULL` initially, assigned later
- Task with `completed_by = NULL` until completed

### Migration Template for SELECT Policy Fix

```sql
-- Migration XXX: Fix [table] SELECT policy for [scenario]

-- Drop restrictive policy
DROP POLICY IF EXISTS "[policy name]" ON [table];

-- Create dual-check policy
CREATE POLICY "[policy name]"
ON [table] FOR SELECT
TO authenticated
USING (
  is_admin() OR
  -- Path 1: Direct relationship (existing pattern)
  (
    [foreign_key] IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM [related_table]
      WHERE [related_table].id = [foreign_key]
      AND [related_table].[user_column] = get_current_user()
    )
  )
  OR
  -- Path 2: Indirect relationship (new pattern for early access)
  EXISTS (
    SELECT 1 FROM [related_table]
    WHERE [related_table].[shared_key] = [table].[shared_key]
    AND [related_table].[user_column] = get_current_user()
  )
);
```

### Real Example: Migration 073

```sql
-- Migration 073: Fix engineer assessment SELECT policy

DROP POLICY IF EXISTS "Engineers can view their assessments" ON assessments;

CREATE POLICY "Engineers can view their assessments"
ON assessments FOR SELECT
TO authenticated
USING (
  is_admin() OR
  (
    appointment_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = assessments.appointment_id
      AND appointments.engineer_id = get_user_engineer_id()
    )
  )
  OR
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.request_id = assessments.request_id
    AND appointments.engineer_id = get_user_engineer_id()
  )
);
```

**Impact:**
- ✅ Engineers can see early-stage assessments (appointment_id = NULL)
- ✅ Engineers can see later-stage assessments (appointment_id set)
- ✅ No "Data integrity error" on "Start Assessment" click
- ✅ Smooth transition between access patterns

---

## RLS UPDATE Policy Errors (Added Jan 26, 2025)

### Symptom: "PGRST116: Cannot Coerce Result to Single JSON Object"

When engineers get `PGRST116` error with "The result contains 0 rows", but they can SELECT the record successfully, it's usually an RLS UPDATE policy that's too restrictive.

### Example Case: Assessment-Centric UPDATE

**Problem:**
```
Error updating assessment: {
  code: 'PGRST116',
  details: 'The result contains 0 rows',
  hint: null,
  message: 'Cannot coerce the result to a single JSON object'
}
```

**Root Cause:**
- Assessment exists with `appointment_id = NULL` (early stage)
- Engineer can SELECT assessment (Migration 073 fixed this)
- Engineer tries to UPDATE to set `appointment_id` for first time
- Engineer UPDATE policy requires `appointment_id IS NOT NULL`
- RLS blocks UPDATE operation
- PostgREST expects 1 row updated, gets 0 rows, throws PGRST116

**Diagnosis:**
```sql
-- Check if record exists and is visible
SELECT * FROM assessments WHERE id = 'assessment-id';
-- Returns data (Migration 073 allows SELECT) ✅

-- Try UPDATE as engineer
UPDATE assessments
SET appointment_id = 'appointment-id'
WHERE id = 'assessment-id';
-- Returns 0 rows ❌ (RLS blocks)

-- Check engineer UPDATE policy
SELECT with_check FROM pg_policies
WHERE tablename = 'assessments'
AND policyname = 'Engineers can update their assessments'
AND cmd = 'UPDATE';
-- Shows: appointment_id IS NOT NULL requirement ❌
```

### Solution Pattern: Same Dual-Check for UPDATE

The UPDATE policy needs the same dual-check pattern as SELECT:

```sql
-- ❌ WRONG: Too restrictive (blocks initial linking)
CREATE POLICY "Engineers can update their assessments"
ON assessments FOR UPDATE
TO authenticated
USING (
  is_admin() OR
  (
    appointment_id IS NOT NULL  -- ❌ Blocks UPDATE to set appointment_id
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = assessments.appointment_id
      AND appointments.engineer_id = get_user_engineer_id()
    )
  )
);

-- ✅ RIGHT: Dual-check pattern (allows initial linking)
CREATE POLICY "Engineers can update their assessments"
ON assessments FOR UPDATE
TO authenticated
USING (
  is_admin() OR
  -- Case 1: Direct link (appointment_id already set)
  (
    appointment_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = assessments.appointment_id
      AND appointments.engineer_id = get_user_engineer_id()
    )
  )
  OR
  -- Case 2: Indirect link (allows initial linking via request's appointments)
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.request_id = assessments.request_id
    AND appointments.engineer_id = get_user_engineer_id()
  )
);
```

### When to Use Dual-Check UPDATE Pattern

Use this pattern when:
1. User needs to UPDATE a foreign key from NULL to a value
2. The UPDATE policy checks the same foreign key for authorization
3. This creates a catch-22: can't UPDATE because key is NULL, but UPDATE is trying to SET the key
4. User should be authorized via an indirect relationship until direct link is established

**Examples:**
- Assessment with `appointment_id = NULL`, updating to link appointment
- Order with `assigned_user_id = NULL`, updating to assign user
- Task with `completed_by = NULL`, updating to mark as completed

### Migration Template for UPDATE Policy Fix

```sql
-- Migration XXX: Fix [table] UPDATE policy for [scenario]

-- Drop restrictive policy
DROP POLICY IF EXISTS "[policy name]" ON [table];

-- Create dual-check policy
CREATE POLICY "[policy name]"
ON [table] FOR UPDATE
TO authenticated
USING (
  is_admin() OR
  -- Path 1: Direct relationship (existing pattern)
  (
    [foreign_key] IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM [related_table]
      WHERE [related_table].id = [foreign_key]
      AND [related_table].[user_column] = get_current_user()
    )
  )
  OR
  -- Path 2: Indirect relationship (allows initial linking)
  EXISTS (
    SELECT 1 FROM [related_table]
    WHERE [related_table].[shared_key] = [table].[shared_key]
    AND [related_table].[user_column] = get_current_user()
  )
);

COMMENT ON POLICY "[policy name]" ON [table] IS
  'Allows users to update [records] for [resources] they are assigned to. Handles both early-stage records ([foreign_key] = NULL - allows initial linking) and later-stage records ([foreign_key] linked). Dual-check ensures users can UPDATE record before and after [foreign_key] is linked. Matches SELECT policy pattern.';
```

### Real Example: Migration 074

```sql
-- Migration 074: Fix engineer assessment UPDATE policy

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

COMMENT ON POLICY "Engineers can update their assessments" ON assessments IS
  'Allows engineers to update assessments for requests they are assigned to via appointments. Handles both early-stage assessments (appointment_id = NULL - allows initial linking) and later-stage assessments (appointment_id linked). Dual-check ensures engineers can UPDATE assessment before and after appointment_id is linked on the assessment record. Matches SELECT policy pattern from Migration 073.';
```

**Impact:**
- ✅ Engineers can UPDATE early-stage assessments (appointment_id = NULL)
- ✅ Engineers can link `appointment_id` for first time
- ✅ Engineers can continue to UPDATE after `appointment_id` is linked
- ✅ No PGRST116 error when trying to link appointment
- ✅ Smooth workflow: SELECT (073) → UPDATE to link (074) → UPDATE normally

### Typical Error Flow and Fix

**Before Migrations 073 & 074:**
1. Engineer clicks "Start Assessment"
2. Code tries to SELECT assessment
3. ❌ RLS blocks SELECT (appointment_id = NULL)
4. Error: "Data integrity error: No assessment found"

**After Migration 073 (SELECT fix):**
1. Engineer clicks "Start Assessment"
2. ✅ Code can SELECT assessment (dual-check via request)
3. Code tries to UPDATE to link appointment_id
4. ❌ RLS blocks UPDATE (appointment_id = NULL)
5. Error: "PGRST116: The result contains 0 rows"

**After Migration 074 (UPDATE fix):**
1. Engineer clicks "Start Assessment"
2. ✅ Code can SELECT assessment (dual-check via request)
3. ✅ Code can UPDATE to link appointment_id (dual-check via request)
4. ✅ Code can UPDATE normally after linking (dual-check via appointment)
5. ✅ No errors, smooth workflow

### Debugging UPDATE Policy Issues

**Step 1: Verify SELECT works**
```sql
-- As engineer, can you see the record?
SELECT * FROM assessments WHERE id = 'assessment-id';
```
If this fails, fix SELECT policy first (see previous section).

**Step 2: Try UPDATE manually**
```sql
-- As engineer, can you update the record?
UPDATE assessments
SET appointment_id = 'appointment-id'
WHERE id = 'assessment-id';

-- Check rows affected
SELECT ROW_COUNT();  -- Should be 1, is it 0?
```

**Step 3: Check UPDATE policy**
```sql
-- View current UPDATE policy
SELECT
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'assessments'
AND cmd = 'UPDATE'
AND policyname LIKE '%engineer%';
```

**Step 4: Test indirect relationship**
```sql
-- Can engineer access via indirect path?
SELECT EXISTS (
  SELECT 1 FROM appointments
  WHERE appointments.request_id = (
    SELECT request_id FROM assessments WHERE id = 'assessment-id'
  )
  AND appointments.engineer_id = get_user_engineer_id()
);
-- Should return true
```

**Step 5: Apply dual-check pattern**
If indirect path returns true but UPDATE still fails, apply Migration 074 pattern.

---

## Related Documentation

- [Database Schema](../System/database_schema.md) - RLS policies for all tables
- [Fixing RLS Recursion](./fixing_rls_recursion.md) - Related RLS debugging
- [Adding Migrations](./adding_migration.md) - Migration workflow
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

**Document Version:** 3.0
**Author:** ClaimTech Development Team
**Based on Implementation:**
- January 25, 2025 - Assessment RLS INSERT policy fix (Migration 066)
- January 26, 2025 - Assessment RLS SELECT policy fix (Migration 073) - Dual-check pattern
- January 26, 2025 - Assessment RLS UPDATE policy fix (Migration 074) - Dual-check pattern

