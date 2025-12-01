# Implementing Role-Based Filtering & Workflows

**Purpose:** Step-by-step guide for implementing role-based data filtering and workflows in ClaimTech
**When to Use:** When adding new features that require different views for admins vs engineers
**Estimated Time:** 30 minutes - 2 hours (depending on complexity)
**Last Updated:** October 25, 2025

---

## Overview

ClaimTech implements role-based access control with **three security layers**:
1. **Route Protection** - Parent layout redirects non-admins from admin routes
2. **Service Layer Filtering** - Services accept optional `engineer_id` parameter
3. **RLS Policies** - Database-level enforcement (backup layer)

This SOP covers implementing filtering at layers 1 and 2 (most common use case).

---

## Prerequisites

Before starting, ensure you understand:
- ✅ SvelteKit page server loads and layouts
- ✅ Parent layout data access (`await parent()`)
- ✅ Service layer pattern (ServiceClient injection)
- ✅ TypeScript optional parameters

**Required Reading:**
- [Project Architecture - Engineer Workflow](../System/project_architecture.md#5-engineer-workflow--role-based-filtering)
- [Working with Services](./working_with_services.md)

---

## When to Implement Role-Based Filtering

### Implement Filtering When:
- ✅ Creating new work-related pages (appointments, assessments, etc.)
- ✅ Adding badge counts or metrics to sidebar/dashboard
- ✅ Creating archive or history pages
- ✅ Implementing any data listing that engineers should see filtered

### Skip Filtering When:
- ❌ Admin-only pages (clients, engineers, settings) - use route protection only
- ❌ Public pages (login, forgot password)
- ❌ Global configuration data

---

## Step-by-Step Implementation

### Step 1: Update Service Method Signatures (10-20 min)

**Pattern:** Add optional `engineer_id` parameter to service methods

#### 1.1 List/Query Methods

**Before:**
```typescript
async listAppointments(
  filters?: { status?: string },
  client?: ServiceClient
): Promise<Appointment[]> {
  // ...
}
```

**After:**
```typescript
async listAppointments(
  filters?: {
    status?: string;
    engineer_id?: string;  // ✅ Add this
  },
  client?: ServiceClient
): Promise<Appointment[]> {
  // ...
}
```

#### 1.2 Count Methods

**Before:**
```typescript
async getInProgressCount(
  client?: ServiceClient
): Promise<number> {
  // ...
}
```

**After:**
```typescript
async getInProgressCount(
  client?: ServiceClient,
  engineer_id?: string | null  // ✅ Add this
): Promise<number> {
  // ...
}
```

**💡 Tip:** For count methods, use `engineer_id` as second parameter (after client) for consistency

---

### Step 2: Implement Service Layer Filtering (15-30 min)

#### 2.1 Direct Table Queries

For tables with `engineer_id` column (e.g., `appointments`, `inspections`):

```typescript
async listAppointments(filters?: {
  status?: string;
  engineer_id?: string;
}, client?: ServiceClient): Promise<Appointment[]> {
  const db = client ?? supabase;

  let query = db
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  // ✅ Filter by engineer if engineer_id provided
  if (filters?.engineer_id) {
    query = query.eq('engineer_id', filters.engineer_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing appointments:', error);
    throw new Error(`Failed to list appointments: ${error.message}`);
  }

  return data || [];
}
```

#### 2.2 Joined Table Queries

For tables that join through `appointments` (e.g., `assessments`, `frc`, `additionals`):

```typescript
async getInProgressAssessments(
  client?: ServiceClient,
  engineer_id?: string | null
): Promise<any[]> {
  const db = client ?? supabase;

  let query = db
    .from('assessments')
    .select(`
      *,
      appointment:appointments!inner(
        id,
        engineer_id,  // ✅ Include engineer_id in select
        inspection_id
      )
    `)
    .eq('status', 'in_progress');

  // ✅ Filter by engineer through join
  if (engineer_id) {
    query = query.eq('appointment.engineer_id', engineer_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching assessments:', error);
    return [];
  }

  return data || [];
}
```

#### 2.3 Deep Nested Joins

For deeply nested relationships (e.g., `additionals` → `assessments` → `appointments`):

```typescript
async listAdditionals(
  client?: ServiceClient,
  engineer_id?: string | null
): Promise<any[]> {
  const db = client ?? supabase;

  let query = db
    .from('assessment_additionals')
    .select(`
      *,
      assessment:assessments!inner(
        id,
        appointment:appointments!inner(
          id,
          engineer_id  // ✅ Include in deep join
        )
      )
    `);

  // ✅ Filter through nested relationship
  if (engineer_id) {
    query = query.eq('assessment.appointment.engineer_id', engineer_id);
  }

  const { data, error } = await query;

  // ... rest of implementation
}
```

#### 2.4 Count Queries with Joins

```typescript
async getCountByStatus(
  status: string,
  client?: ServiceClient,
  engineer_id?: string | null
): Promise<number> {
  const db = client ?? supabase;

  let query = db
    .from('assessment_frc')
    .select('*, assessments!inner(appointment_id, appointments!inner(engineer_id))', {
      count: 'exact',
      head: true
    })
    .eq('status', status);

  // ✅ Filter count by engineer
  if (engineer_id) {
    query = query.eq('assessments.appointments.engineer_id', engineer_id);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error counting FRC:', error);
    return 0;
  }

  return count || 0;
}
```

---

### Step 3: Update Page Server Loads (10-20 min)

#### 3.1 Get Role & Engineer ID from Parent

**Every filtered page server must:**

```typescript
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
  // ✅ ALWAYS get role and engineer_id from parent layout
  const { role, engineer_id } = await parent();
  const isEngineer = role === 'engineer';

  // ... use for filtering below
};
```

**💡 Why?** The parent layout (`/routes/(app)/+layout.server.ts`) extracts role and engineer_id once, making it available to all child routes via `await parent()`.

#### 3.2 Apply Filtering to Service Calls

**Pattern for list queries:**
```typescript
export const load: PageServerLoad = async ({ locals, parent }) => {
  const { role, engineer_id } = await parent();
  const isEngineer = role === 'engineer';

  // ✅ Pass engineer_id if engineer role
  const appointments = await appointmentService.listAppointments(
    {
      status: 'scheduled',
      ...(isEngineer && engineer_id && { engineer_id })  // Conditional spread
    },
    locals.supabase
  );

  return { appointments };
};
```

**Alternative (clearer) pattern:**
```typescript
export const load: PageServerLoad = async ({ locals, parent }) => {
  const { role, engineer_id } = await parent();
  const isEngineer = role === 'engineer';

  // Build filters object
  const filters: any = { status: 'scheduled' };
  if (isEngineer && engineer_id) {
    filters.engineer_id = engineer_id;
  }

  const appointments = await appointmentService.listAppointments(
    filters,
    locals.supabase
  );

  return { appointments };
};
```

**Pattern for count queries:**
```typescript
export const load: PageServerLoad = async ({ locals, parent }) => {
  const { role, engineer_id } = await parent();
  const isEngineer = role === 'engineer';

  // ✅ Pass engineer_id as parameter (undefined for admin)
  const count = await assessmentService.getInProgressCount(
    locals.supabase,
    isEngineer ? engineer_id : undefined
  );

  return { count };
};
```

#### 3.3 Admin-Only Data (Skip for Engineers)

For data that engineers should NEVER see:

```typescript
export const load: PageServerLoad = async ({ locals, parent }) => {
  const { role, engineer_id } = await parent();
  const isEngineer = role === 'engineer';

  const [
    // Engineer data
    appointments,
    assessments,
    // Admin-only data
    requests,
    inspections
  ] = await Promise.all([
    appointmentService.listAppointments(
      isEngineer && engineer_id ? { engineer_id } : {},
      locals.supabase
    ),
    assessmentService.getInProgressAssessments(
      locals.supabase,
      isEngineer ? engineer_id : undefined
    ),
    // ✅ Return empty arrays for engineers (admin-only)
    isEngineer ? [] : requestService.listRequests(locals.supabase),
    isEngineer ? [] : inspectionService.listInspections(locals.supabase)
  ]);

  return {
    appointments,
    assessments,
    requests,
    inspections
  };
};
```

---

### Step 4: Update Sidebar Badge Counts (10-15 min)

If your feature has sidebar badge counts:

#### 4.1 Update Badge Loading Functions

**File:** `src/lib/components/layout/Sidebar.svelte`

```typescript
async function loadAppointmentCount() {
  try {
    const filters: any = { status: 'scheduled' };

    // ✅ Filter by engineer if engineer role
    if (role === 'engineer' && engineer_id) {
      filters.engineer_id = engineer_id;
    }

    appointmentCount = await appointmentService.getAppointmentCount(
      filters,
      $page.data.supabase
    );
  } catch (error) {
    console.error('Error loading appointment count:', error);
  }
}
```

**For count methods with engineer_id as second parameter:**
```typescript
async function loadAssessmentCount() {
  try {
    const engineerIdFilter = role === 'engineer' ? engineer_id : undefined;

    assessmentCount = await assessmentService.getInProgressCount(
      $page.data.supabase,
      engineerIdFilter  // ✅ Second parameter
    );
  } catch (error) {
    console.error('Error loading assessment count:', error);
  }
}
```

---

### Step 5: Test Role-Based Filtering (15-30 min)

#### 5.1 Testing Checklist

**As Admin:**
- [ ] Page loads without errors
- [ ] Sees ALL data (not filtered)
- [ ] Badge counts show total system counts
- [ ] Can access all sections

**As Engineer:**
- [ ] Page loads without errors
- [ ] Sees ONLY their assigned data
- [ ] Badge counts show only their counts
- [ ] Cannot access admin-only routes (redirected)
- [ ] Archive shows only their archived data

#### 5.2 Manual Testing Steps

1. **Create test engineer account:**
   ```bash
   # Via /engineers/new (as admin)
   # Note the engineer_id from database
   ```

2. **Assign test data to engineer:**
   ```sql
   -- Update appointments to assign to test engineer
   UPDATE appointments
   SET engineer_id = 'test-engineer-id'
   WHERE id = 'some-appointment-id';
   ```

3. **Login as engineer and verify:**
   - Dashboard shows only assigned work
   - Work pages show only assigned items
   - Badge counts reflect only assigned work
   - Archive shows only their data

4. **Login as admin and verify:**
   - Dashboard shows ALL work
   - Work pages show ALL items
   - Badge counts show total counts
   - Can see all engineer's work

---

## Common Patterns & Examples

### Pattern 1: Direct Engineer ID Column

**Use when:** Table has `engineer_id` column (e.g., `appointments`, `inspections`)

```typescript
if (filters?.engineer_id) {
  query = query.eq('engineer_id', filters.engineer_id);
}
```

### Pattern 2: Single Join Through Appointments

**Use when:** Table joins to `appointments` (e.g., `assessments`)

```typescript
// In service method
select(`
  *,
  appointment:appointments!inner(
    id,
    engineer_id  // Include in select
  )
`)

// Filtering
if (engineer_id) {
  query = query.eq('appointment.engineer_id', engineer_id);
}
```

### Pattern 3: Deep Nested Joins

**Use when:** Multiple levels of joins (e.g., `additionals` → `assessments` → `appointments`)

```typescript
// In service method
select(`
  *,
  assessment:assessments!inner(
    id,
    appointment:appointments!inner(
      id,
      engineer_id
    )
  )
`)

// Filtering
if (engineer_id) {
  query = query.eq('assessment.appointment.engineer_id', engineer_id);
}
```

### Pattern 4: Archive Pages

**Use when:** Creating archive/history pages with multiple entity types

```typescript
export const load: PageServerLoad = async ({ locals, parent }) => {
  const { role, engineer_id } = await parent();
  const isEngineer = role === 'engineer';

  const [
    archivedAssessments,
    cancelledAppointments,
    // Admin-only
    cancelledRequests,
    cancelledInspections
  ] = await Promise.all([
    // Engineer data (filtered)
    assessmentService.listArchivedAssessments(
      locals.supabase,
      isEngineer ? engineer_id : undefined
    ),
    appointmentService.listCancelledAppointments(
      locals.supabase,
      isEngineer ? engineer_id : undefined
    ),
    // Admin-only (empty for engineers)
    isEngineer ? [] : requestService.listCancelledRequests(locals.supabase),
    isEngineer ? [] : inspectionService.listCancelledInspections(locals.supabase)
  ]);

  return {
    archivedAssessments,
    cancelledAppointments,
    cancelledRequests,
    cancelledInspections
  };
};
```

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Forgetting to Include engineer_id in Select

**Problem:**
```typescript
.select(`
  *,
  appointment:appointments!inner(id)  // ❌ Missing engineer_id
`)

if (engineer_id) {
  query = query.eq('appointment.engineer_id', engineer_id);  // ❌ Won't work!
}
```

**Solution:**
```typescript
.select(`
  *,
  appointment:appointments!inner(
    id,
    engineer_id  // ✅ Include in select
  )
`)
```

**Why:** You can only filter on fields included in the select statement.

---

### ❌ Pitfall 2: Not Calling await parent()

**Problem:**
```typescript
export const load: PageServerLoad = async ({ locals }) => {
  // ❌ Not getting role/engineer_id from parent
  const data = await service.listItems(locals.supabase);
  return { data };
};
```

**Solution:**
```typescript
export const load: PageServerLoad = async ({ locals, parent }) => {
  const { role, engineer_id } = await parent();  // ✅ Get from parent
  const isEngineer = role === 'engineer';

  const data = await service.listItems(
    locals.supabase,
    isEngineer ? engineer_id : undefined
  );
  return { data };
};
```

---

### ❌ Pitfall 3: Inconsistent Parameter Order

**Problem:**
```typescript
// Some methods
async methodA(client?: ServiceClient, engineer_id?: string) { }

// Other methods
async methodB(engineer_id?: string, client?: ServiceClient) { }
```

**Solution:** Follow consistent pattern:
```typescript
// ✅ For list/query methods - engineer_id in filters object
async listItems(filters?: { engineer_id?: string }, client?: ServiceClient) { }

// ✅ For count methods - engineer_id as second parameter
async getCount(client?: ServiceClient, engineer_id?: string | null) { }
```

---

### ❌ Pitfall 4: Badge Counts Not Filtering

**Problem:**
```typescript
async function loadAppointmentCount() {
  // ❌ Not filtering by engineer
  appointmentCount = await appointmentService.getAppointmentCount(
    { status: 'scheduled' },
    $page.data.supabase
  );
}
```

**Solution:**
```typescript
async function loadAppointmentCount() {
  const filters: any = { status: 'scheduled' };

  // ✅ Add engineer filter
  if (role === 'engineer' && engineer_id) {
    filters.engineer_id = engineer_id;
  }

  appointmentCount = await appointmentService.getAppointmentCount(
    filters,
    $page.data.supabase
  );
}
```

---

### ❌ Pitfall 5: Null/Undefined Engineer ID

**Problem:**
```typescript
const data = await service.listItems(
  locals.supabase,
  engineer_id  // ❌ Could be null/undefined for admin
);
```

**Solution:**
```typescript
const data = await service.listItems(
  locals.supabase,
  isEngineer ? engineer_id : undefined  // ✅ Explicit undefined for admin
);
```

**Why:** Service methods check `if (engineer_id)` which is falsy for both `null` and `undefined`, but being explicit is clearer.

---

## Quick Reference Checklist

Use this checklist when implementing role-based filtering:

### Service Layer
- [ ] Add `engineer_id` parameter to method signature
- [ ] Include `engineer_id` in select for joined tables
- [ ] Add conditional filtering: `if (engineer_id) { query = query.eq(...) }`
- [ ] Test with both engineer and admin accounts
- [ ] Update JSDoc comments with parameter description

### Page Server
- [ ] Import `PageServerLoad` type
- [ ] Call `await parent()` to get role and engineer_id
- [ ] Create `isEngineer` boolean for readability
- [ ] Pass engineer_id to service calls (conditional)
- [ ] Return empty arrays for admin-only data if engineer

### Sidebar Badges
- [ ] Accept `role` and `engineer_id` as props
- [ ] Update badge loading functions to filter
- [ ] Use conditional spread or if statement for filters
- [ ] Test badge counts with engineer account

### Testing
- [ ] Create test engineer account
- [ ] Assign test data to engineer
- [ ] Verify engineer sees only their data
- [ ] Verify admin sees all data
- [ ] Verify badge counts are accurate
- [ ] Test archive page filtering

---

## Related Documentation

- [Project Architecture - Engineer Workflow](../System/project_architecture.md#5-engineer-workflow--role-based-filtering)
- [Working with Services](./working_with_services.md)
- [Adding Page Routes](./adding_page_route.md)
- [Engineer Registration Auth](../Tasks/active/engineer_registration_auth.md)
- [Engineer Workflow Spec](../../engineer flow.md)

---

## Troubleshooting

### Issue: Engineers seeing admin data

**Diagnosis:**
1. Check page server calls `await parent()`
2. Verify service methods receive engineer_id
3. Check service implements filtering logic
4. Verify RLS policies (if applicable)

**Fix:** Add filtering at service and page server layers

---

### Issue: Badge counts showing wrong numbers

**Diagnosis:**
1. Check Sidebar receives `role` and `engineer_id` props
2. Verify badge loading functions filter by engineer
3. Check service count methods support engineer_id

**Fix:** Update badge loading functions to pass engineer_id

---

### Issue: NULL engineer_id in database

**Diagnosis:**
1. Check appointment creation includes engineer_id
2. Verify inspection assignment sets engineer_id
3. Check database has correct foreign keys

**Fix:** Update appointment/inspection creation to set engineer_id

---

## Examples from Codebase

### Example 1: Appointment Service

**File:** `src/lib/services/appointment.service.ts`

```typescript
async listAppointments(filters?: {
  status?: AppointmentStatus;
  engineer_id?: string;
}, client?: ServiceClient): Promise<Appointment[]> {
  const db = client ?? supabase;

  let query = db.from('appointments').select('*');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.engineer_id) {
    query = query.eq('engineer_id', filters.engineer_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing appointments:', error);
    throw new Error(`Failed to list appointments: ${error.message}`);
  }

  return data || [];
}
```

### Example 2: Appointments Page Server

**File:** `src/routes/(app)/work/appointments/+page.server.ts`

```typescript
export const load: PageServerLoad = async ({ locals, parent }) => {
  const { role, engineer_id } = await parent();
  const isEngineer = role === 'engineer';

  const [allAppointments, clients, engineers] = await Promise.all([
    appointmentService.listAppointments(
      isEngineer ? { status: 'scheduled', engineer_id: engineer_id! } : { status: 'scheduled' },
      locals.supabase
    ),
    clientService.listClients(true, locals.supabase),
    engineerService.listEngineers(true, locals.supabase)
  ]);

  return {
    appointments: allAppointments,
    clients,
    engineers
  };
};
```

### Example 3: Assessment Service with Deep Join

**File:** `src/lib/services/assessment.service.ts`

```typescript
async getInProgressAssessments(
  client?: ServiceClient,
  engineer_id?: string | null
): Promise<any[]> {
  const db = client ?? supabase;

  let query = db
    .from('assessments')
    .select(`
      *,
      appointment:appointments!inner(
        id,
        engineer_id,
        inspection:inspections!inner(
          id,
          request:requests!inner(
            id,
            request_number,
            client:clients!inner(id, name)
          )
        )
      )
    `)
    .eq('status', 'in_progress');

  if (engineer_id) {
    query = query.eq('appointment.engineer_id', engineer_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching in-progress assessments:', error);
    return [];
  }

  return data || [];
}
```

---

**Version:** 1.0
**Last Updated:** October 25, 2025
**Author:** ClaimTech Development Team
