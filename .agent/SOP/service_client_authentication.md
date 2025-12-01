# SOP: Service Client Authentication Pattern

## Overview

This SOP documents the **critical pattern** for ensuring Row Level Security (RLS) policies work correctly in ClaimTech. All services that interact with the database MUST accept an optional `ServiceClient` parameter to support authenticated operations.

**Last Updated:** January 25, 2025

---

## The Problem

### What Happens Without ServiceClient

When services use the global `supabase` client directly, they operate in an **unauthenticated context**. This causes RLS policies to fail because the database cannot identify the user making the request.

**Error:**
```
Error: new row violates row-level security policy for table "..."
Code: 42501
```

**Why This Happens:**
1. Global `supabase` client = Browser client with no auth context
2. `locals.supabase` = Server client with authenticated user session
3. RLS policies check `auth.uid()` and user roles
4. Without auth context, RLS sees anonymous user and rejects operations

---

## The Solution: ServiceClient Parameter Pattern

### Core Pattern

Every service method that performs database operations MUST:

1. **Import the ServiceClient type**
2. **Accept optional `client?: ServiceClient` parameter** (always last parameter)
3. **Use `const db = client ?? supabase;` pattern**
4. **Use `db` for all database queries**

### Template

```typescript
import { supabase } from '$lib/supabase';
import type { ServiceClient } from '$lib/types/service';

export class EntityService {
  async create(input: CreateInput, client?: ServiceClient): Promise<Entity> {
    const db = client ?? supabase;  // ✅ Use authenticated client if provided
    
    const { data, error } = await db
      .from('entities')
      .insert(input)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating entity:', error);
      throw new Error(`Failed to create entity: ${error.message}`);
    }
    
    return data;
  }
}
```

---

## Implementation Checklist

### For Service Methods

- [ ] Import `ServiceClient` type from `$lib/types/service`
- [ ] Add `client?: ServiceClient` as last parameter to ALL methods that query the database
- [ ] Add `const db = client ?? supabase;` at the start of the method
- [ ] Replace all `supabase.from(...)` with `db.from(...)`
- [ ] Pass `client` through to any helper methods or other services called

### For Server Routes (+page.server.ts)

- [ ] Import service from `$lib/services/*.service`
- [ ] ALWAYS pass `locals.supabase` as the client parameter
- [ ] Wrap service calls in try-catch for error handling
- [ ] Never use the global `supabase` client in server routes

---

## Examples

### ✅ Correct Implementation

**Service:**
```typescript
// src/lib/services/vehicle-values.service.ts
import { supabase } from '$lib/supabase';
import type { VehicleValues, CreateVehicleValuesInput } from '$lib/types/assessment';
import type { ServiceClient } from '$lib/types/service';

export class VehicleValuesService {
  async createDefault(assessmentId: string, client?: ServiceClient): Promise<VehicleValues> {
    return this.create({
      assessment_id: assessmentId,
      extras: []
    }, client);  // ✅ Pass client through
  }

  async create(input: CreateVehicleValuesInput, client?: ServiceClient): Promise<VehicleValues> {
    const db = client ?? supabase;  // ✅ Use authenticated client
    
    const { data, error } = await db
      .from('assessment_vehicle_values')
      .insert({
        assessment_id: input.assessment_id,
        trade_value: input.trade_value || 0,
        // ... other fields
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating vehicle values:', error);
      throw new Error(`Failed to create vehicle values: ${error.message}`);
    }
    
    return data;
  }
}

export const vehicleValuesService = new VehicleValuesService();
```

**Server Route:**
```typescript
// src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts
import type { PageServerLoad } from './$types';
import { vehicleValuesService } from '$lib/services/vehicle-values.service';

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    // ✅ CRITICAL: Always pass locals.supabase
    const vehicleValues = await vehicleValuesService.createDefault(
      assessmentId,
      locals.supabase
    );
    
    return { vehicleValues };
  } catch (error) {
    console.error('Error creating vehicle values:', error);
    throw error(500, 'Failed to create vehicle values');
  }
};
```

---

### ❌ Incorrect Implementation (BROKEN)

**Service:**
```typescript
// ❌ WRONG: No client parameter
export class VehicleValuesService {
  async create(input: CreateVehicleValuesInput): Promise<VehicleValues> {
    const { data, error } = await supabase  // ❌ Always unauthenticated
      .from('assessment_vehicle_values')
      .insert(input)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }
}
```

**Server Route:**
```typescript
// ❌ WRONG: Not passing locals.supabase
const vehicleValues = await vehicleValuesService.create(input);
```

**Result:** Error 42501 - RLS policy violation

---

## When to Use This Pattern

### ALWAYS Use ServiceClient Parameter

- ✅ Any method that performs INSERT operations
- ✅ Any method that performs UPDATE operations
- ✅ Any method that performs DELETE operations
- ✅ Any method that performs SELECT with RLS-protected data
- ✅ Helper methods that call other service methods
- ✅ Methods called from server routes (+page.server.ts, +server.ts)

### Optional (But Recommended)

- ✅ Read-only methods (SELECT) - for consistency
- ✅ Public data queries - for future-proofing

---

## Common Mistakes

### 1. Forgetting to Pass Client Through Helper Methods

```typescript
// ❌ WRONG
async createDefault(assessmentId: string, client?: ServiceClient) {
  return this.create({ assessment_id: assessmentId });  // ❌ Not passing client
}

// ✅ CORRECT
async createDefault(assessmentId: string, client?: ServiceClient) {
  return this.create({ assessment_id: assessmentId }, client);  // ✅ Pass client through
}
```

### 2. Not Passing locals.supabase in Server Routes

```typescript
// ❌ WRONG
await vehicleValuesService.create(input);

// ✅ CORRECT
await vehicleValuesService.create(input, locals.supabase);
```

### 3. Using Global Supabase Client in Server Routes

```typescript
// ❌ WRONG - Never use global client in server routes
const { data } = await supabase.from('entities').select('*');

// ✅ CORRECT - Always use locals.supabase
const { data } = await locals.supabase.from('entities').select('*');

// ✅ BETTER - Use service layer
const entities = await entityService.list({}, locals.supabase);
```

---

## Testing Your Implementation

### 1. Check for RLS Errors

Look for error code `42501` in console:
```
Error: new row violates row-level security policy
Code: 42501
```

If you see this, you're missing the ServiceClient parameter somewhere.

### 2. Test as Different User Roles

- Test as **admin user** - should work
- Test as **engineer user** - should work for their own data
- Check console for any RLS violations

### 3. Verify Database Records

After operations, check that:
- Records are created successfully
- Audit logs are created
- No orphaned records

---

## Migration Guide

### Converting Existing Services

1. **Add ServiceClient import:**
```typescript
import type { ServiceClient } from '$lib/types/service';
```

2. **Update method signatures:**
```typescript
// Before
async create(input: CreateInput): Promise<Entity>

// After
async create(input: CreateInput, client?: ServiceClient): Promise<Entity>
```

3. **Add db variable:**
```typescript
const db = client ?? supabase;
```

4. **Replace all supabase references:**
```typescript
// Before
await supabase.from('entities')...

// After
await db.from('entities')...
```

5. **Update call sites:**
```typescript
// Before
await entityService.create(input);

// After
await entityService.create(input, locals.supabase);
```

---

## Related Documentation

- **[Working with Services](./working_with_services.md)** - Complete service layer patterns and examples
- **[Database Schema](../System/database_schema.md)** - RLS policies and recent fixes
- **[Fix Service Client Injection](../Tasks/active/fix_service_client_injection.md)** - Implementation task and progress
- **[Service Patterns](../../.claude/skills/claimtech-development/resources/service-patterns.md)** - ServiceClient injection templates

---

## Summary

**The Golden Rule:**
> Every service method that touches the database MUST accept `client?: ServiceClient` and use `const db = client ?? supabase;`

**The Server Route Rule:**
> Every server route MUST pass `locals.supabase` to all service calls

Following these rules ensures RLS policies work correctly and users can only access their authorized data.

