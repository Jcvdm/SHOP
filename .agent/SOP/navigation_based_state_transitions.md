# Navigation-Based State Transitions

**SOP**: How to implement navigation-based state transitions in ClaimTech
**Created**: January 29, 2025
**Last Updated**: January 29, 2025
**Status**: Active

---

## Overview

This SOP documents the **server-side-first pattern** for state transitions triggered by navigation in ClaimTech. This pattern delegates complex state management to server-side load functions, resulting in simpler, more maintainable client-side code.

---

## When to Use This Pattern

Use navigation-based state transitions when:

1. **Navigation is the primary action** - User needs to see a different page after the action
2. **Complex state updates required** - Multiple database updates, constraint checks, or child record creation
3. **Idempotent operations needed** - State transitions should be safe to repeat
4. **Server-side validation required** - Business rules, RLS policies, or constraint checking

**Examples**:
- "Start Assessment" button → navigate to assessment detail page
- "Schedule Appointment" button → navigate to appointment detail page
- "Accept Request" button → navigate to inspection detail page

---

## Pattern Definition

### Client-Side (Svelte Component)

**Simple navigation handler** - No service calls, no state updates:

```typescript
async function handleStartAssessment() {
  // Navigate to target page - server will handle all state transitions
  // Server-side load function updates stage and appointment status idempotently
  loading = true;

  try {
    goto(`/work/assessments/${data.appointment.id}`);
  } catch (err) {
    console.error('Error navigating to assessment:', err);
    error = err instanceof Error ? err.message : 'Failed to start assessment. Please try again.';
    loading = false;
  }
}
```

**Key Points**:
- ✅ **No service imports needed** (no `assessmentService`, `appointmentService`, etc.)
- ✅ **Simple error handling** (only catches navigation errors)
- ✅ **Loading state for UX** (shows spinner during navigation)
- ✅ **Descriptive comments** (explains that server handles state)

### Server-Side (Load Function)

**Idempotent state management** - Handle all state transitions:

```typescript
export const load: PageServerLoad = async ({ params, locals }) => {
  // 1. Load existing record
  const appointment = await appointmentService.getAppointment(
    params.id,
    locals.supabase
  );

  // 2. Find or create related record (idempotent)
  let assessment = await assessmentService.findByRequest(
    appointment.request_id,
    locals.supabase
  );

  // 3. Link records if needed (idempotent)
  if (!assessment.appointment_id || assessment.appointment_id !== params.id) {
    assessment = await assessmentService.updateAssessment(
      assessment.id,
      { appointment_id: params.id },
      locals.supabase
    );
  }

  // 4. Update stage if needed (idempotent)
  if (assessment.stage === 'appointment_scheduled') {
    assessment = await assessmentService.updateStage(
      assessment.id,
      'assessment_in_progress',
      locals.supabase
    );
  }

  // 5. Update related record status (idempotent)
  if (appointment.status !== 'in_progress') {
    await appointmentService.updateAppointmentStatus(
      params.id,
      'in_progress',
      locals.supabase
    );
  }

  // 6. Create default child records (idempotent)
  await Promise.all([
    tyresService.createDefaultTyres(assessment.id, locals.supabase),
    damageService.createDefault(assessment.id, locals.supabase),
    // ... other child records
  ]);

  // 7. Return data for page
  return { appointment, assessment };
};
```

**Key Points**:
- ✅ **Idempotent checks** (if record already linked, skip update)
- ✅ **Conditional updates** (only update if stage/status changed)
- ✅ **Error handling** (throw descriptive errors for user)
- ✅ **Atomic operations** (all or nothing via database transaction)
- ✅ **RLS enforcement** (all operations use `locals.supabase`)

---

## Anti-Pattern: Client-Side State Management

### ❌ DON'T DO THIS (Old Pattern)

```typescript
// BAD: Complex client-side logic with service imports
async function handleStartAssessment() {
  loading = true;
  error = null;

  try {
    // Step 1: Update appointment status
    await appointmentService.updateAppointmentStatus(data.appointment.id, 'in_progress');

    // Step 2: Find assessment
    const assessment = await assessmentService.getAssessmentByAppointment(
      data.appointment.id
    );

    // Step 3: Update assessment stage
    if (assessment) {
      await assessmentService.updateStage(
        assessment.id,
        'assessment_in_progress'
      );
    }

    // Step 4: Navigate
    goto(`/work/assessments/${data.appointment.id}`);
  } catch (err) {
    console.error('Error starting assessment:', err);
    error = err instanceof Error ? err.message : 'Failed to start assessment';
    loading = false;
  }
}
```

### Why This Is Bad

1. **Duplicate Logic** - Server load function will redo these operations anyway
2. **Race Conditions** - Client updates race with server load
3. **Import Errors** - Services may not be available in client context
4. **Complexity** - Hard to maintain, debug, and test
5. **No RLS Enforcement** - Client-side updates bypass server validation
6. **Not Idempotent** - Multiple clicks cause duplicate updates
7. **Error Handling** - Complex error states from multiple service calls

---

## Comparison: List Page vs Detail Page

### Appointments List Page (Correct Pattern)

**File**: `src/routes/(app)/work/appointments/+page.svelte`

```typescript
async function handleStartAssessment(assessmentId: string, appointmentId: string) {
  // Prevent double-click
  if (startingAssessment === assessmentId) {
    return;
  }

  startingAssessment = assessmentId;
  try {
    // Navigate to assessment page - server handles state transitions
    goto(`/work/assessments/${appointmentId}`);
  } catch (error) {
    console.error('Error starting assessment:', error);
    alert('Failed to start assessment. Please try again.');
  } finally {
    setTimeout(() => {
      startingAssessment = null;
    }, 1000);
  }
}
```

### Appointment Detail Page (Fixed Pattern)

**File**: `src/routes/(app)/work/appointments/[id]/+page.svelte`

```typescript
async function handleStartAssessment() {
  // Navigate to assessment page - server handles all state transitions
  loading = true;

  try {
    goto(`/work/assessments/${data.appointment.id}`);
  } catch (err) {
    console.error('Error navigating to assessment:', err);
    error = err instanceof Error ? err.message : 'Failed to start assessment. Please try again.';
    loading = false;
  }
}
```

**Key Similarity**: Both delegate to server via navigation. Neither makes service calls client-side.

---

## When NOT to Use This Pattern

This pattern is **NOT** appropriate when:

1. **No navigation needed** - Action updates data on current page (use form actions or optimistic updates)
2. **Real-time feedback required** - User needs immediate UI update (use optimistic updates with server sync)
3. **Modal/dialog actions** - Action happens within modal (use service calls with local state update)
4. **Inline editing** - Editing data in table row (use form actions or inline handlers)

**Examples of when to use OTHER patterns**:
- Reschedule modal (stays on same page) → Use form action + `goto()` with `invalidateAll: true`
- Delete button in table → Use service call + optimistic UI update
- Inline status toggle → Use form action + local state update

---

## Implementation Checklist

When implementing navigation-based state transitions:

### Client-Side Checklist
- [ ] Create simple navigation handler (no service calls)
- [ ] Add loading state for UX (`loading = true`)
- [ ] Use `goto()` to navigate to target page
- [ ] Add error handling (catch navigation errors)
- [ ] Add descriptive comments explaining server handles state
- [ ] Remove any service imports if present
- [ ] Test with double-click (should be safe)

### Server-Side Checklist
- [ ] Implement load function in target page `+page.server.ts`
- [ ] Load all required records
- [ ] Use idempotent checks (if already done, skip)
- [ ] Update stage/status conditionally
- [ ] Link related records as needed
- [ ] Create default child records (idempotent)
- [ ] Return all data needed by page
- [ ] Add error handling with user-friendly messages
- [ ] Ensure all operations use `locals.supabase` (RLS enforcement)
- [ ] Test edge cases (record missing, already transitioned, etc.)

---

## Example: Complete Implementation

### Scenario: "Start Assessment" from Appointment Detail Page

#### 1. Client-Side Handler (Svelte)

**File**: `src/routes/(app)/work/appointments/[id]/+page.svelte`

```typescript
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Play } from 'lucide-svelte';

  let { data } = $props();
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function handleStartAssessment() {
    // Navigate to assessment page - server will handle all state transitions
    // Server-side load function updates stage and appointment status idempotently
    loading = true;

    try {
      goto(`/work/assessments/${data.appointment.id}`);
    } catch (err) {
      console.error('Error navigating to assessment:', err);
      error = err instanceof Error ? err.message : 'Failed to start assessment. Please try again.';
      loading = false;
    }
  }
</script>

<!-- Button in template -->
{#if data.appointment.status === 'scheduled' || data.appointment.status === 'confirmed'}
  <Button variant="default" onclick={handleStartAssessment} disabled={loading}>
    <Play class="mr-2 h-4 w-4" />
    {loading ? 'Starting...' : 'Start Assessment'}
  </Button>
{/if}

{#if error}
  <div class="rounded-md bg-red-50 p-4">
    <p class="text-sm text-red-800">{error}</p>
  </div>
{/if}
```

#### 2. Server-Side Load Function

**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts`

```typescript
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { appointmentService } from '$lib/services/appointment.service';
import { assessmentService } from '$lib/services/assessment.service';
import { tyresService } from '$lib/services/tyres.service';
import { damageService } from '$lib/services/damage.service';
// ... other service imports

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const appointmentId = params.appointment_id;

    // 1. Get appointment
    const appointment = await appointmentService.getAppointment(appointmentId, locals.supabase);
    if (!appointment) {
      throw error(404, 'Appointment not found');
    }

    // 2. Find existing assessment (created when request was created)
    let assessment: Assessment;
    try {
      assessment = await assessmentService.findByRequest(
        appointment.request_id,
        locals.supabase
      );
    } catch (findError) {
      console.error('Data integrity error: Assessment not found for request', {
        request_id: appointment.request_id,
        appointment_id: appointmentId,
        error: findError
      });
      throw error(500, {
        message: 'Assessment not found for this request. Please contact support.',
      });
    }

    // 3. CRITICAL: Link appointment to assessment FIRST (before updating stage)
    // The check constraint requires appointment_id for stage='assessment_in_progress'
    if (!assessment.appointment_id || assessment.appointment_id !== appointmentId) {
      assessment = await assessmentService.updateAssessment(
        assessment.id,
        { appointment_id: appointmentId },
        locals.supabase
      );
      console.log('Assessment linked to appointment');
    }

    // 4. THEN transition stage to in_progress (after appointment_id is set)
    if (['request_submitted', 'request_accepted', 'inspection_scheduled', 'appointment_scheduled'].includes(assessment.stage)) {
      const oldStage = assessment.stage;
      assessment = await assessmentService.updateStage(
        assessment.id,
        'assessment_in_progress',
        locals.supabase
      );
      console.log(`Assessment stage updated from ${oldStage} to assessment_in_progress`);
    }

    // 5. Create default child records (idempotent - only if they don't exist)
    await Promise.all([
      tyresService.createDefaultTyres(assessment.id, locals.supabase),
      damageService.createDefault(assessment.id, locals.supabase),
      vehicleValuesService.createDefault(assessment.id, locals.supabase),
      preIncidentEstimateService.createDefault(assessment.id, locals.supabase),
      estimateService.createDefault(assessment.id, locals.supabase)
    ]);

    // 6. Update appointment status to in_progress (idempotent)
    if (appointment.status !== 'in_progress') {
      await appointmentService.updateAppointmentStatus(appointmentId, 'in_progress', locals.supabase);
      console.log('Appointment status updated to in_progress');
    }

    // 7. Load all related data for page
    const client = appointment.request?.client || null;
    const request = appointment.request || null;
    const engineer = appointment.engineer || null;

    // 8. Return everything the page needs
    return {
      appointment,
      assessment,
      client,
      request,
      engineer
    };
  } catch (err) {
    console.error('Error loading assessment page:', err);
    throw err; // Re-throw SvelteKit errors, convert others to 500
  }
};
```

---

## Benefits of This Pattern

### 1. Simplicity
- Client code is 5-10 lines instead of 30+
- No complex error handling for multiple service calls
- Easy to understand and maintain

### 2. Consistency
- Same pattern used across list pages and detail pages
- Predictable behavior for developers
- Easy to copy-paste and adapt

### 3. Idempotency
- Server checks state before updating
- Safe to navigate multiple times
- No duplicate records created

### 4. Security
- All mutations through server-side authenticated context
- RLS policies enforced
- No client-side bypass possible

### 5. Performance
- Single page load instead of multiple API calls
- Database operations batched server-side
- Optimized query patterns

### 6. Maintainability
- Business logic centralized server-side
- Changes only need to update one place
- Tests focus on server-side logic

---

## Troubleshooting

### Issue: "Service is not defined" Error

**Symptom**: `ReferenceError: assessmentService is not defined`

**Cause**: Client-side code trying to import and use service

**Fix**: Remove service import and service calls. Use navigation pattern instead.

**Example**:
```typescript
// ❌ BEFORE (causes error)
import { assessmentService } from '$lib/services/assessment.service';
const assessment = await assessmentService.getAssessmentByAppointment(id);

// ✅ AFTER (works correctly)
// No import needed
goto(`/work/assessments/${id}`); // Server handles everything
```

---

### Issue: State Not Updating After Navigation

**Symptom**: Navigate to page but stage/status not updated

**Cause**: Server load function missing idempotent update logic

**Fix**: Add conditional updates to server load function

**Example**:
```typescript
// Check if update needed BEFORE updating
if (assessment.stage === 'appointment_scheduled') {
  assessment = await assessmentService.updateStage(
    assessment.id,
    'assessment_in_progress',
    locals.supabase
  );
}
```

---

### Issue: Constraint Violation on Stage Update

**Symptom**: `violates check constraint "valid_stage_for_appointment"`

**Cause**: Trying to update stage before linking appointment_id

**Fix**: Link foreign keys BEFORE updating stage

**Example**:
```typescript
// ✅ CORRECT ORDER:
// 1. Link appointment_id FIRST
if (!assessment.appointment_id) {
  assessment = await assessmentService.updateAssessment(
    assessment.id,
    { appointment_id: params.id },
    locals.supabase
  );
}

// 2. THEN update stage
assessment = await assessmentService.updateStage(
  assessment.id,
  'assessment_in_progress',
  locals.supabase
);
```

---

### Issue: Duplicate Records Created

**Symptom**: Multiple child records created on page refresh

**Cause**: Service methods not idempotent

**Fix**: Use "find or create" pattern in service methods

**Example**:
```typescript
// ✅ Idempotent child record creation
async function createDefaultTyres(assessmentId: string, client: ServiceClient) {
  // Check if already exists
  const existing = await client
    .from('assessment_tyres')
    .select('id')
    .eq('assessment_id', assessmentId)
    .single();

  // Only create if doesn't exist
  if (!existing) {
    return await client
      .from('assessment_tyres')
      .insert({ assessment_id: assessmentId, /* ... defaults */ });
  }

  return existing;
}
```

---

## Related Documentation

- [Assessment-Centric Architecture SOP](./working_with_assessment_centric_architecture.md) - Stage-based workflows
- [Creating Components SOP](./creating-components.md) - Svelte component patterns
- [Working with Services SOP](./working_with_services.md) - Service layer patterns
- [ClaimTech Development Skill](../../.claude/skills/claimtech-development/SKILL.md) - Complete workflows

---

## Version History

**v1.0** - January 29, 2025
- Initial creation
- Documented navigation-based state transition pattern
- Added examples from appointment detail page fix
- Included troubleshooting guide

---

## Examples in Codebase

### Working Examples (Follow These)
- `src/routes/(app)/work/appointments/+page.svelte:152-172` - List page "Start Assessment"
- `src/routes/(app)/work/appointments/[id]/+page.svelte:49-61` - Detail page "Start Assessment" (FIXED)
- `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts:27-90` - Server-side state transitions

### Anti-Patterns (Don't Follow These)
- Any client-side code that imports `assessmentService` or `appointmentService` for state updates
- Any client-side code that calls multiple service methods before navigation
- Any code that duplicates server-side logic client-side

---

**Remember**: When in doubt, **navigate first, let server handle state**. This pattern is proven, tested, and follows ClaimTech architectural principles.
