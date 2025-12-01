# Security Patterns for ClaimTech Supabase

This document provides templates and best practices for implementing Row Level Security (RLS), storage security, and authentication in ClaimTech.

## Table of Contents
1. [RLS Helper Functions](#rls-helper-functions)
2. [RLS Policy Templates](#rls-policy-templates)
3. [Storage Security](#storage-security)
4. [Authentication Patterns](#authentication-patterns)
5. [Common Security Gaps](#common-security-gaps)

---

## RLS Helper Functions

### Core Helper Functions

These functions are used across all RLS policies:

```sql
-- Check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true if the current user has admin role';
```

```sql
-- Get engineer ID for current user
CREATE OR REPLACE FUNCTION public.get_user_engineer_id()
RETURNS UUID AS $$
DECLARE
  eng_id UUID;
BEGIN
  SELECT id INTO eng_id
  FROM public.engineers
  WHERE auth_user_id = auth.uid() AND is_active = true;

  RETURN eng_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_engineer_id() IS
  'Returns the engineer ID for the current authenticated user';
```

### Why SECURITY DEFINER?

**SECURITY DEFINER**: Function executes with the permissions of the function owner (not the caller).

**Why needed**: Allows users to query `user_profiles` table even if they don't have direct SELECT permission on it. The function acts as a "stored query" with elevated permissions.

```sql
-- Without SECURITY DEFINER:
-- User tries to check is_admin() → queries user_profiles → RLS blocks access → fails

-- With SECURITY DEFINER:
-- User calls is_admin() → function (running as owner) queries user_profiles → succeeds
```

### Why STABLE?

**STABLE**: Function result can be cached within a single query.

**Performance impact**:
```sql
-- Without STABLE:
SELECT * FROM requests WHERE is_admin() = true OR assigned_engineer_id = get_user_engineer_id();
-- is_admin() called for EVERY row → N queries

-- With STABLE:
-- is_admin() called ONCE, result cached → 1 query
```

### Additional Helper Functions

```sql
-- Check if user owns an engineer profile
CREATE OR REPLACE FUNCTION public.is_engineer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.engineers
    WHERE auth_user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

```sql
-- Get user profile for current user
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE (id UUID, email TEXT, role TEXT, province TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT up.id, up.email, up.role, up.province
  FROM public.user_profiles up
  WHERE up.id = auth.uid() AND up.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

---

## RLS Policy Templates

### Template 1: Admin + Engineer Access (Read)

**Use case**: Main entity tables where admins see everything, engineers see their assignments.

```sql
-- Drop old permissive policy (development)
DROP POLICY IF EXISTS "Allow all operations on {table} for now" ON {table};

-- Admins can view all records
CREATE POLICY "{table}_admins_select"
  ON {table} FOR SELECT
  TO authenticated
  USING (is_admin());

-- Engineers can view their assigned records
CREATE POLICY "{table}_engineers_select"
  ON {table} FOR SELECT
  TO authenticated
  USING (assigned_engineer_id = get_user_engineer_id());
```

**Example**:
```sql
DROP POLICY IF EXISTS "Allow all operations on requests for now" ON requests;

CREATE POLICY "requests_admins_select"
  ON requests FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "requests_engineers_select"
  ON requests FOR SELECT
  TO authenticated
  USING (assigned_engineer_id = get_user_engineer_id());
```

### Template 2: Admin-Only Write Operations

**Use case**: Only admins can insert/update/delete.

```sql
-- Admins can insert
CREATE POLICY "{table}_admins_insert"
  ON {table} FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update
CREATE POLICY "{table}_admins_update"
  ON {table} FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can delete
CREATE POLICY "{table}_admins_delete"
  ON {table} FOR DELETE
  TO authenticated
  USING (is_admin());
```

### Template 3: Hierarchical Access (Parent Table Controls Child)

**Use case**: Access to child table based on parent table ownership.

```sql
-- Example: assessment_damage access based on assessment ownership

CREATE POLICY "assessment_damage_admins_all"
  ON assessment_damage FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "assessment_damage_engineers_all"
  ON assessment_damage FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN appointments ap ON ap.id = a.appointment_id
      WHERE a.id = assessment_damage.assessment_id
      AND ap.assigned_engineer_id = get_user_engineer_id()
    )
  );
```

### Template 4: User Profile Self-Management

**Use case**: Users can read/update their own profile, admins can manage all.

```sql
-- Users can view their own profile
CREATE POLICY "user_profiles_self_select"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "user_profiles_admins_select"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- Users can update their own profile (limited fields)
CREATE POLICY "user_profiles_self_update"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent role escalation
    role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Admins can update any profile
CREATE POLICY "user_profiles_admins_update"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

### Template 5: Insert-Only Audit Logs

**Use case**: Users can insert audit logs but can't modify/delete them.

```sql
-- Anyone authenticated can insert audit logs
CREATE POLICY "audit_logs_insert"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can view audit logs
CREATE POLICY "audit_logs_admins_select"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- Nobody can update or delete audit logs (immutable)
-- (No UPDATE or DELETE policies = operation denied)
```

### Template 6: Public Read, Authenticated Write

**Use case**: Reference data that anyone can read, only admins can modify.

```sql
-- Example: provinces table

-- Anyone can view provinces (even unauthenticated)
CREATE POLICY "provinces_public_select"
  ON provinces FOR SELECT
  TO public
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "provinces_admins_all"
  ON provinces FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

---

## Storage Security

### Private Buckets with RLS

All storage buckets in ClaimTech are private:

```sql
-- Make bucket private (not publicly accessible)
UPDATE storage.buckets
SET public = false
WHERE id = 'SVA Photos';

UPDATE storage.buckets
SET public = false
WHERE id = 'documents';
```

### Storage Object Policies

#### Template 1: Authenticated Users Only

```sql
-- SELECT: Authenticated users can view files
CREATE POLICY "authenticated_users_can_view_{bucket}"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = '{bucket}');

-- INSERT: Authenticated users can upload files
CREATE POLICY "authenticated_users_can_upload_{bucket}"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = '{bucket}');

-- UPDATE: Authenticated users can update files
CREATE POLICY "authenticated_users_can_update_{bucket}"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = '{bucket}')
  WITH CHECK (bucket_id = '{bucket}');

-- DELETE: Authenticated users can delete files
CREATE POLICY "authenticated_users_can_delete_{bucket}"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = '{bucket}');
```

#### Template 2: Path-Based Access (Recommended)

**More secure**: Users can only access files for their assigned assessments.

```sql
-- Users can only view files for assessments they have access to
CREATE POLICY "users_can_view_assigned_assessment_photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'SVA Photos' AND
    (
      -- Admins see everything
      is_admin() OR
      -- Engineers see their assigned assessments
      (storage.foldername(name))[1] = 'assessments' AND
      (storage.foldername(name))[2]::uuid IN (
        SELECT a.id
        FROM assessments a
        JOIN appointments ap ON ap.id = a.appointment_id
        WHERE ap.assigned_engineer_id = get_user_engineer_id()
      )
    )
  );
```

**Helper functions for path parsing:**
```sql
-- storage.foldername(name) returns array of path segments
-- Example: "assessments/abc123/damage/photo.jpg"
-- → ['assessments', 'abc123', 'damage', 'photo.jpg']

-- Get assessment ID from photo path
CREATE OR REPLACE FUNCTION get_assessment_from_photo_path(file_path TEXT)
RETURNS UUID AS $$
DECLARE
  path_parts TEXT[];
BEGIN
  path_parts := storage.foldername(file_path);
  IF path_parts[1] = 'assessments' THEN
    RETURN path_parts[2]::uuid;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Proxy Endpoint Security

**Don't use signed URLs** (they expire). **Use proxy endpoints** instead:

```typescript
// src/routes/api/photo/[...path]/+server.ts
export const GET: RequestHandler = async ({ params, locals, request }) => {
  const photoPath = params.path;

  // 1. Authenticate user
  const { data: { session } } = await locals.supabase.auth.getSession();
  if (!session) {
    throw error(401, 'Authentication required');
  }

  // 2. Download file (RLS policies enforced via user's session)
  const { data: photoBlob, error: downloadError } = await locals.supabase.storage
    .from('SVA Photos')
    .download(photoPath);

  if (downloadError) {
    console.error('Download error:', downloadError);
    throw error(404, 'Photo not found');
  }

  // 3. Return file with caching headers
  const arrayBuffer = await photoBlob.arrayBuffer();
  const etag = `"${Buffer.from(photoPath).toString('base64').substring(0, 16)}"`;

  // Check ETag for 304 Not Modified
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, {
      status: 304,
      headers: { 'ETag': etag }
    });
  }

  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
      'ETag': etag,
      'X-Content-Type-Options': 'nosniff' // Security header
    }
  });
};
```

**Benefits**:
1. **No expiration**: URLs don't expire
2. **RLS enforced**: Uses user's session
3. **Browser caching**: ETags enable 304 responses
4. **Same-origin**: No CORS issues

---

## Authentication Patterns

### Three Supabase Client Types

#### 1. Browser Client (Anon Key)
```typescript
// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient<Database>(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY // Safe to expose
);
```

**Use for**: Client-side operations, optimistic updates
**RLS**: Enforced based on user's session

#### 2. SSR Client (User Session)
```typescript
// In hooks.server.ts
event.locals.supabase = createServerClient<Database>(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' });
        });
      }
    }
  }
);
```

**Use for**: Server load functions, form actions
**RLS**: Enforced based on user's session
**Safe**: Never exposes service role key

#### 3. Service Role Client (Admin)
```typescript
// src/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseServer = createClient<Database>(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY, // ⚠️ BYPASSES RLS!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

**Use for**: Admin operations, PDF generation, storage uploads
**RLS**: **BYPASSED** - full database access
**Security**: **NEVER** expose to client

### Auth Guard Pattern

```typescript
// src/hooks.server.ts
const authGuard: Handle = async ({ event, resolve }) => {
  // Validate JWT (not just check cookie)
  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  // Explicit root route handling
  if (event.url.pathname === '/') {
    throw redirect(303, session ? '/dashboard' : '/auth/login');
  }

  // Public routes
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/auth/confirm'
  ];
  const isPublicRoute = publicRoutes.some(route =>
    event.url.pathname.startsWith(route)
  );

  // Redirect unauthenticated users to login
  if (!session && !isPublicRoute) {
    throw redirect(303, '/auth/login');
  }

  // Redirect authenticated users away from auth pages
  if (session && isPublicRoute && event.url.pathname !== '/auth/callback') {
    throw redirect(303, '/dashboard');
  }

  return resolve(event);
};
```

### JWT Validation Pattern

```typescript
event.locals.safeGetSession = async () => {
  // Step 1: Get session from cookie
  const { data: { session } } = await event.locals.supabase.auth.getSession();
  if (!session) {
    return { session: null, user: null };
  }

  // Step 2: CRITICAL - Validate JWT by calling getUser()
  // This verifies the JWT signature with Supabase Auth server
  const { data: { user }, error } = await event.locals.supabase.auth.getUser();
  if (error) {
    console.error('JWT validation failed:', error);
    return { session: null, user: null };
  }

  return { session, user };
};
```

**Why both getSession() and getUser()?**
- `getSession()`: Just reads cookie (doesn't verify)
- `getUser()`: Validates JWT signature with Auth server (secure)

### Auto-Create User Profile Pattern

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'engineer'), -- Default to engineer
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING; -- Idempotent

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Common Security Gaps

### ❌ Gap 1: Exposing Service Role Key

**Wrong**:
```typescript
// In +page.server.ts or +server.ts
import { supabaseServer } from '$lib/supabase-server';

export const load = async () => {
  const { data } = await supabaseServer.from('table').select('*');
  return { data }; // Data exposed to browser without RLS!
};
```

**Right**:
```typescript
export const load: PageServerLoad = async ({ locals }) => {
  // Uses user's session, enforces RLS
  const { data } = await locals.supabase.from('table').select('*');
  return { data };
};
```

### ❌ Gap 2: Forgetting RLS on New Tables

**Wrong**:
```sql
CREATE TABLE new_table (...);
-- RLS not enabled → anyone can access!
```

**Right**:
```sql
CREATE TABLE new_table (...);

-- Enable RLS immediately
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "new_table_admins_all" ON new_table FOR ALL
  TO authenticated USING (is_admin());
```

### ❌ Gap 3: Using .single() Instead of .maybeSingle()

**Wrong**:
```typescript
// Throws error if not found (can leak existence)
const { data } = await supabase
  .from('sensitive_table')
  .select('*')
  .eq('id', id)
  .single();
```

**Right**:
```typescript
// Returns null if not found (doesn't reveal existence)
const { data } = await supabase
  .from('sensitive_table')
  .select('*')
  .eq('id', id)
  .maybeSingle();

if (!data) {
  throw error(404, 'Not found');
}
```

### ❌ Gap 4: Permissive Storage Policies

**Wrong** (current):
```sql
-- All authenticated users can access all files
CREATE POLICY "anyone_authenticated" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'SVA Photos');
```

**Right** (recommended):
```sql
-- Users can only access files for their assigned assessments
CREATE POLICY "path_based_access" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'SVA Photos' AND
    (is_admin() OR
     (storage.foldername(name))[2]::uuid IN (
       SELECT a.id FROM assessments a
       JOIN appointments ap ON ap.id = a.appointment_id
       WHERE ap.assigned_engineer_id = get_user_engineer_id()
     ))
  );
```

### ❌ Gap 5: Not Validating JWT

**Wrong**:
```typescript
const { data: { session } } = await supabase.auth.getSession();
// Just checks cookie, doesn't verify signature
if (session) {
  // User is authenticated (maybe not!)
}
```

**Right**:
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
// Validates JWT with Auth server
if (error || !user) {
  throw redirect(303, '/auth/login');
}
```

### ❌ Gap 6: Allowing Role Escalation

**Wrong**:
```sql
CREATE POLICY "users_can_update_profile" ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
  -- User could change their role to 'admin'!
```

**Right**:
```sql
CREATE POLICY "users_can_update_profile" ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent role changes
    role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );
```

---

## Security Checklist

When implementing new features, verify:

- [ ] RLS enabled on all new tables
- [ ] Policies created for admins AND engineers
- [ ] Helper functions use SECURITY DEFINER STABLE
- [ ] Storage buckets are private (not public)
- [ ] Storage policies are path-based (not bucket-wide)
- [ ] Service role client never exposed to browser
- [ ] JWT validated with getUser() (not just getSession())
- [ ] Users can't escalate their own roles
- [ ] Sensitive operations logged to audit_logs
- [ ] Form actions use locals.supabase (not supabaseServer)
- [ ] Proxy endpoints authenticate before serving files
- [ ] ETags implemented for browser caching
- [ ] .maybeSingle() used for nullable queries
- [ ] Foreign key constraints prevent orphaned records

---

## Summary

Security in ClaimTech follows these principles:

1. **Defense in depth**: RLS + auth guard + application logic
2. **Least privilege**: Engineers can't delete, only admins
3. **Audit trail**: All changes logged immutably
4. **Secure defaults**: All tables RLS-enabled from creation
5. **JWT validation**: Always verify signatures, not just cookies
6. **Private storage**: No public buckets, proxy endpoints for access
7. **Path-based policies**: Users only access their assigned resources

Apply these templates consistently across all new features.
