# Service Layer Patterns - ClaimTech

Production-ready patterns for ClaimTech service layer implementation using ServiceClient injection.

---

## Core Principles

### 1. ServiceClient Injection (MANDATORY)

**✅ CORRECT: Services receive SupabaseClient, never create it**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

export class EntityService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getAll() {
    // Use this.supabase
  }
}
```

**❌ WRONG: Never create SupabaseClient in services**

```typescript
// DON'T DO THIS
export class EntityService {
  private supabase = createClient(...); // ❌ WRONG
}
```

### 2. Factory Pattern (RECOMMENDED)

```typescript
// Export factory function for easy instantiation
export const createEntityService = (supabase: SupabaseClient<Database>) =>
  new EntityService(supabase);
```

### 3. Error Handling (MANDATORY)

```typescript
// Always check for errors and throw
const { data, error } = await this.supabase.from('table').select('*');

if (error) throw error;
return data;
```

---

## Service Templates

### Basic CRUD Service

```typescript
// src/lib/services/entity.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

// Type helpers
type Entity = Database['public']['Tables']['entities']['Row'];
type InsertEntity = Database['public']['Tables']['entities']['Insert'];
type UpdateEntity = Database['public']['Tables']['entities']['Update'];

export class EntityService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get all entities
   */
  async getAll(): Promise<Entity[]> {
    const { data, error } = await this.supabase
      .from('entities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<Entity> {
    const { data, error } = await this.supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create new entity
   */
  async create(entity: InsertEntity): Promise<Entity> {
    const { data, error } = await this.supabase
      .from('entities')
      .insert(entity)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update entity
   */
  async update(id: string, updates: UpdateEntity): Promise<Entity> {
    const { data, error } = await this.supabase
      .from('entities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('entities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

// Factory function
export const createEntityService = (supabase: SupabaseClient<Database>) =>
  new EntityService(supabase);
```

### Service with Relationships

```typescript
// src/lib/services/assessment.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

type Assessment = Database['public']['Tables']['assessments']['Row'];
type InsertAssessment = Database['public']['Tables']['assessments']['Insert'];

// Extended type with relationships
type AssessmentWithRelations = Assessment & {
  request: Database['public']['Tables']['requests']['Row'];
  estimates: Database['public']['Tables']['assessment_estimates']['Row'] | null;
};

export class AssessmentService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get assessment with related data
   */
  async getByIdWithRelations(id: string): Promise<AssessmentWithRelations> {
    const { data, error } = await this.supabase
      .from('assessments')
      .select(`
        *,
        request:requests(*),
        estimates:assessment_estimates(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all assessments for a request
   */
  async getByRequestId(requestId: string): Promise<Assessment[]> {
    const { data, error } = await this.supabase
      .from('assessments')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Get assessments for current user (client or engineer)
   */
  async getForCurrentUser(): Promise<AssessmentWithRelations[]> {
    const { data, error } = await this.supabase
      .from('assessments')
      .select(`
        *,
        request:requests(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AssessmentWithRelations[];
  }

  /**
   * Create assessment with initial data
   */
  async create(assessment: InsertAssessment): Promise<Assessment> {
    const { data, error } = await this.supabase
      .from('assessments')
      .insert(assessment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Finalize assessment (mark as complete)
   */
  async finalize(id: string): Promise<Assessment> {
    const { data, error } = await this.supabase
      .from('assessments')
      .update({
        status: 'finalized',
        finalized_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const createAssessmentService = (supabase: SupabaseClient<Database>) =>
  new AssessmentService(supabase);
```

### Service with JSONB Operations

```typescript
// src/lib/services/estimate.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

type AssessmentEstimate = Database['public']['Tables']['assessment_estimates']['Row'];

// Line item type (structure within JSONB)
type EstimateLineItem = {
  id: string;
  process_type: 'N' | 'R' | 'P' | 'B' | 'A' | 'O';
  part_type: 'OEM' | 'ALT' | '2ND';
  description: string;
  part_price_nett: number;
  part_price: number;
  labour_hours?: number;
  labour_rate?: number;
  paint_hours?: number;
  betterment_part_percentage: number;
  betterment_labour_percentage: number;
};

export class EstimateService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get estimate for assessment
   */
  async getByAssessmentId(assessmentId: string): Promise<AssessmentEstimate | null> {
    const { data, error } = await this.supabase
      .from('assessment_estimates')
      .select('*')
      .eq('assessment_id', assessmentId)
      .single();

    if (error) {
      // Return null if not found, throw for other errors
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Create or update estimate with line items
   */
  async upsert(
    assessmentId: string,
    lineItems: EstimateLineItem[]
  ): Promise<AssessmentEstimate> {
    // Calculate totals
    const totals = this.calculateTotals(lineItems);

    const { data, error } = await this.supabase
      .from('assessment_estimates')
      .upsert({
        assessment_id: assessmentId,
        line_items: lineItems as any,
        ...totals
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add single line item to estimate
   */
  async addLineItem(
    assessmentId: string,
    lineItem: EstimateLineItem
  ): Promise<AssessmentEstimate> {
    // Get existing estimate
    const existing = await this.getByAssessmentId(assessmentId);
    const currentItems = (existing?.line_items as EstimateLineItem[]) || [];

    // Add new item
    const updatedItems = [...currentItems, lineItem];

    // Upsert with updated items
    return this.upsert(assessmentId, updatedItems);
  }

  /**
   * Update single line item
   */
  async updateLineItem(
    assessmentId: string,
    lineItemId: string,
    updates: Partial<EstimateLineItem>
  ): Promise<AssessmentEstimate> {
    const existing = await this.getByAssessmentId(assessmentId);
    if (!existing) throw new Error('Estimate not found');

    const currentItems = (existing.line_items as EstimateLineItem[]) || [];
    const updatedItems = currentItems.map(item =>
      item.id === lineItemId ? { ...item, ...updates } : item
    );

    return this.upsert(assessmentId, updatedItems);
  }

  /**
   * Remove line item
   */
  async removeLineItem(
    assessmentId: string,
    lineItemId: string
  ): Promise<AssessmentEstimate> {
    const existing = await this.getByAssessmentId(assessmentId);
    if (!existing) throw new Error('Estimate not found');

    const currentItems = (existing.line_items as EstimateLineItem[]) || [];
    const updatedItems = currentItems.filter(item => item.id !== lineItemId);

    return this.upsert(assessmentId, updatedItems);
  }

  /**
   * Calculate totals from line items
   */
  private calculateTotals(lineItems: EstimateLineItem[]) {
    let total_parts = 0;
    let total_labour = 0;
    let total_paint = 0;

    lineItems.forEach(item => {
      // Apply betterment to parts
      const partCost = item.part_price * (1 - item.betterment_part_percentage / 100);
      total_parts += partCost;

      // Labour
      if (item.labour_hours && item.labour_rate) {
        const labourCost =
          item.labour_hours * item.labour_rate * (1 - item.betterment_labour_percentage / 100);
        total_labour += labourCost;
      }

      // Paint
      if (item.paint_hours && item.labour_rate) {
        total_paint += item.paint_hours * item.labour_rate;
      }
    });

    return {
      total_parts: Number(total_parts.toFixed(2)),
      total_labour: Number(total_labour.toFixed(2)),
      total_paint: Number(total_paint.toFixed(2)),
      grand_total: Number((total_parts + total_labour + total_paint).toFixed(2))
    };
  }
}

export const createEstimateService = (supabase: SupabaseClient<Database>) =>
  new EstimateService(supabase);
```

### Service with Filtering/Search

```typescript
// src/lib/services/request.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

type Request = Database['public']['Tables']['requests']['Row'];

export type RequestFilters = {
  status?: string;
  clientId?: string;
  engineerId?: string;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
};

export class RequestService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get requests with filters
   */
  async getFiltered(filters: RequestFilters = {}): Promise<Request[]> {
    let query = this.supabase
      .from('requests')
      .select('*');

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters.engineerId) {
      query = query.eq('engineer_id', filters.engineerId);
    }

    if (filters.searchTerm) {
      query = query.or(
        `vehicle_make.ilike.%${filters.searchTerm}%,` +
        `vehicle_model.ilike.%${filters.searchTerm}%,` +
        `registration_number.ilike.%${filters.searchTerm}%`
      );
    }

    if (filters.fromDate) {
      query = query.gte('created_at', filters.fromDate);
    }

    if (filters.toDate) {
      query = query.lte('created_at', filters.toDate);
    }

    // Order by most recent
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Get paginated requests
   */
  async getPaginated(
    page: number = 1,
    pageSize: number = 20,
    filters: RequestFilters = {}
  ): Promise<{ data: Request[]; total: number; hasMore: boolean }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build query
    let query = this.supabase.from('requests').select('*', { count: 'exact' });

    // Apply filters (same as getFiltered)
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.clientId) query = query.eq('client_id', filters.clientId);
    if (filters.engineerId) query = query.eq('engineer_id', filters.engineerId);

    // Pagination
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      hasMore: count ? to < count - 1 : false
    };
  }
}

export const createRequestService = (supabase: SupabaseClient<Database>) =>
  new RequestService(supabase);
```

---

## Usage in SvelteKit

### Server Load Functions (+page.server.ts)

```typescript
// src/routes/entities/+page.server.ts
import { createEntityService } from '$lib/services/entity.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const entityService = createEntityService(locals.supabase);
  const entities = await entityService.getAll();

  return { entities };
};
```

### Form Actions (+page.server.ts)

```typescript
// src/routes/entities/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import { createEntityService } from '$lib/services/entity.service';
import type { Actions } from './$types';

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get('name')?.toString();
    const description = formData.get('description')?.toString();

    if (!name) {
      return fail(400, { error: 'Name is required' });
    }

    try {
      const entityService = createEntityService(locals.supabase);
      const entity = await entityService.create({
        name,
        description,
        user_id: locals.session?.user.id
      });

      throw redirect(303, `/entities/${entity.id}`);
    } catch (error) {
      console.error('Failed to create entity:', error);
      return fail(500, { error: 'Failed to create entity' });
    }
  },

  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    const name = formData.get('name')?.toString();

    if (!id || !name) {
      return fail(400, { error: 'Missing required fields' });
    }

    try {
      const entityService = createEntityService(locals.supabase);
      await entityService.update(id, { name });

      return { success: true };
    } catch (error) {
      console.error('Failed to update entity:', error);
      return fail(500, { error: 'Failed to update entity' });
    }
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) {
      return fail(400, { error: 'ID is required' });
    }

    try {
      const entityService = createEntityService(locals.supabase);
      await entityService.delete(id);

      throw redirect(303, '/entities');
    } catch (error) {
      console.error('Failed to delete entity:', error);
      return fail(500, { error: 'Failed to delete entity' });
    }
  }
};
```

### API Routes (+server.ts)

```typescript
// src/routes/api/entities/[id]/+server.ts
import { json, error } from '@sveltejs/kit';
import { createEntityService } from '$lib/services/entity.service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const entityService = createEntityService(locals.supabase);
    const entity = await entityService.getById(params.id);

    return json(entity);
  } catch (err) {
    console.error('Failed to fetch entity:', err);
    throw error(500, 'Failed to fetch entity');
  }
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  try {
    const updates = await request.json();

    const entityService = createEntityService(locals.supabase);
    const entity = await entityService.update(params.id, updates);

    return json(entity);
  } catch (err) {
    console.error('Failed to update entity:', err);
    throw error(500, 'Failed to update entity');
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const entityService = createEntityService(locals.supabase);
    await entityService.delete(params.id);

    return json({ success: true });
  } catch (err) {
    console.error('Failed to delete entity:', err);
    throw error(500, 'Failed to delete entity');
  }
};
```

---

## Error Handling Patterns

### Custom Error Types

```typescript
// src/lib/errors/service-errors.ts

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 403);
    this.name = 'UnauthorizedError';
  }
}
```

### Service with Custom Errors

```typescript
import { NotFoundError, ValidationError } from '$lib/errors/service-errors';

export class EntityService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getById(id: string): Promise<Entity> {
    // Validate input
    if (!id || !this.isValidUUID(id)) {
      throw new ValidationError('Invalid entity ID');
    }

    const { data, error } = await this.supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Entity', id);
      }
      throw error;
    }

    return data;
  }

  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}
```

---

## Best Practices

### ✅ DO

1. **Always inject SupabaseClient**
   ```typescript
   constructor(private supabase: SupabaseClient<Database>) {}
   ```

2. **Use TypeScript types from database**
   ```typescript
   type Entity = Database['public']['Tables']['entities']['Row'];
   ```

3. **Handle errors consistently**
   ```typescript
   if (error) throw error;
   ```

4. **Return type-safe promises**
   ```typescript
   async getById(id: string): Promise<Entity>
   ```

5. **Export factory functions**
   ```typescript
   export const createService = (supabase) => new Service(supabase);
   ```

6. **Document service methods**
   ```typescript
   /**
    * Get entity by ID
    * @throws {NotFoundError} if entity doesn't exist
    */
   ```

### ❌ DON'T

1. **Never create SupabaseClient in service**
   ```typescript
   // ❌ WRONG
   private supabase = createClient(...);
   ```

2. **Don't ignore errors**
   ```typescript
   // ❌ WRONG
   const { data } = await this.supabase.from('table').select('*');
   return data; // Error might be undefined!
   ```

3. **Don't use `any` types**
   ```typescript
   // ❌ WRONG
   async getAll(): Promise<any[]>
   ```

4. **Don't mix concerns**
   ```typescript
   // ❌ WRONG - Service shouldn't handle HTTP
   async create(req: Request): Promise<Response>
   ```

---

## Testing Services

### Unit Test Example

```typescript
// src/lib/services/entity.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { EntityService } from './entity.service';

describe('EntityService', () => {
  it('should get entity by ID', async () => {
    // Mock SupabaseClient
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '123', name: 'Test' },
              error: null
            })
          })
        })
      })
    } as any;

    const service = new EntityService(mockSupabase);
    const result = await service.getById('123');

    expect(result).toEqual({ id: '123', name: 'Test' });
    expect(mockSupabase.from).toHaveBeenCalledWith('entities');
  });

  it('should throw error when entity not found', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      })
    } as any;

    const service = new EntityService(mockSupabase);

    await expect(service.getById('123')).rejects.toThrow();
  });
});
```

---

**Reference**: See `.agent/SOP/working_with_services.md` for ClaimTech service layer guidelines
