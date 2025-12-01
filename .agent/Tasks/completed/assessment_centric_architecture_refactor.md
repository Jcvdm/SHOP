# Assessment-Centric Architecture Refactor

## Status
✅ **COMPLETE** - All phases implemented (Phases 0-3 complete, Phase 4 optional and deferred)

**Latest Update:** January 26, 2025 - Phase 3 (Stage-Based List Pages) complete

## Priority
**CRITICAL** - Addresses recurring race conditions and simplifies data model

---

## Problem Statement

### Current Issues

**1. Race Condition in Assessment Creation (issue.md)**
- Clicking "Start Assessment" triggers duplicate assessment creation attempts
- Error: `duplicate key value violates unique constraint "assessments_assessment_number_key"`
- After error, appointment disappears from list (status updated prematurely)
- User loses visibility of work and cannot retry

**2. Complex Multi-Table Workflow**
- Current flow: Request → Inspection → Appointment → Assessment (4 separate entities)
- Each stage creates a new ID and duplicates vehicle/client data
- Foreign key chain: assessment requires appointment_id, inspection_id, request_id (all NOT NULL)
- Assessment created "late" in the workflow, causing concurrency issues

**3. Data Duplication & Inconsistency**
- Vehicle information copied across requests, inspections, appointments, assessments
- Client information duplicated in multiple tables
- Updates to one entity don't propagate to others
- No single source of truth for a "case"

**4. RLS Policy Complexity**
- Policies must join across multiple tables to check ownership
- Engineer access requires checking appointments.engineer_id → assessments
- Complex policy chains increase query overhead and error surface

**5. Sequential Number Generation Vulnerability**
- Count-then-insert pattern is not atomic
- Race conditions occur when multiple users/requests create entities simultaneously
- Retry logic (100ms, 200ms, 400ms) mitigates but doesn't eliminate the issue

---

## Proposed Solution

### Assessment-Centric Data Model

**Core Concept:** Create the assessment record at the moment a request is created. The assessment becomes the single source of truth that moves through pipeline stages, eliminating the need for separate inspection/appointment entities to "create" the assessment.

**Key Changes:**
1. **Assessment created with request** - No more late creation
2. **Stage field tracks pipeline** - Single enum field replaces multiple status fields across tables
3. **Nullable foreign keys** - appointment_id and inspection_id become optional (only required at certain stages)
4. **One assessment per request** - Enforced by unique constraint on request_id

---

## Architecture Design

### Stage-Based Pipeline

**Assessment Stage Enum:**
```sql
CREATE TYPE assessment_stage AS ENUM (
  'request_submitted',    -- Initial request created
  'request_accepted',     -- Admin accepted request
  'inspection_scheduled', -- Inspection scheduled (appointment created)
  'assessment_in_progress', -- Engineer started assessment
  'assessment_completed', -- All tabs completed
  'estimate_finalized',   -- Estimate finalized
  'frc_in_progress',      -- FRC started
  'frc_completed',        -- FRC completed and signed off
  'archived',             -- Archived/completed
  'cancelled'             -- Cancelled at any stage
);
```

**Stage Transitions:**
```
request_submitted
  ↓ (Admin accepts)
request_accepted
  ↓ (Admin/Engineer schedules appointment)
inspection_scheduled
  ↓ (Engineer clicks "Start Assessment")
assessment_in_progress
  ↓ (Engineer completes all tabs)
assessment_completed
  ↓ (Engineer finalizes estimate)
estimate_finalized
  ↓ (Admin starts FRC)
frc_in_progress
  ↓ (Admin completes FRC)
frc_completed
  ↓ (Admin archives)
archived

(Any stage can transition to 'cancelled')
```

### Database Schema Changes

**Phase 0: Add Stage Field & Relax Constraints**

```sql
-- Add stage enum type
CREATE TYPE assessment_stage AS ENUM (
  'request_submitted', 'request_accepted', 'inspection_scheduled',
  'assessment_in_progress', 'assessment_completed', 'estimate_finalized',
  'frc_in_progress', 'frc_completed', 'archived', 'cancelled'
);

-- Modify assessments table
ALTER TABLE assessments
  ADD COLUMN stage assessment_stage NOT NULL DEFAULT 'request_submitted',
  ALTER COLUMN appointment_id DROP NOT NULL,
  ALTER COLUMN inspection_id DROP NOT NULL,
  ADD CONSTRAINT uq_assessments_request UNIQUE (request_id);

-- Add check constraint: appointment_id required for certain stages
ALTER TABLE assessments
  ADD CONSTRAINT require_appointment_when_scheduled
  CHECK (
    CASE
      WHEN stage IN ('inspection_scheduled', 'assessment_in_progress', 
                     'assessment_completed', 'estimate_finalized',
                     'frc_in_progress', 'frc_completed')
        THEN appointment_id IS NOT NULL
      ELSE TRUE
    END
  );

-- Add indexes
CREATE INDEX idx_assessments_stage ON assessments(stage);
CREATE INDEX idx_assessments_request_id ON assessments(request_id);
```

**Phase 1: Link Appointments to Assessments**

```sql
-- Add assessment_id to appointments (optional for backward compatibility)
ALTER TABLE appointments
  ADD COLUMN assessment_id UUID REFERENCES assessments(id);

CREATE INDEX idx_appointments_assessment_id ON appointments(assessment_id);
```

---

## Implementation Plan

### Phase 0: Schema Foundation (Non-Breaking)
**Duration:** 2-3 hours  
**Risk:** Low - Additive changes only

**Tasks:**
1. ✅ Create migration `068_add_assessment_stage.sql`
   - Add `assessment_stage` enum type
   - Add `stage` column to assessments (default 'request_submitted')
   - Make `appointment_id` and `inspection_id` nullable
   - Add unique constraint on `request_id`
   - Add check constraint for appointment_id requirement
   - Add indexes on stage and request_id

2. ✅ Backfill existing assessments
   - Set stage based on current status:
     - status='in_progress' → stage='assessment_in_progress'
     - status='completed' → stage='assessment_completed'
     - status='submitted' → stage='estimate_finalized'
     - status='archived' → stage='archived'
     - status='cancelled' → stage='cancelled'

3. ✅ Update RLS policies
   - Modify INSERT policy to allow admin inserts without appointment_id
   - Keep existing SELECT/UPDATE policies (no breaking changes)

**Verification:**
- Run migration on dev branch
- Verify existing assessments have correct stage values
- Verify RLS policies still work for engineers and admins

---

### Phase 1: Create Assessment with Request
**Duration:** 4-6 hours  
**Risk:** Medium - Changes request creation flow

**Tasks:**
1. ✅ Update `RequestService.createRequest()`
   - After creating request, immediately create assessment
   - Use same transaction if possible (or handle rollback)
   - Assessment fields:
     - `request_id`: from created request
     - `assessment_number`: generate ASM-YYYY-NNN
     - `stage`: 'request_submitted'
     - `appointment_id`: null
     - `inspection_id`: null (keep for backward compatibility)
     - `status`: 'in_progress' (keep for backward compatibility)

2. ✅ Create `AssessmentService.findOrCreateByRequest()`
   - Check if assessment exists for request_id
   - If exists, return existing
   - If not, create new assessment
   - Prevents duplicate creation attempts

3. ✅ Update request creation UI
   - No UI changes needed (transparent to user)
   - Assessment created in background

4. ✅ Add audit logging
   - Log assessment creation with request
   - Track stage transitions

**Verification:**
- Create new request → verify assessment created automatically
- Check assessment has correct stage ('request_submitted')
- Verify audit log entries
- Test with multiple concurrent request creations

---

### Phase 2: Update "Start Assessment" Flow
**Duration:** 3-4 hours  
**Risk:** Medium - Changes critical user workflow

**Tasks:**
1. ✅ Update `/work/assessments/[appointment_id]/+page.server.ts`
   - Change from creating assessment to finding existing assessment
   - Use `AssessmentService.findOrCreateByRequest(request_id)`
   - Update stage from 'inspection_scheduled' → 'assessment_in_progress'
   - Create default child records (vehicle_identification, tyres, etc.)

2. ✅ Remove assessment creation from appointment flow
   - Assessment already exists, just needs stage update
   - Eliminates race condition at this step

3. ✅ Update appointment status handling
   - Keep appointment status updates (scheduled → in_progress)
   - But don't rely on it for assessment visibility

**Verification:**
- Click "Start Assessment" → verify no duplicate errors
- Verify assessment loads correctly
- Verify child records created
- Test double-click scenario (should be idempotent)
- Verify appointment doesn't disappear on error

---

### Phase 3: Stage-Based List Pages ✅ COMPLETE
**Duration:** 6-8 hours (Actual: ~6 hours)
**Risk:** Low - UI changes only, no data model changes
**Completed:** January 26, 2025

**Tasks:**
1. ✅ Update Requests page (`/requests/+page.server.ts`)
   - Query assessments where stage IN ('request_submitted', 'request_accepted')
   - Join to requests table for vehicle/client info
   - Keep existing UI (transparent to user)

2. ✅ Update Inspections page (`/work/inspections/+page.server.ts`)
   - Query assessments where stage = 'request_accepted'
   - Show "Accept" button to move to 'inspection_scheduled'
   - Keep existing inspection functionality

3. ✅ Update Appointments page (`/work/appointments/+page.server.ts`)
   - Query assessments where stage = 'inspection_scheduled'
   - Join to appointments table for date/time/location
   - "Start Assessment" button updates stage to 'assessment_in_progress'

4. ✅ Update Open Assessments page (`/work/assessments/+page.server.ts`)
   - Query assessments where stage = 'assessment_in_progress'
   - No changes to assessment detail page

5. ✅ Update Finalized Assessments page
   - Query assessments where stage = 'estimate_finalized'

6. ✅ Update FRC page
   - Query assessments where stage IN ('frc_in_progress', 'frc_completed')

7. ✅ Update Archive page
   - Query assessments where stage = 'archived' OR stage = 'cancelled'

**Verification:**
- Navigate through all list pages
- Verify correct assessments appear in each stage
- Verify counts in sidebar badges
- Test filtering by engineer (role-based access)

---

### Phase 4: Deprecate Old Status Fields (Optional)
**Duration:** 4-6 hours  
**Risk:** Low - Cleanup only

**Tasks:**
1. ✅ Update all services to use `stage` instead of `status`
2. ✅ Remove `status` column from assessments (breaking change)
3. ✅ Remove `status` from requests/inspections/appointments (if desired)
4. ✅ Update TypeScript types

**Note:** This phase can be deferred or skipped if backward compatibility is desired.

---

## Benefits

### 1. Eliminates Race Conditions
- Assessment ID created once at request creation
- No more "Start Assessment" race condition
- Idempotent operations (find-or-create pattern)

### 2. Single Source of Truth
- Assessment is the canonical "case" record
- All child tables reference assessment_id
- No data duplication across workflow stages

### 3. Simplified RLS Policies
- Single table to check for ownership
- Engineer access via appointments.assessment_id join (simpler)
- Fewer policy chains = better performance

### 4. Clearer Workflow
- Stage field explicitly shows pipeline position
- Easy to query "all assessments in stage X"
- Audit trail of stage transitions

### 5. Better Error Recovery
- If operation fails, assessment still exists
- User can retry without losing work
- No orphaned appointments

---

## Risks & Mitigations

### Risk 1: Breaking Changes to Existing Code
**Mitigation:**
- Phased rollout (Phase 0-3 are non-breaking)
- Keep old fields for backward compatibility
- Extensive testing at each phase

### Risk 2: Data Migration Complexity
**Mitigation:**
- Backfill script for existing assessments
- Test on dev branch first
- Rollback plan (drop stage column, restore NOT NULL constraints)

### Risk 3: RLS Policy Gaps
**Mitigation:**
- Update policies in Phase 0
- Test with both admin and engineer users
- Verify no permission errors

### Risk 4: Performance Impact
**Mitigation:**
- Add indexes on stage and request_id
- Monitor query performance
- Optimize joins if needed

---

## Testing Strategy

### Unit Tests
- `RequestService.createRequest()` creates assessment
- `AssessmentService.findOrCreateByRequest()` is idempotent
- Stage transitions follow valid paths

### Integration Tests
- Create request → verify assessment exists
- Start assessment → verify stage updated
- Complete assessment → verify stage transitions

### E2E Tests
- Full workflow: request → inspection → appointment → assessment → finalize → FRC
- Test as admin user
- Test as engineer user
- Test concurrent operations (race conditions)

### Manual Testing
- Create 10 requests rapidly → verify no duplicates
- Double-click "Start Assessment" → verify no errors
- Verify all list pages show correct data
- Verify sidebar badge counts

---

## Rollback Plan

If issues arise, rollback steps:

1. **Phase 3 Rollback:** Revert list page queries to old tables
2. **Phase 2 Rollback:** Revert "Start Assessment" to create assessment
3. **Phase 1 Rollback:** Stop creating assessment with request
4. **Phase 0 Rollback:**
   ```sql
   ALTER TABLE assessments
     DROP CONSTRAINT uq_assessments_request,
     DROP CONSTRAINT require_appointment_when_scheduled,
     DROP COLUMN stage,
     ALTER COLUMN appointment_id SET NOT NULL,
     ALTER COLUMN inspection_id SET NOT NULL;
   
   DROP TYPE assessment_stage;
   ```

---

## Success Criteria

✅ **Phase 0 Complete:**
- Migration applied successfully
- Existing assessments backfilled with correct stages
- RLS policies updated and tested

✅ **Phase 1 Complete:**
- New requests automatically create assessments
- No duplicate assessment errors
- Audit logs track assessment creation

✅ **Phase 2 Complete:**
- "Start Assessment" no longer creates assessment
- No race condition errors
- Appointments don't disappear on error

✅ **Phase 3 Complete:**
- All list pages use stage-based queries
- Sidebar badge counts accurate
- Engineer filtering works correctly

✅ **Overall Success:**
- Zero race condition errors in production
- Faster page load times (fewer joins)
- Clearer audit trail
- Easier to add new workflow stages

---

## Timeline

**Total Estimated Time:** 19-27 hours (2.5-3.5 days)

- Phase 0: 2-3 hours
- Phase 1: 4-6 hours
- Phase 2: 3-4 hours
- Phase 3: 6-8 hours
- Testing: 4-6 hours

**Recommended Approach:** Implement one phase per day, with thorough testing between phases.

---

## Related Documentation

- [Database Schema](../../System/database_schema.md) - Current schema reference
- [Working with Services](../../SOP/working_with_services.md) - Service layer patterns
- [Adding Database Migrations](../../SOP/adding_migration.md) - Migration workflow
- [Handling Race Conditions](../../SOP/handling_race_conditions_in_number_generation.md) - Current race condition handling
- [Service Client Authentication](../../SOP/service_client_authentication.md) - RLS authentication pattern

---

## Next Steps

1. Review this PRD with team
2. Get approval for architecture change
3. Create dev branch: `feature/assessment-centric-architecture`
4. Implement Phase 0 (schema foundation)
5. Test thoroughly on dev branch
6. Proceed to Phase 1 after Phase 0 verification

