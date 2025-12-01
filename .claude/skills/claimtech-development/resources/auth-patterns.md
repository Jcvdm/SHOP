# Authentication Patterns - ClaimTech

Production-ready authentication patterns using Supabase Auth with SvelteKit form actions.

---

## Core Principles

### 1. Use Form Actions (NOT API Routes)

**✅ CORRECT: Form actions for auth mutations**

```typescript
// +page.server.ts
export const actions = {
  login: async ({ request, locals }) => {
    const formData = await request.formData();
    const { error } = await locals.supabase.auth.signInWithPassword({...});
    if (error) return fail(400, { error: error.message });
    throw redirect(303, '/dashboard');
  }
};
```

**❌ WRONG: API routes for auth mutations**

```typescript
// ❌ Don't use +server.ts for login/logout
export async function POST({ request, locals }) {
  // This breaks CSRF protection
}
```

### 2. Check Auth in Load Functions

```typescript
export async function load({ locals }) {
  const session = await locals.getSession();
  if (!session) {
    throw redirect(303, '/auth/login');
  }
  return { user: session.user };
}
```

### 3. RLS Protects Data at Database Level

```sql
-- RLS policy ensures even if auth check is bypassed, data is protected
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Authentication Flows

### Login Flow

#### Login Page (+page.svelte)

```svelte
<!-- src/routes/auth/login/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form } = $props<{ form: ActionData }>();
</script>

<div class="login-container">
  <h1>Login</h1>

  <form method="POST" action="?/login" use:enhance>
    <div class="form-group">
      <label for="email">Email</label>
      <input
        type="email"
        id="email"
        name="email"
        required
        autocomplete="email"
      />
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        required
        autocomplete="current-password"
      />
    </div>

    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}

    <button type="submit">Login</button>
  </form>

  <p>
    Don't have an account?
    <a href="/auth/register">Register</a>
  </p>
</div>
```

#### Login Server Actions (+page.server.ts)

```typescript
// src/routes/auth/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect if already logged in
  const session = await locals.getSession();
  if (session) {
    throw redirect(303, '/dashboard');
  }
};

export const actions: Actions = {
  login: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' });
    }

    const { error } = await locals.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);
      return fail(400, { error: error.message });
    }

    // Successful login - redirect to dashboard
    throw redirect(303, '/dashboard');
  }
};
```

### Logout Flow

#### Logout Action (+page.server.ts)

```typescript
// src/routes/auth/logout/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ locals }) => {
    await locals.supabase.auth.signOut();
    throw redirect(303, '/auth/login');
  }
};
```

#### Logout Component

```svelte
<!-- Component for logout button -->
<form method="POST" action="/auth/logout" use:enhance>
  <button type="submit">Logout</button>
</form>
```

### Registration Flow

#### Registration Page (+page.svelte)

```svelte
<!-- src/routes/auth/register/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form } = $props<{ form: ActionData }>();
</script>

<div class="register-container">
  <h1>Register</h1>

  <form method="POST" action="?/register" use:enhance>
    <div class="form-group">
      <label for="email">Email</label>
      <input
        type="email"
        id="email"
        name="email"
        required
      />
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        required
        minlength="8"
      />
    </div>

    <div class="form-group">
      <label for="confirm_password">Confirm Password</label>
      <input
        type="password"
        id="confirm_password"
        name="confirm_password"
        required
      />
    </div>

    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}

    {#if form?.success}
      <p class="success">Registration successful! Check your email to confirm.</p>
    {/if}

    <button type="submit">Register</button>
  </form>

  <p>
    Already have an account?
    <a href="/auth/login">Login</a>
  </p>
</div>
```

#### Registration Server Actions (+page.server.ts)

```typescript
// src/routes/auth/register/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  register: async ({ request, locals, url }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirm_password')?.toString();

    // Validation
    if (!email || !password || !confirmPassword) {
      return fail(400, { error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters' });
    }

    // Register user
    const { error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${url.origin}/auth/callback`
      }
    });

    if (error) {
      console.error('Registration error:', error);
      return fail(400, { error: error.message });
    }

    return { success: true };
  }
};
```

### Email Confirmation Callback

```typescript
// src/routes/auth/callback/+server.ts
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const code = url.searchParams.get('code');

  if (code) {
    await locals.supabase.auth.exchangeCodeForSession(code);
  }

  throw redirect(303, '/dashboard');
};
```

---

## Protected Routes

### Page-Level Protection

```typescript
// src/routes/dashboard/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();

  if (!session) {
    throw redirect(303, '/auth/login');
  }

  // Load user data
  const { data: profile } = await locals.supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return {
    user: session.user,
    profile
  };
};
```

### Layout-Level Protection

```typescript
// src/routes/(protected)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.getSession();

  if (!session) {
    throw redirect(303, '/auth/login');
  }

  return { session };
};
```

### Role-Based Protection

```typescript
// src/routes/admin/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();

  if (!session) {
    throw redirect(303, '/auth/login');
  }

  // Check user role
  const { data: profile } = await locals.supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw error(403, 'Forbidden: Admin access required');
  }

  return { user: session.user };
};
```

### ClaimTech Pattern (Client vs Engineer)

```typescript
// src/routes/assessment/[id]/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = await locals.getSession();

  if (!session) {
    throw redirect(303, '/auth/login');
  }

  // Fetch assessment with request details
  const { data: assessment } = await locals.supabase
    .from('assessments')
    .select(`
      *,
      request:requests(
        id,
        client_id,
        engineer_id
      )
    `)
    .eq('id', params.id)
    .single();

  if (!assessment) {
    throw error(404, 'Assessment not found');
  }

  // Check if user is client or assigned engineer
  const isClient = assessment.request.client_id === session.user.id;
  const isEngineer = assessment.request.engineer_id === session.user.id;

  if (!isClient && !isEngineer) {
    throw error(403, 'Forbidden: You do not have access to this assessment');
  }

  return {
    assessment,
    userRole: isClient ? 'client' : 'engineer'
  };
};
```

---

## RLS Policy Patterns

### User-Owned Resources

```sql
-- Basic user ownership
CREATE POLICY "Users can view own records"
  ON table_name
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
  ON table_name
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
  ON table_name
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
  ON table_name
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Role-Based Policies

```sql
-- Admin can view all, users view own
CREATE POLICY "Admin view all, users view own"
  ON table_name
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert
CREATE POLICY "Only admins can insert"
  ON table_name
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### ClaimTech Client/Engineer Pattern

```sql
-- Requests: client and engineer can view
CREATE POLICY "Client and engineer can view request"
  ON requests
  FOR SELECT
  USING (
    auth.uid() = client_id
    OR auth.uid() = engineer_id
  );

-- Assessments: based on request ownership
CREATE POLICY "Client and engineer can view assessment"
  ON assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE id = request_id
        AND (client_id = auth.uid() OR engineer_id = auth.uid())
    )
  );

-- Only engineer can update assessment
CREATE POLICY "Engineer can update assessment"
  ON assessments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE id = request_id AND engineer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM requests
      WHERE id = request_id AND engineer_id = auth.uid()
    )
  );
```

### Organization-Based Policies

```sql
-- Users in same organization can view
CREATE POLICY "Organization members can view"
  ON table_name
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up1
      JOIN user_profiles up2 ON up1.organization_id = up2.organization_id
      WHERE up1.id = auth.uid()
        AND up2.id = table_name.user_id
    )
  );
```

### Time-Based Policies

```sql
-- Users can only update records created within last hour
CREATE POLICY "Users can update recent records"
  ON table_name
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND created_at > now() - interval '1 hour'
  );
```

### Status-Based Policies

```sql
-- Users cannot update finalized records
CREATE POLICY "Users can update non-finalized records"
  ON assessments
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status != 'finalized'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status != 'finalized'
  );
```

---

## Session Management

### Check Session in Hooks

```typescript
// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => event.cookies.get(key),
        set: (key, value, options) => event.cookies.set(key, value, options),
        remove: (key, options) => event.cookies.delete(key, options)
      }
    }
  );

  event.locals.getSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();
    return session;
  };

  return resolve(event);
};
```

### Session in Client Components

```svelte
<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  let { data } = $props<{ data: PageData }>();

  onMount(() => {
    const {
      data: { subscription }
    } = data.supabase.auth.onAuthStateChange(() => {
      invalidate('supabase:auth');
    });

    return () => {
      subscription.unsubscribe();
    };
  });
</script>

{#if data.session}
  <p>Logged in as {data.session.user.email}</p>
{:else}
  <p>Not logged in</p>
{/if}
```

---

## User Profile Pattern

### Create Profile on Registration

```sql
-- Trigger to create user profile after auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Update Profile Action

```typescript
// src/routes/profile/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();

  const { data: profile } = await locals.supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session!.user.id)
    .single();

  return { profile };
};

export const actions: Actions = {
  update: async ({ request, locals }) => {
    const session = await locals.getSession();
    const formData = await request.formData();

    const displayName = formData.get('display_name')?.toString();
    const phoneNumber = formData.get('phone_number')?.toString();

    const { error } = await locals.supabase
      .from('user_profiles')
      .update({
        display_name: displayName,
        phone_number: phoneNumber
      })
      .eq('id', session!.user.id);

    if (error) {
      return fail(500, { error: error.message });
    }

    return { success: true };
  }
};
```

---

## Password Reset Flow

### Request Reset Page

```typescript
// src/routes/auth/forgot-password/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();

    if (!email) {
      return fail(400, { error: 'Email is required' });
    }

    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${url.origin}/auth/reset-password`
    });

    if (error) {
      return fail(400, { error: error.message });
    }

    return { success: true };
  }
};
```

### Reset Password Page

```typescript
// src/routes/auth/reset-password/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirm_password')?.toString();

    if (!password || !confirmPassword) {
      return fail(400, { error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match' });
    }

    const { error } = await locals.supabase.auth.updateUser({
      password
    });

    if (error) {
      return fail(400, { error: error.message });
    }

    throw redirect(303, '/dashboard');
  }
};
```

---

## Best Practices

### ✅ DO

1. **Use form actions for auth mutations**
   ```typescript
   export const actions = { login: async ({ ... }) => { ... } };
   ```

2. **Check session in load functions**
   ```typescript
   const session = await locals.getSession();
   if (!session) throw redirect(303, '/auth/login');
   ```

3. **Enable RLS on all tables**
   ```sql
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   ```

4. **Create policies for all operations**
   ```sql
   CREATE POLICY ... FOR SELECT ...
   CREATE POLICY ... FOR INSERT ...
   CREATE POLICY ... FOR UPDATE ...
   CREATE POLICY ... FOR DELETE ...
   ```

5. **Use role-based access where appropriate**
   ```sql
   EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
   ```

### ❌ DON'T

1. **Don't use API routes for login/logout**
   ```typescript
   // ❌ WRONG
   export async function POST({ ... }) { ... } // in +server.ts
   ```

2. **Don't skip RLS**
   ```sql
   -- ❌ WRONG - table without RLS is publicly accessible
   CREATE TABLE table_name (...);
   ```

3. **Don't check auth only in load functions**
   ```typescript
   // ❌ INSUFFICIENT - RLS must also protect at DB level
   ```

4. **Don't expose user data without RLS**
   ```sql
   -- ❌ WRONG - no policies means no access (but RLS must be enabled)
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   -- Missing: CREATE POLICY ...
   ```

---

**Reference**: See `.agent/SOP/implementing_form_actions_auth.md` for ClaimTech auth patterns
