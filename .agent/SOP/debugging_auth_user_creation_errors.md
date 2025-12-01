# SOP: Debugging Auth User Creation Errors

## Overview
This SOP documents how to debug and fix auth user creation errors, specifically focusing on trigger function failures and constraint violations.

**Related Issue:** Engineer creation failing with "Database error creating new user"

**Root Cause Found:** `handle_new_user()` trigger defaulting to 'user' role, which violated `user_profiles_role_check` constraint

---

## Common Auth User Creation Errors

### 1. Check Constraint Violations

**Symptom:**
```
AuthApiError: Database error creating new user
Error in logs: "new row for relation 'user_profiles' violates check constraint"
```

**How to Diagnose:**

1. **Check Supabase Auth Logs** (via Dashboard or MCP):
```sql
-- Using Supabase MCP
mcp__supabase__get_logs(project_id, service: 'auth')
```

2. **Identify the Constraint:**
Look for `SQLSTATE 23514` errors mentioning constraint names

3. **Query the Constraint:**
```sql
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.user_profiles'::regclass
  AND contype = 'c';  -- Check constraints
```

**Common Fix:**
Update the trigger function to comply with the constraint:

```sql
-- Example: If constraint only allows ['admin', 'engineer']
-- Update trigger to never use 'user' role

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
BEGIN
  -- Read from metadata first
  user_role := NEW.raw_user_meta_data->>'role';

  -- Validate against allowed values
  IF user_role NOT IN ('admin', 'engineer') THEN
    user_role := 'engineer';  -- Safe default
  END IF;

  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, user_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 2. Invalid API Key Errors

**Symptom:**
```
AuthApiError: Invalid API key
```

**How to Diagnose:**

1. **Check Environment Variables:**
```bash
# Verify service role key is set
grep SUPABASE_SERVICE_ROLE_KEY .env
```

2. **Verify Client Configuration:**
```typescript
// Check src/lib/supabase-server.ts
const supabaseServer = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,  // Must use service role for admin API
  { auth: { persistSession: false } }
);
```

3. **Check API Usage:**
```typescript
// Admin operations require service role client
const { data, error } = await supabaseServer.auth.admin.createUser({
  email: email,
  password: password,
  email_confirm: true,
  user_metadata: { role: 'engineer' }
});
```

**Common Fix:**
- Ensure `.env` has correct `SUPABASE_SERVICE_ROLE_KEY`
- Use `supabaseServer` (not `supabase`) for admin operations
- Restart dev server after `.env` changes

---

### 3. Trigger Function Logic Errors

**Symptom:**
- User created in `auth.users` but not in `user_profiles`
- Orphaned auth users without profiles
- Role mismatch between auth metadata and profile

**How to Diagnose:**

1. **Check for Orphaned Users:**
```sql
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'role' AS metadata_role,
  up.role AS profile_role
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;  -- Orphaned users
```

2. **Review Trigger Function:**
```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';
```

3. **Check Trigger Status:**
```sql
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname = 'on_auth_user_created';
```

**Common Fixes:**

**Fix 1: Read Metadata Correctly**
```sql
-- ✅ Correct: Use ->> for text extraction
user_role := NEW.raw_user_meta_data->>'role';

-- ❌ Wrong: Using -> returns jsonb type
user_role := NEW.raw_user_meta_data->'role';
```

**Fix 2: Provide Safe Defaults**
```sql
-- Always have a fallback that matches constraints
IF user_role IS NULL OR user_role NOT IN ('admin', 'engineer') THEN
  user_role := 'engineer';  -- Safe default
END IF;
```

**Fix 3: Handle Existing Records**
```sql
INSERT INTO public.user_profiles (id, email, role)
VALUES (NEW.id, NEW.email, user_role)
ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate key errors
```

---

### 4. RLS Policy Conflicts

**Symptom:**
```
AuthApiError: new row violates row-level security policy
```

**How to Diagnose:**

1. **Check RLS Policies on user_profiles:**
```sql
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
WHERE tablename = 'user_profiles';
```

2. **Check if RLS is Enabled:**
```sql
SELECT
  relname,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname = 'user_profiles';
```

**Common Fix:**

```sql
-- Allow trigger function to insert (uses SECURITY DEFINER)
-- Or add policy for authenticated inserts

CREATE POLICY "Users can be created by auth triggers"
ON public.user_profiles
FOR INSERT
WITH CHECK (true);  -- Trigger runs as SECURITY DEFINER

-- More restrictive:
CREATE POLICY "Users can be created via auth"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);  -- Only for self-registration
```

---

## Investigation Workflow

### Step 1: Gather Error Information

1. **Capture Full Error Message:**
   - Check application logs
   - Check Supabase Dashboard → Logs → Auth
   - Use `mcp__supabase__get_logs` for programmatic access

2. **Note Error Codes:**
   - `PGRST116`: Not found
   - `23514`: Check constraint violation
   - `23505`: Unique violation
   - `42501`: Insufficient privilege (RLS)
   - `25P02`: Transaction aborted

### Step 2: Check Database State

```sql
-- 1. Check constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.user_profiles'::regclass;

-- 2. Check triggers
SELECT tgname, tgenabled, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- 3. Check RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

-- 4. Check for orphaned users
SELECT au.id, au.email, up.id AS profile_id
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
```

### Step 3: Review Trigger Function Logic

1. **Get Function Definition:**
```sql
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';
```

2. **Check for Common Issues:**
   - ❌ Hardcoded default values that violate constraints
   - ❌ Wrong JSONB operator (`->` vs `->>`)
   - ❌ Missing `ON CONFLICT` clauses
   - ❌ Missing role validation
   - ❌ Not reading `raw_user_meta_data`

### Step 4: Apply Fix

1. **Create Migration:**
```bash
# Create new migration file
touch supabase/migrations/XXX_fix_trigger_function.sql
```

2. **Test Locally First** (if using local Supabase):
```bash
supabase db reset
supabase db push
```

3. **Apply to Production:**
```typescript
// Using Supabase MCP
mcp__supabase__apply_migration(
  project_id: 'xxx',
  name: 'fix_trigger_function',
  query: '...'
)
```

### Step 5: Verify Fix

1. **Test User Creation:**
```typescript
// Test via admin endpoint
const { data, error } = await supabaseServer.auth.admin.createUser({
  email: 'test@example.com',
  password: 'tempPassword123!',
  email_confirm: true,
  user_metadata: { role: 'engineer' }
});
```

2. **Verify Profile Created:**
```sql
SELECT au.email, up.role, up.created_at
FROM auth.users au
JOIN public.user_profiles up ON au.id = up.id
WHERE au.email = 'test@example.com';
```

3. **Check Auth Logs:**
```sql
-- Check for errors in latest auth operations
mcp__supabase__get_logs(project_id, service: 'auth')
```

---

## Prevention Checklist

When creating or modifying auth triggers:

- [ ] Read role from `raw_user_meta_data->>'role'` (text, not jsonb)
- [ ] Validate role against CHECK constraints
- [ ] Provide safe default that matches constraints
- [ ] Use `ON CONFLICT` clauses to prevent duplicate errors
- [ ] Use `SECURITY DEFINER` for trigger functions
- [ ] Test with both admin-created and self-registered users
- [ ] Check RLS policies don't block trigger inserts
- [ ] Document expected metadata fields
- [ ] Add comments explaining role validation logic

---

## Case Study: ClaimTech Engineer Creation Fix

**Problem:**
Admin creating engineers failed with "Database error creating new user"

**Investigation:**
1. Checked auth logs → Found constraint violation: `user_profiles_role_check`
2. Queried constraint → Only allows `['admin', 'engineer']`
3. Reviewed trigger → Defaulted to `role = 'user'` (INVALID!)

**Root Cause:**
```sql
-- OLD (BROKEN)
DECLARE
  default_role text := 'user';  -- ❌ Violates constraint!
```

**Fix Applied:**
```sql
-- NEW (FIXED)
DECLARE
  user_role text;
BEGIN
  -- Read from metadata
  user_role := NEW.raw_user_meta_data->>'role';

  -- Validate and default
  IF user_role NOT IN ('admin', 'engineer') THEN
    user_role := 'engineer';  -- ✅ Safe default
  END IF;

  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, user_role);
END;
```

**Migration:** `065_fix_handle_new_user_role_constraint.sql`

**Result:** Engineer creation works correctly, respects metadata, complies with constraints

---

## Related Documentation

- `.agent/System/database_schema.md` - Database schema and constraints
- `.agent/SOP/implementing_role_based_filtering.md` - Role-based access control
- Supabase Docs: [Auth Triggers](https://supabase.com/docs/guides/auth/auth-hooks)
- Supabase Docs: [Database Functions](https://supabase.com/docs/guides/database/functions)

---

## Quick Reference: Common SQL Queries

```sql
-- Check recent auth errors
SELECT * FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- List all constraints on user_profiles
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.user_profiles'::regclass;

-- Get trigger function source
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check for orphaned auth users
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Verify role distribution
SELECT role, COUNT(*) as count
FROM public.user_profiles
GROUP BY role;
```
