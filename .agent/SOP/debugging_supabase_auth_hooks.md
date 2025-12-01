# SOP: Debugging and Fixing Supabase Auth Hooks

**Created:** October 25, 2025
**Last Updated:** October 25, 2025
**Estimated Time:** 30-60 minutes
**Complexity:** Intermediate
**Prerequisites:** MCP Supabase tools configured, database access

---

## When to Use This SOP

Use this procedure when encountering authentication errors related to custom Supabase auth hooks:

- `AuthApiError: Error running hook URI: pg-functions://postgres/...`
- `AuthSessionMissingError: Auth session missing!`
- Login failures with 500 status code
- JWT tokens missing expected custom claims
- Hook execution errors in Supabase logs
- "Insecure getSession() usage" warnings (see Common Warnings section below)

---

## Overview

Supabase custom auth hooks are PostgreSQL functions that execute during authentication to add custom claims to JWT tokens. Common issues include:

1. **Type casting errors** - Incorrect JSONB operator usage
2. **Missing user profiles** - Auth users without corresponding profile records
3. **Permission issues** - Hook function lacks proper grants
4. **Hook not enabled** - Function exists but isn't configured in dashboard
5. **Session handling** - Missing session checks in password reset flows

---

## Debugging Workflow

### Phase 1: Identify the Error Source (5-10 min)

**1.1 Check Error Logs**

Look for specific error messages in application logs:
- `Error running hook URI` = Hook function execution failed
- `Auth session missing` = Session validation issue
- `cannot cast type X to Y` = Type casting problem

**1.2 Verify Hook Function Exists**

```bash
# Using MCP
mcp__supabase__execute_sql
project_id: [your-project-id]
query: |
  SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname LIKE '%hook%';
```

**Expected Result:** Function definition should appear without errors

---

### Phase 2: Test Hook Function Manually (10-15 min)

**2.1 Get Real User Data**

```sql
-- Get a real user ID from auth.users
SELECT id, email
FROM auth.users
LIMIT 1;
```

**2.2 Test Hook with Sample Event**

```sql
-- Test the hook function manually
SELECT public.custom_access_token_hook(
  jsonb_build_object(
    'user_id', '[user-id-from-step-2.1]',
    'claims', jsonb_build_object(
      'sub', '[user-id-from-step-2.1]',
      'email', '[user-email-from-step-2.1]'
    )
  )
) as result;
```

**What to Look For:**
- ✅ **Success:** Returns JSON with enhanced claims
- ❌ **Error:** Shows exact line number and error type
- ❌ **NULL result:** Logic issue in function

**2.3 Analyze Error Output**

Common error patterns:

```
ERROR: 42846: cannot cast type jsonb to uuid
QUERY: WHERE id = (event->'user_id')::uuid
```
**Cause:** Using `->` operator (returns jsonb) instead of `->>` (returns text)

```
ERROR: 42883: function does not exist
```
**Cause:** Hook function not created or dropped

```
ERROR: 42501: permission denied
```
**Cause:** Missing EXECUTE grant to supabase_auth_admin

---

### Phase 3: Fix Common Issues (15-30 min)

**3.1 Fix Type Casting Errors**

**Problem:** Using wrong JSONB operator

```sql
-- WRONG: -> returns jsonb type
WHERE id = (event->'user_id')::uuid

-- CORRECT: ->> returns text type
WHERE id = (event->>'user_id')::uuid
```

**Fix Pattern:**

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
  engineer_id uuid;
BEGIN
  -- CORRECT: Use ->> to get text, then cast to uuid
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = (event->>'user_id')::uuid;

  SELECT id INTO engineer_id
  FROM public.engineers
  WHERE auth_user_id = (event->>'user_id')::uuid;

  -- Build custom claims
  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  END IF;

  IF engineer_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{engineer_id}', to_jsonb(engineer_id::text));
  END IF;

  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;
```

**Apply Fix via MCP:**

```bash
# Use execute_sql instead of apply_migration for faster iteration
mcp__supabase__execute_sql
project_id: [your-project-id]
query: [paste fixed function above]
```

**3.2 Verify and Grant Permissions**

```sql
-- Check current permissions
SELECT
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'custom_access_token_hook';

-- Grant if missing
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb)
TO supabase_auth_admin;
```

**3.3 Check for Missing User Profiles**

```sql
-- Find auth users without profiles
SELECT
  au.id,
  au.email,
  CASE WHEN up.id IS NULL THEN 'MISSING PROFILE' ELSE 'Has Profile' END as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY status DESC;
```

**If profiles are missing:**

```sql
-- Create missing profiles (adjust fields as needed)
INSERT INTO public.user_profiles (id, email, role, full_name)
SELECT
  au.id,
  au.email,
  'admin', -- or appropriate default role
  COALESCE(au.raw_user_meta_data->>'full_name', au.email)
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
```

**3.4 Fix Password Reset Session Issues**

If seeing `AuthSessionMissingError` on password reset page:

**Create:** `src/routes/auth/reset-password/+page.ts`

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { session } = await parent();

  // User must have a session (from password reset email link)
  if (!session) {
    // No session means they didn't come from a valid password reset link
    redirect(303, '/auth/login');
  }

  return {};
};
```

**Why this works:**
- Password reset links create a recovery session via callback
- Page load function verifies session exists before allowing password update
- Redirects to login if no valid session

---

### Phase 4: Test the Fix (10-15 min)

**4.1 Re-test Hook Function**

```sql
-- Use same test query from Phase 2.2
-- Should now return enhanced claims without errors
SELECT public.custom_access_token_hook(
  jsonb_build_object(
    'user_id', '[user-id]',
    'claims', jsonb_build_object(
      'sub', '[user-id]',
      'email', '[user-email]'
    )
  )
) as result;
```

**Expected Result:**

```json
{
  "user_id": "...",
  "claims": {
    "sub": "...",
    "email": "...",
    "user_role": "admin",          // ✅ Custom claim added
    "engineer_id": "..."           // ✅ If user is engineer
  }
}
```

**4.2 Enable Hook in Dashboard**

**IMPORTANT:** Hook function must be manually enabled in Supabase Dashboard.

1. Go to **Supabase Dashboard** → **Authentication** → **Hooks**
2. Find **"Custom Access Token Hook"**
3. Click **"Enable Hook"** or **"Edit Hook"**
4. Select **`public.custom_access_token_hook`** from dropdown
5. **Save**

**Note:** This step cannot be automated via MCP and must be done manually.

**4.3 Test Login Flow**

1. Open application in browser
2. Navigate to `/auth/login`
3. Login with test credentials
4. Verify successful redirect to dashboard
5. Check browser dev tools → Application → Cookies
6. Verify JWT token contains custom claims

**Decode JWT to verify claims:**
- Go to https://jwt.io
- Paste access token
- Verify payload contains `user_role`, `engineer_id`, etc.

**4.4 Test Password Reset Flow**

1. Navigate to `/auth/forgot-password`
2. Enter email address
3. Check email for reset link
4. Click reset link
5. Should redirect to `/auth/reset-password` (not login)
6. Enter new password
7. Should redirect to dashboard with active session

---

## Common Pitfalls and Solutions

### Pitfall 1: Using apply_migration with Complex Comments

**Problem:** SQL comments containing special characters cause syntax errors

```sql
-- ❌ BREAKS: Special characters in comment
COMMENT ON FUNCTION ... 'Fixed casting (event->>'user_id' instead of event->'user_id')';
```

**Solution:** Use `execute_sql` instead of `apply_migration` for function updates

```bash
# ✅ Direct execution - no migration metadata
mcp__supabase__execute_sql
```

### Pitfall 2: Testing Hook with Non-Existent Users

**Problem:** Testing with old/deleted user IDs gives misleading results

**Solution:** Always query `auth.users` first to get real current user IDs

```sql
-- Get real users
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 3;
```

### Pitfall 3: Hook Enabled but Still Failing

**Problem:** Hook function fixed but login still fails

**Checklist:**
1. ✅ Function definition updated in database?
2. ✅ Permissions granted to `supabase_auth_admin`?
3. ✅ Hook enabled in dashboard?
4. ✅ Browser cache cleared?
5. ✅ Hard refresh (Ctrl+Shift+R)?

### Pitfall 4: Password Reset Works Locally But Not in Production

**Problem:** Environment-specific email redirect URLs

**Solution:** Configure redirect URLs for all environments

In Supabase Dashboard → Authentication → URL Configuration:
- Development: `http://localhost:5173/auth/reset-password`
- Production: `https://yourdomain.com/auth/reset-password`

Add both to **Redirect URLs** whitelist.

---

## Verification Checklist

Before considering the fix complete:

- [ ] Hook function executes without errors in SQL test
- [ ] Hook function returns expected custom claims
- [ ] All auth users have corresponding profile records
- [ ] Permissions granted to `supabase_auth_admin`
- [ ] Hook enabled in Supabase Dashboard
- [ ] Login flow works in browser
- [ ] JWT token contains custom claims
- [ ] Password reset flow works end-to-end
- [ ] No errors in browser console
- [ ] No errors in Supabase logs

---

## Code Snippets Reference

### JSONB Operator Quick Reference

```sql
-- -> Returns jsonb (cannot cast directly to uuid)
event->'user_id'              -- ❌ Returns: jsonb
(event->'user_id')::uuid      -- ❌ ERROR: cannot cast jsonb to uuid

-- ->> Returns text (can cast to uuid)
event->>'user_id'             -- ✅ Returns: text
(event->>'user_id')::uuid     -- ✅ Works: text casts to uuid
```

### Testing Hook Function Template

```sql
-- Template for testing any custom auth hook
SELECT public.[hook_function_name](
  jsonb_build_object(
    'user_id', '[actual-user-uuid]',
    'claims', jsonb_build_object(
      'sub', '[actual-user-uuid]',
      'email', '[actual-user-email]',
      'aud', 'authenticated',
      'role', 'authenticated'
    )
  )
) as result;
```

### Password Reset Page Load Pattern

```typescript
// Pattern for any auth page requiring active session
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { session } = await parent();

  if (!session) {
    redirect(303, '/auth/login');
  }

  return {};
};
```

---

## Related Documentation

- [Authentication Setup](./../Tasks/active/AUTH_SETUP.md) - Full auth implementation details
- [Engineer Registration](./../Tasks/active/engineer_registration_auth.md) - Role-based access implementation
- [Implementing Form Actions & Auth](./implementing_form_actions_auth.md) - Form action patterns
- [Database Schema - Authentication](../System/database_schema.md#authentication--user-tables)

---

## Troubleshooting Decision Tree

```
Login Error?
│
├─ "Error running hook URI"
│  ├─ Test hook manually (Phase 2)
│  ├─ Check error message
│  │  ├─ "cannot cast" → Fix JSONB operators (Phase 3.1)
│  │  ├─ "permission denied" → Grant permissions (Phase 3.2)
│  │  └─ "function does not exist" → Recreate function
│  └─ Verify hook enabled in dashboard (Phase 4.2)
│
├─ "Auth session missing"
│  ├─ Check if page requires session
│  ├─ Add page load function (Phase 3.4)
│  └─ Verify callback handles recovery type
│
└─ Login succeeds but missing custom claims
   ├─ Check hook is enabled
   ├─ Verify user has profile record (Phase 3.3)
   └─ Test hook function returns claims (Phase 4.1)
```

---

## Common Warnings

### "Insecure getSession() Usage" Warning

**Warning Message:**
```
Using the user object as returned from supabase.auth.getSession() or from some
supabase.auth.onAuthStateChange() events could be insecure! This value comes
directly from the storage medium (usually cookies on the server) and may not be
authentic. Use supabase.auth.getUser() instead which authenticates the data by
contacting the Supabase Auth server.
```

**When This Warning Appears:**
- In server-side code that calls `supabase.auth.getSession()`
- Typically in `hooks.server.ts` or `+page.server.ts` files
- During SSR (Server-Side Rendering) operations

**Is This a Problem?**

**NO** - This is usually a **false positive** if you're following the recommended SSR pattern.

**Safe Pattern (Recommended by Supabase):**
```typescript
// hooks.server.ts
event.locals.safeGetSession = async () => {
  // Step 1: Get session from cookies (triggers warning)
  const { data: { session } } = await event.locals.supabase.auth.getSession()

  if (!session) {
    return { session: null, user: null }
  }

  // Step 2: Validate JWT by calling getUser() (makes it secure)
  const { data: { user }, error } = await event.locals.supabase.auth.getUser()

  if (error) {
    return { session: null, user: null }
  }

  return { session, user }  // ✅ Now secure!
}
```

**Why This Is Secure:**
1. `getSession()` retrieves the session from cookies (fast, but unvalidated)
2. `getUser()` validates the JWT token with Supabase Auth server (secure)
3. Only return the session if JWT validation succeeds
4. This is the **official pattern** from Supabase SSR documentation

**When It's Actually Insecure:**
```typescript
// ❌ INSECURE: Using session without validation
const { data: { session } } = await supabase.auth.getSession()
const userId = session?.user.id  // Don't trust this!
// ... use userId for database queries without validation
```

**How to Handle the Warning:**

**Option 1: Add Documentation (Recommended)**
```typescript
/**
 * NOTE: The getSession() call below triggers a Supabase warning about insecure usage.
 * This is a FALSE POSITIVE - the code is secure because:
 * 1. getSession() retrieves the session from cookies
 * 2. Immediately followed by getUser() which validates the JWT
 * 3. This is the recommended pattern from Supabase SSR documentation
 *
 * See: https://supabase.com/docs/guides/auth/server-side/sveltekit
 */
const { data: { session } } = await supabase.auth.getSession()
```

**Option 2: Suppress the Warning (Not Recommended)**
- The warning serves as a reminder to validate sessions
- Better to document why it's safe than suppress it

**References:**
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/sveltekit)
- [SvelteKit Auth Example](https://github.com/supabase/auth-helpers/tree/main/examples/sveltekit)

---

## Summary

**Key Takeaways:**
1. Always test hook functions manually with real user data before enabling
2. Use `->>` (text) not `->` (jsonb) when casting to UUID
3. Use `execute_sql` for quick function fixes, avoid migration overhead
4. Hook must be enabled in dashboard after database fix
5. Password reset pages need session verification in page load
6. "Insecure getSession()" warning is usually a false positive if followed by getUser()

**Time-Saving Tips:**
- Keep a test query template with real user IDs handy
- Use MCP tools for faster iteration than dashboard SQL editor
- Test hook function in isolation before enabling in auth flow
- Verify all auth users have profiles to avoid runtime failures
- Document getSession() usage to clarify it's secure

---

**Document Version:** 1.1
**Author:** ClaimTech Development Team
**Based on Implementation:** October 25, 2025 auth hook debugging session
**Updated:** January 25, 2025 - Added getSession() warning documentation
