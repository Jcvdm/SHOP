# SOP: Password Reset Flow

## Overview

This document describes the correct implementation pattern for password reset functionality in ClaimTech using Supabase authentication. It covers both admin-initiated password resets (engineer creation) and user-initiated password resets (forgot password).

**Key principle:** Password reset requires a **two-step flow** - token exchange creates an authenticated session, then the user updates their password in a protected route.

**⚠️ CRITICAL:** SvelteKit SSR requires custom email templates. Default Supabase templates will NOT work!

---

## ⚠️ Prerequisites: Configuration Required

### 1. Email Template Configuration (CRITICAL)

**Default Supabase templates are designed for implicit flow (client-only apps).** SvelteKit uses PKCE flow (SSR), which requires different email link formats.

**If you don't update the email templates, you will see:**
- `error=access_denied`
- `error_code=otp_expired`
- "Email link is invalid or has expired"

### 2. Site URL Configuration (CRITICAL)

**Supabase project must be configured with the correct Site URL.** This is what `{{ .SiteURL }}` in email templates expands to.

**Common issue:**
- Default Site URL: `http://localhost:3000`
- SvelteKit dev server: `http://localhost:5173`
- **Result:** Email links go to wrong port, won't work

**How to check:**
```bash
# Via Supabase Dashboard
Project Settings → Authentication → URL Configuration → Site URL

# Via API
curl -X GET "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/config/auth" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" | grep "site_url"
```

**How to fix:**
```bash
# Via API (recommended)
curl -X PATCH "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/config/auth" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_url": "http://localhost:5173",
    "uri_allow_list": "http://localhost:5173/**"
  }'

# Via Dashboard (alternative)
1. Go to: Project Settings → Authentication → URL Configuration
2. Set "Site URL" to: http://localhost:5173
3. Add to "Redirect URLs": http://localhost:5173/**
4. Save changes
```

**For production:**
- Set Site URL to: `https://yourapp.com`
- Set URI allow list to: `https://yourapp.com/**`

### Required Template Update

**Navigate to:** Supabase Dashboard → Authentication → Email Templates → Reset Password

**Replace the default template with:**

```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password for {{ .SiteURL }}:</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/set-password">
    Reset Password
  </a>
</p>

<p>If you didn't request this, you can safely ignore this email.</p>

<p>This link expires in 1 hour.</p>
```

### Key Template Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `{{ .SiteURL }}` | Your app's base URL | `https://yourapp.com` |
| `{{ .TokenHash }}` | Recovery token for PKCE flow | `abc123...` |
| `{{ .Token }}` | 6-digit OTP (alternative) | `123456` |
| ~~`{{ .ConfirmationURL }}`~~ | ❌ Don't use (implicit flow only) | Goes to Supabase server |

### PKCE vs Implicit Flow

**Implicit Flow** (Default templates):
```html
<!-- Uses ConfirmationURL -->
<a href="{{ .ConfirmationURL }}">Reset</a>

<!-- Generates link that goes to Supabase first -->
https://[project].supabase.co/auth/v1/verify?token=...&redirect_to=yoursite.com
```

**PKCE Flow** (Required for SvelteKit):
```html
<!-- Uses TokenHash -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset</a>

<!-- Generates link that goes directly to your site -->
https://yoursite.com/auth/confirm?token_hash=...&type=recovery
```

### Other Templates to Update

Apply the same `token_hash` pattern to:
- **Confirm Signup** template
- **Magic Link** template
- **Invite User** template (if using)

---

## Architecture Pattern

### The Two-Step Flow

**Step 1: Token Exchange** (Unauthenticated)
- User clicks password reset link with recovery token
- Token is exchanged for authenticated session
- Endpoint: `/auth/confirm` with `type=recovery`

**Step 2: Password Update** (Authenticated)
- User is now logged in with temporary session
- User accesses protected route to set new password
- Endpoint: `/account/set-password`

### Why Two Steps?

1. **Security**: Separates token validation from password update
2. **Clarity**: `/auth/*` = unauthenticated, `/account/*` = authenticated
3. **Best practice**: Matches Supabase official documentation
4. **Maintainability**: No special cases in auth guards

---

## Implementation Guide

### Step 1: Trigger Password Reset Email

**When to use:**
- Admin creates new user account
- User clicks "Forgot password?" on login page
- Admin triggers manual password reset for existing user

**Pattern:**
```typescript
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals: { supabase }, url }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${url.origin}/auth/confirm?type=recovery&next=/account/set-password`
    })

    if (error) {
      console.error('Password reset error:', error)
      // Don't reveal if email exists (security)
      return { success: true }
    }

    return { success: true }
  }
}
```

**Key points:**
- ✅ Use `resetPasswordForEmail()` (not `admin.resetPasswordForEmail()` unless using service role)
- ✅ redirectTo includes `type=recovery` for proper routing
- ✅ redirectTo includes `next` parameter for final destination
- ✅ Don't reveal if email exists or not (security best practice)

### Step 2: Token Exchange Endpoint

**File:** `src/routes/auth/confirm/+server.ts`

**Pattern:**
```typescript
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as 'signup' | 'recovery' | 'email' | null
  const next = url.searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    // Exchange token for authenticated session
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (!error) {
      // Success: User is now authenticated, redirect to next page
      redirect(303, next)
    }
  }

  // Error: Invalid or expired token
  redirect(303, '/auth/auth-code-error')
}
```

**Key points:**
- ✅ Use `verifyOtp()` for token_hash flows (email confirmation, password reset)
- ✅ Creates authenticated session automatically
- ✅ Respects `next` parameter for flexible routing
- ✅ Handles both signup and recovery types

### Step 3: Password Update Page

**File:** `src/routes/account/set-password/+page.server.ts`

**Pattern:**
```typescript
import { redirect, fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // Validate input
    if (!password || !confirmPassword) {
      return fail(400, { error: 'All fields are required' })
    }

    if (password.length < 6) {
      return fail(400, { error: 'Password must be at least 6 characters' })
    }

    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match' })
    }

    // Update password for currently authenticated user
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error('Password update error:', error)
      return fail(400, { error: error.message })
    }

    // Success: Redirect to dashboard
    redirect(303, '/dashboard')
  }
}
```

**File:** `src/routes/account/set-password/+page.svelte`

**Pattern:**
```svelte
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
  let loading = $state(false)
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="text-3xl font-extrabold text-gray-900">Set new password</h2>
      <p class="text-sm text-gray-600">Enter your new password below</p>
    </div>

    <form
      method="POST"
      class="space-y-6"
      use:enhance={() => {
        loading = true
        return async ({ update }) => {
          await update()
          loading = false
        }
      }}
    >
      {#if form?.error}
        <div class="bg-red-50 text-red-800 p-4 rounded">
          {form.error}
        </div>
      {/if}

      <div>
        <label for="password">New Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minlength="6"
          class="w-full px-3 py-2 border rounded"
          placeholder="At least 6 characters"
        />
      </div>

      <div>
        <label for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minlength="6"
          class="w-full px-3 py-2 border rounded"
          placeholder="Re-enter password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full py-2 px-4 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Resetting password...' : 'Reset password'}
      </button>
    </form>
  </div>
</div>
```

**Key points:**
- ✅ This is a **protected route** - user must be authenticated
- ✅ Uses `updateUser()` which requires active session
- ✅ Validates password requirements
- ✅ Confirms password match before submission
- ✅ Redirects to dashboard on success

### Step 4: Hook Configuration

**File:** `src/hooks.server.ts`

**Pattern:**
```typescript
const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession()
  event.locals.session = session
  event.locals.user = user

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/callback',
    '/auth/confirm',
    '/auth/forgot-password'
    // ❌ DO NOT include '/auth/reset-password' or '/account/set-password'
  ]
  const isPublicRoute = publicRoutes.some(route => event.url.pathname.startsWith(route))

  // Redirect unauthenticated users to login
  if (!session && !isPublicRoute) {
    redirect(303, '/auth/login')
  }

  // Redirect authenticated users away from auth pages
  // Exception: callback and confirm pages handle session creation
  if (session && isPublicRoute &&
      event.url.pathname !== '/auth/callback' &&
      event.url.pathname !== '/auth/confirm') {
    redirect(303, '/dashboard')
  }

  return resolve(event)
}
```

**Key points:**
- ✅ Public routes: `/auth/login`, `/auth/callback`, `/auth/confirm`, `/auth/forgot-password`
- ✅ Protected routes: Everything else (including `/account/*`)
- ✅ No special cases needed - architecture handles it naturally

---

## Common Use Cases

### Use Case 1: Admin Creates Engineer

**Scenario:** Admin creates new engineer account, engineer needs to set password

**Implementation:**
```typescript
// In engineer creation action
export const actions: Actions = {
  default: async ({ request, url, locals }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string

    // Generate temporary password
    const tempPassword = crypto.randomUUID()

    // Create user with admin API
    const { data: authData, error: authError } =
      await supabaseServer.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: formData.get('name'),
          role: 'engineer'
        }
      })

    if (authError) {
      return fail(400, { error: authError.message })
    }

    // Create engineer record
    await engineerService.createEngineer({
      email,
      auth_user_id: authData.user.id,
      // ... other fields
    }, locals.supabase)

    // Send password reset email
    await supabaseServer.auth.resetPasswordForEmail(email, {
      redirectTo: `${url.origin}/auth/confirm?type=recovery&next=/account/set-password`
    })

    redirect(303, '/engineers')
  }
}
```

### Use Case 2: User Forgot Password

**Scenario:** Existing user can't remember password

**Implementation:**
```typescript
// src/routes/auth/forgot-password/+page.server.ts
export const actions: Actions = {
  default: async ({ request, locals: { supabase }, url }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string

    if (!email) {
      return fail(400, { error: 'Email is required' })
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${url.origin}/auth/confirm?type=recovery&next=/account/set-password`
    })

    // Always return success (don't reveal if email exists)
    return { success: true }
  }
}
```

### Use Case 3: User Changes Password (Already Logged In)

**Scenario:** Authenticated user wants to change password from settings

**Implementation:**
```typescript
// src/routes/account/change-password/+page.server.ts
export const actions: Actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string

    // Verify current password first
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: locals.user.email,
      password: currentPassword
    })

    if (verifyError) {
      return fail(400, { error: 'Current password is incorrect' })
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return fail(400, { error: error.message })
    }

    return { success: true }
  }
}
```

---

## Route Organization

### `/auth/*` - Unauthenticated Routes

**Purpose:** Authentication flows for unauthenticated users

**Routes:**
- `/auth/login` - Login form
- `/auth/forgot-password` - Request password reset
- `/auth/callback` - OAuth callback handler (PKCE flow)
- `/auth/confirm` - Email confirmation & token exchange

**Access control:**
- ✅ Accessible when **not authenticated**
- ✅ Redirects authenticated users to dashboard

### `/account/*` - Protected Routes

**Purpose:** Account management for authenticated users

**Routes:**
- `/account/set-password` - Set password after recovery
- `/account/change-password` - Change password while logged in
- `/account/profile` - Edit profile information
- `/account/settings` - User preferences

**Access control:**
- ✅ Accessible when **authenticated**
- ✅ Redirects unauthenticated users to login

---

## Security Best Practices

### 1. Don't Reveal Email Existence

**Bad:**
```typescript
if (error?.message === 'User not found') {
  return fail(404, { error: 'No account found with that email' })
}
```

**Good:**
```typescript
// Always return success, don't reveal if email exists
const { error } = await supabase.auth.resetPasswordForEmail(email, options)
return { success: true }
```

### 2. Validate JWT Tokens

**Bad:**
```typescript
const { data: { session } } = await supabase.auth.getSession()
// ❌ Doesn't validate JWT!
```

**Good:**
```typescript
const { session, user } = await locals.safeGetSession()
// ✅ Validates JWT by calling getUser()
```

### 3. Enforce Password Requirements

```typescript
// Minimum requirements
if (password.length < 6) {
  return fail(400, { error: 'Password must be at least 6 characters' })
}

// Recommended: Add more requirements
if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
  return fail(400, {
    error: 'Password must contain uppercase, lowercase, and number'
  })
}
```

### 4. Confirm Password Before Update

```typescript
if (password !== confirmPassword) {
  return fail(400, { error: 'Passwords do not match' })
}
```

### 5. Use HTTPS in Production

```typescript
// Configure Supabase email templates
const redirectTo = `https://yourapp.com/auth/confirm?type=recovery&next=/account/set-password`
// ❌ Never use http:// in production
```

---

## Troubleshooting

### Issue: User Redirected to Dashboard Instead of Password Form

**Symptom:** User clicks reset link but sees dashboard immediately

**Cause:** Password form is in `/auth/*` and hooks redirect authenticated users

**Solution:** Move password form to `/account/set-password` (protected route)

### Issue: "User not authenticated" Error

**Symptom:** `updateUser()` fails with authentication error

**Cause:** Token exchange didn't create session properly

**Solution:**
1. Check `/auth/confirm` calls `verifyOtp()` correctly
2. Verify `type=recovery` is in URL
3. Check token isn't expired (default: 1 hour)

### Issue: Password Reset Email Not Received

**Symptom:** User doesn't receive email after requesting reset

**Cause:** Multiple possibilities

**Solution:**
1. Check Supabase dashboard → Authentication → Email Templates
2. Verify SMTP settings configured
3. Check spam folder
4. Test with known good email address
5. Check Supabase logs for errors

### Issue: Old Reset Link No Longer Works

**Symptom:** 404 error when clicking old password reset links

**Cause:** Changed from `/auth/reset-password` to `/account/set-password`

**Solution:**
1. Create redirect from old URL to new flow
2. Or wait for old tokens to expire (1 hour)
3. Update email templates in Supabase

### Issue: Email Link Uses Wrong Port/Domain ⭐ COMMON

**Symptom:** Email link goes to `http://localhost:3000` instead of `http://localhost:5173`, or wrong domain

**Cause:** Site URL configuration in Supabase project is incorrect

**Solution:**
```bash
# Check current Site URL
curl -X GET "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/config/auth" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" | grep "site_url"

# Update Site URL
curl -X PATCH "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/config/auth" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_url": "http://localhost:5173",
    "uri_allow_list": "http://localhost:5173/**"
  }'
```

**Or via Dashboard:**
1. Go to: Project Settings → Authentication → URL Configuration
2. Set "Site URL" to: `http://localhost:5173` (dev) or `https://yourapp.com` (prod)
3. Add to "Redirect URLs": `http://localhost:5173/**`
4. Save changes

### Issue: "otp_expired" or "access_denied" Error

**Symptom:** Clicking email link shows error: `error_code=otp_expired` or `access_denied`

**Causes:**
1. **Wrong email template format** - Using `{{ .ConfirmationURL }}` instead of `{{ .TokenHash }}`
2. **Token consumed by Supabase server** - Link goes to Supabase first, then redirects

**Solution:**
1. Update email templates to use `{{ .TokenHash }}` pattern (see Prerequisites section above)
2. Verify email link goes directly to your domain, not `*.supabase.co`
3. Check email link format:
   - ✅ Good: `http://localhost:5173/auth/confirm?token_hash=...`
   - ❌ Bad: `https://project.supabase.co/auth/v1/verify?token=pkce_...`

---

## Testing Checklist

### Engineer Creation Flow
- [ ] Admin can create engineer
- [ ] Engineer receives reset email
- [ ] Email link redirects to set-password page
- [ ] Password form is visible
- [ ] Password validation works
- [ ] Password update succeeds
- [ ] User redirected to dashboard
- [ ] User can log in with new password

### Forgot Password Flow
- [ ] User can request password reset
- [ ] User receives reset email
- [ ] Email link works correctly
- [ ] Password form accessible
- [ ] Password update succeeds
- [ ] User can log in with new password

### Security Tests
- [ ] Invalid token shows error
- [ ] Expired token shows error
- [ ] Cannot access set-password without recovery session
- [ ] Password requirements enforced
- [ ] Password confirmation required
- [ ] No email enumeration possible

---

## Related Documentation

- [Implementing Form Actions & Auth](./implementing_form_actions_auth.md)
- [Engineer Registration Implementation](../Tasks/active/engineer_registration_auth.md)
- [Fix Password Reset Flow](../Tasks/active/fix_password_reset_flow.md)
- [Project Architecture - Security & Authentication](../System/project_architecture.md#security--authentication)
- [Supabase Development Skill - Auth Patterns](../../.claude/skills/supabase-development/SECURITY.md)

---

## Quick Reference

### Send Reset Email
```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${url.origin}/auth/confirm?type=recovery&next=/account/set-password`
})
```

### Token Exchange
```typescript
// /auth/confirm endpoint
await supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
```

### Update Password
```typescript
// /account/set-password page
await supabase.auth.updateUser({ password: newPassword })
```

---

**Last Updated:** January 25, 2025
**Applies to:** Supabase Auth, SvelteKit 2.22.0+, Svelte 5.0+
