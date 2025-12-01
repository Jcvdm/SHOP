# SOP: Working with Services

## Overview

ClaimTech uses a **Service Layer Pattern** to abstract all database operations. Services provide a clean, testable, and reusable interface for data access across the application.

---

## Service Architecture

### Location
All services are in `src/lib/services/*.service.ts`

### Naming Convention
- File: `{entity}.service.ts` (e.g., `client.service.ts`)
- Class: `{Entity}Service` (e.g., `ClientService`)
- Methods: `get()`, `create()`, `update()`, `delete()`, `list()`

### Core Principles
1. **Accept optional ServiceClient parameter**: All methods that interact with the database MUST accept `client?: ServiceClient` as the last parameter
2. **Use authenticated client pattern**: `const db = client ?? supabase;` to support both server-side (authenticated) and client-side operations
3. **RLS Authentication**: Always pass `locals.supabase` from server routes to ensure RLS policies can authenticate the user
4. **Return typed data**: Use TypeScript types from database schema
5. **Single responsibility**: Each service handles one entity or domain
6. **Error handling**: Throw descriptive errors with context

---

## Basic Service Structure

### Modern Class-Based Template (RECOMMENDED)

```typescript
// src/lib/services/entity.service.ts
import { supabase } from '$lib/supabase';
import type { Entity, CreateEntityInput, UpdateEntityInput } from '$lib/types/assessment';
import type { ServiceClient } from '$lib/types/service';
import { auditService } from './audit.service';

export class EntityService {
  /**
   * Get all entities with optional filtering
   */
  async list(filters?: { is_active?: boolean }, client?: ServiceClient): Promise<Entity[]> {
    const db = client ?? supabase;
    let query = db
      .from('entities')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing entities:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get single entity by ID
   */
  async get(id: string, client?: ServiceClient): Promise<Entity | null> {
    const db = client ?? supabase;
    const { data, error } = await db
      .from('entities')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching entity:', error);
      return null;
    }

    return data;
  }

  /**
   * Create new entity
   */
  async create(input: CreateEntityInput, client?: ServiceClient): Promise<Entity> {
    const db = client ?? supabase;
    const { data, error } = await db
      .from('entities')
      .insert(input)
      .select()
      .single();

    if (error) {
      console.error('Error creating entity:', error);
      throw new Error(`Failed to create entity: ${error.message}`);
    }

    // Log audit trail
    try {
      await auditService.logChange({
        entity_type: 'entity',
        entity_id: data.id,
        action: 'created',
        metadata: { name: input.name }
      });
    } catch (auditError) {
      console.error('Error logging audit change:', auditError);
    }

    return data;
  }

  /**
   * Update entity
   */
  async update(id: string, input: UpdateEntityInput, client?: ServiceClient): Promise<Entity> {
    const db = client ?? supabase;
    const { data, error } = await db
      .from('entities')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating entity:', error);
      throw new Error(`Failed to update entity: ${error.message}`);
    }

    // Log audit trail
    try {
      await auditService.logChange({
        entity_type: 'entity',
        entity_id: id,
        action: 'updated'
      });
    } catch (auditError) {
      console.error('Error logging audit change:', auditError);
    }

    return data;
  }

  /**
   * Delete entity (soft delete by setting is_active = false)
   */
  async delete(id: string, client?: ServiceClient): Promise<void> {
    const db = client ?? supabase;
    const { error } = await db
      .from('entities')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting entity:', error);
      throw new Error(`Failed to delete entity: ${error.message}`);
    }

    // Log audit trail
    try {
      await auditService.logChange({
        entity_type: 'entity',
        entity_id: id,
        action: 'cancelled'
      });
    } catch (auditError) {
      console.error('Error logging audit change:', auditError);
    }
  }
}

export const entityService = new EntityService();
```

### Key Points

1. **ServiceClient Parameter**: Always add `client?: ServiceClient` as the last parameter
2. **Authenticated Client Pattern**: Use `const db = client ?? supabase;` at the start of each method
3. **Error Handling**: Log errors and throw descriptive messages
4. **Audit Logging**: Log all create/update/delete operations
5. **Return Types**: Always specify return types for type safety

---

## Why ServiceClient Parameter is Critical

### The Problem
Without the `client` parameter, services always use the global `supabase` client which has no authentication context. This causes RLS policies to fail with error 42501:

```
Error: new row violates row-level security policy for table "..."
```

### The Solution
By accepting `client?: ServiceClient` and using `const db = client ?? supabase;`, services can:
- Use `locals.supabase` (authenticated) when called from server routes
- Use the global `supabase` client when called from browser code
- Properly authenticate with RLS policies

### Example: Before vs After

**❌ Before (BROKEN):**
```typescript
async create(input: CreateInput): Promise<Entity> {
  const { data, error } = await supabase  // ❌ Always unauthenticated
    .from('entities')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

**✅ After (CORRECT):**
```typescript
async create(input: CreateInput, client?: ServiceClient): Promise<Entity> {
  const db = client ?? supabase;  // ✅ Use authenticated client if provided
  const { data, error } = await db
    .from('entities')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

---

## Using Services in Routes

### In `+page.server.ts` (ALWAYS pass locals.supabase)

```typescript
import type { PageServerLoad } from './$types'
import { entityService } from '$lib/services/entity.service'
import { error } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals }) => {
  try {
    // ✅ CRITICAL: Always pass locals.supabase for RLS authentication
    const entities = await entityService.list({ is_active: true }, locals.supabase);

    return {
      entities
    }
  } catch (err) {
    console.error('Error loading entities:', err);
    throw error(500, 'Failed to load entities');
  }
}
```

### In Form Actions (ALWAYS pass locals.supabase)

```typescript
import type { Actions } from './$types'
import { entityService } from '$lib/services/entity.service'
import { fail, redirect } from '@sveltejs/kit'

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData()

    const entity = {
      name: formData.get('name')?.toString(),
      description: formData.get('description')?.toString()
    }

    if (!entity.name) {
      return fail(400, { error: 'Name is required' })
    }

    try {
      // ✅ CRITICAL: Always pass locals.supabase for RLS authentication
      await entityService.create(entity, locals.supabase);
      throw redirect(303, '/entities');
    } catch (err) {
      console.error('Error creating entity:', err);
      return fail(500, { error: 'Failed to create entity' });
    }
  },

  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) {
      return fail(400, { error: 'ID is required' });
    }

    const updates = {
      name: formData.get('name')?.toString(),
      description: formData.get('description')?.toString()
    };

    try {
      // ✅ CRITICAL: Always pass locals.supabase for RLS authentication
      await entityService.update(id, updates, locals.supabase);
      throw redirect(303, '/entities');
    } catch (err) {
      console.error('Error updating entity:', err);
      return fail(500, { error: 'Failed to update entity' });
    }
  }
}

    const { error: createError } = await createEntity(
      locals.supabase,
      entity
    )

    if (createError) {
      return fail(500, { error: 'Failed to create entity' })
    }

    throw redirect(303, '/entities')
  }
}
```

### In API Routes

```typescript
import type { RequestHandler } from './$types'
import { getEntity } from '$lib/services/entity.service'
import { json, error } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ params, locals }) => {
  const { data: entity, error: fetchError } = await getEntity(
    locals.supabase,
    params.id
  )

  if (fetchError || !entity) {
    throw error(404, 'Entity not found')
  }

  return json(entity)
}
```

---

## Advanced Service Patterns

### 1. Fetching Related Data (Joins)

```typescript
/**
 * Get assessment with all related data
 */
export async function getAssessmentWithRelations(
  supabase: SupabaseClient<Database>,
  id: string
) {
  return await supabase
    .from('assessments')
    .select(`
      *,
      appointment:appointments(*),
      inspection:inspections(*),
      request:requests(*, client:clients(*)),
      vehicle_identification:assessment_vehicle_identification(*),
      exterior:assessment_360_exterior(*),
      damage:assessment_damage(*)
    `)
    .eq('id', id)
    .single()
}
```

### 2. Complex Filters

```typescript
/**
 * Get requests with complex filtering
 */
export async function getRequestsFiltered(
  supabase: SupabaseClient<Database>,
  filters: {
    status?: string[]
    clientId?: string
    engineerId?: string
    dateFrom?: string
    dateTo?: string
  }
) {
  let query = supabase
    .from('requests')
    .select('*, client:clients(*), engineer:engineers(*)')

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId)
  }

  if (filters.engineerId) {
    query = query.eq('assigned_engineer_id', filters.engineerId)
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  return await query.order('created_at', { ascending: false })
}
```

### 3. Batch Operations

```typescript
/**
 * Create multiple estimate line items
 */
export async function createEstimateLines(
  supabase: SupabaseClient<Database>,
  lines: Database['public']['Tables']['assessment_estimates']['Insert'][]
) {
  return await supabase
    .from('assessment_estimates')
    .insert(lines)
    .select()
}
```

### 4. Transactional Operations

```typescript
/**
 * Create assessment with initial data
 */
export async function createAssessmentWithInitialData(
  supabase: SupabaseClient<Database>,
  assessment: Database['public']['Tables']['assessments']['Insert']
) {
  // Create assessment
  const { data: newAssessment, error: assessmentError } = await supabase
    .from('assessments')
    .insert(assessment)
    .select()
    .single()

  if (assessmentError || !newAssessment) {
    return { data: null, error: assessmentError }
  }

  // Create related records
  const { error: identificationError } = await supabase
    .from('assessment_vehicle_identification')
    .insert({ assessment_id: newAssessment.id })

  if (identificationError) {
    // Rollback not possible - handle gracefully
    return { data: null, error: identificationError }
  }

  const { error: exteriorError } = await supabase
    .from('assessment_360_exterior')
    .insert({ assessment_id: newAssessment.id })

  if (exteriorError) {
    return { data: null, error: exteriorError }
  }

  return { data: newAssessment, error: null }
}
```

### 5. Aggregations

```typescript
/**
 * Get assessment statistics
 */
export async function getAssessmentStats(
  supabase: SupabaseClient<Database>,
  filters?: { dateFrom?: string; dateTo?: string }
) {
  let query = supabase
    .from('assessments')
    .select('status, id.count()', { count: 'exact' })

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  return await query
}
```

---

## Service Best Practices

### 1. Always Accept Supabase Client

**Good:**
```typescript
export async function getClient(supabase: SupabaseClient<Database>, id: string)
```

**Bad:**
```typescript
import { supabase } from '$lib/supabase'
export async function getClient(id: string) {
  return await supabase.from('clients').select('*')
}
```

**Why:** Accepting the client allows for flexibility:
- Use `locals.supabase` for authenticated requests
- Use `supabaseServer` for server-side operations
- Easier to test with mocked clients

---

### 2. Return Raw Supabase Response

**Good:**
```typescript
export async function getClient(supabase: SupabaseClient<Database>, id: string) {
  return await supabase.from('clients').select('*').eq('id', id).single()
}
```

**Bad:**
```typescript
export async function getClient(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}
```

**Why:** Let the caller decide how to handle errors. Different contexts may need different error handling.

---

### 3. Use TypeScript Types

**Good:**
```typescript
import type { Database } from '$lib/types/database'

type ClientInsert = Database['public']['Tables']['clients']['Insert']

export async function createClient(
  supabase: SupabaseClient<Database>,
  client: ClientInsert
) { ... }
```

**Bad:**
```typescript
export async function createClient(
  supabase: any,
  client: any
) { ... }
```

**Why:** Type safety prevents bugs and provides autocomplete.

---

### 4. Use Optional Filters

**Good:**
```typescript
export async function getClients(
  supabase: SupabaseClient<Database>,
  filters?: { is_active?: boolean; type?: string }
) {
  let query = supabase.from('clients').select('*')

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  return await query
}
```

**Why:** Single function can handle multiple use cases without creating separate functions.

---

### 5. Document Complex Queries

Use JSDoc comments for complex functions:

```typescript
/**
 * Get assessment with all related data for report generation
 *
 * @param supabase - Supabase client
 * @param assessmentId - Assessment ID
 * @returns Assessment with joined data (appointment, request, client, damage, estimates)
 */
export async function getAssessmentForReport(
  supabase: SupabaseClient<Database>,
  assessmentId: string
) {
  return await supabase
    .from('assessments')
    .select(`
      *,
      appointment:appointments(*),
      request:requests(*, client:clients(*)),
      damage:assessment_damage(*),
      estimates:assessment_estimates(*)
    `)
    .eq('id', assessmentId)
    .single()
}
```

---

## Common Service Examples from ClaimTech

### Example 1: Assessment Service

```typescript
// src/lib/services/assessment.service.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database'

export async function getAssessment(
  supabase: SupabaseClient<Database>,
  id: string
) {
  return await supabase
    .from('assessments')
    .select('*')
    .eq('id', id)
    .single()
}

export async function updateAssessmentStatus(
  supabase: SupabaseClient<Database>,
  id: string,
  status: string
) {
  return await supabase
    .from('assessments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function finalizeAssessment(
  supabase: SupabaseClient<Database>,
  id: string,
  finalizationData: {
    report_number?: string
    assessor_name?: string
    assessor_contact?: string
  }
) {
  return await supabase
    .from('assessments')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      estimate_finalized_at: new Date().toISOString(),
      ...finalizationData
    })
    .eq('id', id)
}
```

### Example 2: Estimate Service

```typescript
// src/lib/services/estimate.service.ts
export async function getEstimates(
  supabase: SupabaseClient<Database>,
  assessmentId: string
) {
  return await supabase
    .from('assessment_estimates')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('is_removed', false)
    .order('line_number')
}

export async function createEstimateLine(
  supabase: SupabaseClient<Database>,
  estimate: Database['public']['Tables']['assessment_estimates']['Insert']
) {
  return await supabase
    .from('assessment_estimates')
    .insert(estimate)
    .select()
    .single()
}

export async function removeEstimateLine(
  supabase: SupabaseClient<Database>,
  lineId: string
) {
  // Soft delete
  return await supabase
    .from('assessment_estimates')
    .update({ is_removed: true })
    .eq('id', lineId)
}
```

### Example 3: Storage Service

```typescript
// src/lib/services/storage.service.ts
export async function uploadPhoto(
  supabase: SupabaseClient<Database>,
  file: File,
  path: string
) {
  return await supabase.storage
    .from('SVA Photos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })
}

export async function getSignedUrl(
  supabase: SupabaseClient<Database>,
  bucket: string,
  path: string,
  expiresIn: number = 3600
) {
  return await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
}

export async function deletePhoto(
  supabase: SupabaseClient<Database>,
  path: string
) {
  return await supabase.storage
    .from('SVA Photos')
    .remove([path])
}
```

---

## Testing Services

### Unit Testing with Mocked Client

```typescript
import { describe, it, expect, vi } from 'vitest'
import { getClient } from '$lib/services/client.service'

describe('client.service', () => {
  it('should get client by id', async () => {
    // Mock Supabase client
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: '123', name: 'Test Client' },
              error: null
            }))
          }))
        }))
      }))
    } as any

    const { data, error } = await getClient(mockSupabase, '123')

    expect(error).toBeNull()
    expect(data).toEqual({ id: '123', name: 'Test Client' })
  })
})
```

---

## Common Pitfalls

### 1. Hardcoding Supabase Client

**Bad:**
```typescript
import { supabase } from '$lib/supabase'

export async function getClient(id: string) {
  return await supabase.from('clients').select('*').eq('id', id).single()
}
```

**Why:** You can't use different clients (authenticated vs. service role).

---

### 2. Throwing Errors in Services

**Bad:**
```typescript
export async function getClient(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}
```

**Why:** Let the caller handle errors. They may want to handle 404s differently than 500s.

---

### 3. Not Using Filters

**Bad:**
```typescript
export async function getActiveClients(supabase: SupabaseClient) { ... }
export async function getInactiveClients(supabase: SupabaseClient) { ... }
export async function getAllClients(supabase: SupabaseClient) { ... }
```

**Good:**
```typescript
export async function getClients(
  supabase: SupabaseClient,
  filters?: { is_active?: boolean }
) { ... }
```

---

## Related Documentation
- Project Architecture: `../System/project_architecture.md`
- Adding Page Routes: `adding_page_route.md`
- Database Schema: `../System/database_schema.md`
