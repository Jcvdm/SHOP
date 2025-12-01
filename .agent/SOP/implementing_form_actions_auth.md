# SOP: Implementing Form Actions and Authentication

## Overview

This document describes how to correctly implement authentication endpoints and form actions in ClaimTech using SvelteKit. It covers the critical distinction between form actions (`+page.server.ts`) and API routes (`+server.ts`), and how to avoid common pitfalls.

---

## Critical Distinction: Form Actions vs API Routes

### Form Actions (`+page.server.ts`)

**Use for:**
- HTML form submissions
- Authentication operations (login, logout, signup)
- CRUD operations triggered by user forms
- Any endpoint used with `use:enhance`

**Characteristics:**
- Returns `ActionResult` (JSON-serializable object)
- Compatible with SvelteKit's `use:enhance` directive
- Provides progressive enhancement (works without JavaScript)
- Automatically handles redirects correctly
- Type-safe with generated `Actions` type

**Returns:**
```typescript
// ActionResult structure
{
  type: 'success' | 'failure' | 'redirect',
  status?: number,
  data?: any
}
```

### API Routes (`+server.ts`)

**Use for:**
- JSON API endpoints for external consumption
- Operations called via fetch() from client
- Webhooks from external services
- File downloads (PDF, ZIP)
- Endpoints that need different HTTP methods

**Characteristics:**
- Returns HTTP `Response` object
- Returns raw HTTP responses (HTML, JSON, binary)
- Not compatible with `use:enhance`
- Requires manual error handling

**Returns:**
```typescript
// HTTP Response
new Response(body, { status, headers })
```

---

## When to Use Which

### ✅ Use Form Actions When:

1. **Handling HTML forms with `use:enhance`**
```svelte
<form method="POST" action="/auth/login" use:enhance>
  <!-- This REQUIRES a form action -->
</form>
```

2. **Authentication operations**
- Login
- Logout
- Signup
- Password reset

3. **Standard CRUD operations**
- Create client
- Update assessment
- Delete request

### ✅ Use API Routes When:

1. **Building JSON APIs**
```typescript
// External services calling your API
POST /api/generate-report
```

2. **File generation/download**
- PDF generation
- ZIP downloads
- Signed URLs

3. **Webhooks**
- Supabase webhooks
- Payment processor callbacks

4. **Non-form fetch requests**
```typescript
// Client-side fetch
const response = await fetch('/api/data')
```

---

## Implementation Guide

### 1. Implementing Login (Form Action)

**File:** `src/routes/auth/login/+page.server.ts`

```typescript
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

// Optional: Redirect if already logged in
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.session) {
    redirect(303, '/dashboard')
  }
  return {}
}

export const actions: Actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validate input
    if (!email || !password) {
      return fail(400, {
        error: 'Email and password are required',
        email
      })
    }

    // Attempt login
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return fail(400, {
        error: 'Invalid email or password',
        email
      })
    }

    // Success - redirect to dashboard
    redirect(303, '/dashboard')
  }
}
```

**Component:** `src/routes/auth/login/+page.svelte`

```svelte
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()

  let loading = $state(false)
</script>

<div class="max-w-md mx-auto p-6">
  <h1 class="text-2xl font-bold mb-6">Login</h1>

  <form
    method="POST"
    use:enhance={() => {
      loading = true
      return async ({ update }) => {
        await update()
        loading = false
      }
    }}
    class="space-y-4"
  >
    {#if form?.error}
      <div class="bg-red-100 text-red-700 p-3 rounded">
        {form.error}
      </div>
    {/if}

    <div>
      <label for="email" class="block mb-1">Email</label>
      <input
        type="email"
        id="email"
        name="email"
        value={form?.email ?? ''}
        required
        class="w-full px-3 py-2 border rounded"
      />
    </div>

    <div>
      <label for="password" class="block mb-1">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        required
        class="w-full px-3 py-2 border rounded"
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Signing in...' : 'Sign In'}
    </button>
  </form>

  <p class="mt-4 text-center">
    Don't have an account? <a href="/auth/signup" class="text-blue-600">Sign up</a>
  </p>
</div>
```

---

### 2. Implementing Logout (Form Action)

**File:** `src/routes/auth/logout/+page.server.ts`

```typescript
import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ locals: { supabase } }) => {
    await supabase.auth.signOut()
    redirect(303, '/auth/login')
  }
}
```

**Component:** Add to layout or header

```svelte
<script lang="ts">
  import { enhance } from '$app/forms'
  import { LogOut } from 'lucide-svelte'

  let loading = $state(false)
</script>

<form
  method="POST"
  action="/auth/logout"
  use:enhance={() => {
    loading = true
    return async ({ update }) => {
      await update()
      loading = false
    }
  }}
>
  <button
    type="submit"
    disabled={loading}
    class="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
  >
    <LogOut class="h-4 w-4" />
    {loading ? 'Signing out...' : 'Sign out'}
  </button>
</form>
```

---

### 3. Implementing Signup (Form Action)

**File:** `src/routes/auth/signup/+page.server.ts`

```typescript
import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string
    const role = formData.get('role') as 'admin' | 'engineer'

    // Validate input
    if (!email || !password || !fullName || !role) {
      return fail(400, {
        error: 'All fields are required',
        email,
        fullName,
        role
      })
    }

    if (password.length < 8) {
      return fail(400, {
        error: 'Password must be at least 8 characters',
        email,
        fullName,
        role
      })
    }

    // Create user with metadata
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    })

    if (error) {
      return fail(400, {
        error: error.message,
        email,
        fullName,
        role
      })
    }

    // Success - show confirmation message
    return {
      success: true,
      message: 'Check your email for a confirmation link'
    }
  }
}
```

---

### 4. Auth Guard Implementation

**File:** `src/hooks.server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Database } from '$lib/types/database'

const supabase: Handle = async ({ event, resolve }) => {
  // Create Supabase client for this request
  event.locals.supabase = createServerClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, { ...options, path: '/' })
          })
        },
      },
    }
  )

  // Helper to validate JWT and get session
  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()

    if (!session) {
      return { session: null, user: null }
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser()

    if (error) {
      // JWT validation failed
      return { session: null, user: null }
    }

    return { session, user }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

const authGuard: Handle = async ({ event, resolve }) => {
  // Validate session
  const { session, user } = await event.locals.safeGetSession()
  event.locals.session = session
  event.locals.user = user

  // Explicit root route handling
  if (event.url.pathname === '/') {
    redirect(303, session ? '/dashboard' : '/auth/login')
  }

  // Define public routes
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/callback', '/auth/confirm']
  const isPublicRoute = publicRoutes.some(route => event.url.pathname.startsWith(route))

  // Redirect unauthenticated users to login
  if (!session && !isPublicRoute) {
    redirect(303, '/auth/login')
  }

  // Redirect authenticated users away from auth pages
  if (session && isPublicRoute && event.url.pathname !== '/auth/callback' && event.url.pathname !== '/auth/confirm') {
    redirect(303, '/dashboard')
  }

  return resolve(event)
}

export const handle: Handle = sequence(supabase, authGuard)
```

---

### 5. Root Layout Configuration

**File:** `src/routes/+layout.server.ts`

```typescript
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session, user } = await safeGetSession()
  return { session, user }
}
```

**File:** `src/routes/+layout.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Database } from '$lib/types/database'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  depends('supabase:auth')

  const supabase = createBrowserClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { fetch },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { user } = data

  return { session, supabase, user }
}
```

---

## Common Patterns

### 1. Named Form Actions

Use named actions for multiple operations on the same page:

```typescript
export const actions: Actions = {
  login: async ({ request, locals }) => {
    // Login logic
  },

  signup: async ({ request, locals }) => {
    // Signup logic
  }
}
```

```svelte
<form method="POST" action="?/login" use:enhance>
  <!-- Login form -->
</form>

<form method="POST" action="?/signup" use:enhance>
  <!-- Signup form -->
</form>
```

### 2. Returning Data from Actions

Return validation errors or success data:

```typescript
export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string

    if (!email.includes('@')) {
      return fail(400, {
        error: 'Invalid email format',
        email
      })
    }

    // Process...
    return {
      success: true,
      message: 'Email sent successfully'
    }
  }
}
```

### 3. Enhanced Form with Custom Logic

```svelte
<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidate } from '$app/navigation'

  let loading = $state(false)
</script>

<form
  method="POST"
  use:enhance={({ formData }) => {
    // Add extra data before submission
    formData.set('timestamp', new Date().toISOString())
    loading = true

    return async ({ result, update }) => {
      if (result.type === 'success') {
        // Custom success handling
        await invalidate('app:data')
      }

      await update()
      loading = false
    }
  }}
>
  <!-- Form fields -->
</form>
```

---

## Best Practices

### 1. Always Use `safeGetSession()`

**Good:**
```typescript
const { session, user } = await event.locals.safeGetSession()
```

**Bad:**
```typescript
const { data: { session } } = await supabase.auth.getSession()
// ❌ Doesn't validate JWT!
```

**Why:** `safeGetSession()` validates the JWT by calling `getUser()`, preventing invalid/expired sessions.

### 2. Use 303 Redirects After POST

**Good:**
```typescript
redirect(303, '/dashboard')
```

**Bad:**
```typescript
redirect(302, '/dashboard')
```

**Why:** 303 ensures POST → GET redirect, preventing form resubmission.

### 3. Handle Both Success and Error States

```typescript
export const actions: Actions = {
  default: async ({ request, locals }) => {
    try {
      // Operation
      const { error } = await locals.supabase.auth.signIn(/* ... */)

      if (error) {
        return fail(400, { error: error.message })
      }

      redirect(303, '/dashboard')
    } catch (err) {
      return fail(500, { error: 'An unexpected error occurred' })
    }
  }
}
```

### 4. Preserve Form Data on Error

Return user input on validation errors:

```typescript
if (!email) {
  return fail(400, {
    error: 'Email is required',
    email,
    name,
    phone
    // Preserve all non-sensitive fields
  })
}
```

```svelte
<input
  type="email"
  name="email"
  value={form?.email ?? ''}
  required
/>
```

### 5. Single Source of Truth for Auth Redirects

**All auth redirects in `hooks.server.ts`:**
```typescript
// ✅ Centralized auth logic
const authGuard: Handle = async ({ event, resolve }) => {
  // All redirect logic here
}
```

**NOT in page server loads:**
```typescript
// ❌ Don't duplicate redirect logic
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session) {
    redirect(303, '/auth/login') // ❌ Don't do this
  }
}
```

### 6. Session-Only Cookie Configuration (Security-Sensitive Apps)

For applications handling sensitive data (insurance, healthcare) requiring re-authentication after browser closes:

**Pattern: Override Supabase Cookie Options**

**Location:** `src/hooks.server.ts`

```typescript
event.locals.supabase = createServerClient<Database>(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, {
            ...options,
            path: '/',
            maxAge: undefined,   // Remove long expiration
            expires: undefined,  // Make session-only (cleared on browser close)
          })
        })
      },
    },
  }
)
```

**When to use:**
- Insurance/healthcare apps with sensitive data
- Apps requiring session termination on browser close
- Compliance requirements for session management
- When PCI-DSS or HIPAA compliance needed

**Trade-offs:**
- ✅ Better security (no persistent sessions)
- ✅ Compliance with data protection regulations
- ✅ Prevents unauthorized access after browser left open
- ❌ Users must log in again after closing browser
- ❌ No persistent "remember me" functionality (unless explicitly added)
- ❌ Slight UX friction for frequent users

**Verification Steps:**
1. Log in → Check cookies in DevTools (Application → Cookies)
2. Note `sb-` cookies present with session scope
3. Close browser completely → Reopen
4. Navigate to protected route → Expect redirect to login

### 7. Explicit Cookie Cleanup on Logout

Always explicitly delete cookies on logout to prevent session persistence:

**Location:** `src/routes/auth/logout/+page.server.ts`

```typescript
export const actions: Actions = {
  default: async ({ locals: { supabase }, cookies }) => {
    // Sign out with global scope - terminates all sessions
    await supabase.auth.signOut({ scope: 'global' })

    // Explicitly delete all Supabase cookies
    const allCookies = cookies.getAll()
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-')) {
        cookies.delete(cookie.name, { path: '/' })
      }
    })

    redirect(303, '/auth/login')
  }
}
```

**Why explicit deletion:**
- `signOut()` invalidates session server-side but may not delete all cookies
- Old cookies can persist and be reused for authentication
- Explicit deletion ensures complete cleanup
- Critical for security on shared/public computers

### 8. Client-Side Session Invalidation

Invalidate session state on logout to clear client memory:

**Pattern: Use `invalidate()` in form enhancement**

```svelte
<script lang="ts">
  import { enhance } from '$app/forms'
  import { invalidate, invalidateAll } from '$app/navigation'
</script>

<form
  method="POST"
  action="/auth/logout"
  use:enhance={() => {
    return async ({ update }) => {
      // Invalidate all auth-dependent data
      await invalidateAll()
      await invalidate('supabase:auth')

      // Apply form action result (redirect)
      await update()
    }
  }}
>
  <button type="submit">Sign Out</button>
</form>
```

**Why:**
- Clears cached session data from client memory
- Forces re-fetch of all auth-dependent data
- Prevents stale data after logout
- Ensures clean state transition

### 9. Auth State Listener (Real-Time Session Monitoring)

Implement auth state listener in root layout to detect session changes:

**Location:** `src/routes/+layout.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { invalidate } from '$app/navigation'

  let { data } = $props()

  onMount(() => {
    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = data.supabase.auth.onAuthStateChange(
      (event, _session) => {
        // If session changed, reload auth-dependent data
        if (_session?.expires_at !== data.session?.expires_at) {
          invalidate('supabase:auth')
        }
      }
    )

    // Cleanup on unmount
    return () => subscription.unsubscribe()
  })
</script>
```

**When sessions change:**
- User logs out in another tab → Current tab detects and reacts
- JWT expires → App automatically refreshes
- Session revoked server-side → App redirects to login
- Token refresh occurs → App updates with new token

**Benefits:**
- Real-time session synchronization across tabs
- Automatic handling of session expiration
- Better UX during token refresh
- Follows Supabase recommended pattern

---

## Common Pitfalls

### 1. Using `+server.ts` for Forms with `use:enhance`

**WRONG:**
```typescript
// ❌ src/routes/auth/logout/+server.ts
export const POST: RequestHandler = async ({ locals }) => {
  await locals.supabase.auth.signOut()
  redirect(303, '/auth/login')
}
```

```svelte
<form method="POST" action="/auth/logout" use:enhance>
  <!-- ❌ This causes: JSON.parse: unexpected character at line 1 column 1 -->
</form>
```

**CORRECT:**
```typescript
// ✅ src/routes/auth/logout/+page.server.ts
export const actions: Actions = {
  default: async ({ locals }) => {
    await locals.supabase.auth.signOut()
    redirect(303, '/auth/login')
  }
}
```

### 2. Not Handling Loading States

**Bad:**
```svelte
<form method="POST" use:enhance>
  <button type="submit">Submit</button>
</form>
```

**Good:**
```svelte
<script lang="ts">
  let loading = $state(false)
</script>

<form
  method="POST"
  use:enhance={() => {
    loading = true
    return async ({ update }) => {
      await update()
      loading = false
    }
  }}
>
  <button type="submit" disabled={loading}>
    {loading ? 'Submitting...' : 'Submit'}
  </button>
</form>
```

### 3. Forgetting to Validate Input

**Bad:**
```typescript
export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    // ❌ No validation
    await locals.supabase.auth.signIn({ email, password: '...' })
  }
}
```

**Good:**
```typescript
export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string

    // ✅ Validate
    if (!email || !email.includes('@')) {
      return fail(400, { error: 'Invalid email' })
    }

    // Continue...
  }
}
```

### 4. Exposing Sensitive Information in Errors

**Bad:**
```typescript
if (error) {
  return fail(400, { error: error.message })
  // ❌ Might expose internal details
}
```

**Good:**
```typescript
if (error) {
  console.error('Auth error:', error)
  return fail(400, { error: 'Invalid credentials' })
  // ✅ Generic user-facing message
}
```

### 5. Not Using TypeScript Types

**Bad:**
```typescript
export const actions = {
  default: async ({ request, locals }) => {
    // ❌ No type safety
  }
}
```

**Good:**
```typescript
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals }) => {
    // ✅ Full type safety
  }
}
```

---

## Testing Form Actions

### Unit Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { actions } from './+page.server'

describe('login action', () => {
  it('should fail with missing credentials', async () => {
    const formData = new FormData()
    const result = await actions.default({
      request: { formData: () => Promise.resolve(formData) },
      locals: { supabase: mockSupabase }
    })

    expect(result.status).toBe(400)
    expect(result.data.error).toBeTruthy()
  })
})
```

### E2E Testing

```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/auth/login')

  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')

  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
})

test('shows error for invalid credentials', async ({ page }) => {
  await page.goto('/auth/login')

  await page.fill('input[name="email"]', 'wrong@example.com')
  await page.fill('input[name="password"]', 'wrongpass')

  await page.click('button[type="submit"]')

  await expect(page.locator('text=Invalid')).toBeVisible()
})
```

---

## Troubleshooting

### Error: `JSON.parse: unexpected character at line 1 column 1`

**Cause:** Using `+server.ts` with `use:enhance`

**Solution:** Convert to form action in `+page.server.ts`

### Error: `Redirect not allowed`

**Cause:** Trying to redirect from client-side code

**Solution:** Redirects must happen in server-side code (actions, load functions)

### Error: Session not persisting

**Cause:** Cookies not being set correctly

**Solution:** Check `hooks.server.ts` cookie handling:
```typescript
setAll: (cookiesToSet) => {
  cookiesToSet.forEach(({ name, value, options }) => {
    event.cookies.set(name, value, { ...options, path: '/' })
  })
}
```

---

## Common Pitfalls & Solutions

### ❌ CRITICAL: Don't Catch redirect() in try-catch

**Problem:**
`redirect()` throws a `Redirect` object (SvelteKit's control flow mechanism). If caught by try-catch, it appears as an error even though the operation succeeded.

**Wrong ❌:**
```typescript
export const actions: Actions = {
  default: async ({ request, locals }) => {
    try {
      const formData = await request.formData()
      // ... create record ...
      redirect(303, '/success')  // ❌ Gets caught as "error"
    } catch (err) {
      console.error('Error:', err)  // ❌ Shows "Redirect" as error
      return fail(500, { error: 'Failed' })
    }
  }
}
```

**Result:** Console shows `Error: Redirect { status: 303, location: '/success' }` even though everything worked!

**Correct ✅:**
```typescript
export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()

    // Handle errors for each operation individually
    const { data, error } = await locals.supabase.from('table').insert(formData)
    if (error) return fail(500, { error: error.message })

    // Redirect OUTSIDE any try-catch (throws Redirect object)
    redirect(303, `/success/${data.id}`)
  }
}
```

**Key Rules:**
- ✅ `redirect()` must NEVER be inside try-catch
- ✅ Only wrap actual fallible code in try-catch
- ✅ Handle Supabase errors via `if (error)` checks, not exceptions

### ❌ Don't Use getSession() Without JWT Validation

**Problem:**
`getSession()` reads directly from cookies without validating the JWT. This can allow forged sessions.

**Wrong ❌:**
```typescript
const { data: { session } } = await locals.supabase.auth.getSession()  // ❌ INSECURE
```

**Correct ✅:**
```typescript
const { session, user } = await locals.safeGetSession()  // ✅ SECURE: Validates JWT
```

**In layouts:**
```typescript
// +layout.ts (client)
const { session, user } = data  // ✅ Use validated session from parent data
```

---

## Related Documentation

- [Project Architecture - Security & Authentication](../System/project_architecture.md#security--authentication)
- [Adding Page Routes](./adding_page_route.md)
- [Working with Services](./working_with_services.md)
- [Auth Setup Documentation](../Tasks/active/AUTH_SETUP.md)
- [Debugging Auth User Creation Errors](./debugging_auth_user_creation_errors.md)

---

## Quick Reference

### Form Action Template

```typescript
import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const field = formData.get('field') as string

    // Validate
    if (!field) {
      return fail(400, { error: 'Field is required' })
    }

    // Process
    const { error } = await locals.supabase
      .from('table')
      .insert({ field })

    if (error) {
      return fail(500, { error: 'Operation failed' })
    }

    // Success
    redirect(303, '/success')
  }
}
```

### Component Template

```svelte
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
  let loading = $state(false)
</script>

<form
  method="POST"
  use:enhance={() => {
    loading = true
    return async ({ update }) => {
      await update()
      loading = false
    }
  }}
>
  {#if form?.error}
    <div class="error">{form.error}</div>
  {/if}

  <input type="text" name="field" required />

  <button type="submit" disabled={loading}>
    {loading ? 'Processing...' : 'Submit'}
  </button>
</form>
```

---

**Last Updated:** October 25, 2025 (Added redirect() and getSession() pitfalls)
**Applies to:** SvelteKit 2.22.0+, Svelte 5.0+, Supabase Auth
