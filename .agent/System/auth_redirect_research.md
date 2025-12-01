# SvelteKit Authentication Redirect Patterns - Research Report

**Research Date:** January 25, 2025
**Context:** ClaimTech authentication implementation troubleshooting
**SvelteKit Version:** 2.22.0 (current in project)

---

## Executive Summary

This research addresses authentication redirect issues in the ClaimTech application, specifically:
1. JSON.parse errors during logout with `use:enhance`
2. Root route redirect behavior after server restart
3. Conflict between hooks.server.ts and page.server.ts redirect logic

**Key Finding:** The current logout implementation uses a `+server.ts` POST handler instead of a form action, which causes `use:enhance` to fail when processing redirects. The root cause is that `use:enhance` expects form action responses to be JSON-formatted ActionResults, but POST handlers in `+server.ts` files return standard HTTP responses.

---

## 1. SvelteKit Form Actions and Redirects

### How Form Actions Should Work

Form actions are defined in `+page.server.ts` files and are the **recommended way** to handle form submissions in SvelteKit:

```typescript
// CORRECT PATTERN: +page.server.ts
import { redirect, fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  logout: async ({ locals: { supabase } }) => {
    await supabase.auth.signOut()
    redirect(303, '/auth/login')
  }
}
```

### Form Actions vs POST Handlers (+server.ts)

| Feature | Form Actions (+page.server.ts) | POST Handlers (+server.ts) |
|---------|-------------------------------|---------------------------|
| **Purpose** | Handle form submissions | Expose API endpoints (JSON API) |
| **Progressive Enhancement** | Built-in support | Not designed for forms |
| **use:enhance Support** | Native support | Not compatible |
| **Response Format** | ActionResult (JSON) | HTTP Response |
| **Best For** | User-facing forms | API integrations |

**Current Issue:** The logout endpoint is implemented as a POST handler in `/auth/logout/+server.ts`, which is incompatible with `use:enhance`.

---

## 2. JSON.parse Errors with Redirects

### Root Cause

When `use:enhance` is used with a form posting to a `+server.ts` POST handler (not a form action):

1. `use:enhance` expects the response to be JSON-formatted ActionResult
2. The POST handler returns an HTTP redirect (HTML response)
3. `use:enhance` tries to parse the HTML as JSON
4. **Error:** `JSON.parse: unexpected character at line 1 column 1`

### Why This Happens

From the SvelteKit GitHub issues (#10855):

> "An unhelpful error message presents when using a form with `use:enhance` posting to an ordinary POST endpoint instead of a SvelteKit action. This occurs because the enhance action tries to parse the fetch response body as JSON."

### The Fix

**Option 1: Convert to Form Action** (Recommended)

Move logout logic from `+server.ts` to form action in `+page.server.ts`:

```typescript
// src/routes/auth/logout/+page.server.ts
import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ locals: { supabase } }) => {
    await supabase.auth.signOut()
    redirect(303, '/auth/login')
  }
}
```

**Option 2: Remove use:enhance** (Not Recommended)

Remove `use:enhance` from the logout form, but this loses progressive enhancement benefits.

---

## 3. How use:enhance Handles Redirects

### Normal Behavior (Form Actions)

When used with proper form actions, `use:enhance`:

1. Intercepts form submission
2. Makes fetch request to the action endpoint
3. Expects JSON response in ActionResult format
4. On redirect: Calls `goto()` for client-side navigation (no full page reload)
5. On error/validation failure: Updates `form` prop with error data

### Code Example

```typescript
use:enhance={() => {
  return async ({ result, update }) => {
    // result.type can be: 'success', 'failure', 'redirect', 'error'

    if (result.type === 'redirect') {
      // SvelteKit automatically calls goto(result.location)
    }

    await update(); // Updates form prop and re-renders
  };
}}
```

### What use:enhance Does NOT Handle

- Redirects from `+server.ts` POST handlers
- Non-JSON responses
- Redirects thrown in hooks.server.ts (fixed in SvelteKit 2.0+)

---

## 4. Redirects from hooks.server.ts

### The Historical Issue

In earlier SvelteKit versions, throwing `redirect()` from `hooks.server.ts` during a form action caused issues:

**From GitHub Issue #9555:**

> "When you throw a redirect from inside the `handle()` hook, SvelteKit doesn't 'know' that it's a form action and doesn't return the redirect information in a format that the client JavaScript understands. Instead, the client tries to parse the route (which has been returned as HTML) as JSON, and fails."

### The Workaround (Pre-Fix)

```typescript
const javascriptFormSubmission =
  event.request.headers.get('x-sveltekit-action') === 'true';

if (javascriptFormSubmission) {
  return new Response(JSON.stringify({
    type: 'redirect',
    status: 303,
    location: '/login'
  }), {
    headers: { 'content-type': 'application/json' }
  });
} else {
  redirect(303, '/login');
}
```

### Current Status (SvelteKit 2.22.0)

This issue was **fixed in PR #9658** and is included in SvelteKit 2.0+. The ClaimTech project uses version 2.22.0, so:

**Redirects from hooks.server.ts now work correctly with form actions and use:enhance.**

You can safely throw `redirect()` from `authGuard` in `hooks.server.ts` when handling form actions.

---

## 5. Root Route Authentication Patterns

### Current Implementation Analysis

**File: `src/routes/+page.server.ts`**
```typescript
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.session) {
    redirect(303, '/dashboard');
  }
  redirect(303, '/auth/login');
};
```

**File: `src/hooks.server.ts`**
```typescript
const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession()

  if (!session && !isPublicRoute) {
    redirect(303, '/auth/login')
  }

  if (session && isPublicRoute) {
    redirect(303, '/dashboard')
  }

  return resolve(event)
}
```

### The Problem: Redundant Logic

The root route (`/`) is being handled by **both**:
1. `hooks.server.ts` authGuard
2. `+page.server.ts` load function

This creates redundant redirects and potential race conditions.

### Execution Order

1. **hooks.server.ts** runs FIRST (before all load functions and form actions)
2. **+page.server.ts** runs SECOND (if not already redirected)

### Best Practice: Single Source of Truth

**Recommendation from research:**

> "Using `hooks.server.ts` for route protection is the current recommended solution for protecting routes in SvelteKit. The handle function in hooks.server.ts runs before all the load functions or even the form actions."

**Implementation Strategy:**

```typescript
// hooks.server.ts - Handle all auth redirects
const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession()

  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/callback', '/auth/confirm']
  const isPublicRoute = publicRoutes.some(route => event.url.pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes
  if (!session && !isPublicRoute) {
    redirect(303, '/auth/login')
  }

  // Redirect authenticated users from auth pages
  if (session && isPublicRoute && !event.url.pathname.includes('/callback') && !event.url.pathname.includes('/confirm')) {
    redirect(303, '/dashboard')
  }

  // Handle root route in hooks
  if (session && event.url.pathname === '/') {
    redirect(303, '/dashboard')
  }

  if (!session && event.url.pathname === '/') {
    redirect(303, '/auth/login')
  }

  return resolve(event)
}
```

```typescript
// src/routes/+page.server.ts - Remove redundant logic
// Option 1: Delete this file entirely (let hooks handle it)

// Option 2: Keep minimal load for data if needed
export const load: PageServerLoad = async () => {
  // Root route redirects are handled by hooks.server.ts
  // This load function won't be reached due to redirect in hooks
  return {}
}
```

---

## 6. Supabase SSR Logout Patterns

### Official Supabase + SvelteKit Pattern

From Supabase documentation:

```typescript
// Form action pattern (recommended)
export const actions: Actions = {
  logout: async ({ locals: { supabase } }) => {
    await supabase.auth.signOut()
    redirect(303, '/auth/login')
  }
}
```

### What signOut() Does

1. Clears user session from Supabase
2. Removes auth cookies
3. Removes tokens from localStorage (client-side)
4. Invalidates JWT

### Post-Logout Redirect

**Best Practice:**
- Always redirect after logout (to `/auth/login` or `/`)
- Use status code `303` to ensure POST converts to GET
- Handle redirect in server-side action (not client)

### Common Pitfalls

1. **Not redirecting after logout** - User stays on protected page
2. **Using 307 instead of 303** - Browser maintains POST method on redirect
3. **Using +server.ts instead of form action** - Breaks use:enhance
4. **Catching redirect errors** - Accidentally swallowing redirect throws

---

## 7. Redirect Status Codes

### Which Status Code to Use

| Code | Method Handling | Use Case |
|------|-----------------|----------|
| **303** | POST → GET | **Form submissions** (recommended) |
| 307 | Preserves method | Temporary redirects (maintains POST) |
| 308 | Preserves method | Permanent redirects (maintains POST) |

**From SvelteKit docs:**

> "303 — for form actions, following a successful submission"

### Why 303 Matters

When you use `redirect(307, '/login')`:
- Browser redirects using POST method
- `/login` receives POST request
- If `/login` only has GET handler → **405 Method Not Allowed**

When you use `redirect(303, '/login')`:
- Browser redirects using GET method
- `/login` receives GET request
- Works correctly ✓

---

## 8. Complete Solution for ClaimTech

### Issue Summary

| Issue | Root Cause | Solution |
|-------|------------|----------|
| JSON.parse error on logout | `/auth/logout/+server.ts` POST handler with `use:enhance` | Convert to form action in `+page.server.ts` |
| Root route doesn't load login | Redundant redirect logic | Centralize in `hooks.server.ts` |
| Dev server restart confusion | Root route logic conflict | Remove `+page.server.ts` redirect |

### Recommended Changes

**1. Convert Logout to Form Action**

Delete: `src/routes/auth/logout/+server.ts`

Create: `src/routes/auth/logout/+page.server.ts`
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

**2. Update Logout Forms (No Changes Needed)**

The existing forms already use the correct pattern:
```svelte
<form method="POST" action="/auth/logout" use:enhance>
  <button type="submit">Sign Out</button>
</form>
```

This will work automatically once the form action exists.

**3. Simplify Root Route**

Option A - Delete entirely:
```bash
# Remove the file
rm src/routes/+page.server.ts
```

Option B - Keep minimal version:
```typescript
// src/routes/+page.server.ts
export const load = async () => {
  // Redirects handled by hooks.server.ts
  return {}
}
```

**4. Enhance hooks.server.ts (Optional)**

Add explicit root route handling if needed:
```typescript
// Add to authGuard in hooks.server.ts
if (event.url.pathname === '/') {
  redirect(303, session ? '/dashboard' : '/auth/login')
}
```

---

## 9. Testing Recommendations

### Test Cases

After implementing fixes, verify:

1. **Logout from header menu**
   - Click "Sign Out" in user menu
   - Should redirect to `/auth/login`
   - No JSON.parse errors
   - Session cleared

2. **Logout from sidebar**
   - Click "Sign Out" in sidebar
   - Should redirect to `/auth/login`
   - No JSON.parse errors
   - Session cleared

3. **Root route when logged in**
   - Navigate to `/`
   - Should redirect to `/dashboard`

4. **Root route when logged out**
   - Clear session
   - Navigate to `/`
   - Should redirect to `/auth/login`

5. **Dev server restart**
   - Stop dev server
   - Start dev server
   - Navigate to `localhost:5173`
   - Should redirect to `/auth/login` (no session)

6. **Protected route access**
   - Log out
   - Try to access `/dashboard`
   - Should redirect to `/auth/login`

7. **Auth page access when logged in**
   - Log in
   - Try to access `/auth/login`
   - Should redirect to `/dashboard`

---

## 10. Common Pitfalls and Solutions

### Pitfall 1: Mixing +server.ts and Form Actions

**Problem:** Using `+server.ts` POST handlers with `use:enhance`

**Solution:** Always use form actions in `+page.server.ts` for form submissions

### Pitfall 2: Wrong Redirect Status Code

**Problem:** Using 307/308 for form redirects causes method mismatch

**Solution:** Always use 303 for post-form-submission redirects

### Pitfall 3: Catching Redirect Errors

**Problem:** Try-catch blocks swallow redirect throws

**Solution:** Re-throw after catching:
```typescript
try {
  // ... logic
} catch (err) {
  // Check if it's a redirect or error
  if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
    throw err; // Re-throw redirects
  }
  // Handle actual errors
}
```

### Pitfall 4: Duplicate Auth Logic

**Problem:** Auth checks in both hooks and page loads

**Solution:** Centralize auth guards in `hooks.server.ts`

### Pitfall 5: Not Awaiting signOut()

**Problem:** Redirecting before signOut completes

**Solution:** Always await:
```typescript
await supabase.auth.signOut()
redirect(303, '/auth/login')
```

---

## 11. Additional Resources

### Official Documentation
- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions)
- [SvelteKit Hooks](https://svelte.dev/docs/kit/hooks)
- [Supabase SSR with SvelteKit](https://supabase.com/docs/guides/auth/server-side/sveltekit)

### GitHub Issues
- [#9555 - Form action redirects in handle() hook](https://github.com/sveltejs/kit/issues/9555)
- [#10855 - use:enhance compatibility with non-actions](https://github.com/sveltejs/kit/issues/10855)

### Key Takeaways
1. Use form actions for forms, +server.ts for APIs
2. Use 303 status for post-form redirects
3. Centralize auth in hooks.server.ts
4. SvelteKit 2.0+ handles hook redirects correctly
5. Never mix POST handlers with use:enhance

---

## 12. Implementation Checklist

- [ ] Delete `/auth/logout/+server.ts`
- [ ] Create `/auth/logout/+page.server.ts` with form action
- [ ] Simplify or delete `/+page.server.ts`
- [ ] Test logout from header menu
- [ ] Test logout from sidebar
- [ ] Test root route when logged in
- [ ] Test root route when logged out
- [ ] Test dev server restart behavior
- [ ] Verify no JSON.parse errors
- [ ] Update AUTH_SETUP.md documentation

---

**Report Prepared By:** Claude (Research Context Gatherer Agent)
**For:** ClaimTech Authentication Implementation
**Date:** January 25, 2025
