# SOP: Fixing RLS Infinite Recursion with JWT Claims

**Created:** October 25, 2025
**Last Updated:** October 25, 2025
**Estimated Time:** 30-60 minutes
**Complexity:** Intermediate
**Prerequisites:** Access to Supabase database, understanding of RLS policies, custom access token hook enabled

---

## When to Use This SOP

Use this procedure when encountering RLS infinite recursion errors:

- `ERROR: infinite recursion detected in policy for relation "table_name"`
- Database queries hang or timeout
- Login/authentication failures with recursion errors
- Operations on specific tables consistently fail with recursion errors

**Common Scenarios:**
- RLS policies that check user roles by querying the same table
- Helper functions that query protected tables
- Circular dependencies between RLS policies and database functions

---

## Overview

RLS infinite recursion occurs when a Row Level Security policy queries the same table it's protecting, creating a circular dependency. PostgreSQL detects this and throws an error to prevent infinite loops.

**The Problem:**
```sql
-- ❌ RECURSIVE: This policy protects user_profiles but queries user_profiles
CREATE POLICY "Admins can read profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles  -- Triggers same policy again → infinite loop
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**The Solution:**
Use JWT claims instead of database queries. JWT claims are populated during authentication and don't trigger RLS policies.

```sql
-- ✅ NO RECURSION: Checks JWT claim, no database query
CREATE POLICY "Admins can read profiles"
  ON user_profiles
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_role') = 'admin'  -- No database query = no recursion
    OR auth.uid() = id
  );
```

---

## Prerequisites Check

Before starting, verify these requirements:

### 1. Custom Access Token Hook Exists

Check if you have a hook function that adds claims to JWT:

```sql
-- Query to find custom access token hook
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%access_token%';
```

**Expected Result**: A function that adds custom claims to JWT (like `user_role`, `engineer_id`, etc.)

**If Missing**: Create the hook first (see [Custom Access Token Hook](#appendix-a-creating-custom-access-token-hook) in Appendix)

### 2. Hook Enabled in Supabase Dashboard

1. Go to **Supabase Dashboard → Authentication → Hooks**
2. Find **"Custom Access Token Hook"**
3. Verify it's **enabled** and pointing to your function

**If Not Enabled**: Enable it before proceeding (JWT claims won't be populated otherwise)

### 3. Verify JWT Claims Structure

Test what claims are available in your JWT:

```sql
-- Check current user's JWT claims
SELECT auth.jwt();
```

**Expected Output**:
```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "user_role": "admin",        // Custom claim
  "engineer_id": "uuid-here",  // Custom claim (if applicable)
  "email": "user@example.com"
}
```

**If Missing Custom Claims**: Hook isn't working - troubleshoot hook first

---

## Step-by-Step Procedure

### Phase 1: Identify Recursive Policies (10-15 min)

**1.1 Reproduce the Error**

Try the operation that triggers recursion:
- Login attempt
- Database query on affected table
- API endpoint that reads the table

**Capture the full error message:**
```
ERROR: 42P17: infinite recursion detected in policy for relation "user_profiles"
```

**1.2 Find the Problematic Table**

The error message tells you which table has the issue:
- `relation "user_profiles"` → Issue is in `user_profiles` table

**1.3 List All RLS Policies on That Table**

```sql
-- Get all policies for the affected table
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
WHERE tablename = 'user_profiles'  -- Replace with your table
  AND schemaname = 'public'
ORDER BY policyname;
```

**1.4 Identify Recursive Policies**

Look for policies that query the same table in their `qual` (USING clause):

```sql
-- Example recursive policy
qual: "(EXISTS ( SELECT 1
   FROM user_profiles user_profiles_1  -- ⚠️ Queries same table
  WHERE ((user_profiles_1.id = auth.uid()) AND (user_profiles_1.role = 'admin'::text))))"
```

**Red Flags:**
- Policy USING clause contains `SELECT FROM [same_table]`
- Policy calls helper function that queries the same table
- Policy references the table name it's protecting

---

### Phase 2: Design JWT-Based Replacement (15-20 min)

**2.1 Map Current Policy Logic**

For each recursive policy, document:
1. What it checks (e.g., "Is user an admin?")
2. What operation it controls (SELECT, INSERT, UPDATE, DELETE)
3. What data it accesses (e.g., "own profile" vs "all profiles")

**Example Mapping:**

| Current Policy | Checks | Operation | Access |
|---|---|---|---|
| "Admins can read all profiles" | role = 'admin' | SELECT | All rows |
| "Users can read own profile" | id = auth.uid() | SELECT | Own row only |

**2.2 Identify Required JWT Claims**

Based on your mapping, determine what claims you need:
- Admin check → Need `user_role` claim
- Engineer check → Need `engineer_id` claim
- Custom permissions → Need custom claim

**Verify Claims Available:**
```sql
SELECT auth.jwt() ->> 'user_role';  -- Should return 'admin' or 'engineer'
```

**2.3 Draft New Policy Syntax**

Rewrite each policy using JWT claims:

**Pattern for Admin Checks:**
```sql
-- Check if user is admin
(auth.jwt() ->> 'user_role') = 'admin'

-- Check if user is admin OR accessing own data
(auth.jwt() ->> 'user_role') = 'admin' OR auth.uid() = id
```

**Pattern for Engineer Checks:**
```sql
-- Check if user is engineer with specific ID
(auth.jwt() ->> 'engineer_id')::uuid = engineer_id

-- Check if engineer AND accessing own assignments
(auth.jwt() ->> 'user_role') = 'engineer' AND (auth.jwt() ->> 'engineer_id')::uuid = engineer_id
```

**Pattern for Combined Checks:**
```sql
-- Admin sees all, engineer sees own, user sees nothing
CASE
  WHEN (auth.jwt() ->> 'user_role') = 'admin' THEN true
  WHEN (auth.jwt() ->> 'user_role') = 'engineer' THEN (auth.jwt() ->> 'engineer_id')::uuid = engineer_id
  ELSE false
END
```

---

### Phase 3: Create Migration (15-20 min)

**3.1 Create Migration File**

```bash
# Create new migration file
# Format: XXX_fix_rls_recursion_[table_name].sql
```

**Example filename:**
```
065_fix_rls_recursion_appointments.sql
```

**3.2 Write Migration SQL**

Use this template:

```sql
-- Migration: Fix RLS Infinite Recursion on [table_name]
--
-- Problem: RLS policies query the same table they protect, causing infinite recursion
-- Solution: Use JWT claims instead of database queries
--
-- Created: [Date]
-- References:
--   - SOP: .agent/SOP/fixing_rls_recursion.md
--   - Migration 064: user_profiles recursion fix example

-- ============================================================================
-- Step 1: Drop Recursive Policies
-- ============================================================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Policy Name 1" ON public.table_name;
DROP POLICY IF EXISTS "Policy Name 2" ON public.table_name;
-- Add more as needed

-- ============================================================================
-- Step 2: Create JWT-Based Policies
-- ============================================================================

-- SELECT: Who can read records?
CREATE POLICY "Descriptive policy name"
  ON public.table_name
  FOR SELECT
  USING (
    -- Admin sees all
    (auth.jwt() ->> 'user_role') = 'admin'
    -- Engineer sees own
    OR ((auth.jwt() ->> 'user_role') = 'engineer'
        AND (auth.jwt() ->> 'engineer_id')::uuid = engineer_id)
    -- User sees own
    OR auth.uid() = user_id
  );

-- INSERT: Who can create records?
CREATE POLICY "Descriptive policy name"
  ON public.table_name
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'admin'
  );

-- UPDATE: Who can modify records?
CREATE POLICY "Descriptive policy name"
  ON public.table_name
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_role') = 'admin'
    OR auth.uid() = user_id
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'admin'
    OR auth.uid() = user_id
  );

-- DELETE: Who can delete records?
CREATE POLICY "Descriptive policy name"
  ON public.table_name
  FOR DELETE
  USING (
    (auth.jwt() ->> 'user_role') = 'admin'
  );

-- ============================================================================
-- Verification
-- ============================================================================

-- After this migration:
-- ✅ No database queries in RLS policies = no recursion
-- ✅ JWT claims checked directly via auth.jwt()
-- ✅ Custom access token hook populates claims
-- ✅ Operations work without recursion errors
```

**3.3 Test Migration Syntax**

Before applying, verify SQL syntax locally:

```bash
# Using Supabase CLI
supabase db lint

# Or test in SQL editor with a transaction
BEGIN;
-- Paste migration SQL here
ROLLBACK;  -- Don't commit yet, just test syntax
```

---

### Phase 4: Apply Migration (10-15 min)

**4.1 Backup Current Policies (Optional but Recommended)**

```sql
-- Export current policies for rollback reference
SELECT
  'CREATE POLICY "' || policyname || '" ON ' || schemaname || '.' || tablename ||
  ' FOR ' || cmd || ' USING (' || qual || ')' ||
  CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END ||
  ';' as policy_statement
FROM pg_policies
WHERE tablename = 'user_profiles'  -- Your table
  AND schemaname = 'public';

-- Save output to file for rollback if needed
```

**4.2 Apply Migration Using MCP**

Using Claude Code MCP tools:

```typescript
// Apply migration via MCP
mcp__supabase__apply_migration({
  project_id: "your-project-id",
  name: "065_fix_rls_recursion_appointments",
  query: "... migration SQL ..."
})
```

**Or via Supabase CLI:**

```bash
# Apply migration
supabase db push

# Verify migration applied
supabase db diff
```

**Or via Supabase Dashboard:**

1. Go to **SQL Editor**
2. Paste migration SQL
3. Click **Run**
4. Verify success message

**4.3 Verify Migration Applied**

```sql
-- Check new policies exist
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Verify no references to same table in qual
-- Should see auth.jwt() ->> 'user_role' instead of SELECT FROM table
```

---

### Phase 5: Test & Verify (10-15 min)

**5.1 Test Basic Operations**

Try operations that previously caused recursion:

**Test 1: Login as Admin**
```bash
# Login and verify no recursion errors
# Check server logs for errors
```

**Expected**: Login succeeds, no recursion errors in logs

**Test 2: Query Protected Table**
```sql
-- As admin user
SELECT * FROM user_profiles LIMIT 5;
```

**Expected**: Returns data without recursion errors

**Test 3: Login as Engineer**
```bash
# Login as engineer user
# Verify role-based filtering works
```

**Expected**: Sees only own/assigned data, no recursion errors

**5.2 Verify JWT Claims Are Used**

Enable query logging and check execution plan:

```sql
-- Show which policies are evaluated
EXPLAIN (VERBOSE, COSTS OFF)
SELECT * FROM user_profiles WHERE id = auth.uid();

-- Should see: Filter: ((auth.jwt() ->> 'user_role'::text) = 'admin'::text)
-- Should NOT see: SELECT FROM user_profiles in the plan
```

**5.3 Test All CRUD Operations**

Create test script:

```sql
-- Test SELECT
SELECT * FROM user_profiles LIMIT 1;

-- Test INSERT (as admin)
INSERT INTO user_profiles (id, email, role, full_name)
VALUES (gen_random_uuid(), 'test@example.com', 'engineer', 'Test User');

-- Test UPDATE
UPDATE user_profiles SET full_name = 'Updated Name' WHERE email = 'test@example.com';

-- Test DELETE
DELETE FROM user_profiles WHERE email = 'test@example.com';
```

**Expected**: All operations succeed without recursion errors

**5.4 Monitor Application Logs**

Watch for any recursion errors in production:

```bash
# Supabase Dashboard → Database → Logs
# Filter for: "infinite recursion"

# Or via CLI
supabase functions logs --filter "recursion"
```

**Expected**: No recursion errors in last 24 hours

---

## Common Pitfalls & Solutions

### Pitfall 1: JWT Claims Not Populated

**Symptom**: Policies don't work, `auth.jwt() ->> 'user_role'` returns NULL

**Cause**: Custom access token hook not enabled or not working

**Solution**:
1. Check hook is enabled in Supabase Dashboard → Authentication → Hooks
2. Verify hook function exists: `SELECT * FROM pg_proc WHERE proname LIKE '%access_token%'`
3. Test hook manually: `SELECT custom_access_token_hook('{"user_id": "..."}'::jsonb)`
4. Check hook has no errors (see [Debugging Auth Hooks SOP](./debugging_supabase_auth_hooks.md))

---

### Pitfall 2: Type Casting Issues with JWT Claims

**Symptom**: Error like `cannot cast type text to uuid`

**Cause**: JWT claims return text, need explicit casting for UUID columns

**Solution**:
```sql
-- ❌ WRONG: Comparing text to uuid
(auth.jwt() ->> 'engineer_id') = engineer_id

-- ✅ CORRECT: Cast text to uuid first
(auth.jwt() ->> 'engineer_id')::uuid = engineer_id
```

**Common Type Casts:**
- UUID: `(auth.jwt() ->> 'claim')::uuid`
- Integer: `(auth.jwt() ->> 'claim')::int`
- Boolean: `(auth.jwt() ->> 'claim')::boolean`
- Text: `auth.jwt() ->> 'claim'` (no cast needed)

---

### Pitfall 3: NULL Checks for Optional Claims

**Symptom**: Policy blocks access for users without optional claim (e.g., engineers without `engineer_id`)

**Cause**: Missing NULL check for optional JWT claims

**Solution**:
```sql
-- ❌ WRONG: Breaks for users without engineer_id
(auth.jwt() ->> 'engineer_id')::uuid = engineer_id

-- ✅ CORRECT: Check NULL first
((auth.jwt() ->> 'engineer_id') IS NOT NULL
 AND (auth.jwt() ->> 'engineer_id')::uuid = engineer_id)

-- OR use COALESCE with impossible value
COALESCE((auth.jwt() ->> 'engineer_id')::uuid, '00000000-0000-0000-0000-000000000000'::uuid) = engineer_id
```

---

### Pitfall 4: Still Querying Same Table via Helper Function

**Symptom**: Recursion still occurs even after using JWT claims

**Cause**: Policy calls a helper function (like `is_admin()`) which queries the protected table

**Solution**:
1. **Option A**: Don't use helper function, inline JWT check
   ```sql
   -- Instead of: is_admin()
   -- Use: (auth.jwt() ->> 'user_role') = 'admin'
   ```

2. **Option B**: Rewrite helper function to use JWT claims
   ```sql
   CREATE OR REPLACE FUNCTION public.is_admin()
   RETURNS BOOLEAN AS $$
   BEGIN
     -- ✅ Check JWT, don't query database
     RETURN (auth.jwt() ->> 'user_role') = 'admin';
   END;
   $$ LANGUAGE plpgsql
   SECURITY DEFINER
   STABLE
   SET search_path = '';
   ```

---

### Pitfall 5: Forgetting BOTH USING and WITH CHECK

**Symptom**: INSERT/UPDATE operations fail even though SELECT works

**Cause**: UPDATE and INSERT policies need both `USING` (for existing row) and `WITH CHECK` (for new row)

**Solution**:
```sql
-- ❌ WRONG: Only USING clause
CREATE POLICY "Update policy"
  ON table_name
  FOR UPDATE
  USING ((auth.jwt() ->> 'user_role') = 'admin');

-- ✅ CORRECT: Both USING and WITH CHECK
CREATE POLICY "Update policy"
  ON table_name
  FOR UPDATE
  USING ((auth.jwt() ->> 'user_role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_role') = 'admin');
```

**Rule of Thumb:**
- **SELECT**: Only needs `USING`
- **INSERT**: Only needs `WITH CHECK`
- **UPDATE**: Needs BOTH `USING` and `WITH CHECK`
- **DELETE**: Only needs `USING`

---

## Verification Checklist

Before considering the fix complete:

- [ ] Migration applied successfully without errors
- [ ] All old recursive policies dropped
- [ ] New JWT-based policies created
- [ ] Custom access token hook is enabled in dashboard
- [ ] JWT claims populated correctly (tested with `SELECT auth.jwt()`)
- [ ] Login works for admin users
- [ ] Login works for engineer/non-admin users
- [ ] Protected table queries succeed without recursion errors
- [ ] All CRUD operations work (SELECT, INSERT, UPDATE, DELETE)
- [ ] Role-based filtering works correctly (admins see all, users see own)
- [ ] No recursion errors in application logs
- [ ] No `NULL` JWT claim issues for users
- [ ] Type casting correct for UUID/int claims
- [ ] Documentation updated (database_schema.md, migration comments)

---

## Rollback Plan

If the new policies cause issues:

### Quick Rollback (5 min)

```sql
-- Disable RLS temporarily (EMERGENCY ONLY)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- WARNING: This removes all access control! Only use for critical issues.
-- Re-enable ASAP after fixing policies.
```

### Proper Rollback (15 min)

1. **Drop new policies:**
   ```sql
   DROP POLICY IF EXISTS "New Policy Name 1" ON table_name;
   DROP POLICY IF EXISTS "New Policy Name 2" ON table_name;
   ```

2. **Restore old policies from backup:**
   ```sql
   -- Use policy statements saved in Phase 4.1
   CREATE POLICY "Old Policy Name" ON table_name ...
   ```

3. **Verify old policies work:**
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'table_name';
   ```

4. **Re-investigate issue:**
   - Check JWT claims structure
   - Verify hook is working
   - Test with different user types

---

## Code Snippets Reference

### JWT Claim Patterns

```sql
-- Basic admin check
(auth.jwt() ->> 'user_role') = 'admin'

-- Engineer check with UUID cast
(auth.jwt() ->> 'engineer_id')::uuid = engineer_id

-- Multiple role check
(auth.jwt() ->> 'user_role') IN ('admin', 'manager')

-- Admin OR own data
(auth.jwt() ->> 'user_role') = 'admin' OR auth.uid() = user_id

-- NULL-safe engineer check
COALESCE((auth.jwt() ->> 'engineer_id')::uuid, '00000000-0000-0000-0000-000000000000'::uuid) = engineer_id

-- Complex multi-condition
((auth.jwt() ->> 'user_role') = 'admin')
OR ((auth.jwt() ->> 'user_role') = 'engineer'
    AND (auth.jwt() ->> 'engineer_id')::uuid = engineer_id)
OR (auth.uid() = created_by)
```

### Complete Policy Templates

**SELECT Policy (Read Access):**
```sql
CREATE POLICY "role_based_read_access"
  ON public.table_name
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_role') = 'admin'
    OR auth.uid() = user_id
  );
```

**INSERT Policy (Create Access):**
```sql
CREATE POLICY "role_based_insert_access"
  ON public.table_name
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'admin'
  );
```

**UPDATE Policy (Modify Access):**
```sql
CREATE POLICY "role_based_update_access"
  ON public.table_name
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_role') = 'admin'
    OR auth.uid() = user_id
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'admin'
    OR auth.uid() = user_id
  );
```

**DELETE Policy (Remove Access):**
```sql
CREATE POLICY "role_based_delete_access"
  ON public.table_name
  FOR DELETE
  USING (
    (auth.jwt() ->> 'user_role') = 'admin'
  );
```

---

## Related Documentation

- [Database Schema](../System/database_schema.md) - RLS policy reference
- [Debugging Supabase Auth Hooks](./debugging_supabase_auth_hooks.md) - Troubleshooting JWT claims
- [Auth Setup](../Tasks/active/AUTH_SETUP.md) - Authentication system overview
- [Security Recommendations](../System/security_recommendations.md) - RLS best practices
- [Fix RLS Recursion Task](../Tasks/active/fix_rls_recursion_and_errors.md) - Real implementation example

---

## Appendix A: Creating Custom Access Token Hook

If you don't have a custom access token hook, create one:

### Step 1: Create Hook Function

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_email text;
  engineer_id uuid;
BEGIN
  -- Get user email from event
  user_email := event->'claims'->>'email';

  -- Get user role from user_profiles
  -- Note: Use ->> (text) not -> (jsonb) to avoid casting issues
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = (event->>'user_id')::uuid;

  -- Get engineer_id if user is an engineer
  SELECT id INTO engineer_id
  FROM public.engineers
  WHERE auth_user_id = (event->>'user_id')::uuid;

  -- Build custom claims
  claims := event->'claims';

  -- Add custom claims
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  END IF;

  IF user_email IS NOT NULL THEN
    claims := jsonb_set(claims, '{email}', to_jsonb(user_email));
  END IF;

  IF engineer_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{engineer_id}', to_jsonb(engineer_id::text));
  END IF;

  -- Update event with new claims
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant execute to Supabase auth admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb)
TO supabase_auth_admin;
```

### Step 2: Enable Hook in Dashboard

1. Go to **Supabase Dashboard → Authentication → Hooks**
2. Find **"Custom Access Token Hook"**
3. Click **"Enable Hook"**
4. Select `public.custom_access_token_hook` from dropdown
5. **Save**

### Step 3: Test Hook

```sql
-- Test with sample user
SELECT public.custom_access_token_hook(
  jsonb_build_object(
    'user_id', 'real-user-uuid-here',
    'claims', jsonb_build_object(
      'sub', 'real-user-uuid-here',
      'email', 'test@example.com'
    )
  )
) as result;

-- Should return event with user_role claim added
```

---

## Appendix B: Debugging Checklist

If policies still don't work after migration:

### 1. Verify JWT Claims

```sql
-- Login as user, then check:
SELECT auth.jwt();
SELECT auth.jwt() ->> 'user_role';
SELECT auth.jwt() ->> 'engineer_id';
```

**Expected**: Should see custom claims populated

**If NULL**: Hook not working or not enabled

### 2. Check Policy Evaluation

```sql
-- Enable query logging
SET log_statement = 'all';

-- Run query and check logs for policy evaluation
SELECT * FROM user_profiles LIMIT 1;

-- Check pg_stat_statements for slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%user_profiles%'
ORDER BY mean_exec_time DESC;
```

### 3. Test with Different Users

Create test users with different roles:

```sql
-- Test admin access
-- Test engineer access
-- Test regular user access

-- Verify each sees appropriate data
```

### 4. Check for Other Recursive Patterns

```sql
-- Find all policies that reference same table
SELECT
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE qual LIKE '%' || tablename || '%'
  AND schemaname = 'public';
```

---

## Summary

**When to Use JWT Claims in RLS Policies:**
- ✅ Checking user roles (admin, engineer, etc.)
- ✅ Checking user permissions
- ✅ Getting user metadata (email, name, etc.)
- ✅ Engineer/assignment filtering

**When NOT to Use JWT Claims:**
- ❌ Complex business logic requiring joins
- ❌ Data that changes frequently (claims are cached)
- ❌ Very large datasets (claims have size limits)

**Key Takeaways:**
1. **Never query the same table in its own RLS policies** - causes recursion
2. **Use JWT claims for role checks** - fast, no recursion
3. **Custom hook must be enabled** - or JWT claims won't populate
4. **Type cast claims correctly** - text → uuid, int, etc.
5. **Test thoroughly** - all roles, all operations

**Time Savings:**
- Prevents hours of debugging recursion errors
- Faster policy evaluation (no database queries)
- Clearer security model (declarative claims)

---

**Document Version**: 1.0
**Author**: ClaimTech Development Team
**Based on Implementation**: October 25, 2025 user_profiles recursion fix
