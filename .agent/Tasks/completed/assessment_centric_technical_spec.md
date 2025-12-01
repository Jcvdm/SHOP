# Assessment-Centric Architecture - Technical Specification

## Overview

This document provides detailed technical specifications, SQL migrations, and code examples for implementing the assessment-centric architecture refactor.

**Related:** [Assessment-Centric Architecture Refactor PRD](./assessment_centric_architecture_refactor.md)

---

## Phase 0: Schema Foundation

### Migration 068: Add Assessment Stage

**File:** `supabase/migrations/068_add_assessment_stage.sql`

```sql
-- ============================================================================
-- Migration 068: Add Assessment Stage Field
-- Purpose: Introduce stage-based pipeline tracking for assessments
-- Date: January 2025
-- ============================================================================

-- Step 1: Create assessment_stage enum type
CREATE TYPE assessment_stage AS ENUM (
  'request_submitted',      -- Initial request created, assessment created
  'request_accepted',       -- Admin accepted request, ready for scheduling
  'inspection_scheduled',   -- Appointment scheduled with engineer
  'assessment_in_progress', -- Engineer started assessment (collecting data)
  'assessment_completed',   -- All assessment tabs completed
  'estimate_finalized',     -- Estimate finalized, rates frozen
  'frc_in_progress',        -- Final Repair Costing started
  'frc_completed',          -- FRC completed and signed off
  'archived',               -- Assessment archived/completed
  'cancelled'               -- Cancelled at any stage
);

-- Step 2: Add stage column to assessments table
ALTER TABLE assessments
  ADD COLUMN stage assessment_stage NOT NULL DEFAULT 'request_submitted';

-- Step 3: Make appointment_id and inspection_id nullable
-- (They don't exist when assessment is first created with request)
ALTER TABLE assessments
  ALTER COLUMN appointment_id DROP NOT NULL,
  ALTER COLUMN inspection_id DROP NOT NULL;

-- Step 4: Add unique constraint on request_id
-- (One assessment per request - assessment is the canonical case record)
ALTER TABLE assessments
  ADD CONSTRAINT uq_assessments_request UNIQUE (request_id);

-- Step 5: Add check constraint for appointment_id requirement
-- (appointment_id must exist for certain stages)
ALTER TABLE assessments
  ADD CONSTRAINT require_appointment_when_scheduled
  CHECK (
    CASE
      WHEN stage IN (
        'inspection_scheduled',
        'assessment_in_progress',
        'assessment_completed',
        'estimate_finalized',
        'frc_in_progress',
        'frc_completed'
      ) THEN appointment_id IS NOT NULL
      ELSE TRUE
    END
  );

-- Step 6: Add indexes for performance
CREATE INDEX idx_assessments_stage ON assessments(stage);
CREATE INDEX idx_assessments_request_id ON assessments(request_id);

-- Step 7: Backfill existing assessments with stage based on status
UPDATE assessments
SET stage = CASE
  WHEN status = 'in_progress' THEN 'assessment_in_progress'::assessment_stage
  WHEN status = 'completed' THEN 'assessment_completed'::assessment_stage
  WHEN status = 'submitted' THEN 'estimate_finalized'::assessment_stage
  WHEN status = 'archived' THEN 'archived'::assessment_stage
  WHEN status = 'cancelled' THEN 'cancelled'::assessment_stage
  ELSE 'assessment_in_progress'::assessment_stage
END;

-- Step 8: Add comment for documentation
COMMENT ON COLUMN assessments.stage IS 'Pipeline stage tracking - replaces status field with more granular workflow stages';
COMMENT ON TYPE assessment_stage IS 'Assessment pipeline stages from request submission to archive';

-- ============================================================================
-- RLS Policy Updates
-- ============================================================================

-- Drop old INSERT policy that requires appointment_id
DROP POLICY IF EXISTS "Engineers can insert their assessments" ON assessments;

-- Create new INSERT policy that allows admin inserts without appointment_id
CREATE POLICY "Admins can insert assessments without appointment"
ON assessments FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Create new INSERT policy for engineers (requires appointment_id)
CREATE POLICY "Engineers can insert assessments for their appointments"
ON assessments FOR INSERT
TO authenticated
WITH CHECK (
  appointment_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.id = appointment_id
    AND appointments.engineer_id = get_user_engineer_id()
  )
);

-- Update SELECT policy to allow viewing assessments in early stages
-- (Admins can see all, engineers can see their assigned ones)
DROP POLICY IF EXISTS "Engineers can view their assessments" ON assessments;

CREATE POLICY "Engineers can view their assessments"
ON assessments FOR SELECT
TO authenticated
USING (
  is_admin()
  OR (
    appointment_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = assessments.appointment_id
      AND appointments.engineer_id = get_user_engineer_id()
    )
  )
);

-- ============================================================================
-- Audit Log Entry
-- ============================================================================

INSERT INTO audit_logs (
  entity_type,
  entity_id,
  action,
  old_value,
  new_value,
  metadata
) VALUES (
  'system',
  gen_random_uuid(),
  'migration',
  'status-based workflow',
  'stage-based workflow',
  jsonb_build_object(
    'migration', '068_add_assessment_stage',
    'description', 'Added assessment_stage enum and stage column to assessments table',
    'breaking_changes', false,
    'backfilled_records', (SELECT COUNT(*) FROM assessments)
  )
);
```

---

## Phase 1: Create Assessment with Request

### Service Layer Changes

**File:** `src/lib/services/request.service.ts`

```typescript
import { supabase } from '$lib/supabase';
import type { Request, CreateRequestInput, UpdateRequestInput } from '$lib/types/request';
import type { ServiceClient } from '$lib/types/service';
import { auditService } from './audit.service';
import { AssessmentService } from './assessment.service';

export class RequestService {
  private assessmentService = new AssessmentService();

  /**
   * Create a new request with automatic assessment creation
   * This eliminates the race condition at "Start Assessment" by creating the assessment upfront
   */
  async createRequest(
    input: CreateRequestInput,
    client?: ServiceClient,
    maxRetries: number = 3
  ): Promise<{ request: Request; assessment: Assessment }> {
    const db = client ?? supabase;

    // Retry loop to handle race conditions in request number generation
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const requestNumber = await this.generateRequestNumber(input.type, client);

        // Step 1: Create request
        const { data: request, error: requestError } = await db
          .from('requests')
          .insert({
            ...input,
            request_number: requestNumber,
            status: 'draft',
            current_step: 'request'
          })
          .select()
          .single();

        if (requestError) {
          // Check if this is a duplicate key error (race condition)
          if (requestError.code === '23505' && attempt < maxRetries - 1) {
            console.log(`Duplicate request number detected (attempt ${attempt + 1}/${maxRetries}), retrying...`);
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
            continue;
          }

          console.error('Error creating request:', requestError);
          throw new Error(`Failed to create request: ${requestError.message}`);
        }

        // Step 2: Create assessment immediately
        // This is the key change - assessment exists from the start
        const assessment = await this.assessmentService.createAssessmentForRequest(
          request.id,
          client,
          maxRetries
        );

        // Step 3: Log creation
        await auditService.logChange({
          entity_type: 'request',
          entity_id: request.id,
          action: 'created',
          new_value: requestNumber,
          metadata: {
            type: input.type,
            client_id: input.client_id,
            assessment_id: assessment.id,
            assessment_number: assessment.assessment_number
          }
        });

        return { request, assessment };

      } catch (error) {
        // If we're on the last retry, throw the error
        if (attempt === maxRetries - 1) {
          throw error;
        }
        // Otherwise, retry
        console.log(`Error creating request (attempt ${attempt + 1}/${maxRetries}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
      }
    }

    throw new Error('Failed to create request after maximum retries');
  }

  // ... rest of RequestService methods unchanged
}
```

**File:** `src/lib/services/assessment.service.ts`

```typescript
import { supabase } from '$lib/supabase';
import type { Assessment, CreateAssessmentInput } from '$lib/types/assessment';
import type { ServiceClient } from '$lib/types/service';
import { auditService } from './audit.service';

export class AssessmentService {
  /**
   * Generate unique assessment number (ASM-2025-001)
   */
  private async generateAssessmentNumber(client?: ServiceClient): Promise<string> {
    const db = client ?? supabase;
    const year = new Date().getFullYear();

    const { count, error } = await db
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .like('assessment_number', `ASM-${year}-%`);

    if (error) {
      console.error('Error counting assessments:', error);
      throw new Error(`Failed to generate assessment number: ${error.message}`);
    }

    const nextNumber = (count || 0) + 1;
    return `ASM-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * Create assessment for a request (called during request creation)
   * This is the new pattern - assessment created upfront, not at "Start Assessment"
   */
  async createAssessmentForRequest(
    requestId: string,
    client?: ServiceClient,
    maxRetries: number = 3
  ): Promise<Assessment> {
    const db = client ?? supabase;

    // Retry loop to handle race conditions in assessment number generation
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const assessmentNumber = await this.generateAssessmentNumber(client);

        const { data, error } = await db
          .from('assessments')
          .insert({
            request_id: requestId,
            assessment_number: assessmentNumber,
            stage: 'request_submitted', // Initial stage
            status: 'in_progress', // Keep for backward compatibility
            appointment_id: null, // Will be set when appointment is scheduled
            inspection_id: null, // Keep for backward compatibility
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          // Check if this is a duplicate key error (race condition)
          if (error.code === '23505' && attempt < maxRetries - 1) {
            console.log(`Duplicate assessment number detected (attempt ${attempt + 1}/${maxRetries}), retrying...`);
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
            continue;
          }

          console.error('Error creating assessment:', error);
          throw new Error(`Failed to create assessment: ${error.message}`);
        }

        // Log creation
        await auditService.logChange({
          entity_type: 'assessment',
          entity_id: data.id,
          action: 'created',
          new_value: assessmentNumber,
          metadata: {
            request_id: requestId,
            stage: 'request_submitted'
          }
        });

        return data;

      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
      }
    }

    throw new Error('Failed to create assessment after maximum retries');
  }

  /**
   * Find or create assessment by request ID
   * Idempotent operation - safe to call multiple times
   */
  async findOrCreateByRequest(
    requestId: string,
    client?: ServiceClient
  ): Promise<Assessment> {
    const db = client ?? supabase;

    // Try to find existing assessment
    const { data: existing, error: findError } = await db
      .from('assessments')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (existing) {
      return existing;
    }

    // If not found (and error is PGRST116 = not found), create new
    if (findError && findError.code === 'PGRST116') {
      return this.createAssessmentForRequest(requestId, client);
    }

    // Other errors should be thrown
    if (findError) {
      console.error('Error finding assessment:', findError);
      throw new Error(`Failed to find assessment: ${findError.message}`);
    }

    throw new Error('Unexpected state in findOrCreateByRequest');
  }

  /**
   * Update assessment stage with audit logging
   */
  async updateStage(
    id: string,
    newStage: AssessmentStage,
    client?: ServiceClient
  ): Promise<Assessment> {
    const db = client ?? supabase;

    // Get current assessment
    const current = await this.getAssessment(id, client);
    if (!current) {
      throw new Error('Assessment not found');
    }

    // Update stage
    const { data, error } = await db
      .from('assessments')
      .update({ stage: newStage })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating assessment stage:', error);
      throw new Error(`Failed to update assessment stage: ${error.message}`);
    }

    // Log stage transition
    await auditService.logChange({
      entity_type: 'assessment',
      entity_id: id,
      action: 'stage_transition',
      old_value: current.stage,
      new_value: newStage,
      metadata: {
        assessment_number: current.assessment_number
      }
    });

    return data;
  }

  // ... rest of AssessmentService methods
}
```

---

## Phase 2: Update "Start Assessment" Flow

**File:** `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts`

```typescript
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { AssessmentService } from '$lib/services/assessment.service';
import { AppointmentService } from '$lib/services/appointment.service';
import { VehicleIdentificationService } from '$lib/services/vehicle-identification.service';
import { TyresService } from '$lib/services/tyres.service';
import { DamageService } from '$lib/services/damage.service';
// ... other service imports

const assessmentService = new AssessmentService();
const appointmentService = new AppointmentService();
// ... other service instances

export const load: PageServerLoad = async ({ params, locals }) => {
  const { appointment_id } = params;

  try {
    // Step 1: Get appointment
    const appointment = await appointmentService.getAppointment(appointment_id, locals.supabase);
    if (!appointment) {
      throw error(404, 'Appointment not found');
    }

    // Step 2: Find or create assessment (idempotent)
    // This is the key change - we don't create a new assessment, we find the existing one
    let assessment = await assessmentService.findOrCreateByRequest(
      appointment.request_id,
      locals.supabase
    );

    // Step 3: If assessment is in early stage, transition to in_progress
    if (assessment.stage === 'inspection_scheduled') {
      // Update stage to in_progress
      assessment = await assessmentService.updateStage(
        assessment.id,
        'assessment_in_progress',
        locals.supabase
      );

      // Link appointment to assessment if not already linked
      if (!assessment.appointment_id) {
        assessment = await assessmentService.updateAssessment(
          assessment.id,
          { appointment_id: appointment.id },
          locals.supabase
        );
      }

      // Create default child records (only if they don't exist)
      await Promise.all([
        vehicleIdentificationService.findOrCreate(assessment.id, locals.supabase),
        tyresService.createDefaultTyres(assessment.id, locals.supabase),
        damageService.findOrCreate(assessment.id, locals.supabase),
        // ... other default records
      ]);
    }

    // Step 4: Load all assessment data
    const [
      vehicleIdentification,
      exterior360,
      accessories,
      interiorMechanical,
      tyres,
      damage,
      notes,
      estimate,
      preIncidentEstimate,
      vehicleValues
    ] = await Promise.all([
      vehicleIdentificationService.getByAssessment(assessment.id, locals.supabase),
      // ... load other data
    ]);

    return {
      appointment,
      assessment,
      vehicleIdentification,
      // ... other data
    };

  } catch (err) {
    console.error('Error loading assessment:', err);
    throw error(500, 'Failed to load assessment');
  }
};
```

---

## TypeScript Type Updates

**File:** `src/lib/types/assessment.ts`

```typescript
// Add new stage type
export type AssessmentStage =
  | 'request_submitted'
  | 'request_accepted'
  | 'inspection_scheduled'
  | 'assessment_in_progress'
  | 'assessment_completed'
  | 'estimate_finalized'
  | 'frc_in_progress'
  | 'frc_completed'
  | 'archived'
  | 'cancelled';

// Update Assessment interface
export interface Assessment {
  id: string;
  assessment_number: string;
  request_id: string;
  appointment_id: string | null; // Now nullable
  inspection_id: string | null; // Now nullable
  stage: AssessmentStage; // New field
  status: AssessmentStatus; // Keep for backward compatibility
  current_tab: string;
  tabs_completed: string[];
  started_at: string;
  completed_at: string | null;
  submitted_at: string | null;
  cancelled_at: string | null;
  // ... other fields
  created_at: string;
  updated_at: string;
}

// Update CreateAssessmentInput
export interface CreateAssessmentInput {
  request_id: string;
  appointment_id?: string | null; // Now optional
  inspection_id?: string | null; // Now optional
  stage?: AssessmentStage;
  status?: AssessmentStatus;
}
```

---

## Testing Checklist

### Phase 0 Testing
- [ ] Migration runs successfully on dev branch
- [ ] Existing assessments have correct stage values
- [ ] RLS policies allow admin inserts without appointment_id
- [ ] RLS policies still enforce engineer restrictions
- [ ] Indexes created successfully
- [ ] No breaking changes to existing functionality

### Phase 1 Testing
- [ ] Creating request automatically creates assessment
- [ ] Assessment has correct stage ('request_submitted')
- [ ] Assessment number generated correctly (ASM-YYYY-NNN)
- [ ] Audit logs track assessment creation
- [ ] Concurrent request creation doesn't cause duplicates
- [ ] findOrCreateByRequest is idempotent

### Phase 2 Testing
- [ ] "Start Assessment" finds existing assessment
- [ ] Stage transitions from 'inspection_scheduled' to 'assessment_in_progress'
- [ ] Default child records created
- [ ] Double-clicking "Start Assessment" doesn't cause errors
- [ ] Appointment doesn't disappear on error
- [ ] Assessment loads correctly with all data

---

## Rollback Procedures

See [Assessment-Centric Architecture Refactor PRD](./assessment_centric_architecture_refactor.md#rollback-plan) for detailed rollback procedures.

---

## Related Documentation

- [Assessment-Centric Architecture Refactor PRD](./assessment_centric_architecture_refactor.md)
- [Database Schema](../../System/database_schema.md)
- [Working with Services](../../SOP/working_with_services.md)
- [Adding Database Migrations](../../SOP/adding_migration.md)

