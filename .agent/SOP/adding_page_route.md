# SOP: Adding a New Page Route

## Overview

This document describes how to add a new page route in ClaimTech using SvelteKit's file-based routing system.

---

## SvelteKit Routing Basics

SvelteKit uses **file-based routing**: the file structure in `src/routes/` determines the URL structure.

### Route Types

1. **Page Routes**: `+page.svelte` - Renders a page
2. **Server Load**: `+page.server.ts` - Fetches data on the server
3. **Client Load**: `+page.ts` - Fetches data on the client
4. **Layouts**: `+layout.svelte` - Shared UI wrapper for routes
5. **Server Layouts**: `+layout.server.ts` - Shared server-side data loading
6. **API Routes**: `+server.ts` - API endpoints

### Route Groups

Routes can be grouped using parentheses:
- `(app)` - Protected routes requiring authentication
- `(public)` - Public routes

---

## Step-by-Step Guide

### 1. Determine Route Structure

Decide where your page fits in the application:

**Examples:**
- Dashboard: `/dashboard` → `src/routes/(app)/dashboard/+page.svelte`
- Client detail: `/clients/[id]` → `src/routes/(app)/clients/[id]/+page.svelte`
- New request: `/requests/new` → `src/routes/(app)/requests/new/+page.svelte`
- API endpoint: `/api/generate-report` → `src/routes/api/generate-report/+server.ts`

---

### 2. Create Route Directory

Create the directory structure for your route:

```bash
# Example: Adding a new "reports" page
mkdir -p src/routes/\(app\)/reports
```

---

### 3. Create Page Component (`+page.svelte`)

Create a Svelte component for your page:

```bash
touch src/routes/\(app\)/reports/+page.svelte
```

**Basic Template:**

```svelte
<script lang="ts">
  import type { PageData } from './$types'

  // Props passed from +page.server.ts
  let { data }: { data: PageData } = $props()

  // Component state using Svelte 5 runes
  let searchQuery = $state('')

  // Derived state
  let filteredReports = $derived(
    data.reports.filter(r => r.name.includes(searchQuery))
  )
</script>

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">Reports</h1>

  <input
    type="text"
    bind:value={searchQuery}
    placeholder="Search reports..."
    class="mb-4 px-4 py-2 border rounded"
  />

  <div class="grid gap-4">
    {#each filteredReports as report}
      <div class="border p-4 rounded">
        <h2>{report.name}</h2>
        <p>{report.description}</p>
      </div>
    {/each}
  </div>
</div>
```

---

### 4. Create Server Load Function (`+page.server.ts`)

Create a server-side load function to fetch data:

```bash
touch src/routes/\(app\)/reports/+page.server.ts
```

**Template:**

```typescript
import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals, params }) => {
  const { supabase } = locals

  // Fetch data from database
  const { data: reports, error: fetchError } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (fetchError) {
    throw error(500, 'Failed to load reports')
  }

  return {
    reports: reports ?? []
  }
}
```

**With Actions (for form submissions):**

```typescript
import type { PageServerLoad, Actions } from './$types'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals }) => {
  // Load data...
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData()
    const name = formData.get('name')?.toString()

    if (!name) {
      return fail(400, { error: 'Name is required' })
    }

    const { error: insertError } = await locals.supabase
      .from('reports')
      .insert({ name })

    if (insertError) {
      return fail(500, { error: 'Failed to create report' })
    }

    throw redirect(303, '/reports')
  }
}
```

---

### 5. Using Route Parameters

For dynamic routes (e.g., `/clients/[id]`):

**Directory Structure:**
```
src/routes/(app)/clients/[id]/
  +page.svelte
  +page.server.ts
```

**+page.server.ts:**
```typescript
import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals, params }) => {
  const { id } = params

  const { data: client, error: fetchError } = await locals.supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !client) {
    throw error(404, 'Client not found')
  }

  return { client }
}
```

**+page.svelte:**
```svelte
<script lang="ts">
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<h1>{data.client.name}</h1>
<p>{data.client.email}</p>
```

---

### 6. Add Navigation Link

Update the navigation to include your new page.

**Example: Update `src/routes/(app)/+layout.svelte`:**

```svelte
<nav class="flex gap-4">
  <a href="/dashboard">Dashboard</a>
  <a href="/requests">Requests</a>
  <a href="/clients">Clients</a>
  <a href="/reports">Reports</a> <!-- New link -->
</nav>
```

---

### 7. Using Services for Data Fetching

Follow the service layer pattern:

**Create a service (if needed):**

```typescript
// src/lib/services/report.service.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database'

type ReportRow = Database['public']['Tables']['reports']['Row']

export async function getReports(supabase: SupabaseClient<Database>) {
  return await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function getReport(supabase: SupabaseClient<Database>, id: string) {
  return await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()
}

export async function createReport(
  supabase: SupabaseClient<Database>,
  report: Database['public']['Tables']['reports']['Insert']
) {
  return await supabase
    .from('reports')
    .insert(report)
    .select()
    .single()
}
```

**Use in +page.server.ts:**

```typescript
import { getReports } from '$lib/services/report.service'

export const load: PageServerLoad = async ({ locals }) => {
  const { data: reports, error } = await getReports(locals.supabase)

  if (error) {
    throw error(500, 'Failed to load reports')
  }

  return { reports }
}
```

---

## Common Page Patterns

### 1. List Page (e.g., `/clients`)

**Structure:**
```
src/routes/(app)/clients/
  +page.svelte          # List view
  +page.server.ts       # Load all clients
  [id]/
    +page.svelte        # Detail view
    +page.server.ts     # Load single client
```

**+page.server.ts:**
```typescript
export const load: PageServerLoad = async ({ locals }) => {
  const { data: clients, error } = await locals.supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error(500, 'Failed to load clients')

  return { clients: clients ?? [] }
}
```

**+page.svelte:**
```svelte
<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<div class="container">
  <h1>Clients</h1>

  <div class="grid gap-4">
    {#each data.clients as client}
      <a href="/clients/{client.id}" class="card">
        <h2>{client.name}</h2>
        <Badge>{client.type}</Badge>
      </a>
    {/each}
  </div>
</div>
```

---

### 2. Detail Page (e.g., `/clients/[id]`)

**+page.server.ts:**
```typescript
export const load: PageServerLoad = async ({ params, locals }) => {
  const { data: client, error } = await locals.supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !client) {
    throw error(404, 'Client not found')
  }

  return { client }
}
```

---

### 3. Form Page (e.g., `/clients/new`)

**+page.server.ts:**
```typescript
export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()

    const client = {
      name: formData.get('name')?.toString(),
      email: formData.get('email')?.toString(),
      type: formData.get('type')?.toString()
    }

    // Validation
    if (!client.name || !client.email) {
      return fail(400, { error: 'Name and email are required' })
    }

    // Insert
    const { error: insertError } = await locals.supabase
      .from('clients')
      .insert(client)

    if (insertError) {
      return fail(500, { error: 'Failed to create client' })
    }

    // Redirect to list
    throw redirect(303, '/clients')
  }
}
```

**+page.svelte:**
```svelte
<script lang="ts">
  import { enhance } from '$app/forms'
</script>

<form method="POST" use:enhance>
  <label>
    Name:
    <input type="text" name="name" required />
  </label>

  <label>
    Email:
    <input type="email" name="email" required />
  </label>

  <label>
    Type:
    <select name="type" required>
      <option value="insurance">Insurance</option>
      <option value="private">Private</option>
    </select>
  </label>

  <button type="submit">Create Client</button>
</form>
```

---

### 4. Edit Page (e.g., `/clients/[id]/edit`)

**+page.server.ts:**
```typescript
export const load: PageServerLoad = async ({ params, locals }) => {
  const { data: client, error } = await locals.supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !client) {
    throw error(404, 'Client not found')
  }

  return { client }
}

export const actions: Actions = {
  default: async ({ request, params, locals }) => {
    const formData = await request.formData()

    const updates = {
      name: formData.get('name')?.toString(),
      email: formData.get('email')?.toString()
    }

    const { error: updateError } = await locals.supabase
      .from('clients')
      .update(updates)
      .eq('id', params.id)

    if (updateError) {
      return fail(500, { error: 'Failed to update client' })
    }

    throw redirect(303, `/clients/${params.id}`)
  }
}
```

---

## Protected Routes (Authentication)

All routes in `(app)` group are protected by the auth guard in `src/hooks.server.ts`.

To add a public route:
1. Place it outside `(app)` group, or
2. Update `publicRoutes` array in `hooks.server.ts`

**Example: Public landing page**
```
src/routes/
  +page.svelte          # Public landing page
  (app)/
    dashboard/
      +page.svelte      # Protected dashboard
```

---

## API Routes

For API endpoints (e.g., PDF generation):

**Structure:**
```
src/routes/api/generate-report/
  +server.ts
```

**+server.ts:**
```typescript
import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = await request.json()
  const { reportId } = body

  if (!reportId) {
    throw error(400, 'Report ID is required')
  }

  // Process report generation...
  const result = { success: true, url: '...' }

  return json(result)
}

export const GET: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get('id')

  // Fetch and return data...
  return json({ data: [] })
}
```

---

## Best Practices

### 1. Use TypeScript Types

Always import and use generated types:
```typescript
import type { PageData, PageServerLoad } from './$types'
```

### 2. Handle Errors Properly

Use SvelteKit's `error()` helper:
```typescript
import { error } from '@sveltejs/kit'

if (!data) {
  throw error(404, 'Not found')
}
```

### 3. Use Service Layer

Don't write database queries directly in `+page.server.ts`:
```typescript
// Good
import { getClients } from '$lib/services/client.service'
const { data } = await getClients(locals.supabase)

// Bad
const { data } = await locals.supabase.from('clients').select('*')
```

### 4. Use Form Actions for Mutations

Use SvelteKit's form actions instead of API routes for form submissions:
```typescript
export const actions: Actions = {
  create: async ({ request, locals }) => { ... },
  update: async ({ request, locals }) => { ... },
  delete: async ({ request, locals }) => { ... }
}
```

**CRITICAL: Form Actions vs API Routes**

**Use Form Actions (`+page.server.ts`)** when:
- Handling HTML form submissions
- Using `use:enhance` in your Svelte component
- Need progressive enhancement (works without JavaScript)
- Examples: Login, logout, create/update/delete operations

**Use API Routes (`+server.ts`)** when:
- Building JSON API endpoints
- Handling non-form requests (fetch, external services)
- Need different HTTP methods on same endpoint
- Examples: PDF generation, signed URLs, webhooks

**Why this matters:**
- Form actions return `ActionResult` (JSON-serializable) that `use:enhance` can parse
- API routes return HTTP `Response` objects (HTML/redirect)
- Using `+server.ts` with `use:enhance` causes: `JSON.parse: unexpected character at line 1 column 1`

**Example - Login/Logout (CORRECT):**
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

```svelte
<!-- Component using form action -->
<form method="POST" action="/auth/logout" use:enhance>
  <button type="submit">Logout</button>
</form>
```

### 5. Use `enhance` for Progressive Enhancement

Use `enhance` action for better UX:
```svelte
<script>
  import { enhance } from '$app/forms'
</script>

<form method="POST" use:enhance>
  <!-- Form fields -->
</form>
```

### 6. Follow Naming Conventions

- **Components**: PascalCase (e.g., `ClientCard.svelte`)
- **Routes**: kebab-case (e.g., `new-request`)
- **Services**: camelCase with `.service.ts` suffix

---

## Common Pitfalls

### 1. Not Handling Loading States

Always show loading states:
```svelte
{#if !data.clients}
  <p>Loading...</p>
{:else}
  <!-- Content -->
{/if}
```

### 2. Forgetting to Add RLS Policies

If you add a new table, ensure RLS policies exist or queries will fail.

### 3. Not Using `locals.supabase`

Always use `locals.supabase` (respects user session), not `supabaseServer` (service role) for user-facing queries.

### 4. Not Redirecting After Mutations

Always redirect after successful form submission:
```typescript
throw redirect(303, '/clients')
```

### 5. Using +server.ts for Form Submissions

**WRONG:**
```typescript
// src/routes/auth/logout/+server.ts
export const POST: RequestHandler = async ({ locals }) => {
  await locals.supabase.auth.signOut()
  redirect(303, '/auth/login') // Returns HTTP Response
}
```

```svelte
<form method="POST" action="/auth/logout" use:enhance>
  <!-- This will cause JSON.parse error! -->
</form>
```

**CORRECT:**
```typescript
// src/routes/auth/logout/+page.server.ts
export const actions: Actions = {
  default: async ({ locals }) => {
    await locals.supabase.auth.signOut()
    redirect(303, '/auth/login') // Returns ActionResult
  }
}
```

**Why:** `use:enhance` requires form actions that return ActionResult, not API routes that return HTTP Response.

---

## Examples from ClaimTech

### Example 1: Assessment Detail Page

**Route:** `/work/assessments/[appointment_id]`

**Structure:**
```
src/routes/(app)/work/assessments/[appointment_id]/
  +page.svelte
  +page.server.ts
```

**+page.server.ts:**
```typescript
export const load: PageServerLoad = async ({ params, locals }) => {
  const { data: appointment } = await locals.supabase
    .from('appointments')
    .select('*, inspection:inspections(*), request:requests(*)')
    .eq('id', params.appointment_id)
    .single()

  if (!appointment) {
    throw error(404, 'Appointment not found')
  }

  // Load assessment if exists
  const { data: assessment } = await locals.supabase
    .from('assessments')
    .select('*')
    .eq('appointment_id', params.appointment_id)
    .single()

  return {
    appointment,
    assessment
  }
}
```

---

## Related Documentation
- Project Architecture: `../System/project_architecture.md`
- Service Layer Pattern: See services in `src/lib/services/`
