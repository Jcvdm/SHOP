# Service Development Command

You are a backend expert creating ClaimTech service classes with proper ServiceClient injection, error handling, and testing.

---

## Prerequisites Check

Before starting:
- [ ] Database migration completed (table exists)
- [ ] TypeScript types generated
- [ ] Read `.agent/SOP/working_with_services.md`
- [ ] Invoke `supabase-development` skill
- [ ] Review `.claude/skills/claimtech-development/resources/service-patterns.md`

---

## Phase 1: Service Design (5-10 min)

### 1.1 Identify Required Operations

**Basic CRUD:**
- [ ] getAll() - List all records
- [ ] getById() - Get single record
- [ ] create() - Insert new record
- [ ] update() - Modify existing record
- [ ] delete() - Remove record

**Custom Operations:**
- [ ] Search/filter methods
- [ ] Relationship queries (with joins)
- [ ] Aggregations (counts, sums)
- [ ] Bulk operations
- [ ] Status transitions

### 1.2 Plan Relationships

**Questions:**
- What related data needs to be fetched?
- Which tables need to be joined?
- What foreign keys exist?
- Are there many-to-many relationships?

### 1.3 Design Error Handling

**Strategy:**
- Throw errors for database failures
- Return null for not found (optional)
- Validate input before queries
- Log errors appropriately

**Output:** Service design document

---

## Phase 2: Create Service File (5-10 min)

### 2.1 File Location

```bash
# Standard services
src/lib/services/entity.service.ts

# Domain-specific services
src/lib/services/assessment/notes.service.ts
```

### 2.2 Service Template

```typescript
// src/lib/services/entity.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

// Type aliases for convenience
type Entity = Database['public']['Tables']['entities']['Row'];
type EntityInsert = Database['public']['Tables']['entities']['Insert'];
type EntityUpdate = Database['public']['Tables']['entities']['Update'];

export class EntityService {
  /**
   * CRITICAL: Never create SupabaseClient here
   * Always inject via constructor
   */
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get all entities
   * @param filters Optional filters
   * @returns Array of entities
   */
  async getAll(filters?: { status?: string }): Promise<Entity[]> {
    let query = this.supabase
      .from('entities')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching entities:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get entity by ID
   * @param id Entity UUID
   * @returns Entity or null if not found
   */
  async getById(id: string): Promise<Entity | null> {
    const { data, error } = await this.supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching entity:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create new entity
   * @param entity Entity data to insert
   * @returns Created entity
   */
  async create(entity: EntityInsert): Promise<Entity> {
    const { data, error } = await this.supabase
      .from('entities')
      .insert(entity)
      .select()
      .single();

    if (error) {
      console.error('Error creating entity:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update existing entity
   * @param id Entity UUID
   * @param updates Partial entity data
   * @returns Updated entity
   */
  async update(id: string, updates: EntityUpdate): Promise<Entity> {
    const { data, error } = await this.supabase
      .from('entities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating entity:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete entity
   * @param id Entity UUID
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('entities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entity:', error);
      throw error;
    }
  }
}
```

**Output:** Basic service file created

---

## Phase 3: Implement CRUD Operations (15-25 min)

### 3.1 getAll() with Filtering

```typescript
async getAll(filters?: {
  status?: string;
  search?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<Entity[]> {
  let query = this.supabase
    .from('entities')
    .select('*')
    .order('created_at', { ascending: false });

  // Status filter
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  // Search filter (case-insensitive)
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  // User filter
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  // Pagination
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching entities:', error);
    throw error;
  }

  return data || [];
}
```

### 3.2 getById() with Relationships

```typescript
async getByIdWithRelations(id: string): Promise<EntityWithRelations | null> {
  const { data, error } = await this.supabase
    .from('entities')
    .select(`
      *,
      parent:parent_id (
        id,
        name
      ),
      children:child_entities (
        id,
        name,
        status
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching entity with relations:', error);
    throw error;
  }

  return data;
}
```

### 3.3 create() with Validation

```typescript
async create(entity: EntityInsert): Promise<Entity> {
  // Validate input
  if (!entity.name || entity.name.trim() === '') {
    throw new Error('Entity name is required');
  }

  if (entity.status && !['active', 'inactive', 'archived'].includes(entity.status)) {
    throw new Error('Invalid status value');
  }

  const { data, error } = await this.supabase
    .from('entities')
    .insert(entity)
    .select()
    .single();

  if (error) {
    console.error('Error creating entity:', error);
    throw error;
  }

  return data;
}
```

### 3.4 update() with Optimistic Locking

```typescript
async update(id: string, updates: EntityUpdate, expectedVersion?: number): Promise<Entity> {
  let query = this.supabase
    .from('entities')
    .update(updates)
    .eq('id', id);

  // Optimistic locking (if version column exists)
  if (expectedVersion !== undefined) {
    query = query.eq('version', expectedVersion);
  }

  const { data, error } = await query.select().single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Entity not found or version mismatch');
    }
    console.error('Error updating entity:', error);
    throw error;
  }

  return data;
}
```

### 3.5 delete() with Cascade Handling

```typescript
async delete(id: string, options?: { force?: boolean }): Promise<void> {
  // Check for dependencies (if not using CASCADE)
  if (!options?.force) {
    const { count } = await this.supabase
      .from('child_entities')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', id);

    if (count && count > 0) {
      throw new Error(`Cannot delete entity with ${count} child records`);
    }
  }

  const { error } = await this.supabase
    .from('entities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting entity:', error);
    throw error;
  }
}
```

**Output:** Complete CRUD operations

---

## Phase 4: Add Business Logic (15-30 min)

### 4.1 Custom Queries

```typescript
/**
 * Get entities by status with counts
 */
async getByStatusWithCounts(): Promise<{ status: string; count: number }[]> {
  const { data, error } = await this.supabase
    .rpc('get_entity_counts_by_status');

  if (error) {
    console.error('Error fetching status counts:', error);
    throw error;
  }

  return data || [];
}

/**
 * Search entities with full-text search
 */
async search(query: string, limit = 10): Promise<Entity[]> {
  const { data, error } = await this.supabase
    .from('entities')
    .select('*')
    .textSearch('name', query, {
      type: 'websearch',
      config: 'english'
    })
    .limit(limit);

  if (error) {
    console.error('Error searching entities:', error);
    throw error;
  }

  return data || [];
}
```

### 4.2 Aggregations

```typescript
/**
 * Get entity statistics
 */
async getStatistics(): Promise<{
  total: number;
  active: number;
  inactive: number;
  archived: number;
}> {
  const { count: total } = await this.supabase
    .from('entities')
    .select('*', { count: 'exact', head: true });

  const { count: active } = await this.supabase
    .from('entities')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: inactive } = await this.supabase
    .from('entities')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'inactive');

  const { count: archived } = await this.supabase
    .from('entities')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'archived');

  return {
    total: total || 0,
    active: active || 0,
    inactive: inactive || 0,
    archived: archived || 0
  };
}
```

### 4.3 Bulk Operations

```typescript
/**
 * Create multiple entities
 */
async createBulk(entities: EntityInsert[]): Promise<Entity[]> {
  const { data, error } = await this.supabase
    .from('entities')
    .insert(entities)
    .select();

  if (error) {
    console.error('Error creating entities in bulk:', error);
    throw error;
  }

  return data || [];
}

/**
 * Update multiple entities
 */
async updateBulk(ids: string[], updates: EntityUpdate): Promise<Entity[]> {
  const { data, error } = await this.supabase
    .from('entities')
    .update(updates)
    .in('id', ids)
    .select();

  if (error) {
    console.error('Error updating entities in bulk:', error);
    throw error;
  }

  return data || [];
}
```

### 4.4 Status Transitions

```typescript
/**
 * Transition entity to new status
 */
async transitionStatus(
  id: string,
  newStatus: string,
  userId: string
): Promise<Entity> {
  // Validate transition
  const entity = await this.getById(id);
  if (!entity) {
    throw new Error('Entity not found');
  }

  const validTransitions: Record<string, string[]> = {
    active: ['inactive', 'archived'],
    inactive: ['active', 'archived'],
    archived: [] // Cannot transition from archived
  };

  if (!validTransitions[entity.status]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${entity.status} to ${newStatus}`);
  }

  // Update status
  const updated = await this.update(id, { status: newStatus });

  // Log transition (if audit service exists)
  // await auditService.log({
  //   entity_type: 'entity',
  //   entity_id: id,
  //   action: 'status_change',
  //   old_value: entity.status,
  //   new_value: newStatus,
  //   user_id: userId
  // });

  return updated;
}
```

**Output:** Complete business logic

---

## Phase 5: Testing (15-25 min)

### 5.1 Manual Testing in Routes

**Create test route:** `src/routes/test/entity-service/+page.server.ts`

```typescript
import { EntityService } from '$lib/services/entity.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const service = new EntityService(locals.supabase);

  try {
    // Test getAll
    const all = await service.getAll();
    console.log('All entities:', all.length);

    // Test create
    const created = await service.create({
      name: 'Test Entity',
      status: 'active'
    });
    console.log('Created:', created.id);

    // Test getById
    const fetched = await service.getById(created.id);
    console.log('Fetched:', fetched?.name);

    // Test update
    const updated = await service.update(created.id, {
      name: 'Updated Entity'
    });
    console.log('Updated:', updated.name);

    // Test delete
    await service.delete(created.id);
    console.log('Deleted successfully');

    return { success: true };
  } catch (error) {
    console.error('Test failed:', error);
    return { success: false, error };
  }
};
```

### 5.2 Test with Different Roles

```typescript
// Test as admin
const adminClient = locals.supabase; // Has admin role
const adminService = new EntityService(adminClient);
const adminEntities = await adminService.getAll();
console.log('Admin sees:', adminEntities.length);

// Test as engineer (if applicable)
// const engineerClient = ...; // Has engineer role
// const engineerService = new EntityService(engineerClient);
// const engineerEntities = await engineerService.getAll();
// console.log('Engineer sees:', engineerEntities.length);
```

### 5.3 Test Error Cases

```typescript
// Test not found
const notFound = await service.getById('00000000-0000-0000-0000-000000000000');
console.log('Not found:', notFound === null);

// Test invalid data
try {
  await service.create({ name: '' }); // Should throw
  console.error('Should have thrown validation error');
} catch (error) {
  console.log('Validation error caught:', error.message);
}

// Test RLS enforcement
// (try to access data you shouldn't have access to)
```

**Output:** Verified working service

---

## Phase 6: Documentation (5-10 min)

### 6.1 Add JSDoc Comments

```typescript
/**
 * Service for managing entities
 * 
 * @example
 * ```typescript
 * const service = new EntityService(supabase);
 * const entities = await service.getAll({ status: 'active' });
 * ```
 */
export class EntityService {
  // ... methods with JSDoc
}
```

### 6.2 Update System Documentation

**File:** `.agent/System/project_architecture.md`

Add service to services list:
```markdown
### Services

- **EntityService** (`src/lib/services/entity.service.ts`)
  - CRUD operations for entities
  - Status transitions
  - Search and filtering
```

**Output:** Documented service

---

## Quality Checklist

**ServiceClient Injection:**
- [ ] Constructor accepts SupabaseClient
- [ ] Never creates client internally
- [ ] Uses injected client for all queries

**Error Handling:**
- [ ] All async operations have try-catch or throw
- [ ] Errors logged with context
- [ ] User-friendly error messages
- [ ] Not found returns null (not throws)

**TypeScript:**
- [ ] All methods typed
- [ ] Return types specified
- [ ] Parameters typed
- [ ] No `any` types

**Performance:**
- [ ] Efficient queries (no N+1)
- [ ] Proper indexes used
- [ ] Pagination supported
- [ ] Bulk operations available

**Testing:**
- [ ] Manual tests passed
- [ ] Role-based access tested
- [ ] Error cases tested
- [ ] RLS enforcement verified

---

## Common Pitfalls

### ❌ Never:
- Create SupabaseClient in service
- Skip error handling
- Use `any` types
- Forget to test RLS
- Hard-code values

### ✅ Always:
- Inject SupabaseClient
- Handle all errors
- Use TypeScript types
- Test with different roles
- Document public methods

---

## Related Commands

- `feature-implementation.md` - Full feature workflow
- `database-migration.md` - Create tables first
- `testing-workflow.md` - Testing procedures

---

## Related Skills

- `supabase-development` - Database patterns
- `claimtech-development` - Service workflows

