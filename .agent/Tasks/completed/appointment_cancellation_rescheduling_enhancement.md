# Appointment Cancellation & Rescheduling Enhancement

**Status**: 🔄 In Progress
**Priority**: High
**Created**: January 27, 2025
**Last Updated**: January 27, 2025

---

## Executive Summary

Enhance the appointment system with two critical features:
1. **Automatic stage fallback** when appointments are cancelled (revert to `inspection_scheduled` stage)
2. **Dedicated rescheduling workflow** accessible from both appointment list and detail pages

This ensures proper workflow continuity when appointments are cancelled and provides a formal rescheduling process with audit trail tracking.

---

## Problem Statement

### Current Issues

1. **No Stage Fallback on Cancellation**
   - When appointment cancelled, assessment remains at current stage (e.g., `appointment_scheduled`, `assessment_in_progress`)
   - System doesn't automatically revert to `inspection_scheduled` stage
   - Admins/engineers must manually handle the fallback
   - Creates workflow confusion and potential data inconsistencies

2. **Informal Rescheduling Process**
   - Existing modal allows updating appointment date/time
   - BUT: Uses generic `updateAppointment()` - no distinction from regular updates
   - No status transition to 'rescheduled'
   - No tracking of original appointment date
   - No dedicated audit trail for rescheduling events
   - Appointment detail page lacks reschedule option

3. **Missing User Experience**
   - `/work/appointments/[id]` page has cancel button but no reschedule option
   - Users must navigate back to list page to reschedule
   - No clear indication that appointment has been rescheduled (vs. just updated)

---

## Requirements

### Functional Requirements

#### FR1: Cancellation with Stage Fallback
- ✅ When appointment cancelled → automatically update assessment stage to `inspection_scheduled`
- ✅ Preserve cancellation reason and timestamp
- ✅ Create audit log entry for both appointment cancellation AND stage transition
- ✅ Keep cancelled appointment in database (don't delete)
- ✅ Option to unlink appointment_id from assessment (or keep as cancelled reference)

#### FR2: Dedicated Rescheduling Workflow
- ✅ Create formal `rescheduleAppointment()` service method
- ✅ Update status to 'rescheduled' when date/time changed
- ✅ Track original appointment date for history
- ✅ Track reschedule count (how many times rescheduled)
- ✅ Store reschedule reason (optional)
- ✅ Distinguished audit log entry (not generic "update")

#### FR3: Appointment Detail Page Enhancement
- ✅ Add "Reschedule Appointment" button next to existing actions
- ✅ Open reschedule modal/form with current appointment details pre-filled
- ✅ Update cancellation handler to use new `cancelAppointmentWithFallback()`
- ✅ Display reschedule history in activity log
- ✅ Show visual indicator if appointment has been rescheduled

#### FR4: Appointments List Page Enhancement
- ✅ Enhance existing schedule modal to detect reschedule vs. initial schedule
- ✅ Use `rescheduleAppointment()` when updating existing appointments
- ✅ Add cancellation with fallback option
- ✅ Show reschedule count badge on appointments list

### Non-Functional Requirements

#### NFR1: Assessment-Centric Architecture Compliance
- ✅ Maintain assessment as canonical "case" record
- ✅ Stage transitions follow assessment-centric patterns
- ✅ ServiceClient injection for RLS authentication
- ✅ Idempotent operations where applicable

#### NFR2: Security & Access Control
- ✅ Engineers can only reschedule/cancel assigned appointments
- ✅ Admins can reschedule/cancel any appointment
- ✅ RLS policies enforced via ServiceClient pattern
- ✅ Proper authorization checks before stage transitions

#### NFR3: Data Integrity
- ✅ Preserve original appointment date when rescheduling
- ✅ Maintain comprehensive audit trail
- ✅ Handle concurrent updates gracefully
- ✅ Validate date/time constraints

#### NFR4: User Experience
- ✅ Clear confirmation dialogs for destructive actions
- ✅ Success/error feedback messages
- ✅ Loading states during async operations
- ✅ Responsive UI on both list and detail pages

---

## Current State Analysis

### Existing Functionality

**Appointment Table Schema** (Migration 005):
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  appointment_number TEXT UNIQUE NOT NULL,

  -- Status enum includes 'rescheduled' but not actively used
  status TEXT CHECK (IN ('scheduled', 'confirmed', 'in_progress',
                         'completed', 'cancelled', 'rescheduled')),

  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Missing: rescheduled_from_date, reschedule_count, reschedule_reason
);
```

**Existing Service Methods**:
- `cancelAppointment(id, reason, client?)` - Sets status='cancelled', adds timestamp and reason
- `updateAppointment(id, input, client?)` - Generic update (used for everything including reschedules)
- `updateAppointmentStatus(id, status, client?)` - Status-only update with timestamp handling

**Existing UI**:
- Appointments list page: Schedule modal can update date/time (informal reschedule)
- Appointment detail page: Cancel button (no reschedule option)

### What's Missing

1. **Service Layer**:
   - No `cancelAppointmentWithFallback()` - doesn't update assessment stage
   - No `rescheduleAppointment()` - uses generic `updateAppointment()`
   - No integration with assessment service for stage transitions

2. **Database Schema**:
   - No `rescheduled_from_date` field to track original date
   - No `reschedule_count` to track how many times rescheduled
   - No `reschedule_reason` to document why rescheduled

3. **User Interface**:
   - Appointment detail page lacks reschedule button/form
   - List page modal doesn't distinguish reschedule from initial schedule
   - No visual indicator for rescheduled appointments

4. **Audit Trail**:
   - Generic "updated" entries don't distinguish rescheduling from other updates
   - No specific audit entry for stage fallback on cancellation

---

## Technical Specification

### Architecture Overview

```
User Action: Cancel Appointment
    ↓
appointmentService.cancelAppointmentWithFallback(id, reason)
    ↓
1. Update appointment (status='cancelled', cancelled_at, cancellation_reason)
    ↓
2. Get related assessment
    ↓
3. Update assessment stage to 'inspection_scheduled'
    ↓
4. Create audit logs (appointment + assessment stage change)
    ↓
Success Response


User Action: Reschedule Appointment
    ↓
appointmentService.rescheduleAppointment(id, updateData, reason)
    ↓
1. Get current appointment (capture original date)
    ↓
2. Update appointment (new date/time, status='rescheduled', increment count)
    ↓
3. Store rescheduled_from_date, reschedule_reason, reschedule_count
    ↓
4. Create audit log (reschedule event)
    ↓
5. Assessment stage remains unchanged (appointment still active)
    ↓
Success Response
```

### Database Changes

#### Migration 076: Add Reschedule Tracking

```sql
-- File: supabase/migrations/076_add_appointment_reschedule_tracking.sql

-- Add columns for reschedule tracking
ALTER TABLE appointments
  ADD COLUMN rescheduled_from_date TIMESTAMPTZ,
  ADD COLUMN reschedule_count INTEGER DEFAULT 0,
  ADD COLUMN reschedule_reason TEXT;

-- Add comment explaining usage
COMMENT ON COLUMN appointments.rescheduled_from_date IS
  'Original appointment date before most recent reschedule (used for history tracking)';

COMMENT ON COLUMN appointments.reschedule_count IS
  'Number of times this appointment has been rescheduled';

COMMENT ON COLUMN appointments.reschedule_reason IS
  'Reason provided for most recent reschedule';
```

**Rationale**:
- `rescheduled_from_date`: Preserves original date for audit trail and history
- `reschedule_count`: Tracks frequency of rescheduling (useful for analytics and flagging problematic appointments)
- `reschedule_reason`: Documents why rescheduled (helps identify patterns and issues)

### TypeScript Type Updates

**File**: `src/lib/types/appointment.ts`

```typescript
export interface Appointment {
  // ... existing fields ...

  // Reschedule tracking (new fields)
  rescheduled_from_date: string | null;
  reschedule_count: number;
  reschedule_reason: string | null;
}

export interface UpdateAppointmentInput {
  // ... existing fields ...

  // Reschedule tracking (optional updates)
  rescheduled_from_date?: string | null;
  reschedule_count?: number;
  reschedule_reason?: string | null;
}

export interface RescheduleAppointmentInput {
  appointment_date: string;
  appointment_time?: string | null;
  duration_minutes?: number;
  location_address?: string | null;
  location_city?: string | null;
  location_province?: string | null;
  location_notes?: string | null;
  notes?: string | null;
  special_instructions?: string | null;
}
```

### Service Layer Implementation

#### Method 1: cancelAppointmentWithFallback()

**File**: `src/lib/services/appointment.service.ts`

```typescript
/**
 * Cancel appointment and revert assessment to inspection_scheduled stage.
 * This ensures proper workflow fallback when appointments are cancelled.
 *
 * @param id - Appointment ID
 * @param reason - Optional cancellation reason
 * @param client - ServiceClient for RLS authentication
 * @returns Cancelled appointment with updated assessment
 */
async cancelAppointmentWithFallback(
  id: string,
  reason?: string,
  client?: ServiceClient
): Promise<Appointment> {
  const supabase = client || this.supabase;

  // Step 1: Get appointment to find related assessment
  const appointment = await this.getAppointment(id, client);
  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Step 2: Cancel appointment (existing logic)
  const cancelledAppointment = await this.cancelAppointment(id, reason, client);

  // Step 3: Find related assessment by inspection_id
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('id, stage')
    .eq('inspection_id', appointment.inspection_id)
    .single();

  if (assessmentError) {
    console.error('Error finding assessment:', assessmentError);
    // Return cancelled appointment even if assessment update fails
    return cancelledAppointment;
  }

  // Step 4: Update assessment stage to inspection_scheduled (fallback)
  if (assessment && assessment.stage !== 'inspection_scheduled') {
    const assessmentService = new AssessmentService(this.supabase);
    await assessmentService.updateAssessment(
      assessment.id,
      { stage: 'inspection_scheduled' },
      client
    );

    // Step 5: Create audit log for stage transition
    await this.auditService.createLog({
      entity_type: 'assessment',
      entity_id: assessment.id,
      action: 'stage_transition',
      details: {
        from_stage: assessment.stage,
        to_stage: 'inspection_scheduled',
        reason: 'Appointment cancelled - fallback to inspection scheduling',
        related_appointment_id: id,
        cancellation_reason: reason
      }
    }, client);
  }

  return cancelledAppointment;
}
```

**Key Features**:
- ✅ Cancels appointment using existing method
- ✅ Finds related assessment via inspection_id
- ✅ Updates assessment stage to `inspection_scheduled`
- ✅ Creates audit log for stage transition
- ✅ Handles errors gracefully (returns cancelled appointment even if assessment update fails)
- ✅ Uses ServiceClient for RLS

**Audit Trail Example**:
```json
{
  "entity_type": "assessment",
  "entity_id": "uuid",
  "action": "stage_transition",
  "details": {
    "from_stage": "appointment_scheduled",
    "to_stage": "inspection_scheduled",
    "reason": "Appointment cancelled - fallback to inspection scheduling",
    "related_appointment_id": "appointment-uuid",
    "cancellation_reason": "Engineer unavailable due to emergency"
  }
}
```

#### Method 2: rescheduleAppointment()

**File**: `src/lib/services/appointment.service.ts`

```typescript
/**
 * Reschedule an appointment with proper tracking and audit trail.
 * Updates status to 'rescheduled', tracks original date, and logs the change.
 *
 * @param id - Appointment ID
 * @param input - New appointment details (date, time, location, etc.)
 * @param reason - Optional reason for rescheduling
 * @param client - ServiceClient for RLS authentication
 * @returns Updated appointment with reschedule tracking
 */
async rescheduleAppointment(
  id: string,
  input: RescheduleAppointmentInput,
  reason?: string,
  client?: ServiceClient
): Promise<Appointment> {
  const supabase = client || this.supabase;

  // Step 1: Get current appointment to capture original date
  const currentAppointment = await this.getAppointment(id, client);
  if (!currentAppointment) {
    throw new Error('Appointment not found');
  }

  // Step 2: Check if date/time actually changed
  const dateChanged = input.appointment_date !== currentAppointment.appointment_date;
  const timeChanged = input.appointment_time !== currentAppointment.appointment_time;

  if (!dateChanged && !timeChanged) {
    // No reschedule needed - just update other fields
    return this.updateAppointment(id, input, client);
  }

  // Step 3: Prepare update data with reschedule tracking
  const updateData: UpdateAppointmentInput = {
    ...input,
    status: 'rescheduled',
    rescheduled_from_date: currentAppointment.appointment_date, // Preserve original
    reschedule_count: (currentAppointment.reschedule_count || 0) + 1,
    reschedule_reason: reason || null
  };

  // Step 4: Update appointment
  const { data: updatedAppointment, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Step 5: Create audit log for reschedule event
  await this.auditService.createLog({
    entity_type: 'appointment',
    entity_id: id,
    action: 'rescheduled',
    details: {
      original_date: currentAppointment.appointment_date,
      original_time: currentAppointment.appointment_time,
      new_date: input.appointment_date,
      new_time: input.appointment_time,
      reschedule_count: updateData.reschedule_count,
      reason: reason,
      changed_fields: Object.keys(input)
    }
  }, client);

  return updatedAppointment;
}
```

**Key Features**:
- ✅ Captures original appointment date before changing
- ✅ Only triggers reschedule logic if date/time actually changed
- ✅ Updates status to 'rescheduled'
- ✅ Increments reschedule_count
- ✅ Stores reschedule_reason
- ✅ Creates detailed audit log with before/after values
- ✅ Assessment stage remains unchanged (appointment still active)
- ✅ Uses ServiceClient for RLS

**Audit Trail Example**:
```json
{
  "entity_type": "appointment",
  "entity_id": "uuid",
  "action": "rescheduled",
  "details": {
    "original_date": "2025-01-28T10:00:00Z",
    "original_time": "10:00",
    "new_date": "2025-01-30T14:00:00Z",
    "new_time": "14:00",
    "reschedule_count": 2,
    "reason": "Client requested different time due to work conflict",
    "changed_fields": ["appointment_date", "appointment_time", "notes"]
  }
}
```

### UI Implementation

#### Appointment Detail Page Enhancement

**File**: `src/routes/(app)/work/appointments/[id]/+page.svelte`

**Changes Required**:

1. **Add Reschedule Button**:
```svelte
{#if data.appointment.status === 'scheduled' || data.appointment.status === 'confirmed' || data.appointment.status === 'rescheduled'}
  <button
    onclick={handleReschedule}
    class="btn btn-primary"
  >
    Reschedule Appointment
  </button>
{/if}
```

2. **Add Reschedule Modal State**:
```typescript
let showRescheduleModal = $state(false);
let rescheduleDate = $state(data.appointment.appointment_date);
let rescheduleTime = $state(data.appointment.appointment_time || '');
let rescheduleDuration = $state(data.appointment.duration_minutes || 60);
let rescheduleReason = $state('');
// ... other reschedule fields
```

3. **Reschedule Handler**:
```typescript
async function handleReschedule() {
  showRescheduleModal = true;
}

async function handleSaveReschedule() {
  try {
    saving = true;

    const input: RescheduleAppointmentInput = {
      appointment_date: rescheduleDate,
      appointment_time: rescheduleTime || null,
      duration_minutes: rescheduleDuration,
      notes: rescheduleNotes || null,
      special_instructions: rescheduleSpecialInstructions || null
    };

    // Add location fields for in-person appointments
    if (data.appointment.appointment_type === 'in_person') {
      input.location_address = rescheduleLocationAddress || null;
      input.location_city = rescheduleLocationCity || null;
      input.location_province = rescheduleLocationProvince || null;
      input.location_notes = rescheduleLocationNotes || null;
    }

    await appointmentService.rescheduleAppointment(
      data.appointment.id,
      input,
      rescheduleReason || undefined
    );

    showRescheduleModal = false;
    await goto(`/work/appointments/${data.appointment.id}`, { invalidateAll: true });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    alert('Error rescheduling appointment. Please try again.');
  } finally {
    saving = false;
  }
}
```

4. **Update Cancel Handler**:
```typescript
async function handleCancelAppointment() {
  const reason = prompt('Reason for cancellation (optional):');
  if (reason === null) return; // User clicked cancel

  try {
    // Use new method with fallback
    await appointmentService.cancelAppointmentWithFallback(
      data.appointment.id,
      reason || undefined
    );

    alert('Appointment cancelled. Assessment has been moved back to inspection scheduling.');
    goto('/work/appointments');
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    alert('Error cancelling appointment. Please try again.');
  }
}
```

5. **Add Reschedule Modal Component** (inline or separate file):
```svelte
{#if showRescheduleModal}
  <div class="modal">
    <div class="modal-content">
      <h2>Reschedule Appointment</h2>

      <form onsubmit={handleSaveReschedule}>
        <div class="form-group">
          <label>Date</label>
          <input type="date" bind:value={rescheduleDate} required />
        </div>

        <div class="form-group">
          <label>Time</label>
          <input type="time" bind:value={rescheduleTime} />
        </div>

        <div class="form-group">
          <label>Duration (minutes)</label>
          <input type="number" bind:value={rescheduleDuration} min="15" step="15" />
        </div>

        {#if data.appointment.appointment_type === 'in_person'}
          <!-- Location fields -->
          <div class="form-group">
            <label>Address</label>
            <input type="text" bind:value={rescheduleLocationAddress} />
          </div>
          <!-- ... other location fields ... -->
        {/if}

        <div class="form-group">
          <label>Reason for Rescheduling (optional)</label>
          <textarea bind:value={rescheduleReason} rows="3"></textarea>
        </div>

        <div class="modal-actions">
          <button type="submit" class="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" class="btn btn-secondary" onclick={() => showRescheduleModal = false}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
```

6. **Display Reschedule History** (in appointment details):
```svelte
{#if data.appointment.reschedule_count > 0}
  <div class="alert alert-info">
    This appointment has been rescheduled {data.appointment.reschedule_count} time(s).
    {#if data.appointment.rescheduled_from_date}
      <br>Original date: {formatDate(data.appointment.rescheduled_from_date)}
    {/if}
    {#if data.appointment.reschedule_reason}
      <br>Reason: {data.appointment.reschedule_reason}
    {/if}
  </div>
{/if}
```

#### Appointments List Page Enhancement

**File**: `src/routes/(app)/work/appointments/+page.svelte`

**Changes Required**:

1. **Detect Reschedule vs. Initial Schedule**:
```typescript
async function handleSaveSchedule() {
  try {
    saving = true;

    const input = {
      appointment_date: scheduleDate,
      appointment_time: scheduleTime || null,
      duration_minutes: scheduleDuration,
      notes: scheduleNotes || null,
      special_instructions: scheduleSpecialInstructions || null
    };

    // Add location for in-person
    if (selectedAssessment.appointment_type === 'in_person') {
      input.location_address = scheduleLocationAddress || null;
      input.location_city = scheduleLocationCity || null;
      input.location_province = scheduleLocationProvince || null;
      input.location_notes = scheduleLocationNotes || null;
    }

    // Detect if rescheduling (appointment already has date/time set)
    const isReschedule = selectedAssessment.appointment_date != null;

    if (isReschedule) {
      // Use reschedule method
      await appointmentService.rescheduleAppointment(
        selectedAssessment.appointment_id,
        input,
        scheduleReason || undefined
      );
    } else {
      // Use update method for initial scheduling
      await appointmentService.updateAppointment(
        selectedAssessment.appointment_id,
        input
      );
    }

    showScheduleModal = false;
    await goto('/work/appointments', { invalidateAll: true });
  } catch (error) {
    console.error('Error saving schedule:', error);
    alert('Error saving schedule. Please try again.');
  } finally {
    saving = false;
  }
}
```

2. **Add Reason Field to Modal**:
```svelte
{#if selectedAssessment && selectedAssessment.appointment_date}
  <div class="form-group">
    <label>Reason for Rescheduling (optional)</label>
    <textarea bind:value={scheduleReason} rows="3"></textarea>
  </div>
{/if}
```

3. **Update Modal Title**:
```svelte
<h2>
  {selectedAssessment && selectedAssessment.appointment_date
    ? 'Reschedule Appointment'
    : 'Schedule Appointment'}
</h2>
```

4. **Show Reschedule Badge** (on appointment cards):
```svelte
{#if assessment.appointment.reschedule_count > 0}
  <span class="badge badge-warning">
    Rescheduled ({assessment.appointment.reschedule_count}x)
  </span>
{/if}
```

---

## Implementation Steps

### Phase 1: Database & Types (10-15 min)

1. **Create Migration 076**
   - Add `rescheduled_from_date`, `reschedule_count`, `reschedule_reason` columns
   - Add column comments for documentation
   - Test migration locally
   - Apply to remote database

2. **Update TypeScript Types**
   - Add new fields to `Appointment` interface
   - Add new fields to `UpdateAppointmentInput`
   - Create `RescheduleAppointmentInput` interface
   - Run type check: `npm run check`

### Phase 2: Service Layer (30-45 min)

3. **Implement cancelAppointmentWithFallback()**
   - Add method to `AppointmentService` class
   - Import and use `AssessmentService` for stage transition
   - Create comprehensive audit log entry
   - Add error handling

4. **Implement rescheduleAppointment()**
   - Add method to `AppointmentService` class
   - Capture original date before update
   - Update reschedule tracking fields
   - Create detailed audit log entry
   - Add validation (date/time changed check)

5. **Test Service Methods** (manual testing via MCP or direct calls)
   - Test cancellation with fallback
   - Test rescheduling with reason
   - Verify audit logs created correctly
   - Verify assessment stage transitions

### Phase 3: UI Implementation (40-60 min)

6. **Update Appointment Detail Page**
   - Add reschedule button and modal
   - Implement reschedule form with all fields
   - Add reschedule handler using new service method
   - Update cancel handler to use `cancelAppointmentWithFallback()`
   - Display reschedule history badge
   - Add loading states and error handling

7. **Update Appointments List Page**
   - Add reschedule detection logic to schedule modal
   - Add reason field when rescheduling
   - Update modal title dynamically
   - Add reschedule badge to appointment cards
   - Update save handler to use appropriate method

### Phase 4: Testing (15-20 min)

8. **Manual Testing Checklist**
   - [ ] Cancel appointment from detail page → verify stage changes to `inspection_scheduled`
   - [ ] Cancel appointment as engineer → verify only assigned appointments can be cancelled
   - [ ] Reschedule from detail page → verify status='rescheduled', original date saved
   - [ ] Reschedule from list page → verify same behavior
   - [ ] Reschedule multiple times → verify reschedule_count increments
   - [ ] Check audit logs → verify comprehensive entries created
   - [ ] Test with in-person appointment → verify location fields work
   - [ ] Test with digital appointment → verify location fields not shown
   - [ ] Verify engineer can only access assigned appointments
   - [ ] Verify admin can access all appointments

9. **Edge Case Testing**
   - [ ] Reschedule without changing date/time → should use updateAppointment()
   - [ ] Cancel appointment in 'completed' status → should be prevented
   - [ ] Cancel appointment in 'cancelled' status → should be prevented
   - [ ] Reschedule with invalid date (past) → should show validation error
   - [ ] Concurrent reschedules → verify data integrity

### Phase 5: Documentation (5-10 min)

10. **Update Documentation**
    - Update this PRD with implementation results
    - Update `.agent/README.md` with new feature summary
    - Update `.agent/SOP/working_with_assessment_centric_architecture.md` with cancellation fallback pattern
    - Document new service methods in code comments

---

## Testing Plan

### Unit Testing Approach

**Service Method Tests** (future enhancement - not included in this implementation):
```typescript
describe('AppointmentService', () => {
  describe('cancelAppointmentWithFallback', () => {
    it('should cancel appointment and update assessment stage', async () => {
      // Test implementation
    });

    it('should handle missing assessment gracefully', async () => {
      // Test implementation
    });
  });

  describe('rescheduleAppointment', () => {
    it('should update status to rescheduled when date changes', async () => {
      // Test implementation
    });

    it('should increment reschedule_count', async () => {
      // Test implementation
    });

    it('should use updateAppointment when date unchanged', async () => {
      // Test implementation
    });
  });
});
```

### Manual Testing Scenarios

#### Scenario 1: Cancel Scheduled Appointment (Admin)
1. Login as admin
2. Navigate to `/work/appointments/[id]` (scheduled appointment)
3. Click "Cancel Appointment"
4. Enter reason: "Client requested cancellation"
5. **Expected Results**:
   - Appointment status → 'cancelled'
   - Appointment `cancelled_at` → current timestamp
   - Appointment `cancellation_reason` → "Client requested cancellation"
   - Assessment stage → 'inspection_scheduled'
   - Audit logs created (2 entries: appointment cancellation + assessment stage transition)
   - User redirected to appointments list
   - Cancelled appointment appears in archive

#### Scenario 2: Reschedule In-Person Appointment (Engineer)
1. Login as engineer
2. Navigate to `/work/appointments/[id]` (assigned appointment)
3. Click "Reschedule Appointment"
4. Change date from Jan 28 → Jan 30
5. Change time from 10:00 → 14:00
6. Update location address
7. Enter reason: "Client prefers afternoon"
8. Click "Save Changes"
9. **Expected Results**:
   - Appointment status → 'rescheduled'
   - Appointment `appointment_date` → Jan 30
   - Appointment `appointment_time` → 14:00
   - Appointment `rescheduled_from_date` → Jan 28 (preserved)
   - Appointment `reschedule_count` → 1
   - Appointment `reschedule_reason` → "Client prefers afternoon"
   - Assessment stage → unchanged (still 'appointment_scheduled')
   - Audit log created with before/after values
   - Reschedule badge shown on detail page
   - User stays on detail page (invalidateAll refreshes data)

#### Scenario 3: Reschedule from List Page (Admin)
1. Login as admin
2. Navigate to `/work/appointments` list
3. Find appointment with date/time already set
4. Click "Reschedule" button
5. Modal opens with current details pre-filled
6. Change date and add reason
7. Click "Save Schedule"
8. **Expected Results**:
   - Same as Scenario 2
   - Modal closes
   - List page refreshes
   - Reschedule badge appears on appointment card

#### Scenario 4: Multiple Reschedules
1. Create appointment (reschedule_count = 0)
2. Reschedule once (reschedule_count = 1)
3. Reschedule again (reschedule_count = 2)
4. **Expected Results**:
   - Each reschedule increments counter
   - `rescheduled_from_date` always stores immediate previous date (not original)
   - Audit trail shows complete history of all reschedules
   - Badge shows "Rescheduled (2x)"

#### Scenario 5: Engineer Access Control
1. Login as Engineer A (assigned to appointment X)
2. Try to access appointment Y (assigned to Engineer B)
3. **Expected Results**:
   - Engineer A cannot see appointment Y in list
   - Direct URL access to appointment Y → 404 or redirect
   - RLS policies enforce access control
   - No authorization errors in console

---

## Success Metrics

### Functional Metrics
- ✅ Cancellation automatically reverts assessment stage (100% of cases)
- ✅ Rescheduling creates distinct audit log entry (100% of cases)
- ✅ Reschedule count accurately increments (100% of cases)
- ✅ Original date preserved on first reschedule (100% of cases)
- ✅ Both list and detail pages support rescheduling (100% coverage)

### User Experience Metrics
- ✅ Clear confirmation dialogs for all destructive actions
- ✅ Success/error messages display appropriately
- ✅ Loading states prevent duplicate submissions
- ✅ Reschedule history visible on detail page
- ✅ Intuitive UI with consistent patterns

### Data Integrity Metrics
- ✅ No orphaned assessments after cancellation
- ✅ No duplicate appointments created
- ✅ Audit trail complete for all operations
- ✅ RLS policies enforced correctly
- ✅ No data loss during reschedules

---

## Rollout Plan

### Development Phase (Current)
1. ✅ Create PRD (this document)
2. 🔄 Implement database migration
3. 🔄 Implement service methods
4. 🔄 Update UI components
5. 🔄 Manual testing

### Staging Phase
1. Deploy to staging environment
2. Conduct UAT with admin users
3. Conduct UAT with engineer users
4. Verify audit logs in Supabase dashboard
5. Performance testing (if needed)

### Production Phase
1. Deploy migration to production
2. Deploy service layer changes
3. Deploy UI changes
4. Monitor error logs
5. Collect user feedback

### Rollback Plan
If critical issues found:
1. Revert UI changes (remove reschedule buttons/modals)
2. Keep new service methods but don't call them
3. Keep database columns (data won't break anything)
4. Fix issues in development
5. Re-deploy when ready

---

## Future Enhancements

### Phase 2 Enhancements (Future)
1. **Notification System Integration**
   - Email notification on cancellation
   - Email notification on reschedule
   - SMS notifications (optional)
   - In-app notification bell

2. **Calendar View**
   - Visual calendar with appointments
   - Drag-and-drop to reschedule
   - Engineer workload view
   - Color coding by status

3. **Advanced Reschedule Features**
   - Suggest alternative dates based on engineer availability
   - Bulk reschedule for multiple appointments
   - Recurring appointment support
   - Conflict detection when scheduling

4. **Analytics & Reporting**
   - Reschedule frequency by engineer
   - Cancellation reasons analysis
   - Appointment completion rate
   - Average reschedule count per appointment

5. **Mobile Optimization**
   - Mobile-friendly reschedule modal
   - Touch-optimized date/time pickers
   - Push notifications for changes

---

## Related Documentation

- [Database Schema Documentation](.agent/System/database_schema.md) - Appointments table details
- [Assessment-Centric Architecture SOP](.agent/SOP/working_with_assessment_centric_architecture.md) - Stage transition patterns
- [Project Architecture](.agent/System/project_architecture.md) - System overview
- [Appointment System Research Report](.agent/Tasks/active/appointment_system_research_report.md) - Complete research findings

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| Jan 27, 2025 | Claude | Initial PRD creation with comprehensive research |

---

**End of PRD**
