# SOP: Working with Assessment-Centric Architecture

## Overview

This SOP provides step-by-step guidance for working with ClaimTech's assessment-centric architecture. The assessment is the canonical "case" record that exists from request creation through FRC completion.

**When to use this SOP:**
- Implementing new features that involve assessments
- Updating assessment workflow stages
- Querying assessments by pipeline stage
- Understanding the assessment lifecycle
- Implementing Phase 3 (stage-based list pages)

**Related Documentation:**
- [Assessment-Centric Architecture PRD](../Tasks/active/assessment_centric_architecture_refactor.md)
- [All Fixes Complete](../Tasks/active/assessment_centric_fixes_complete.md)
- [Database Schema](../System/database_schema.md)

---

## Assessment Lifecycle

### Stage-Based Pipeline

Assessments progress through 10 distinct stages:

```
1. request_submitted (default)
     ↓ (Admin reviews)
2. request_reviewed
     ↓ (Admin schedules inspection)
3. inspection_scheduled
     ↓ (Admin/Engineer creates appointment)
4. appointment_scheduled
     ↓ (Engineer clicks "Start Assessment")
5. assessment_in_progress
     ↓ (Engineer completes all tabs, estimate under review)
6. estimate_review
     ↓ (Estimate sent to client)
7. estimate_sent
     ↓ (Admin finalizes estimate)
8. estimate_finalized
     ↓ (Admin starts FRC)
9. frc_in_progress
     ↓ (Admin archives)
10. archived

(Can be cancelled at any stage → cancelled)
```

**Stage Transitions (Jan 2025):**
- Stages 1-2: Request management (admin-only)
- Stage 3: Inspection scheduling (admin-only)
- Stage 4: Appointment creation (admin or engineer)
- Stages 5-7: Active assessment work (engineer)
- Stage 8: Finalized estimate (ready for documents/FRC)
- Stage 9: FRC in progress (admin)
- Stage 10: Archived or cancelled (terminal states)

### Key Principles

1. **Assessment created with request** - No more creation at "Start Assessment"
2. **One assessment per request** - Enforced by unique constraint
3. **Stage-based workflow** - Use `stage` field for pipeline tracking
4. **Nullable foreign keys** - `appointment_id` and `inspection_id` can be null initially
5. **Idempotent operations** - All creation methods are safe to call multiple times

### Design Rationale: Why Foreign Keys in "Assessment-Centric" Architecture?

**Important**: This is NOT a pure assessment-centric architecture, but a **pragmatic hybrid** that combines the benefits of:
- Assessment as canonical record (eliminates race conditions)
- Foreign keys for referential integrity and performance

**Why we keep `appointment_id` and `inspection_id` foreign keys:**

1. **RLS Policy Efficiency** - Engineer access control via simple FK joins:
   ```sql
   -- Efficient: Direct FK join
   WHERE appointment_id IN (
     SELECT id FROM appointments WHERE engineer_id = current_engineer
   )

   -- vs Complex: Multi-table join without FK
   WHERE request_id IN (
     SELECT request_id FROM appointments WHERE engineer_id = current_engineer
   )
   ```

2. **Database-Enforced Constraints** - Check constraint requires appointment_id for later stages:
   ```sql
   CHECK (
     CASE
       WHEN stage >= 'appointment_scheduled'
       THEN appointment_id IS NOT NULL
       ELSE TRUE
     END
   )
   ```

3. **Query Performance** - Indexed foreign keys enable fast queries:
   ```typescript
   // Direct query by appointment_id (indexed)
   const assessment = await assessmentService.getAssessmentByAppointment(appointmentId);
   ```

4. **Backward Compatibility** - Existing code expects these relationships:
   ```typescript
   // Legacy code still queries by inspection_id
   const assessment = await assessmentService.getAssessmentByInspectionId(inspectionId);
   ```

5. **Referential Integrity** - Database enforces valid relationships (cascades, prevents orphans)

**Trade-offs accepted:**
- ❌ Not "pure" assessment-centric (still has dependencies)
- ✅ Eliminates race conditions (assessment created early)
- ✅ Maintains performance (efficient RLS policies)
- ✅ Preserves simplicity (straightforward queries)
- ✅ Ensures data integrity (database-enforced)

**Alternative considered and rejected:** Remove foreign keys, make appointments point to assessments
- **Why rejected:** Introduces NEW race conditions (circular dependency), complex queries, breaking changes

**Conclusion:** The nullable foreign key pattern is **intentional** and provides the best balance of:
- Race condition elimination (original problem solved)
- Query performance (direct FK joins)
- Data integrity (database constraints)
- Backward compatibility (non-breaking)

---

## Appointment Management (Jan 2025)

### Appointment Lifecycle

Appointments are linked to assessments via nullable `appointment_id` foreign key. They support cancellation with automatic stage fallback and comprehensive rescheduling tracking.

**Appointment States:**
- `scheduled` - Initial state when created
- `confirmed` - Engineer confirmed attendance
- `in_progress` - Appointment is happening now
- `completed` - Appointment finished
- `cancelled` - Appointment cancelled (fallback to inspection stage)
- `rescheduled` - Appointment date/time changed

### Pattern: Cancel Appointment with Stage Fallback

**When:** Cancelling an appointment and reverting assessment to inspection scheduling

**Why Fallback is Needed:**
- When appointment cancelled, assessment can't stay at `appointment_scheduled` stage
- System automatically reverts to `inspection_scheduled` to continue workflow
- Enables admin to reschedule with new appointment

```typescript
import { appointmentService } from '$lib/services/appointment.service';

// Cancel with automatic stage fallback (Jan 2025)
const cancelledAppointment = await appointmentService.cancelAppointmentWithFallback(
  appointmentId,
  'Engineer unavailable due to emergency', // Optional reason
  locals.supabase
);

// Result:
// 1. Appointment status → 'cancelled'
// 2. Appointment cancelled_at → timestamp
// 3. Appointment cancellation_reason → reason
// 4. Assessment stage → 'inspection_scheduled' (automatic fallback)
// 5. Audit logs created for both operations
```

**What Happens Behind the Scenes:**
1. Cancels appointment using existing `cancelAppointment()` method
2. Finds related assessment via `inspection_id`
3. Updates assessment stage to `inspection_scheduled`
4. Creates comprehensive audit log for stage transition
5. Returns cancelled appointment

**Audit Trail Example:**
```json
{
  "entity_type": "assessment",
  "entity_id": "uuid",
  "action": "stage_transition",
  "field_name": "stage",
  "old_value": "appointment_scheduled",
  "new_value": "inspection_scheduled",
  "metadata": {
    "reason": "Appointment cancelled - fallback to inspection scheduling",
    "related_appointment_id": "appointment-uuid",
    "cancellation_reason": "Engineer unavailable due to emergency"
  }
}
```

**Error Handling:**
- If assessment not found, appointment is still cancelled (graceful degradation)
- If assessment update fails, appointment is still cancelled
- Console logs errors but doesn't throw exceptions

---

### Pattern: Reschedule Appointment with Tracking

**When:** Changing appointment date/time with proper tracking

**Why Tracking is Important:**
- Tracks how many times appointment rescheduled (reschedule_count)
- Preserves original appointment date for history
- Documents reason for rescheduling
- Creates distinct audit log (not generic "update")

```typescript
import { appointmentService } from '$lib/services/appointment.service';
import type { RescheduleAppointmentInput } from '$lib/types/appointment';

// Reschedule with comprehensive tracking (Jan 2025)
const input: RescheduleAppointmentInput = {
  appointment_date: '2025-01-30', // New date
  appointment_time: '14:00', // New time
  duration_minutes: 60,
  notes: 'Client requested afternoon slot',
  special_instructions: 'Call before arrival',
  // Location fields (for in-person appointments)
  location_address: '123 Main St',
  location_city: 'Cape Town',
  location_province: 'Western Cape',
  location_notes: 'Use back entrance'
};

const rescheduled = await appointmentService.rescheduleAppointment(
  appointmentId,
  input,
  'Client requested different time due to work conflict', // Optional reason
  locals.supabase
);

// Result:
// 1. Appointment appointment_date → new date
// 2. Appointment appointment_time → new time
// 3. Appointment status → 'rescheduled'
// 4. Appointment rescheduled_from_date → original date (preserved)
// 5. Appointment reschedule_count → incremented by 1
// 6. Appointment reschedule_reason → reason
// 7. Assessment stage → UNCHANGED (appointment still active)
// 8. Audit log created with before/after details
```

**Smart Reschedule Detection:**
- Only increments `reschedule_count` if date OR time actually changes
- If only location/notes change, uses `updateAppointment()` instead
- Prevents false reschedule counts from minor updates

```typescript
// Example: Only location changed
const dateChanged = input.appointment_date !== currentAppointment.appointment_date;
const timeChanged = input.appointment_time !== currentAppointment.appointment_time;

if (!dateChanged && !timeChanged) {
  // No reschedule needed - just update other fields
  return this.updateAppointment(id, input, client);
}
// Otherwise proceed with reschedule tracking
```

**Audit Trail Example:**
```json
{
  "entity_type": "appointment",
  "entity_id": "uuid",
  "action": "rescheduled",
  "field_name": "appointment_date",
  "old_value": "2025-01-28T10:00:00Z",
  "new_value": "2025-01-30T14:00:00Z",
  "metadata": {
    "appointment_number": "APT-2025-001",
    "original_date": "2025-01-28T10:00:00Z",
    "original_time": "10:00",
    "new_date": "2025-01-30",
    "new_time": "14:00",
    "reschedule_count": 2,
    "reason": "Client requested different time due to work conflict",
    "changed_fields": ["appointment_date", "appointment_time", "notes"]
  }
}
```

**Reschedule Tracking Fields (Migration 076):**
```sql
-- Added January 27, 2025
rescheduled_from_date TIMESTAMPTZ  -- Original date before most recent reschedule
reschedule_count INTEGER DEFAULT 0  -- Number of times rescheduled
reschedule_reason TEXT              -- Reason for most recent reschedule
```

**UI Integration:**
```typescript
// Display reschedule history on appointment detail page
{#if appointment.reschedule_count > 0}
  <div class="alert alert-warning">
    <p>Appointment rescheduled {appointment.reschedule_count} time(s)</p>
    {#if appointment.rescheduled_from_date}
      <p>Original date: {formatDate(appointment.rescheduled_from_date)}</p>
    {/if}
    {#if appointment.reschedule_reason}
      <p>Reason: {appointment.reschedule_reason}</p>
    {/if}
  </div>
{/if}
```

---

## Cancelling Assessments (Jan 2025)

### Assessment Cancellation Pattern

**When:** Cancelling an assessment at any stage to stop work

**Why Cancellation is Needed:**
- Assessments can be cancelled from any stage (terminal state)
- Cancelled assessments move to Archive page for reactivation if needed
- Provides clean way to stop work without deleting records

**Service Method:**
```typescript
import { assessmentService } from '$lib/services/assessment.service';

// Cancel assessment (sets both status and stage to cancelled)
const cancelledAssessment = await assessmentService.cancelAssessment(
  assessmentId,
  client // Optional: authenticated Supabase client
);

// Result:
// 1. Assessment status → 'cancelled'
// 2. Assessment cancelled_at → timestamp
// 3. Assessment stage → 'cancelled' (terminal state)
// 4. Audit logs created for both status and stage changes
```

**What Happens Behind the Scenes:**
1. Updates assessment status to `'cancelled'` (sets `cancelled_at` timestamp)
2. Updates assessment stage to `'cancelled'` (terminal state)
3. Creates audit log for status change
4. Creates audit log for stage transition
5. Returns updated assessment

**UI Integration:**

**Open Assessments Table:**
```typescript
// Cancel button in table actions
<ActionIconButton
  icon={XCircle}
  label="Cancel Assessment"
  onclick={() => handleCancelAssessment(row)}
  variant="destructive"
  loading={cancellingAssessmentId === row.id}
  disabled={cancellingAssessmentId !== null}
/>

async function handleCancelAssessment(assessment) {
  if (!confirm('Are you sure you want to cancel this assessment? This action cannot be undone.')) {
    return;
  }
  
  cancellingAssessmentId = assessment.id;
  try {
    await assessmentService.cancelAssessment(assessment.id);
    await invalidateAll(); // Refresh list (cancelled assessment removed)
  } catch (error) {
    console.error('Error cancelling assessment:', error);
    alert('Failed to cancel assessment. Please try again.');
  } finally {
    cancellingAssessmentId = null;
  }
}
```

**Assessment Detail Page Header:**
```svelte
<!-- Cancel button in AssessmentLayout header -->
{#if onCancel && ['assessment_in_progress', 'estimate_review', 'estimate_sent'].includes(assessment.stage)}
  <Button variant="destructive" onclick={onCancel}>
    <Trash2 class="mr-2 h-4 w-4" />
    Cancel
  </Button>
{/if}

<!-- Handler in detail page -->
async function handleCancelAssessment() {
  if (!confirm('Are you sure you want to cancel this assessment? This action cannot be undone.')) {
    return;
  }
  
  try {
    await assessmentService.cancelAssessment(data.assessment.id, data.supabase);
    goto('/work/archive?tab=cancelled'); // Navigate to archive
  } catch (error) {
    console.error('Error cancelling assessment:', error);
    alert('Failed to cancel assessment. Please try again.');
  }
}
```

**Navigation After Cancellation:**
- Open Assessments Table → Refreshes list (cancelled assessment disappears)
- Assessment Detail Page → Redirects to `/work/archive?tab=cancelled`
- Archive Page → Cancelled assessment appears in "Cancelled" tab

**Valid Stages for Cancellation:**
- `assessment_in_progress` - Engineer working on assessment
- `estimate_review` - Estimate under review
- `estimate_sent` - Estimate sent to client
- Can be cancelled from any stage, but UI typically shows cancel button for stages 5-7

**Archive Integration:**
- Cancelled assessments automatically appear in Archive page
- Archive filters by `stage = 'cancelled'`
- Users can reactivate cancelled assessments from Archive
- Cancelled assessments excluded from active work lists (Open Assessments, FRC, Additionals)

**Audit Trail Example:**
```json
{
  "entity_type": "assessment",
  "entity_id": "uuid",
  "action": "status_changed",
  "field_name": "status",
  "old_value": "in_progress",
  "new_value": "cancelled"
},
{
  "entity_type": "assessment",
  "entity_id": "uuid",
  "action": "stage_transition",
  "old_value": "assessment_in_progress",
  "new_value": "cancelled",
  "metadata": {
    "assessment_number": "ASM-2025-001"
  }
}
```

**Related Patterns:**
- [Inspection Cancellation](#cancelling-inspections-jan-2025) - Similar pattern for inspections
- [Archive Page](../System/project_architecture.md#archive-page) - Where cancelled assessments appear
- [Reactivation Flow](#reactivation-pattern) - How to reactivate cancelled assessments

---

## Cancelling Inspections (Jan 2025)

### Inspection Cancellation Pattern

**When:** Cancelling an inspection to stop the workflow

**Why Cancellation is Needed:**
- Inspections can be cancelled at any stage
- Cancelled inspections move to Archive page for reactivation if needed
- Reverts request status and assessment stage appropriately

**Service Method:**
```typescript
import { inspectionService } from '$lib/services/inspection.service';
import { requestService } from '$lib/services/request.service';
import { assessmentService } from '$lib/services/assessment.service';

// Cancel inspection (manual process - no single helper method)
// 1. Cancel inspection status
if (inspection) {
  await inspectionService.updateInspectionStatus(inspection.id, 'cancelled');
}

// 2. Revert request status
await requestService.updateRequest(requestId, {
  status: 'submitted',
  current_step: 'request',
  assigned_engineer_id: null
});

// 3. Clear foreign keys BEFORE stage transition (follows check constraint)
await assessmentService.updateAssessment(assessmentId, {
  appointment_id: null,
  inspection_id: null
}, client);

// 4. Update assessment stage to request_submitted
await assessmentService.updateStage(assessmentId, 'request_submitted', client);
```

**Navigation After Cancellation:**
- Cancelled inspections redirect to `/work/archive?tab=cancelled`
- Archive page automatically selects "Cancelled" tab via URL query parameter
- Cancelled inspections appear in Archive with "Cancelled" status badge

**Archive Integration:**
- Archive page queries cancelled inspections via `listCancelledInspections()`
- Includes assessment data via `request_id` join (since `inspection_id` is cleared)
- DetailUrl uses assessment ID (not inspection ID) for navigation
- Supports reactivation from Archive page

**Audit Trail:**
- Inspection status change logged
- Request status change logged
- Assessment stage transition logged

**Related Patterns:**
- [Assessment Cancellation](#cancelling-assessments-jan-2025) - Similar pattern for assessments
- [Archive Page](../System/project_architecture.md#archive-page) - Where cancelled inspections appear
- [Reactivation Flow](#reactivation-pattern) - How to reactivate cancelled inspections

---

### Mistake #1: Wrong Join Table for Stage (CRITICAL)

**Symptoms:** Engineer has assigned work but sidebar badge shows 0

**Root Cause:** Joining with table that has NULL foreign key at that stage

**Example Bug (Jan 2025):**
```typescript
// BUG - inspection_scheduled stage joins with appointments
.select('*, appointments!inner(engineer_id)', { count: 'exact', head: true })
.eq('stage', 'inspection_scheduled');
// At stage 3, appointment_id is NULL → INNER JOIN fails → returns 0
```

**Stage-Based FK Lifecycle:**
| Stage | inspection_id | appointment_id | Correct Join |
|-------|--------------|----------------|-------------|
| 1-2 | NULL | NULL | N/A |
| 3. inspection_scheduled | **SET** ✓ | NULL ❌ | **inspections** |
| 4+ appointment_scheduled+ | SET | **SET** ✓ | **appointments** |

**Fix:**
```typescript
// CORRECT - inspection_scheduled joins with inspections
.select('*, inspections!inner(assigned_engineer_id)', { count: 'exact', head: true })
.eq('stage', 'inspection_scheduled');
```

**Golden Rule:** Match JOIN TABLE to the foreign key that's SET at that stage:
- Stage 3 → Join `inspections` (inspection_id is set)
- Stage 4+ → Join `appointments` (appointment_id is set)

### Mistake #2: Missing Stage Update in Workflow Actions

**Symptoms:** Assessment doesn't appear in expected list after workflow action (e.g., "Start Assessment")

**Root Cause:** Action updates related record (appointment) but forgets to update assessment stage

**Example Bug (Jan 2025):**
```typescript
// BUG - Only updates appointment status, not assessment stage
async function handleStartAssessment() {
  await appointmentService.updateAppointmentStatus(id, 'in_progress');
  goto(`/work/assessments/${id}`);
  // Missing: Update assessment stage to 'assessment_in_progress'
}
```

**Result:**
- Assessment stays at `appointment_scheduled` stage
- Still visible in Appointments list (queries stage='appointment_scheduled')
- NOT visible in Open Assessments list (queries stage='assessment_in_progress')

**Fix:**
```typescript
// CORRECT - Update both appointment AND assessment
async function handleStartAssessment() {
  // 1. Update appointment status
  await appointmentService.updateAppointmentStatus(id, 'in_progress');

  // 2. Find assessment by appointment_id
  const assessment = await assessmentService.getAssessmentByAppointment(id);

  // 3. Update assessment stage
  if (assessment) {
    await assessmentService.updateStage(assessment.id, 'assessment_in_progress');
  }

  // 4. Navigate
  goto(`/work/assessments/${id}`);
}
```

**Workflow Action Checklist:**
- [ ] Update related record (appointment/inspection) if needed
- [ ] **Update assessment stage** to match workflow transition
- [ ] Verify assessment appears in correct list page
- [ ] Log stage transition in audit_logs (automatic via service)

### Debugging Badge Count Mismatches

**Step 1: Check FK State in Database**
```sql
-- Verify which FKs are set at the stage
SELECT
  a.id,
  a.stage,
  a.inspection_id,   -- NULL or SET?
  a.appointment_id   -- NULL or SET?
FROM assessments a
WHERE a.stage = 'YOUR_STAGE';
```

**Step 2: Test INNER JOIN Behavior**
```sql
-- Test with appointments join (will fail if appointment_id is NULL)
SELECT COUNT(*)
FROM assessments a
INNER JOIN appointments ap ON a.appointment_id = ap.id
WHERE a.stage = 'inspection_scheduled';
-- Expected: 0 (appointment_id is NULL at this stage)

-- Test with inspections join (will work if inspection_id is SET)
SELECT COUNT(*)
FROM assessments a
INNER JOIN inspections i ON a.inspection_id = i.id
WHERE a.stage = 'inspection_scheduled';
-- Expected: 1+ (inspection_id is SET at this stage)
```

**Step 3: Fix the Badge Query**
- Use join table that matches the SET foreign key for that stage
- Refer to [Implementing Badge Counts SOP](./implementing_badge_counts.md) for patterns

**References:**
- [Fix Sidebar and Stage Update Bugs Task](../Tasks/active/fix_sidebar_and_stage_update_bugs.md) - Complete bug analysis
- [Implementing Badge Counts SOP](./implementing_badge_counts.md) - Comprehensive badge count patterns

---

## Common Patterns

### Pattern 1: Find or Create Assessment by Request

**When:** You need to get or create an assessment for a request

```typescript
import { assessmentService } from '$lib/services/assessment.service';

// Idempotent - safe to call multiple times
const assessment = await assessmentService.findOrCreateByRequest(
  requestId,
  locals.supabase
);
```

**Why this works:**
- Checks for existing assessment first
- Creates only if not found
- Returns existing assessment if found
- Handles backward compatibility with old requests

---

### Pattern 2: Update Assessment Stage

**When:** Moving assessment through the pipeline

```typescript
import { assessmentService } from '$lib/services/assessment.service';

// Always check current stage first
if (assessment.stage === 'request_reviewed') {
  // Update to next stage
  const updated = await assessmentService.updateStage(
    assessment.id,
    'inspection_scheduled',
    locals.supabase
  );
}
```

**Important:**
- Use `updateStage()` not `updateAssessment()` for stage changes
- `updateStage()` includes audit logging
- Always pass authenticated client (`locals.supabase`)

---

### Pattern 3: Link Assessment to Appointment

**When:** Scheduling an appointment for an assessment

```typescript
import { assessmentService } from '$lib/services/assessment.service';

// CRITICAL: Link appointment BEFORE updating stage
// The check constraint requires appointment_id for later stages
if (!assessment.appointment_id) {
  assessment = await assessmentService.updateAssessment(
    assessment.id,
    { appointment_id: appointmentId },
    locals.supabase
  );
}

// THEN update stage
if (assessment.stage === 'request_reviewed') {
  assessment = await assessmentService.updateStage(
    assessment.id,
    'appointment_scheduled',
    locals.supabase
  );
}
```

**Why order matters:**
- Migration 068 has check constraint: `require_appointment_when_scheduled`
- Stages 'inspection_scheduled' and beyond REQUIRE `appointment_id IS NOT NULL`
- Updating stage before linking appointment will FAIL

---

### Pattern 4: Create Child Records Idempotently

**When:** Creating default child records (tyres, estimates, etc.)

```typescript
import { tyresService } from '$lib/services/tyres.service';
import { estimateService } from '$lib/services/estimate.service';
import { vehicleValuesService } from '$lib/services/vehicle-values.service';

// All these methods are idempotent - safe to call multiple times
await Promise.all([
  tyresService.createDefaultTyres(assessmentId, locals.supabase),
  estimateService.createDefault(assessmentId, locals.supabase),
  vehicleValuesService.createDefault(assessmentId, locals.supabase),
  damageService.createDefault(assessmentId, locals.supabase),
  preIncidentEstimateService.createDefault(assessmentId, locals.supabase)
]);
```

**Why this is safe:**
- Migration 069 added unique constraints
- Services use check-then-create or upsert patterns
- Returns existing records if already created
- No duplicate errors

---

### Pattern 5: Query Assessments by Stage

**When:** Implementing list pages (Phase 3)

```typescript
import { supabase } from '$lib/supabase';

// Query assessments in specific stage
const { data: assessments, error } = await locals.supabase
  .from('assessments')
  .select(`
    *,
    request:requests!inner(*),
    appointment:appointments(*)
  `)
  .eq('stage', 'assessment_in_progress')
  .order('updated_at', { ascending: false });
```

**Stage-based queries (Phase 3 - Jan 2025):**
```typescript
// Requests page
.in('stage', ['request_submitted', 'request_reviewed'])

// Inspections page
.eq('stage', 'inspection_scheduled')

// Appointments page
.in('stage', ['appointment_scheduled', 'assessment_in_progress'])

// Open Assessments page
.in('stage', ['assessment_in_progress', 'estimate_review', 'estimate_sent'])

// Finalized Assessments page
.eq('stage', 'estimate_finalized')

// FRC page
.eq('stage', 'frc_in_progress')

// Archive page
.in('stage', ['archived', 'cancelled'])
```

---

## Implementing New Features

### Checklist for Assessment-Related Features

- [ ] **1. Read the PRD** - Understand assessment lifecycle
- [ ] **2. Identify stage transitions** - Which stages are affected?
- [ ] **3. Check constraints** - Does feature need appointment_id?
- [ ] **4. Use authenticated client** - Always pass `locals.supabase`
- [ ] **5. Make it idempotent** - Safe to call multiple times?
- [ ] **6. Log stage transitions** - Use `updateStage()` for audit trail
- [ ] **7. Test error cases** - What if assessment not found?
- [ ] **8. Test backward compat** - Works with old requests?

### Example: Adding a New Stage

**Scenario:** Add "quality_review" stage between "estimate_sent" and "estimate_finalized"

**Step 1: Update Enum Type**
```sql
-- Migration 075_add_quality_review_stage.sql
ALTER TYPE assessment_stage ADD VALUE 'quality_review' BEFORE 'estimate_finalized';

COMMENT ON TYPE assessment_stage IS 'Updated: Added quality_review stage for QA process';
```

**Step 2: Update TypeScript Types**
```typescript
// src/lib/types/assessment.ts
export type AssessmentStage =
  | 'request_submitted'
  | 'request_reviewed'
  | 'inspection_scheduled'
  | 'appointment_scheduled'
  | 'assessment_in_progress'
  | 'estimate_review'
  | 'estimate_sent'
  | 'quality_review' // NEW - Added after estimate_sent
  | 'estimate_finalized'
  | 'frc_in_progress'
  | 'archived'
  | 'cancelled';
```

**Step 3: Update Stage Transitions**
```typescript
// In assessment completion handler
if (allTabsCompleted) {
  await assessmentService.updateStage(
    assessmentId,
    'quality_review', // Changed from 'estimate_finalized'
    locals.supabase
  );
}
```

**Step 4: Add Quality Review Page**
```typescript
// src/routes/(app)/work/quality-review/+page.server.ts
const { data: assessments } = await locals.supabase
  .from('assessments')
  .select('*')
  .eq('stage', 'quality_review')
  .order('updated_at', { ascending: false });
```

**Step 5: Update Sidebar Badge**
```typescript
// Get count for quality review
const { count } = await locals.supabase
  .from('assessments')
  .select('*', { count: 'exact', head: true })
  .eq('stage', 'quality_review');
```

---

## Phase 3 Implementation Guide

### Goal
Replace status-based queries with stage-based queries across all list pages.

### Pages to Update

1. **Requests Page** (`/requests`)
   ```typescript
   // OLD (status-based)
   .eq('status', 'draft')

   // NEW (stage-based - Phase 3, Jan 2025)
   .in('stage', ['request_submitted', 'request_reviewed'])
   ```

2. **Inspections Page** (`/work/inspections`)
   ```typescript
   // OLD (table-centric - queried inspections table)
   .from('inspections')
   .eq('status', 'pending')

   // NEW (assessment-centric - Phase 3, Jan 2025)
   .from('assessments')
   .eq('stage', 'inspection_scheduled')
   ```

3. **Appointments Page** (`/work/appointments`)
   ```typescript
   // OLD (table-centric - queried appointments table)
   .from('appointments')
   .eq('status', 'scheduled')

   // NEW (assessment-centric - Updated Jan 27, 2025)
   .from('assessments')
   .eq('stage', 'appointment_scheduled')

   // Note: Appointments page displays assessments at 'appointment_scheduled' stage.
   //
   // Data Flow During "Start Assessment":
   // 1. User clicks "Start Assessment" on appointment row
   // 2. Action updates appointment.status to 'in_progress'
   // 3. Action updates assessment.stage to 'assessment_in_progress' (CRITICAL!)
   // 4. User navigates to assessment detail page
   // 5. On return, appointment has disappeared from Appointments list
   // 6. Assessment now visible in Open Assessments list
   //
   // Why no invalidateAll() needed:
   // - Navigation causes automatic data refresh
   // - Stage change naturally filters assessment out of appointments query
   // - Clean separation of concerns (scheduled vs in-progress)
   //
   // See "Mistake #2: Missing Stage Update in Workflow Actions" (line 354)
   // for common bug pattern and fix checklist.
   ```

4. **Open Assessments Page** (`/work/assessments`)
   ```typescript
   // OLD (status-based)
   .eq('status', 'in_progress')

   // NEW (stage-based - Phase 3, Jan 2025)
   .in('stage', ['assessment_in_progress', 'estimate_review', 'estimate_sent'])
   ```

5. **Finalized Assessments Page** (`/work/finalized`)
   ```typescript
   // OLD (status-based)
   .eq('status', 'submitted')

   // NEW (stage-based - Phase 3, Jan 2025)
   .eq('stage', 'estimate_finalized')
   ```

6. **FRC Page** (`/work/frc`)
   ```typescript
   // OLD (status-based, multiple stages)
   .in('status', ['frc_in_progress', 'frc_completed'])

   // NEW (stage-based - Phase 3, Jan 2025)
   .eq('stage', 'frc_in_progress')
   ```

7. **Archive Page** (`/archive`)
   ```typescript
   // OLD
   .in('status', ['archived', 'cancelled'])

   // NEW
   .in('stage', ['archived', 'cancelled'])
   ```

### Sidebar Badge Updates

**IMPORTANT:** Badge counts MUST use assessment-centric queries.

❌ **INCORRECT** - Old table-centric approach:
```typescript
// DON'T query appointments/inspections tables directly
const { count } = await supabase
  .from('appointments')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'scheduled');
```

✅ **CORRECT** - Assessment-centric approach:
```typescript
// DO query assessments table with stage filters
const { count } = await supabase
  .from('assessments')
  .select('*, appointments!inner(engineer_id)', { count: 'exact', head: true })
  .in('stage', ['appointment_scheduled', 'assessment_in_progress']);
```

**For complete badge implementation guide, see:**
- [SOP: Implementing Badge Counts](./implementing_badge_counts.md) - Comprehensive badge patterns, examples, and troubleshooting

---

## Database Constraints Reference

### Migration 068: Assessment Stage

**Unique Constraints:**
- `uq_assessments_request` - One assessment per request

**Check Constraints:**
- `require_appointment_when_scheduled` - appointment_id required for stages 4-9:
  - appointment_scheduled (stage 4)
  - assessment_in_progress (stage 5)
  - estimate_review (stage 6)
  - estimate_sent (stage 7)
  - estimate_finalized (stage 8)
  - frc_in_progress (stage 9)

**Indexes:**
- `idx_assessments_stage` - Fast stage queries
- `idx_assessments_request_id` - Fast request lookups

### Migration 069: Child Record Constraints

**Unique Constraints:**
- `uq_assessment_tyres_position` - (assessment_id, position)
- `uq_assessment_vehicle_values` - (assessment_id)
- `uq_pre_incident_estimates` - (assessment_id)
- `uq_assessment_estimates` - (assessment_id) - pre-existing
- `uq_assessment_damage` - (assessment_id) - pre-existing

---

## Troubleshooting

### Error: "violates check constraint 'require_appointment_when_scheduled'"

**Cause:** Trying to update stage to 'inspection_scheduled' or later without appointment_id

**Solution:**
```typescript
// Link appointment FIRST
assessment = await assessmentService.updateAssessment(
  assessment.id,
  { appointment_id: appointmentId },
  locals.supabase
);

// THEN update stage
assessment = await assessmentService.updateStage(
  assessment.id,
  'inspection_scheduled',
  locals.supabase
);
```

---

### Error: "duplicate key value violates unique constraint 'uq_assessments_request'"

**Cause:** Trying to create second assessment for same request

**Solution:** Use `findOrCreateByRequest()` instead of `createAssessment()`
```typescript
// DON'T DO THIS
const assessment = await assessmentService.createAssessment({...});

// DO THIS
const assessment = await assessmentService.findOrCreateByRequest(
  requestId,
  locals.supabase
);
```

---

### Error: "duplicate key value violates unique constraint 'uq_assessment_tyres_position'"

**Cause:** Trying to create duplicate tyre for same position

**Solution:** Services are already idempotent after migration 069, but if manually inserting:
```typescript
// Use upsert instead of insert
await locals.supabase
  .from('assessment_tyres')
  .upsert(
    { assessment_id, position, position_label },
    { onConflict: 'assessment_id,position' }
  );
```

---

### Error: "column assessments.stage does not exist"

**Cause:** Migration 068 not applied

**Solution:**
```bash
# Apply migration
supabase db push

# Or using Supabase MCP
# Use mcp__supabase__apply_migration tool
```

---

## Testing Checklist

When working with assessment-centric features:

**Unit Tests:**
- [ ] Test findOrCreateByRequest with new request
- [ ] Test findOrCreateByRequest with existing request
- [ ] Test updateStage with valid transitions
- [ ] Test updateStage logs audit trail
- [ ] Test child record creation is idempotent

**Integration Tests:**
- [ ] Test full request → assessment → appointment flow
- [ ] Test stage transitions enforce constraints
- [ ] Test appointment_id requirement for later stages
- [ ] Test RLS policies with admin and engineer users

**Manual Tests:**
- [ ] Create request → verify assessment created
- [ ] Start Assessment → verify stage updated
- [ ] Refresh page multiple times → verify idempotent
- [ ] Double-click "Start Assessment" → verify no errors
- [ ] Test as admin and engineer → verify RLS

---

## Code Review Checklist

When reviewing assessment-related code:

**Stage Handling:**
- [ ] Uses `stage` field, not just `status`
- [ ] Uses `updateStage()` for stage transitions
- [ ] Logs stage changes in audit trail

**Constraint Compliance:**
- [ ] Links appointment_id before updating to later stages
- [ ] Uses authenticated client (`locals.supabase`)
- [ ] Handles constraint violations gracefully

**Idempotency:**
- [ ] Child record creation is idempotent
- [ ] Uses findOrCreateByRequest() not createAssessment()
- [ ] Safe to call multiple times

**Error Handling:**
- [ ] Handles "assessment not found" gracefully
- [ ] Handles constraint violations
- [ ] Provides clear error messages

**Testing:**
- [ ] Tests cover stage transitions
- [ ] Tests verify idempotency
- [ ] Tests cover error cases

---

## Performance Considerations

**Query Optimization:**
- Use `idx_assessments_stage` index for stage queries
- Use `idx_assessments_request_id` for request lookups
- Combine with `.select()` to fetch related data in one query

**Example Optimized Query:**
```typescript
const { data } = await locals.supabase
  .from('assessments')
  .select(`
    *,
    request:requests!inner(*, client:clients(*)),
    appointment:appointments(*, engineer:engineers(*))
  `)
  .eq('stage', 'assessment_in_progress')
  .order('updated_at', { ascending: false });
```

**Avoid:**
```typescript
// ❌ N+1 queries
const assessments = await getAssessments();
for (const assessment of assessments) {
  const request = await getRequest(assessment.request_id);
  const appointment = await getAppointment(assessment.appointment_id);
}

// ✅ Single query with joins
const assessments = await getAssessmentsWithRelations();
```

---

## Migration Strategy

**For Existing Features:**
1. Identify status-based queries
2. Map to equivalent stage-based queries
3. Update incrementally (one page at a time)
4. Keep backward compatibility temporarily
5. Monitor for issues
6. Remove old status-based code

**For New Features:**
- Always use stage-based queries
- Don't use status field except for backward compatibility
- Follow patterns in this SOP

---

## Common Bugs and Pitfalls

### Missing Stages in Transition Logic

**Problem:** When adding new stages to the pipeline, forgetting to update stage transition checks in server load functions.

**Example Bug (Fixed January 29, 2025):**
```typescript
// ❌ BROKEN: Missing 'appointment_scheduled' stage
if (['request_submitted', 'request_accepted', 'inspection_scheduled'].includes(assessment.stage)) {
    assessment = await assessmentService.updateStage(
        assessment.id,
        'assessment_in_progress',
        locals.supabase
    );
}

// ✅ FIXED: Includes all eligible stages
if (['request_submitted', 'request_accepted', 'inspection_scheduled', 'appointment_scheduled'].includes(assessment.stage)) {
    assessment = await assessmentService.updateStage(
        assessment.id,
        'assessment_in_progress',
        locals.supabase
    );
}
```

**Impact:**
- Appointments didn't move from Appointments list to Open Assessments list
- Engineers clicked "Start Assessment" but assessment remained at `appointment_scheduled` stage
- Core workflow broken

**Root Cause:**
- Assessment detail page server load function had hard-coded array of stages eligible for transition
- When `appointment_scheduled` stage was added to pipeline, it wasn't added to this array
- Stage transition was skipped for appointments

**Prevention:**
1. **Centralize Stage Constants**: Extract stage transition rules to shared constants file
2. **Document Dependencies**: When adding new stages, search codebase for hard-coded stage arrays
3. **Integration Testing**: Test full workflow end-to-end after adding new stages
4. **Code Review**: Review all `includes(assessment.stage)` checks when modifying pipeline

**Best Practice Pattern:**
```typescript
// src/lib/constants/assessment-stages.ts
export const STAGES_ELIGIBLE_FOR_IN_PROGRESS = [
    'request_submitted',
    'request_accepted',
    'inspection_scheduled',
    'appointment_scheduled'
] as const;

// Usage in server load function
import { STAGES_ELIGIBLE_FOR_IN_PROGRESS } from '$lib/constants/assessment-stages';

if (STAGES_ELIGIBLE_FOR_IN_PROGRESS.includes(assessment.stage)) {
    // Transition to assessment_in_progress
}
```

**Related Files:**
- Bug location: `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts:68`
- Post-mortem: `.agent/System/bug_postmortem_appointment_stage_transition.md`
- Fix commit: January 29, 2025

---

## Related SOPs

- [Working with Services](./working_with_services.md)
- [Adding Database Migrations](./adding_migration.md)
- [Handling Race Conditions](./handling_race_conditions_in_number_generation.md)
- [Navigation-Based State Transitions](./navigation_based_state_transitions.md)

---

**Last Updated:** January 29, 2025
**Author:** Claude Code (Sonnet 4.5)
**Status:** Active - Phase 3 implementation pending
