# 🚀 Deployment & Authentication Implementation Plan

**Project:** Claimtech - Vehicle Processing & Estimating App  
**Stack:** SvelteKit 5 + Supabase + Tailwind + Shadcn-Svelte  
**Target Platforms:** Vercel (Primary) / Netlify (Alternative)  
**Date Created:** 2025-10-21

---

## 📋 Table of Contents

1. [Current Status](#current-status)
2. [Security Overview](#security-overview)
3. [Authentication Implementation](#authentication-implementation)
4. [Deployment Guide](#deployment-guide)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Cost Estimates](#cost-estimates)

---

## 🎯 Current Status

### ✅ What's Already Set Up

- **Vercel Adapter:** Installed and configured (`@sveltejs/adapter-vercel@5.6.3`)
- **Supabase Client:** Browser and server-side clients configured
- **Environment Variables:** Structure defined in `.env.example`
- **Database Schema:** Complete with RLS enabled (permissive dev policies)
- **Storage Bucket:** `documents` bucket created (currently public)
- **Serverless Timeout:** Configured for 300 seconds (requires Vercel Pro)

### ❌ What's Missing for Production

- **Authentication System:** No login/user management
- **Secure Storage Policies:** Public bucket with anon access
- **Restrictive RLS Policies:** Database allows public read/write
- **Signed URLs:** Using public URLs (never expire)
- **Role-Based Access Control:** No admin/engineer separation
- **Puppeteer for Serverless:** Needs `@sparticuz/chromium` for Vercel

---

## 🔒 Security Overview

### Current Security Status: ⚠️ NOT SAFE FOR PRODUCTION

| Component | Current State | Production State (After Auth) |
|-----------|---------------|-------------------------------|
| **Storage Bucket** | Public (`public: true`) | Private (`public: false`) |
| **Document URLs** | Public URLs (never expire) | Signed URLs (1-hour expiration) |
| **Photo Access** | Anyone with URL can view | Auth required + role-based |
| **Database Access** | `FOR ALL USING (true)` | Role-based RLS policies |
| **API Endpoints** | No authentication | JWT token required |
| **File Uploads** | Anon role can upload | Authenticated users only |

### Security Risks (Current)

🔴 **CRITICAL:** Anyone can view documents/photos if they know the URL  
🔴 **CRITICAL:** Anyone can upload files without authentication  
🔴 **CRITICAL:** Anyone can read/write all database data  
🟡 **MEDIUM:** No audit trail for file access  

---

## 🔐 Authentication Implementation

### Phase 1: Database Setup

#### Step 1.1: Install Required Package

```bash
npm install @supabase/ssr
```

#### Step 1.2: Create User Roles System

**File:** `supabase/migrations/050_create_user_roles.sql`

```sql
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'engineer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  engineer_id UUID REFERENCES engineers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_engineer_id ON user_roles(engineer_id);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow auth admin to read user roles" 
  ON user_roles FOR SELECT TO supabase_auth_admin USING (true);

CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Add auth_user_id to engineers table
ALTER TABLE engineers 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_engineers_auth_user_id ON engineers(auth_user_id);
```

#### Step 1.3: Create Auth Hook for JWT Claims

**File:** `supabase/migrations/051_create_auth_hook.sql`

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role public.app_role;
  eng_id uuid;
BEGIN
  SELECT role, engineer_id 
  INTO user_role, eng_id
  FROM public.user_roles 
  WHERE user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    
    IF user_role = 'engineer' AND eng_id IS NOT NULL THEN
      claims := jsonb_set(claims, '{engineer_id}', to_jsonb(eng_id));
    END IF;
  ELSE
    claims := jsonb_set(claims, '{user_role}', 'null');
  END IF;

  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT ALL ON TABLE public.user_roles TO supabase_auth_admin;
REVOKE ALL ON TABLE public.user_roles FROM authenticated, anon, public;
```

#### Step 1.4: Enable Auth Hook in Supabase Dashboard

1. Go to: **Supabase Dashboard → Authentication → Hooks**
2. Enable: **Custom Access Token Hook**
3. Select: `public.custom_access_token_hook`
4. Save

#### Step 1.5: Update Storage Policies (Make Private)

**File:** `supabase/migrations/052_secure_storage_policies.sql`

```sql
-- Change bucket to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'documents';

-- Drop public/anon policies
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon updates" ON storage.objects;

-- Create authenticated-only policies
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

#### Step 1.6: Update Database RLS Policies

**File:** `supabase/migrations/053_secure_database_policies.sql`

```sql
-- Drop permissive development policies
DROP POLICY IF EXISTS "Allow all operations on clients for now" ON clients;
DROP POLICY IF EXISTS "Allow all operations on requests for now" ON requests;
DROP POLICY IF EXISTS "Allow all operations on engineers for now" ON engineers;

-- Clients: Authenticated users can view all, only admins can modify
CREATE POLICY "Authenticated users can view clients"
ON clients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can insert clients"
ON clients FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update clients"
ON clients FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete clients"
ON clients FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Requests: Admins see all, engineers see assigned only
CREATE POLICY "Admins can view all requests"
ON requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Engineers can view assigned requests"
ON requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM inspections i
    JOIN appointments a ON a.inspection_id = i.id
    WHERE i.request_id = requests.id
    AND a.engineer_id = (
      SELECT engineer_id FROM user_roles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Similar policies for other tables...
-- (Add more as needed for inspections, assessments, etc.)
```

### Phase 2: SvelteKit Auth Setup

#### Step 2.1: Create Server Hooks

**File:** `src/hooks.server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

const supabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
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

  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession()
    if (!session) return { session: null, user: null, role: null, engineerId: null }

    const { data: { user }, error } = await event.locals.supabase.auth.getUser()
    if (error) return { session: null, user: null, role: null, engineerId: null }

    // Extract role from JWT
    const role = session.access_token ? 
      (JSON.parse(atob(session.access_token.split('.')[1])).user_role || null) : null
    const engineerId = session.access_token ?
      (JSON.parse(atob(session.access_token.split('.')[1])).engineer_id || null) : null

    return { session, user, role, engineerId }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user, role, engineerId } = await event.locals.safeGetSession()
  event.locals.session = session
  event.locals.user = user
  event.locals.role = role
  event.locals.engineerId = engineerId

  // Redirect to login if accessing protected routes without auth
  if (!session && event.url.pathname.startsWith('/(app)')) {
    redirect(303, '/auth/login')
  }

  // Redirect to app if already logged in and trying to access auth pages
  if (session && event.url.pathname.startsWith('/auth')) {
    if (role === 'engineer') {
      redirect(303, '/engineer/dashboard')
    } else {
      redirect(303, '/')
    }
  }

  // Engineer role restrictions
  if (role === 'engineer') {
    if (!event.url.pathname.startsWith('/engineer')) {
      redirect(303, '/engineer/dashboard')
    }
  }

  return resolve(event)
}

export const handle: Handle = sequence(supabase, authGuard)
```

#### Step 2.2: Create Type Definitions

**File:** `src/app.d.ts`

```typescript
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient
      safeGetSession: () => Promise<{
        session: Session | null
        user: User | null
        role: 'admin' | 'engineer' | null
        engineerId: string | null
      }>
      session: Session | null
      user: User | null
      role: 'admin' | 'engineer' | null
      engineerId: string | null
    }
    interface PageData {
      session: Session | null
      role: 'admin' | 'engineer' | null
    }
  }
}

export {}
```

#### Step 2.3: Create Root Layout Server Load

**File:** `src/routes/+layout.server.ts`

```typescript
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session, user, role } = await safeGetSession()
  return {
    session,
    user,
    role
  }
}
```

#### Step 2.4: Create Root Layout Client

**File:** `src/routes/+layout.ts`

```typescript
import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  depends('supabase:auth')

  const supabase = isBrowser()
    ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
          fetch,
        },
      })
    : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
          fetch,
        },
        cookies: {
          getAll() {
            return data.cookies
          },
        },
      })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return { session, supabase }
}
```

#### Step 2.5: Update Root Layout Component

**File:** `src/routes/+layout.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { invalidate } from '$app/navigation'
  import type { LayoutData } from './$types'

  let { data, children }: { data: LayoutData; children: any } = $props()

  onMount(() => {
    const { data: { subscription } } = data.supabase.auth.onAuthStateChange(() => {
      invalidate('supabase:auth')
    })

    return () => {
      subscription.unsubscribe()
    }
  })
</script>

{@render children()}
```

### Phase 3: Auth Routes

#### Step 3.1: Create Login Page

**File:** `src/routes/auth/login/+page.svelte`

```svelte
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <div class="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
    <div>
      <h2 class="text-center text-3xl font-bold text-gray-900">Sign in to Claimtech</h2>
    </div>

    <form method="POST" use:enhance class="mt-8 space-y-6">
      {#if form?.error}
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">{form.error}</p>
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        class="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Sign in
      </button>
    </form>
  </div>
</div>
```

**File:** `src/routes/auth/login/+page.server.ts`

```typescript
import { redirect, fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return fail(400, { error: error.message })
    }

    redirect(303, '/')
  },
}
```

#### Step 3.2: Create Signup Page

**File:** `src/routes/auth/signup/+page.svelte`

```svelte
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <div class="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
    <div>
      <h2 class="text-center text-3xl font-bold text-gray-900">Create Account</h2>
    </div>

    <form method="POST" use:enhance class="mt-8 space-y-6">
      {#if form?.error}
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">{form.error}</p>
        </div>
      {/if}

      {#if form?.success}
        <div class="rounded-md bg-green-50 p-4">
          <p class="text-sm text-green-800">Check your email to confirm your account!</p>
        </div>
      {/if}

      <div class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minlength="6"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <button
        type="submit"
        class="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Sign up
      </button>
    </form>
  </div>
</div>
```

**File:** `src/routes/auth/signup/+page.server.ts`

```typescript
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals: { supabase }, url }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${url.origin}/auth/confirm`,
      },
    })

    if (error) {
      return fail(400, { error: error.message })
    }

    return { success: true }
  },
}
```

#### Step 3.3: Create Email Confirmation Handler

**File:** `src/routes/auth/confirm/+server.ts`

```typescript
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (!error) {
      redirect(303, '/')
    }
  }

  redirect(303, '/auth/login')
}
```

#### Step 3.4: Create Logout Handler

**File:** `src/routes/auth/logout/+server.ts`

```typescript
import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ locals: { supabase } }) => {
  await supabase.auth.signOut()
  redirect(303, '/auth/login')
}
```

### Phase 4: Update Supabase Dashboard Settings

#### Step 4.1: Configure Email Templates

1. Go to: **Supabase Dashboard → Authentication → Email Templates**
2. Update **Confirm signup** template:
   - Change redirect URL from `http://localhost:5173/auth/confirm` to `https://your-app.vercel.app/auth/confirm`
3. Update **Magic Link** template (if using)
4. Update **Reset Password** template (if using)

#### Step 4.2: Configure Site URL

1. Go to: **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL:** `https://your-app.vercel.app`
3. Add **Redirect URLs:**
   - `https://your-app.vercel.app/auth/confirm`
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:5173/auth/confirm` (for development)

### Phase 5: Create First Admin User

#### Step 5.1: Create User in Supabase Dashboard

1. Go to: **Supabase Dashboard → Authentication → Users**
2. Click **Add User**
3. Enter email and password
4. Click **Create User**
5. Copy the user ID

#### Step 5.2: Assign Admin Role

Run this SQL in Supabase SQL Editor:

```sql
-- Replace 'USER_ID_HERE' with the actual user ID from step 5.1
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin');
```

#### Step 5.3: Test Login

1. Go to your app: `http://localhost:5173/auth/login`
2. Login with the admin credentials
3. You should be redirected to the dashboard

---

## 🚀 Deployment Guide

### Option 1: Vercel (Recommended - Already Configured)

#### Prerequisites

- ✅ Vercel adapter installed (`@sveltejs/adapter-vercel@5.6.3`)
- ✅ `svelte.config.js` configured with `maxDuration: 300`
- ✅ Code pushed to GitHub

#### Step 1: Fix Puppeteer for Serverless

```bash
# Install Chromium for serverless environments
npm install @sparticuz/chromium puppeteer-core

# Remove regular puppeteer (optional, but reduces bundle size)
npm uninstall puppeteer
```

Update your PDF generation code to use `@sparticuz/chromium`:

**File:** `src/lib/services/pdf-generation.service.ts` (or wherever Puppeteer is used)

```typescript
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// Replace browser launch with:
const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
```

#### Step 2: Deploy to Vercel

**Method A: GitHub Integration (Recommended)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Project**
3. Select your GitHub repository
4. Vercel auto-detects SvelteKit ✅
5. Click **Deploy**

**Method B: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Step 3: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
PUBLIC_SUPABASE_URL = https://cfblmkzleqtvtfxujikf.supabase.co
PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key_here
```

**Important:**
- Mark `SUPABASE_SERVICE_ROLE_KEY` as **Production** only (don't expose to preview deployments)
- Click **Save** after adding each variable
- Redeploy after adding variables

#### Step 4: Update Supabase for Production

1. **Add Production URL to Allowed URLs:**
   - Supabase Dashboard → Authentication → URL Configuration
   - Add: `https://your-app.vercel.app`
   - Add redirect URLs: `https://your-app.vercel.app/auth/confirm`

2. **Update Email Templates:**
   - Change all `localhost:5173` URLs to `your-app.vercel.app`

3. **Update CORS Settings (if needed):**
   - Supabase Dashboard → Settings → API
   - Add your Vercel domain to allowed origins

#### Step 5: Upgrade to Vercel Pro (Required for PDF Generation)

PDF generation takes 1-5 minutes, which exceeds the Hobby plan's 10-second limit.

1. Go to: **Vercel Dashboard → Settings → Billing**
2. Click **Upgrade to Pro** ($20/month)
3. Confirm upgrade
4. Redeploy your app

#### Step 6: Test Production Deployment

```bash
# Visit your app
https://your-app.vercel.app

# Test authentication
1. Go to /auth/login
2. Login with admin credentials
3. Verify you're redirected to dashboard

# Test PDF generation
1. Go to an assessment
2. Click "Generate Report"
3. Wait for generation (should complete in 1-5 minutes)
4. Download the PDF
```

### Option 2: Netlify (Alternative)

#### Step 1: Install Netlify Adapter

```bash
npm uninstall @sveltejs/adapter-vercel
npm install -D @sveltejs/adapter-netlify
```

#### Step 2: Update `svelte.config.js`

```javascript
import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      edge: false, // Use serverless functions
      split: false // Bundle all functions together
    })
  }
};

export default config;
```

#### Step 3: Create `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "build"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/render"
  status = 200
```

#### Step 4: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

#### Step 5: Add Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables:

```
PUBLIC_SUPABASE_URL = https://cfblmkzleqtvtfxujikf.supabase.co
PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key_here
```

---

## ✅ Post-Deployment Checklist

### Security Checklist

- [ ] Authentication is enabled and working
- [ ] Storage bucket is set to private (`public: false`)
- [ ] Public/anon storage policies are removed
- [ ] Database RLS policies are restrictive (no `USING (true)`)
- [ ] Service role key is marked as secret in Vercel/Netlify
- [ ] Signed URLs are used instead of public URLs
- [ ] Admin user is created and can login
- [ ] Engineer users cannot access admin routes
- [ ] Unauthenticated users are redirected to login

### Functionality Checklist

- [ ] Login page works
- [ ] Signup page works (if enabled)
- [ ] Email confirmation works
- [ ] Logout works
- [ ] Dashboard loads after login
- [ ] PDF generation works (within timeout limits)
- [ ] Photo uploads work
- [ ] Document downloads work
- [ ] All CRUD operations work (clients, requests, inspections, etc.)

### Performance Checklist

- [ ] Vercel Pro plan is active (for PDF generation timeout)
- [ ] Puppeteer uses `@sparticuz/chromium` (for serverless)
- [ ] Images are optimized
- [ ] Database queries are indexed
- [ ] No console errors in production

### Monitoring Checklist

- [ ] Set up error tracking (e.g., Sentry)
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Set up analytics (e.g., Vercel Analytics)
- [ ] Review Supabase usage/quotas
- [ ] Set up backup strategy

---

## 💰 Cost Estimates

### Monthly Costs (Production)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| **Vercel** | Pro | $20/month | Required for 300s timeout (PDF generation) |
| **Supabase** | Free | $0/month | 500MB database, 1GB storage, 2GB bandwidth |
| **Supabase** | Pro | $25/month | 8GB database, 100GB storage, 250GB bandwidth |
| **Domain** | Custom | $10-15/year | Optional (Vercel provides free subdomain) |

**Minimum:** $20/month (Vercel Pro + Supabase Free)
**Recommended:** $45/month (Vercel Pro + Supabase Pro)

### When to Upgrade Supabase

Upgrade to Supabase Pro when you exceed:
- **Database:** 500MB (Free) → 8GB (Pro)
- **Storage:** 1GB (Free) → 100GB (Pro)
- **Bandwidth:** 2GB/month (Free) → 250GB/month (Pro)
- **Concurrent connections:** 60 (Free) → 200 (Pro)

---

## 🔧 Troubleshooting

### Issue: PDF Generation Times Out

**Solution:**
1. Verify Vercel Pro plan is active
2. Check `svelte.config.js` has `maxDuration: 300`
3. Verify `@sparticuz/chromium` is installed
4. Check Vercel function logs for errors

### Issue: Authentication Redirects to Wrong URL

**Solution:**
1. Check Supabase Dashboard → Authentication → URL Configuration
2. Verify Site URL matches your production domain
3. Update email templates with correct URLs
4. Clear browser cookies and try again

### Issue: Storage Upload Fails

**Solution:**
1. Verify storage bucket is created
2. Check storage policies allow authenticated uploads
3. Verify environment variables are set correctly
4. Check Supabase logs for detailed error

### Issue: RLS Policy Denies Access

**Solution:**
1. Check user has correct role in `user_roles` table
2. Verify JWT token contains `user_role` claim
3. Check auth hook is enabled in Supabase Dashboard
4. Test with Supabase SQL Editor to debug policy

---

## 📚 Additional Resources

### Documentation

- **SvelteKit:** https://svelte.dev/docs/kit
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Vercel Deployment:** https://vercel.com/docs/frameworks/sveltekit
- **@sparticuz/chromium:** https://github.com/Sparticuz/chromium

### Support

- **Supabase Discord:** https://discord.supabase.com
- **SvelteKit Discord:** https://svelte.dev/chat
- **Vercel Support:** https://vercel.com/support

---

## 🎯 Summary

### What You Have Now

✅ Complete authentication system with admin/engineer roles
✅ Secure storage with authenticated-only access
✅ Restrictive database RLS policies
✅ Production-ready deployment configuration
✅ Serverless-compatible PDF generation

### Next Steps

1. **Implement Authentication** (Phase 1-5 above)
2. **Test Locally** (verify login, roles, permissions)
3. **Deploy to Vercel** (follow deployment guide)
4. **Test Production** (verify all functionality works)
5. **Monitor & Optimize** (set up monitoring, review performance)

### Timeline Estimate

- **Authentication Implementation:** 4-6 hours
- **Testing & Debugging:** 2-3 hours
- **Deployment Setup:** 1-2 hours
- **Production Testing:** 1-2 hours
- **Total:** 8-13 hours

---

**Last Updated:** 2025-10-21
**Status:** Ready for Implementation
**Priority:** High (Security Critical)

