# Fix Engineer Creation False Error & getSession() Warnings

**Status:** Active
**Priority:** High
**Created:** October 25, 2025

## Problem Statement

Two issues discovered during engineer creation testing:

### Issue 1: "Error creating engineer" - False Error (CRITICAL)
- **Symptom:** Console shows `Error creating engineer: Redirect { status: 303, location: '/engineers/55e8f159-...' }`
- **Reality:** Engineer IS created successfully, redirect works, but error appears in console
- **User Impact:** Confusing error message despite successful operation
- **Root Cause:** `redirect()` throws a `Redirect` object (SvelteKit pattern), but try-catch block catches it as an error

### Issue 2: getSession() Security Warnings (4x)
- **Symptom:** 4 identical warnings about using `getSession()` being insecure
- **Warning Text:** "Using the user object as returned from supabase.auth.getSession() could be insecure! Use supabase.auth.getUser() instead"
- **User Impact:** Console noise, misleading security warnings
- **Root Cause:** `src/routes/+layout.ts` line 26 calls `getSession()` directly
- **Note:** Actually safe in this context because:
  - Client-side getSession() is safe
  - Server-side already uses safeGetSession()
  - But warning appears due to SSR hydration

## Technical Analysis

### Issue 1: Redirect Handling

**Current Code (src/routes/(app)/engineers/new/+page.server.ts:69-74):**
```typescript
try {
  // ... create auth user ...
  // ... create engineer record ...
  // ... send password reset email ...

  redirect(303, `/engineers/${engineer.id}`);  // ❌ Throws Redirect object
} catch (err) {
  console.error('Error creating engineer:', err);  // ❌ Catches the Redirect!
  return fail(500, { error: '...' });
}
```

**Why this happens:**
- SvelteKit's `redirect()` function throws a `Redirect` object (not an Error)
- This is by design - it's how SvelteKit handles redirects in actions
- The try-catch block catches the Redirect object as if it were an error
- Engineer is successfully created, redirect works, but console shows error

**Solution:**
Move redirect outside try-catch:
```typescript
try {
  // ... create auth user ...
  // ... create engineer record ...
  // ... send password reset email ...

  // Return engineer ID (don't redirect here)
  return { success: true, engineerId: engineer.id };
} catch (err) {
  console.error('Error creating engineer:', err);
  return fail(500, { error: '...' });
}

// Redirect happens after try-catch (won't be caught)
// But this doesn't work either because we need the engineerId...

// BETTER: Don't use try-catch for the entire flow
```

Actually, the better pattern is:
```typescript
// Create variables to hold results
let authData;
let engineer;

// Create auth user
const authResult = await supabaseServer.auth.admin.createUser({...});
if (authResult.error) {
  return fail(400, { error: `...${authResult.error.message}` });
}
authData = authResult.data;

// Create engineer (in try-catch only for this part)
try {
  engineer = await engineerService.createEngineer(engineerData, locals.supabase);
} catch (err) {
  return fail(500, { error: '...' });
}

// Send password reset
const resetResult = await supabaseServer.auth.resetPasswordForEmail(email, {...});
if (resetResult.error) {
  console.error('Error sending password reset:', resetResult.error);
}

// Redirect (NOT in try-catch)
redirect(303, `/engineers/${engineer.id}`);
```

### Issue 2: getSession() Warnings

**Current Code (src/routes/+layout.ts:24-26):**
```typescript
const {
  data: { session },
} = await supabase.auth.getSession()
```

**Why this happens:**
- Supabase warns when using `getSession()` because it doesn't validate JWT
- However, the comment in the code explains this IS safe here
- The warning appears during SSR/hydration
- Appears 4x because layout reloads during form submission flow

**Solution:**
Use session from parent data instead:
```typescript
const { session: serverSession } = data
const session = serverSession

// OR just destructure directly:
const { session, user } = data
return { session, supabase, user }
```

The session is already validated by server's `safeGetSession()` and passed via data.

## Implementation Plan

### Step 1: Fix Engineer Creation False Error
**File:** `src/routes/(app)/engineers/new/+page.server.ts`

**Changes:**
1. Remove outer try-catch block
2. Handle each async operation individually with proper error checking
3. Keep redirect outside any error handling
4. Use Supabase's error returns instead of exceptions

**Pattern:**
```typescript
// Auth user creation
const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({...});
if (authError) return fail(400, { error: `...` });

// Engineer creation
const { data: engineer, error: engineerError } = await engineerService.createEngineer(...);
if (engineerError) return fail(500, { error: `...` });

// Password reset (optional - don't fail)
await supabaseServer.auth.resetPasswordForEmail(...);

// Redirect (throws Redirect, not caught)
redirect(303, `/engineers/${engineer.id}`);
```

### Step 2: Fix getSession() Warnings
**File:** `src/routes/+layout.ts`

**Changes:**
1. Remove `await supabase.auth.getSession()` call
2. Use `session` from parent `data` (already validated by server)
3. Update return to use data values

**Pattern:**
```typescript
export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  depends('supabase:auth')

  const supabase = createBrowserClient(...)

  // Use session from server data (already validated)
  const { session, user } = data

  return { session, supabase, user }
}
```

### Step 3: Test
1. Create new engineer
2. Verify no console errors
3. Verify redirect works
4. Verify no getSession() warnings
5. Verify engineer is created successfully

## Files to Modify

1. **src/routes/(app)/engineers/new/+page.server.ts**
   - Remove try-catch around entire flow
   - Handle errors individually
   - Keep redirect outside error handling

2. **src/routes/+layout.ts**
   - Remove getSession() call
   - Use session from data

## Success Criteria

- ✅ Engineer creation works without console errors
- ✅ Redirect happens successfully
- ✅ No "Error creating engineer: Redirect" message
- ✅ No getSession() security warnings
- ✅ All functionality preserved

## Testing Checklist

- [ ] Create engineer as admin
- [ ] Verify engineer created in database
- [ ] Verify redirect to engineer detail page
- [ ] Check console - no errors
- [ ] Check console - no getSession() warnings
- [ ] Verify password reset email sent
- [ ] Test engineer can login with reset password

## Documentation Updates

After implementation:
- Update `.agent/SOP/implementing_form_actions_auth.md` with redirect pattern
- Add note about getSession() in layout.ts to documentation
- Update README.md Recent Updates section

## Related Issues

- Engineer creation (migration 065) - FIXED
- getSession() warnings in API endpoints (migration 064) - FIXED
- This completes the engineer workflow implementation

## Notes

- `redirect()` is NOT an error - it's SvelteKit's control flow mechanism
- Never wrap `redirect()` in try-catch in form actions
- Client-side `getSession()` is safe when session comes from validated server data
