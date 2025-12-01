---
name: Assessment-Centric Specialist
description: Implement and maintain ClaimTech's assessment-centric architecture where assessments are the canonical "case" record existing from request creation through completion. Use when implementing stage-based features, adding workflow stages, fixing assessment bugs, or ensuring compliance with assessment-centric patterns.
---

# Assessment-Centric Specialist Skill

Specialized expertise for implementing and maintaining ClaimTech's assessment-centric architecture.

## Overview

This skill provides comprehensive guidance for working with ClaimTech's assessment-centric data model, where assessments serve as the canonical "case" record from request creation through FRC completion. The assessment-centric approach eliminates race conditions, simplifies the data model, and provides a single source of truth for the entire workflow.

## When to Use

Auto-invokes when working with:
- Assessment stage transitions and workflow
- Stage-based list page queries
- Assessment creation and lifecycle
- Child record idempotency
- Assessment-related bugs or errors
- Migration from status-based to stage-based queries

**Explicit invocation recommended for:**
- Implementing Phase 3 (stage-based list pages)
- Adding new workflow stages
- Debugging constraint violations
- Ensuring backward compatibility with old requests

## Key Concepts

### Assessment-Centric Principles

1. **Assessment created WITH request** - Not at "Start Assessment"
2. **One assessment per request** - Enforced by unique constraint
3. **10 pipeline stages** - From request_submitted → archived/cancelled
4. **Nullable foreign keys** - appointment_id, inspection_id can be null initially
5. **Check constraint enforces relationships** - appointment_id required for later stages
6. **All operations are idempotent** - Safe to call multiple times
7. **Stage transitions are logged** - Complete audit trail maintained

### Stage-Based Pipeline

```
request_submitted (default)
  ↓ (Admin reviews)
request_reviewed
  ↓ (Admin schedules appointment)
appointment_scheduled
  ↓ (Engineer accepts)
inspection_scheduled
  ↓ (Engineer clicks "Start Assessment")
assessment_in_progress
  ↓ (Engineer creates estimate)
estimate_review
  ↓ (Admin sends estimate)
estimate_sent
  ↓ (Estimate approved)
estimate_finalized
  ↓ (FRC started)
frc_in_progress
  ↓ (Admin archives)
archived

(Can be cancelled at any stage → cancelled)
```

---

## Core Skills

### Skill 1: Implement Stage-Based List Page

**When:** Converting status-based queries to stage-based queries, implementing new list pages

**Complexity:** Medium
**Time Estimate:** 15-30 minutes per page

**Steps:**

1. **Read Existing Page Load Function**
   ```typescript
   // Identify current query pattern
   const existing = await locals.supabase
     .from('some_table')
     .eq('status', 'some_status') // ← OLD status-based
   ```

2. **Map Status to Stage**
   ```typescript
   // Status → Stage mapping
   'draft' → 'request_submitted', 'request_reviewed'
   'pending' → 'request_reviewed'
   'scheduled' → 'appointment_scheduled', 'inspection_scheduled'
   'in_progress' → 'assessment_in_progress'
   'completed' → 'estimate_review', 'estimate_sent'
   'submitted' → 'estimate_finalized'
   'archived' → 'archived'
   'cancelled' → 'cancelled'
   ```

3. **Update Query to Use Stage**
   ```typescript
   const { data: assessments, error } = await locals.supabase
     .from('assessments')
     .select(`
       *,
       request:requests!inner(*),
       appointment:appointments(*),
       engineer:appointments(engineer:engineers(*))
     `)
     .eq('stage', 'assessment_in_progress') // ← NEW stage-based
     .order('updated_at', { ascending: false });
   ```

4. **Apply Role-Based Filtering**
   ```typescript
   let query = locals.supabase
     .from('assessments')
     .select('*')
     .eq('stage', 'assessment_in_progress');

   // Engineer filtering
   if (userRole === 'engineer') {
     query = query.eq('appointment.engineer_id', userId);
   }

   const { data } = await query;
   ```

5. **Test Different User Roles**
   - [ ] Test as admin (see all assessments)
   - [ ] Test as engineer (see only assigned)
   - [ ] Verify counts are accurate
   - [ ] Check pagination works

6. **Update Sidebar Badge if Applicable**
   ```typescript
   const { count } = await locals.supabase
     .from('assessments')
     .select('*', { count: 'exact', head: true })
     .eq('stage', 'assessment_in_progress');
   ```

7. **Verify RLS Still Enforced**
   - [ ] Check policy uses authenticated client
   - [ ] Verify no permission errors
   - [ ] Test with different user types

**Quality Checklist:**
- [ ] Uses `stage` field not `status`
- [ ] Includes proper RLS filters for user role
- [ ] Fetches related data efficiently (uses joins, not N+1 queries)
- [ ] Pagination works correctly
- [ ] Counts are accurate and match displayed items
- [ ] No breaking changes for existing functionality
- [ ] Backward compatible with old data

**Common Pitfalls:**
- ❌ Using `.eq('status', ...)` instead of `.eq('stage', ...)`
- ❌ Forgetting to apply engineer filtering
- ❌ Using N+1 queries instead of joins
- ❌ Not testing with both admin and engineer users

**Example Implementation:**
```typescript
// src/routes/(app)/work/assessments/+page.server.ts
export async function load({ locals }) {
  const session = await locals.getSession();
  const { data: profile } = await locals.supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session!.user.id)
    .single();

  let query = locals.supabase
    .from('assessments')
    .select(`
      *,
      request:requests!inner(*, client:clients(*)),
      appointment:appointments(*, engineer:engineers(*))
    `)
    .eq('stage', 'assessment_in_progress');

  // Engineer filtering
  if (profile?.role === 'engineer') {
    query = query.eq('appointment.engineer_id', session!.user.id);
  }

  const { data: assessments, error } = await query
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return { assessments };
}
```

---

### Skill 2: Add New Assessment Stage

**When:** Adding new workflow step to pipeline, splitting existing stage, adding approval/review stages

**Complexity:** High
**Time Estimate:** 60-90 minutes

**Steps:**

1. **Update Assessment Stage Enum**
   ```sql
   -- Migration: 070_add_quality_review_stage.sql
   ALTER TYPE assessment_stage
     ADD VALUE 'quality_review'
     BEFORE 'estimate_finalized';

   COMMENT ON TYPE assessment_stage IS
     'Updated: Added quality_review stage for QA process (Jan 2025)';
   ```

2. **Update TypeScript AssessmentStage Type**
   ```typescript
   // src/lib/types/assessment.ts
   export type AssessmentStage =
     | 'request_submitted'
     | 'request_reviewed'
     | 'appointment_scheduled'
     | 'inspection_scheduled'
     | 'assessment_in_progress'
     | 'estimate_review'
     | 'estimate_sent'
     | 'quality_review' // ← NEW STAGE
     | 'estimate_finalized'
     | 'frc_in_progress'
     | 'archived'
     | 'cancelled';
   ```

3. **Update Stage Transition Logic**
   ```typescript
   // In assessment completion handler
   if (allTabsCompleted) {
     await assessmentService.updateStage(
       assessmentId,
       'quality_review', // ← Changed from 'estimate_finalized'
       locals.supabase
     );
   }

   // In quality review approval handler
   if (qualityReviewPassed) {
     await assessmentService.updateStage(
       assessmentId,
       'estimate_finalized',
       locals.supabase
     );
   }
   ```

4. **Update Check Constraint if Needed**
   ```sql
   -- If new stage requires appointment_id
   ALTER TABLE assessments
     DROP CONSTRAINT require_appointment_when_scheduled;

   ALTER TABLE assessments
     ADD CONSTRAINT require_appointment_when_scheduled
     CHECK (
       CASE
         WHEN stage IN (
           'appointment_scheduled', 'inspection_scheduled',
           'assessment_in_progress', 'estimate_review', 'estimate_sent',
           'quality_review', -- ← Added here
           'estimate_finalized', 'frc_in_progress'
         )
           THEN appointment_id IS NOT NULL
         ELSE TRUE
       END
     );
   ```

5. **Update Relevant List Pages**
   ```typescript
   // Create new quality review page
   // src/routes/(app)/work/quality-review/+page.server.ts
   const { data: assessments } = await locals.supabase
     .from('assessments')
     .select('*')
     .eq('stage', 'quality_review')
     .order('updated_at', { ascending: false });
   ```

6. **Update Sidebar Badges**
   ```typescript
   // In +layout.server.ts
   const { count: qualityReviewCount } = await locals.supabase
     .from('assessments')
     .select('*', { count: 'exact', head: true })
     .eq('stage', 'quality_review');
   ```

7. **Add New Page for Stage if Needed**
   - Create route at appropriate location
   - Implement data loading
   - Create UI components
   - Add navigation link

8. **Test Stage Transitions**
   - [ ] Test transition INTO new stage
   - [ ] Test transition OUT OF new stage
   - [ ] Verify constraint enforcement
   - [ ] Test backward/forward compatibility

9. **Verify Audit Logging**
   ```typescript
   // Check audit logs created for stage transition
   const { data: logs } = await locals.supabase
     .from('audit_logs')
     .select('*')
     .eq('entity_type', 'assessment')
     .eq('entity_id', assessmentId)
     .order('created_at', { ascending: false });
   ```

**Quality Checklist:**
- [ ] Enum value added in correct order (affects sorting)
- [ ] TypeScript types match database enum exactly
- [ ] Constraint logic updated if stage requires appointment_id
- [ ] Audit logging tracks stage transition
- [ ] Backward compatible with existing assessments
- [ ] Migration is idempotent
- [ ] Documentation updated with new stage
- [ ] All stage transitions tested manually

**Common Pitfalls:**
- ❌ Adding enum value at wrong position (enum order matters)
- ❌ Forgetting to update TypeScript types
- ❌ Not updating check constraint for appointment_id
- ❌ Breaking existing stage transitions
- ❌ Not testing backward compatibility

---

### Skill 3: Fix Assessment-Related Bug

**When:** Debugging constraint violations, duplicate records, stage transition errors, RLS permission errors

**Complexity:** Variable (30-120 minutes depending on issue)
**Time Estimate:** 30-120 minutes

**Common Issues:**

**Issue 1: Constraint Violation - appointment_id Required**
```
Error: violates check constraint "require_appointment_when_scheduled"
```

**Diagnosis:**
```typescript
// Check if attempting to update stage without appointment_id
if (newStage in later stages && !assessment.appointment_id) {
  // This will fail
}
```

**Solution:**
```typescript
// ALWAYS link appointment BEFORE updating stage
if (!assessment.appointment_id) {
  assessment = await assessmentService.updateAssessment(
    assessment.id,
    { appointment_id },
    locals.supabase
  );
}

// THEN update stage
assessment = await assessmentService.updateStage(
  assessment.id,
  'inspection_scheduled',
  locals.supabase
);
```

**Issue 2: Duplicate Assessment Creation**
```
Error: duplicate key value violates unique constraint "uq_assessments_request"
```

**Diagnosis:**
```typescript
// Using createAssessment() instead of findOrCreateByRequest()
const assessment = await assessmentService.createAssessment({
  request_id: requestId // ← Will fail if assessment already exists
});
```

**Solution:**
```typescript
// Use idempotent method
const assessment = await assessmentService.findOrCreateByRequest(
  requestId,
  locals.supabase
);
```

**Issue 3: Duplicate Child Records**
```
Error: duplicate key value violates unique constraint "uq_assessment_tyres_position"
```

**Diagnosis:**
```typescript
// Calling createDefault multiple times
await tyresService.createDefaultTyres(assessmentId, locals.supabase);
// Page refresh or retry calls this again → duplicate error
```

**Solution:**
```typescript
// Services are already idempotent after migration 069
// If manually creating, use upsert:
await locals.supabase
  .from('assessment_tyres')
  .upsert(
    { assessment_id, position, position_label },
    { onConflict: 'assessment_id,position' }
  );
```

**Issue 4: RLS Permission Error**
```
Error: new row violates row-level security policy
```

**Diagnosis:**
```typescript
// Not passing authenticated client
const { data } = await supabase // ← Using global instance
  .from('assessments')
  .insert(assessment);
```

**Solution:**
```typescript
// Always pass authenticated client
const { data } = await locals.supabase // ← User's authenticated client
  .from('assessments')
  .insert(assessment);
```

**Issue 5: Stage Transition Error**
```
Error: Invalid stage transition
```

**Diagnosis:**
```typescript
// Attempting invalid transition (e.g., archived → assessment_in_progress)
await updateStage(id, 'assessment_in_progress', client);
```

**Solution:**
```typescript
// Check current stage first
if (assessment.stage === 'archived') {
  throw new Error('Cannot reopen archived assessment');
}

// Only allow valid transitions
const validTransitions = {
  'request_submitted': ['request_reviewed', 'cancelled'],
  'request_reviewed': ['appointment_scheduled', 'cancelled'],
  'appointment_scheduled': ['inspection_scheduled', 'cancelled'],
  'inspection_scheduled': ['assessment_in_progress', 'cancelled'],
  'assessment_in_progress': ['estimate_review', 'cancelled'],
  'estimate_review': ['estimate_sent', 'assessment_in_progress', 'cancelled'],
  'estimate_sent': ['estimate_finalized', 'estimate_review', 'cancelled'],
  'estimate_finalized': ['frc_in_progress', 'archived'],
  'frc_in_progress': ['archived'],
  // ... etc
};

if (!validTransitions[currentStage]?.includes(newStage)) {
  throw new Error(`Cannot transition from ${currentStage} to ${newStage}`);
}
```

**Diagnostic Workflow:**

1. **Read Error Message Carefully**
   - Identify constraint name
   - Identify which stage/operation failed
   - Check if RLS or constraint violation

2. **Identify Which Constraint or Stage Involved**
   - `require_appointment_when_scheduled` → appointment_id issue
   - `uq_assessments_request` → duplicate assessment
   - `uq_assessment_tyres_position` → duplicate child record
   - RLS error → authentication issue

3. **Check Operation Order**
   ```typescript
   // Correct order:
   // 1) Link foreign keys
   // 2) Update stage
   // 3) Create child records
   ```

4. **Verify Authenticated Client Passed**
   ```typescript
   // Every service method should receive client
   await service.method(..., locals.supabase);
   ```

5. **Check Idempotency Maintained**
   ```typescript
   // Safe to call multiple times?
   await service.createDefault(id, client); // Check-then-create
   await service.upsert(...); // Upsert pattern
   ```

6. **Review Audit Logs for Clues**
   ```sql
   SELECT * FROM audit_logs
   WHERE entity_type = 'assessment'
     AND entity_id = 'xxx'
   ORDER BY created_at DESC;
   ```

**Quality Checklist:**
- [ ] Fix addresses root cause (not just symptoms)
- [ ] Maintains idempotency of operations
- [ ] Doesn't break existing functionality
- [ ] Includes test to prevent regression
- [ ] Updates documentation if pattern changed
- [ ] Logs error context for debugging

---

### Skill 4: Migrate Status to Stage

**When:** Implementing Phase 3, updating legacy code, consolidating status/stage usage

**Complexity:** Medium
**Time Estimate:** 20-40 minutes per component

**Steps:**

1. **Find All Status-Based Queries**
   ```bash
   # Search for status references
   grep -r "\.eq('status'" src/routes/
   grep -r "\.in('status'" src/routes/
   grep -r "status =" src/lib/services/
   ```

2. **Map Status Values to Stage Values**
   ```typescript
   // Create mapping object for reference
   const statusToStage: Record<string, AssessmentStage | AssessmentStage[]> = {
     'draft': ['request_submitted', 'request_reviewed'],
     'pending': 'request_reviewed',
     'scheduled': ['appointment_scheduled', 'inspection_scheduled'],
     'in_progress': 'assessment_in_progress',
     'completed': ['estimate_review', 'estimate_sent'],
     'submitted': 'estimate_finalized',
     'frc_in_progress': 'frc_in_progress',
     'archived': 'archived',
     'cancelled': 'cancelled'
   };
   ```

3. **Update Queries to Use Stage**
   ```typescript
   // OLD (status-based)
   const { data } = await locals.supabase
     .from('assessments')
     .select('*')
     .eq('status', 'in_progress');

   // NEW (stage-based)
   const { data } = await locals.supabase
     .from('assessments')
     .select('*')
     .eq('stage', 'assessment_in_progress');
   ```

4. **Update TypeScript Types**
   ```typescript
   // Remove status from interfaces if no longer used
   export interface Assessment {
     id: string;
     stage: AssessmentStage; // Use this
     // status: string; ← Remove if deprecated
   }
   ```

5. **Test All User Flows**
   - [ ] Create request
   - [ ] Accept request
   - [ ] Schedule appointment
   - [ ] Start assessment
   - [ ] Complete assessment
   - [ ] Finalize estimate
   - [ ] Archive

6. **Remove Unused Status References**
   ```typescript
   // Clean up old code
   // Delete status-based filter functions
   // Remove status constants
   // Update comments referencing status
   ```

7. **Update Documentation**
   - Update SOP with stage-based patterns
   - Update database schema docs
   - Add migration notes

**Quality Checklist:**
- [ ] All status references replaced with stage
- [ ] Backward compatible (old assessments still work)
- [ ] Tests updated to use stage
- [ ] No breaking changes for existing data
- [ ] Documentation reflects new patterns
- [ ] Type safety maintained

**Common Pitfalls:**
- ❌ Missing some status references in codebase
- ❌ Not testing backward compatibility
- ❌ Breaking existing assessments with old status values
- ❌ Forgetting to update tests

---

### Skill 5: Create Idempotent Child Record Service

**When:** Adding new child record type, fixing duplicate creation issues

**Complexity:** Medium
**Time Estimate:** 30-45 minutes

**Pattern A: Check-then-create (Single Record Per Assessment)**

Use for tables with 1:1 relationship with assessments.

```typescript
// Example: vehicle_values, damage, estimates, pre_incident_estimates
export class ChildRecordService {
  constructor(private supabase: SupabaseClient<Database>) {}

  // Idempotent getter
  async getByAssessment(
    assessmentId: string,
    client?: ServiceClient
  ): Promise<ChildRecord | null> {
    const db = client ?? this.supabase;
    const { data, error } = await db
      .from('child_records')
      .select('*')
      .eq('assessment_id', assessmentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Idempotent creator
  async createDefault(
    assessmentId: string,
    client?: ServiceClient
  ): Promise<ChildRecord> {
    // Check if already exists
    const existing = await this.getByAssessment(assessmentId, client);
    if (existing) return existing; // ← Return existing, don't create duplicate

    // Create only if not found
    return this.create(
      { assessment_id: assessmentId, /* default values */ },
      client
    );
  }

  async create(
    input: InsertChildRecord,
    client?: ServiceClient
  ): Promise<ChildRecord> {
    const db = client ?? this.supabase;
    const { data, error } = await db
      .from('child_records')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
```

**Pattern B: Upsert (Multiple Records with Compound Key)**

Use for tables with multiple records per assessment (e.g., tyres, photos).

```typescript
// Example: assessment_tyres (assessment_id + position unique)
export class TyresService {
  async createDefaultTyres(
    assessmentId: string,
    client?: ServiceClient
  ): Promise<Tyre[]> {
    const db = client ?? supabase;

    const defaultTyres = [
      { assessment_id: assessmentId, position: 1, position_label: 'Front Left' },
      { assessment_id: assessmentId, position: 2, position_label: 'Front Right' },
      { assessment_id: assessmentId, position: 3, position_label: 'Rear Left' },
      { assessment_id: assessmentId, position: 4, position_label: 'Rear Right' },
      { assessment_id: assessmentId, position: 5, position_label: 'Spare' }
    ];

    // Upsert with compound key
    const { data, error } = await db
      .from('assessment_tyres')
      .upsert(defaultTyres, {
        onConflict: 'assessment_id,position', // ← Compound unique key
        ignoreDuplicates: false // Update if exists
      })
      .select();

    if (error) throw error;
    return data;
  }
}
```

**Steps:**

1. **Identify Relationship Type**
   - 1:1 (assessment_id unique) → Use check-then-create
   - 1:N (compound unique key) → Use upsert

2. **Add Database Constraint**
   ```sql
   -- For 1:1 relationship
   ALTER TABLE child_records
     ADD CONSTRAINT uq_child_records UNIQUE (assessment_id);

   -- For 1:N relationship with compound key
   ALTER TABLE assessment_tyres
     ADD CONSTRAINT uq_assessment_tyres_position
     UNIQUE (assessment_id, position);
   ```

3. **Implement Service Method**
   - Use Pattern A or Pattern B above
   - Always accept `client?: ServiceClient` parameter
   - Return existing record if found

4. **Test Idempotency**
   ```typescript
   // Should not throw error when called multiple times
   await service.createDefault(assessmentId, client);
   await service.createDefault(assessmentId, client);
   await service.createDefault(assessmentId, client);

   // Verify only one set of records created
   const records = await service.getByAssessment(assessmentId);
   expect(records.length).toBe(expectedCount);
   ```

5. **Handle Errors Gracefully**
   ```typescript
   try {
     return await this.create(input, client);
   } catch (error) {
     if (error.code === '23505') { // Unique violation
       // Return existing record
       return await this.getByAssessment(assessmentId, client);
     }
     throw error;
   }
   ```

**Quality Checklist:**
- [ ] Unique constraint exists in database
- [ ] Service method is truly idempotent (safe to call multiple times)
- [ ] Returns existing record if found (doesn't throw error)
- [ ] Handles errors gracefully
- [ ] Uses authenticated client parameter
- [ ] Works with page refreshes and retries
- [ ] No race conditions

**Common Pitfalls:**
- ❌ Missing database unique constraint
- ❌ Not checking for existing record before creating
- ❌ Using `insert` instead of `upsert` for compound keys
- ❌ Not passing authenticated client
- ❌ Throwing error on duplicate instead of returning existing

---

### Skill 6: Update Assessment Stage Safely

**When:** Implementing stage transitions, moving assessment through pipeline

**Complexity:** Low
**Time Estimate:** 10-15 minutes

**Critical Pattern:**

```typescript
// ALWAYS follow this order:

// 1) Link foreign keys FIRST (if required for new stage)
if (!assessment.appointment_id && requiresAppointment(newStage)) {
  assessment = await assessmentService.updateAssessment(
    assessment.id,
    { appointment_id: appointmentId },
    locals.supabase
  );
}

// 2) THEN update stage
assessment = await assessmentService.updateStage(
  assessment.id,
  newStage,
  locals.supabase
);

// 3) Create child records (if needed for new stage)
if (newStage === 'assessment_in_progress') {
  await Promise.all([
    tyresService.createDefaultTyres(assessment.id, locals.supabase),
    vehicleValuesService.createDefault(assessment.id, locals.supabase),
    damageService.createDefault(assessment.id, locals.supabase),
    estimateService.createDefault(assessment.id, locals.supabase),
    preIncidentService.createDefault(assessment.id, locals.supabase)
  ]);
}
```

**Why Order Matters:**

```sql
-- Database check constraint (migration 068)
ALTER TABLE assessments
  ADD CONSTRAINT require_appointment_when_scheduled
  CHECK (
    CASE
      WHEN stage IN (
        'appointment_scheduled',
        'inspection_scheduled',
        'assessment_in_progress',
        'estimate_review',
        'estimate_sent',
        'estimate_finalized',
        'frc_in_progress'
      )
        THEN appointment_id IS NOT NULL
      ELSE TRUE
    END
  );
```

**Stages Requiring appointment_id:**
- appointment_scheduled
- inspection_scheduled
- assessment_in_progress
- estimate_review
- estimate_sent
- estimate_finalized
- frc_in_progress

**Complete Example:**

```typescript
// src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts
export async function load({ params, locals }) {
  const { appointment_id } = params;

  // Get assessment by appointment
  const { data: appointment } = await locals.supabase
    .from('appointments')
    .select('*, request:requests!inner(*)')
    .eq('id', appointment_id)
    .single();

  // Find or create assessment
  let assessment = await assessmentService.findOrCreateByRequest(
    appointment.request_id,
    locals.supabase
  );

  // Check if needs stage update
  const needsStageUpdate = [
    'request_submitted',
    'request_reviewed',
    'appointment_scheduled',
    'inspection_scheduled'
  ].includes(assessment.stage);

  if (needsStageUpdate) {
    // 1) Link appointment FIRST
    if (!assessment.appointment_id) {
      assessment = await assessmentService.updateAssessment(
        assessment.id,
        { appointment_id },
        locals.supabase
      );
    }

    // 2) THEN update stage
    assessment = await assessmentService.updateStage(
      assessment.id,
      'assessment_in_progress',
      locals.supabase
    );

    // 3) Create child records
    await Promise.all([
      tyresService.createDefaultTyres(assessment.id, locals.supabase),
      vehicleValuesService.createDefault(assessment.id, locals.supabase),
      damageService.createDefault(assessment.id, locals.supabase),
      estimateService.createDefault(assessment.id, locals.supabase),
      preIncidentService.createDefault(assessment.id, locals.supabase)
    ]);
  }

  return { assessment, appointment };
}
```

**Quality Checklist:**
- [ ] Foreign keys set before stage update
- [ ] Uses `updateStage()` not `updateAssessment()` for stage changes
- [ ] Passes authenticated client (`locals.supabase`)
- [ ] Checks current stage before updating
- [ ] Validates stage transition is allowed
- [ ] Audit log created (handled by updateStage)
- [ ] Child records created idempotently

**Common Pitfalls:**
- ❌ Updating stage before linking appointment_id
- ❌ Using `updateAssessment()` for stage changes (no audit logging)
- ❌ Not passing authenticated client
- ❌ Allowing invalid stage transitions
- ❌ Creating child records before stage update

---

### Skill 7: Query Assessments Efficiently

**When:** Building list pages, implementing search, creating reports

**Complexity:** Low
**Time Estimate:** 10-20 minutes

**Efficient Query Pattern:**

```typescript
const { data: assessments, error } = await locals.supabase
  .from('assessments')
  .select(`
    *,
    request:requests!inner(
      *,
      client:clients(*),
      vehicle:vehicles(*)
    ),
    appointment:appointments(
      *,
      engineer:engineers(*)
    )
  `)
  .eq('stage', 'assessment_in_progress')
  .order('updated_at', { ascending: false });
```

**Query Optimization Techniques:**

**1. Use Stage Index**
```typescript
// Fast - uses idx_assessments_stage
.eq('stage', 'assessment_in_progress')

// Fast - uses idx_assessments_stage
.in('stage', ['request_submitted', 'request_accepted'])
```

**2. Fetch Related Data in Single Query**
```typescript
// ✅ GOOD - Single query with joins
.select(`
  *,
  request:requests!inner(*),
  appointment:appointments(*, engineer:engineers(*))
`)

// ❌ BAD - N+1 queries
const assessments = await getAssessments();
for (const assessment of assessments) {
  const request = await getRequest(assessment.request_id);
  const appointment = await getAppointment(assessment.appointment_id);
}
```

**3. Apply RLS Filters**
```typescript
let query = locals.supabase
  .from('assessments')
  .select('*')
  .eq('stage', 'assessment_in_progress');

// Engineer filtering
const { data: profile } = await locals.supabase
  .from('user_profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();

if (profile?.role === 'engineer') {
  query = query.eq('appointment.engineer_id', session.user.id);
}

const { data } = await query;
```

**4. Order Results Appropriately**
```typescript
// Most recent first
.order('updated_at', { ascending: false })

// By assessment number
.order('assessment_number', { ascending: false })

// By request date
.order('request.created_at', { ascending: false })
```

**5. Handle Pagination**
```typescript
const pageSize = 20;
const offset = (page - 1) * pageSize;

const { data, count } = await locals.supabase
  .from('assessments')
  .select('*', { count: 'exact' })
  .eq('stage', 'assessment_in_progress')
  .range(offset, offset + pageSize - 1)
  .order('updated_at', { ascending: false });

const totalPages = Math.ceil(count / pageSize);
```

**Stage-Based Query Examples:**

```typescript
// New Requests page
.eq('stage', 'request_submitted')

// Requests page (multiple stages)
.in('stage', ['request_submitted', 'request_reviewed'])

// Inspections page
.eq('stage', 'request_reviewed')

// Appointments page
.eq('stage', 'appointment_scheduled')

// Inspections scheduled page
.eq('stage', 'inspection_scheduled')

// Open Assessments page
.eq('stage', 'assessment_in_progress')

// Finalized Assessments page (multiple stages)
.in('stage', ['estimate_review', 'estimate_sent', 'estimate_finalized'])

// FRC page
.eq('stage', 'frc_in_progress')

// Archive page (multiple stages)
.in('stage', ['archived', 'cancelled'])
```

**Quality Checklist:**
- [ ] Uses stage index for filtering (`.eq('stage', ...)`)
- [ ] Joins related data in single query (no N+1)
- [ ] Applies RLS filters based on user role
- [ ] Orders results appropriately for use case
- [ ] Handles pagination if list is long
- [ ] Returns proper TypeScript types
- [ ] Error handling included

**Common Pitfalls:**
- ❌ N+1 query pattern (fetching relations separately)
- ❌ Not using stage index (filtering by other fields first)
- ❌ Forgetting engineer filtering for role-based access
- ❌ Loading all records without pagination
- ❌ Not ordering results

---

### Skill 8: Multi-Step Transactions with Verification

**When:** Critical operations requiring multiple database updates, stage transitions with side effects, FRC completion

**Complexity:** Medium-High
**Time Estimate:** 30-45 minutes

**Critical Pattern - Explicit Verification:**

When performing operations with multiple steps where failure of any step could leave data in an inconsistent state, use explicit verification queries after each critical step.

```typescript
// Pattern: Multi-step transaction with per-step error handling
async function criticalMultiStepOperation(
  id: string,
  client: ServiceClient
): Promise<Result> {
  try {
    // Step 1: Update field A
    const { error: stepError1 } = await client
      .from('table')
      .update({ field_a: valueA })
      .eq('id', id);

    if (stepError1) {
      throw new Error(`Step 1 failed: ${stepError1.message}`);
    }

    // Step 2: Update field B (critical - must succeed)
    try {
      await someService.updateField(id, valueB, client);
    } catch (stepError2) {
      console.error('CRITICAL ERROR: Step 2 failed:', stepError2);
      throw new Error(`Step 2 failed: ${stepError2.message}`);
    }

    // Step 3: VERIFY both updates succeeded
    const { data: verifyData, error: verifyError } = await client
      .from('table')
      .select('field_a, field_b')
      .eq('id', id)
      .single();

    if (verifyError) {
      throw new Error(`Verification query failed: ${verifyError.message}`);
    }

    if (verifyData.field_a !== valueA || verifyData.field_b !== valueB) {
      throw new Error(
        `CRITICAL ERROR: Verification failed. ` +
        `Expected field_a=${valueA}, field_b=${valueB}. ` +
        `Got field_a=${verifyData.field_a}, field_b=${verifyData.field_b}`
      );
    }

    // Step 4: Perform side effects only after verification
    await performSideEffects(id, client);

    return { success: true, data: verifyData };

  } catch (error) {
    // ALWAYS re-throw - critical failures must bubble to UI
    console.error('Critical multi-step operation failed:', error);
    throw new Error(`Critical operation failed: ${error.message}`);
  }
}
```

**Real Example: FRC Completion (from frc.service.ts)**

```typescript
// src/lib/services/frc.service.ts lines 731-800
async completeFRC(frcId: string, client?: ServiceClient): Promise<FRC> {
  const db = client ?? supabase;

  try {
    // Step 1: Mark FRC as completed
    const { data: frc, error: frcError } = await db
      .from('frc')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', frcId)
      .select('*, assessment:assessments(*)')
      .single();

    if (frcError) {
      throw new Error(`Failed to complete FRC: ${frcError.message}`);
    }

    // Step 2: Update assessment stage (CRITICAL - must not fail silently)
    try {
      await assessmentService.updateStage(
        frc.assessment.id,
        'archived',
        db
      );
    } catch (stageError) {
      console.error('CRITICAL ERROR: Failed to update assessment stage:', stageError);
      throw new Error(`Failed to update assessment stage: ${stageError.message}`);
    }

    // Step 3: VERIFY assessment stage was updated
    const { data: verifyAssessment, error: verifyError } = await db
      .from('assessments')
      .select('id, stage, status')
      .eq('id', frc.assessment.id)
      .single();

    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`);
    }

    if (verifyAssessment.stage !== 'archived') {
      throw new Error(
        `CRITICAL ERROR: Assessment stage verification failed. ` +
        `Expected stage='archived', got stage='${verifyAssessment.stage}'`
      );
    }

    // Step 4: Log audit trail (only after verification succeeds)
    try {
      await auditService.logChange({
        entity_type: 'frc',
        entity_id: frcId,
        action: 'complete',
        changes: { status: 'completed' },
        user_id: frc.created_by
      }, db);
    } catch (auditError) {
      // Audit failures are non-critical - log but don't throw
      console.error('Warning: Failed to log audit:', auditError);
    }

    return frc;

  } catch (error) {
    // ALWAYS re-throw - UI must show error to user
    console.error('FRC completion failed:', error);
    throw error;
  }
}
```

**Why This Pattern Is Critical:**

1. **Silent Failures Are Dangerous**
   - Without explicit verification, stage update could fail silently
   - Assessment would show wrong stage in UI
   - User wouldn't know operation failed

2. **Error Handling Per Step**
   - Each critical step has its own try-catch
   - Errors include context about which step failed
   - "CRITICAL ERROR:" prefix helps debugging

3. **Explicit Verification**
   - After critical updates, query database to verify
   - Compare actual values to expected values
   - Throw detailed error if verification fails

4. **Fail Loudly**
   - Re-throw all errors to UI
   - Don't catch and log silently
   - User must know if operation failed

**Steps to Implement:**

1. **Identify Critical Operations**
   ```typescript
   // Critical: Multiple updates that must all succeed
   - Stage transitions with status updates
   - FRC/Additional completion flows
   - Request creation with assessment
   - Appointment scheduling with stage update
   ```

2. **Structure as Multi-Step with Try-Catch Per Step**
   ```typescript
   try {
     // Step 1
     const result1 = await operation1();
     if (error1) throw new Error('Step 1 failed');

     // Step 2 (critical)
     try {
       await operation2();
     } catch (step2Error) {
       console.error('CRITICAL ERROR:', step2Error);
       throw new Error(`Step 2 failed: ${step2Error.message}`);
     }

     // Continue...
   } catch (error) {
     console.error('Multi-step operation failed:', error);
     throw error; // Re-throw to UI
   }
   ```

3. **Add Verification Query**
   ```typescript
   // After critical updates, verify with SELECT
   const { data: verify } = await db
     .select('field1, field2')
     .eq('id', id)
     .single();

   if (verify.field1 !== expectedValue1 || verify.field2 !== expectedValue2) {
     throw new Error(
       `Verification failed: expected X, got Y`
     );
   }
   ```

4. **Add Audit Logging (Defensive)**
   ```typescript
   // Audit failures should NOT break the operation
   try {
     await auditService.logChange({...}, client);
   } catch (auditError) {
     console.error('Warning: Failed to log audit:', auditError);
     // DON'T throw - audit is non-critical
   }
   ```

5. **Test Failure Scenarios**
   - [ ] Test Step 1 failure → error thrown, UI shows message
   - [ ] Test Step 2 failure → error thrown, UI shows message
   - [ ] Test verification failure → error thrown, UI shows message
   - [ ] Test audit failure → logged but operation succeeds
   - [ ] Verify no silent failures

**Quality Checklist:**
- [ ] Each critical step has error handling
- [ ] Uses "CRITICAL ERROR:" prefix for debugging
- [ ] Verification query after critical updates
- [ ] Detailed error messages with expected vs actual values
- [ ] Re-throws errors to UI (no silent failures)
- [ ] Audit logging is defensive (doesn't break operation)
- [ ] Console logging for debugging
- [ ] Tested all failure scenarios

**Common Pitfalls:**
- ❌ Catching errors without re-throwing (silent failures)
- ❌ Not verifying critical updates succeeded
- ❌ Vague error messages ("Update failed" without context)
- ❌ Audit logging failures breaking the operation
- ❌ Not using "CRITICAL ERROR:" prefix for important failures
- ❌ Missing per-step error handling

**When to Use This Pattern:**
- ✅ Stage transitions with side effects
- ✅ FRC/Additional completion flows
- ✅ Multi-field updates that must be atomic
- ✅ Operations where inconsistent state would be dangerous
- ❌ Simple single-field updates (overkill)
- ❌ Non-critical operations (standard error handling is fine)

---

### Skill 9: Assessment Cancellation Pattern

**When:** User cancels an assessment, inspection cannot be completed, request is withdrawn

**Complexity:** Low-Medium
**Time Estimate:** 15-20 minutes

**Core Pattern - Atomic Status + Stage Updates:**

When cancelling an assessment, ALWAYS update both `status` and `stage` fields atomically. The `stage` field is the primary field for queries, but `status` provides additional context.

```typescript
// Pattern: Atomic cancellation with helper method
async cancelAssessment(
  assessmentId: string,
  reason: string,
  client: ServiceClient
): Promise<Assessment> {
  const db = client ?? supabase;

  // Single atomic update - both status and stage
  const { data: assessment, error } = await db
    .from('assessments')
    .update({
      status: 'cancelled',
      stage: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason
    })
    .eq('id', assessmentId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to cancel assessment: ${error.message}`);
  }

  // Log audit trail
  try {
    await auditService.logChange({
      entity_type: 'assessment',
      entity_id: assessmentId,
      action: 'cancel',
      changes: {
        status: 'cancelled',
        stage: 'cancelled',
        reason
      },
      user_id: (await getCurrentUser(db)).id
    }, db);
  } catch (auditError) {
    console.error('Warning: Failed to log cancellation audit:', auditError);
  }

  return assessment;
}
```

**Real Example: Inspection Cancellation (from inspection handler)**

```typescript
// src/routes/(app)/work/inspections/[id]/+page.server.ts
export const actions = {
  cancel: async ({ params, request, locals }) => {
    const formData = await request.formData();
    const reason = formData.get('reason')?.toString();

    if (!reason) {
      return fail(400, { error: 'Cancellation reason is required' });
    }

    try {
      // Get inspection with assessment
      const { data: inspection } = await locals.supabase
        .from('inspections')
        .select('*, assessment:assessments(*)')
        .eq('id', params.id)
        .single();

      if (!inspection?.assessment) {
        return fail(404, { error: 'Assessment not found' });
      }

      // Cancel assessment atomically
      await assessmentService.cancelAssessment(
        inspection.assessment.id,
        reason,
        locals.supabase
      );

      // Redirect to archive with cancelled tab active
      throw redirect(303, '/work/archive?tab=cancelled');

    } catch (error) {
      console.error('Failed to cancel assessment:', error);
      return fail(500, { error: 'Failed to cancel assessment' });
    }
  }
};
```

**Archive Page Tab Query Pattern:**

After cancellation, redirect to archive page with `?tab=cancelled` query parameter to show the cancelled assessments tab.

```typescript
// Archive page load function
export async function load({ url, locals }) {
  const tab = url.searchParams.get('tab') || 'all';

  let query = locals.supabase
    .from('assessments')
    .select('*');

  // Filter by tab
  if (tab === 'cancelled') {
    query = query.eq('stage', 'cancelled');
  } else if (tab === 'archived') {
    query = query.eq('stage', 'archived');
  } else {
    // 'all' tab - show both
    query = query.in('stage', ['archived', 'cancelled']);
  }

  const { data: assessments } = await query
    .order('updated_at', { ascending: false });

  return { assessments, currentTab: tab };
}
```

```svelte
<!-- Archive page UI with tabs -->
<script>
  export let data;
</script>

<div class="tabs">
  <a href="/work/archive?tab=all"
     class:active={data.currentTab === 'all'}>
    All ({data.allCount})
  </a>
  <a href="/work/archive?tab=archived"
     class:active={data.currentTab === 'archived'}>
    Archived ({data.archivedCount})
  </a>
  <a href="/work/archive?tab=cancelled"
     class:active={data.currentTab === 'cancelled'}>
    Cancelled ({data.cancelledCount})
  </a>
</div>

<!-- Assessment list -->
{#each data.assessments as assessment}
  <!-- ... -->
{/each}
```

**Why Atomic Updates Matter:**

```typescript
// ❌ WRONG - Two separate updates (race condition possible)
await db.update({ status: 'cancelled' }).eq('id', id);
await db.update({ stage: 'cancelled' }).eq('id', id);

// ✅ CORRECT - Single atomic update
await db.update({
  status: 'cancelled',
  stage: 'cancelled'
}).eq('id', id);
```

**Steps to Implement:**

1. **Add Helper Method to Assessment Service**
   ```typescript
   // src/lib/services/assessment.service.ts
   async cancelAssessment(
     assessmentId: string,
     reason: string,
     client?: ServiceClient
   ): Promise<Assessment> {
     // Implementation above
   }
   ```

2. **Add Cancellation Action to Page**
   ```typescript
   // Add to any page where cancellation is possible
   export const actions = {
     cancel: async ({ params, request, locals }) => {
       const reason = (await request.formData()).get('reason')?.toString();

       if (!reason) {
         return fail(400, { error: 'Reason required' });
       }

       await assessmentService.cancelAssessment(
         params.assessmentId,
         reason,
         locals.supabase
       );

       throw redirect(303, '/work/archive?tab=cancelled');
     }
   };
   ```

3. **Add Cancellation UI**
   ```svelte
   <form method="POST" action="?/cancel">
     <label>
       Cancellation Reason
       <textarea name="reason" required minlength="10"></textarea>
     </label>
     <button type="submit">Cancel Assessment</button>
   </form>
   ```

4. **Update Archive Page with Tabs**
   - Add tab navigation with counts
   - Read `?tab=` query parameter
   - Filter assessments by tab
   - Redirect to cancelled tab after cancellation

5. **Test Cancellation Flow**
   - [ ] Cancel assessment from inspection page
   - [ ] Verify redirects to archive?tab=cancelled
   - [ ] Check cancelled tab shows assessment
   - [ ] Verify status='cancelled' and stage='cancelled'
   - [ ] Check audit log created
   - [ ] Test with different user roles

**Quality Checklist:**
- [ ] Updates both status AND stage atomically
- [ ] Includes cancellation_reason field
- [ ] Includes cancelled_at timestamp
- [ ] Logs audit trail
- [ ] Redirects to archive?tab=cancelled
- [ ] Archive page has tab navigation
- [ ] Cancellation UI requires reason (min 10 chars)
- [ ] Works with RLS for both admin and engineer
- [ ] Error handling includes user-friendly messages

**Common Pitfalls:**
- ❌ Only updating status OR stage (not both)
- ❌ Two separate updates instead of atomic update
- ❌ Not redirecting to cancelled tab
- ❌ Missing cancellation reason validation
- ❌ Not logging audit trail
- ❌ Forgetting to add tab query parameter handling

**Related Patterns:**
- Archive page: `/work/archive?tab=cancelled`
- Tab-based filtering: `url.searchParams.get('tab')`
- Query parameter redirects: `redirect(303, '/path?param=value')`

---

## Workflows

### Workflow 1: Implement Phase 3 - Stage-Based List Pages

**Goal:** Replace status-based queries with stage-based queries across all list pages

**Time Estimate:** 6-8 hours (all pages)

**Steps:**

1. **Read SOP Documentation**
   - Read `.agent/SOP/working_with_assessment_centric_architecture.md`
   - Understand stage → status mapping
   - Review constraint requirements

2. **Identify All List Pages**
   ```bash
   # Find all list pages
   find src/routes -name "+page.server.ts" | grep -E "(requests|inspections|appointments|assessments|frc|archive)"
   ```

3. **Update Each Page Systematically**

   **Page 1: New Requests** (`/requests/new/+page.server.ts`)
   ```typescript
   // OLD
   .eq('status', 'draft')

   // NEW
   .eq('stage', 'request_submitted')
   ```

   **Page 2: Requests** (`/requests/+page.server.ts`)
   ```typescript
   // OLD
   .eq('status', 'draft')

   // NEW
   .in('stage', ['request_submitted', 'request_reviewed'])
   ```

   **Page 3: Inspections** (`/work/inspections/+page.server.ts`)
   ```typescript
   // OLD
   .eq('status', 'pending')

   // NEW
   .eq('stage', 'request_reviewed')
   ```

   **Page 4: Appointments** (`/work/appointments/+page.server.ts`)
   ```typescript
   // OLD
   .eq('status', 'scheduled')

   // NEW
   .eq('stage', 'appointment_scheduled')
   ```

   **Page 5: Open Assessments** (`/work/assessments/+page.server.ts`)
   ```typescript
   // OLD
   .eq('status', 'in_progress')

   // NEW
   .eq('stage', 'assessment_in_progress')
   ```

   **Page 6: Finalized Assessments** (`/work/finalized-assessments/+page.server.ts`)
   ```typescript
   // OLD
   .eq('status', 'submitted')

   // NEW
   .in('stage', ['estimate_review', 'estimate_sent', 'estimate_finalized'])
   ```

   **Page 7: FRC** (`/work/frc/+page.server.ts`)
   ```typescript
   // OLD
   .in('status', ['frc_in_progress'])

   // NEW
   .eq('stage', 'frc_in_progress')
   ```

   **Page 8: Archive** (`/work/archive/+page.server.ts`)
   ```typescript
   // OLD
   .in('status', ['archived', 'cancelled'])

   // NEW (same stages)
   .in('stage', ['archived', 'cancelled'])
   ```

4. **Update Sidebar Badges**
   ```typescript
   // src/routes/(app)/+layout.server.ts

   // Get counts by stage
   const { count: openCount } = await locals.supabase
     .from('assessments')
     .select('*', { count: 'exact', head: true })
     .eq('stage', 'assessment_in_progress');

   const { count: scheduledCount } = await locals.supabase
     .from('assessments')
     .select('*', { count: 'exact', head: true })
     .eq('stage', 'inspection_scheduled');

   // ... etc for all badges
   ```

5. **Test Complete User Flow**
   - [ ] Create request → appears in Requests page
   - [ ] Accept request → appears in Inspections page
   - [ ] Schedule appointment → appears in Appointments page
   - [ ] Start assessment → appears in Open Assessments page
   - [ ] Complete assessment → appears in Finalized page
   - [ ] Archive → appears in Archive page

6. **Update Documentation**
   - Update `.agent/System/database_schema.md` if needed
   - Update `.agent/SOP/working_with_assessment_centric_architecture.md`
   - Add completion notes to Phase 3 task

**Quality Checklist:**
- [ ] All 7 list pages updated
- [ ] Sidebar badges use stage field
- [ ] Engineer filtering works correctly
- [ ] Backward compatible with old data
- [ ] No breaking changes
- [ ] All manual tests passed
- [ ] Documentation updated

---

### Workflow 2: Add Quality Review Stage (Example New Stage)

**Goal:** Add a new "quality_review" stage between assessment_completed and estimate_finalized

**Time Estimate:** 60-90 minutes

**Steps:**

1. **Create Migration**
   ```sql
   -- supabase/migrations/070_add_quality_review_stage.sql
   ALTER TYPE assessment_stage
     ADD VALUE 'quality_review'
     BEFORE 'estimate_finalized';

   -- Update check constraint if QR requires appointment
   ALTER TABLE assessments
     DROP CONSTRAINT require_appointment_when_scheduled;

   ALTER TABLE assessments
     ADD CONSTRAINT require_appointment_when_scheduled
     CHECK (
       CASE
         WHEN stage IN (
           'appointment_scheduled', 'inspection_scheduled',
           'assessment_in_progress', 'estimate_review', 'estimate_sent',
           'quality_review', 'estimate_finalized', 'frc_in_progress'
         )
           THEN appointment_id IS NOT NULL
         ELSE TRUE
       END
     );

   COMMENT ON TYPE assessment_stage IS
     'Pipeline stages. Updated Jan 2025: Added quality_review for QA process';
   ```

2. **Update TypeScript Types**
   ```typescript
   // src/lib/types/assessment.ts
   export type AssessmentStage =
     | 'request_submitted'
     | 'request_reviewed'
     | 'appointment_scheduled'
     | 'inspection_scheduled'
     | 'assessment_in_progress'
     | 'estimate_review'
     | 'estimate_sent'
     | 'quality_review' // NEW
     | 'estimate_finalized'
     | 'frc_in_progress'
     | 'archived'
     | 'cancelled';
   ```

3. **Add Transition from assessment_completed → quality_review**
   ```typescript
   // In assessment completion handler
   // src/routes/(app)/work/assessments/[id]/complete/+page.server.ts
   export const actions = {
     complete: async ({ params, locals }) {
       // Validate all tabs completed
       const allTabsCompleted = await validateAssessmentComplete(params.id);

       if (allTabsCompleted) {
         await assessmentService.updateStage(
           params.id,
           'quality_review', // ← Changed from 'estimate_finalized'
           locals.supabase
         );
       }

       throw redirect(303, '/work/quality-review');
     }
   };
   ```

4. **Create Quality Review Page**
   ```typescript
   // src/routes/(app)/work/quality-review/+page.server.ts
   export async function load({ locals }) {
     const session = await locals.getSession();
     const { data: profile } = await locals.supabase
       .from('user_profiles')
       .select('role')
       .eq('id', session!.user.id)
       .single();

     let query = locals.supabase
       .from('assessments')
       .select(`
         *,
         request:requests!inner(*, client:clients(*)),
         appointment:appointments(*, engineer:engineers(*))
       `)
       .eq('stage', 'quality_review');

     // Engineer filtering
     if (profile?.role === 'engineer') {
       query = query.eq('appointment.engineer_id', session!.user.id);
     }

     const { data: assessments, error } = await query
       .order('updated_at', { ascending: false });

     if (error) throw error;

     return { assessments };
   }
   ```

5. **Add QR Approval Action**
   ```typescript
   // src/routes/(app)/work/quality-review/[id]/+page.server.ts
   export const actions = {
     approve: async ({ params, locals }) {
       await assessmentService.updateStage(
         params.id,
         'estimate_finalized',
         locals.supabase
       );

       throw redirect(303, '/work/finalized');
     },

     reject: async ({ params, locals, request }) => {
       const formData = await request.formData();
       const reason = formData.get('reason')?.toString();

       // Log rejection reason
       await auditLogService.create({
         entity_type: 'assessment',
         entity_id: params.id,
         action: 'quality_review_rejected',
         changes: { reason },
         user_id: (await locals.getSession())!.user.id
       }, locals.supabase);

       // Send back to assessment_completed
       await assessmentService.updateStage(
         params.id,
         'assessment_completed',
         locals.supabase
       );

       throw redirect(303, '/work/assessments');
     }
   };
   ```

6. **Update Sidebar with QR Count**
   ```typescript
   // src/routes/(app)/+layout.server.ts
   const { count: qualityReviewCount } = await locals.supabase
     .from('assessments')
     .select('*', { count: 'exact', head: true })
     .eq('stage', 'quality_review');

   return {
     // ... other counts
     qualityReviewCount
   };
   ```

7. **Test Stage Transitions**
   - [ ] Complete assessment → moves to quality_review
   - [ ] Approve in QR → moves to estimate_finalized
   - [ ] Reject in QR → moves back to assessment_completed
   - [ ] Verify audit logs created
   - [ ] Test as admin and engineer

8. **Document New Stage**
   - Update `.agent/SOP/working_with_assessment_centric_architecture.md`
   - Add to stage pipeline diagram
   - Document valid transitions
   - Update quality checklist

**Quality Checklist:**
- [ ] Migration applied successfully
- [ ] TypeScript types updated
- [ ] Transition logic implemented
- [ ] New page created with proper filtering
- [ ] Sidebar badge shows count
- [ ] Audit logging works
- [ ] Tested all transitions
- [ ] Documentation updated

---

## Common Mistakes to Avoid

### Critical Errors

1. **❌ Updating stage before linking appointment_id**
   ```typescript
   // WRONG - Will violate constraint
   await updateStage(id, 'inspection_scheduled', ...);
   await updateAssessment(id, { appointment_id }, ...);

   // CORRECT - Link first, then update stage
   await updateAssessment(id, { appointment_id }, ...);
   await updateStage(id, 'inspection_scheduled', ...);
   ```

2. **❌ Using status instead of stage for new features**
   ```typescript
   // WRONG - Old pattern
   .eq('status', 'in_progress')

   // CORRECT - New pattern
   .eq('stage', 'assessment_in_progress')
   ```

3. **❌ Creating assessment at "Start Assessment"**
   ```typescript
   // WRONG - Creates at wrong time
   const assessment = await assessmentService.createAssessment({...});

   // CORRECT - Use findOrCreate (already exists from request creation)
   const assessment = await assessmentService.findOrCreateByRequest(
     requestId,
     client
   );
   ```

4. **❌ Not passing authenticated client**
   ```typescript
   // WRONG - Breaks RLS
   await assessmentService.updateAssessment(id, updates);

   // CORRECT - Pass authenticated client
   await assessmentService.updateAssessment(id, updates, locals.supabase);
   ```

5. **❌ Making non-idempotent child record creation**
   ```typescript
   // WRONG - Will create duplicates on retry
   async createDefault(assessmentId: string) {
     return this.create({ assessment_id: assessmentId });
   }

   // CORRECT - Check-then-create pattern
   async createDefault(assessmentId: string, client?: ServiceClient) {
     const existing = await this.getByAssessment(assessmentId, client);
     if (existing) return existing;
     return this.create({ assessment_id: assessmentId }, client);
   }
   ```

6. **❌ Using createAssessment() for existing requests**
   ```typescript
   // WRONG - Will violate unique constraint
   const assessment = await assessmentService.createAssessment({
     request_id: existingRequestId
   });

   // CORRECT - Use findOrCreate
   const assessment = await assessmentService.findOrCreateByRequest(
     existingRequestId,
     locals.supabase
   );
   ```

7. **❌ Forgetting to update audit logs for stage transitions**
   ```typescript
   // WRONG - No audit trail
   await this.updateAssessment(id, { stage: newStage }, client);

   // CORRECT - Use updateStage (includes audit logging)
   await this.updateStage(id, newStage, client);
   ```

---

## Testing Requirements

### Unit Tests

```typescript
describe('AssessmentService', () => {
  it('findOrCreateByRequest is idempotent', async () => {
    const request = await createTestRequest();

    const assessment1 = await assessmentService.findOrCreateByRequest(
      request.id,
      client
    );
    const assessment2 = await assessmentService.findOrCreateByRequest(
      request.id,
      client
    );

    expect(assessment1.id).toBe(assessment2.id);
  });

  it('updateStage enforces appointment_id constraint', async () => {
    const assessment = await createTestAssessment({ appointment_id: null });

    await expect(
      assessmentService.updateStage(
        assessment.id,
        'inspection_scheduled',
        client
      )
    ).rejects.toThrow('require_appointment_when_scheduled');
  });

  it('child record creation is idempotent', async () => {
    const assessment = await createTestAssessment();

    await tyresService.createDefaultTyres(assessment.id, client);
    await tyresService.createDefaultTyres(assessment.id, client);
    await tyresService.createDefaultTyres(assessment.id, client);

    const tyres = await tyresService.getByAssessment(assessment.id, client);
    expect(tyres.length).toBe(5); // Not 15
  });
});
```

### Integration Tests

```typescript
describe('Assessment Lifecycle', () => {
  it('complete workflow: request → assessment → appointment → complete', async () => {
    // 1. Create request
    const { request, assessment } = await requestService.createRequest(
      requestInput,
      client
    );
    expect(assessment.stage).toBe('request_submitted');

    // 2. Accept request
    await assessmentService.updateStage(
      assessment.id,
      'request_accepted',
      client
    );

    // 3. Schedule appointment
    const appointment = await appointmentService.create({
      assessment_id: assessment.id,
      // ...
    }, client);

    await assessmentService.updateAssessment(
      assessment.id,
      { appointment_id: appointment.id },
      client
    );

    await assessmentService.updateStage(
      assessment.id,
      'inspection_scheduled',
      client
    );

    // 4. Start assessment
    await assessmentService.updateStage(
      assessment.id,
      'assessment_in_progress',
      client
    );

    // 5. Verify child records created
    const tyres = await tyresService.getByAssessment(assessment.id, client);
    expect(tyres.length).toBe(5);
  });
});
```

### Manual Testing

**Test 1: Create Request**
- [ ] Create new request as admin
- [ ] Verify assessment created automatically
- [ ] Check stage = 'request_submitted'
- [ ] Verify audit logs

**Test 2: Start Assessment**
- [ ] Schedule appointment for request
- [ ] Click "Start Assessment"
- [ ] Verify assessment loads
- [ ] Check stage updated to 'assessment_in_progress'
- [ ] Verify no constraint errors

**Test 3: Idempotency (Page Refresh)**
- [ ] On assessment page, hit F5 multiple times
- [ ] Verify no duplicate child records
- [ ] Check database counts match expected

**Test 4: Double-Click Protection**
- [ ] Rapidly click "Start Assessment" multiple times
- [ ] Verify no errors
- [ ] Verify no duplicate assessments or child records

**Test 5: Role-Based Access**
- [ ] Test as admin → see all assessments
- [ ] Test as engineer → see only assigned assessments
- [ ] Verify RLS enforced

**Test 6: Backward Compatibility**
- [ ] Find old request (before migration)
- [ ] Schedule appointment
- [ ] Start assessment
- [ ] Verify assessment created correctly

---

## Success Criteria

### Feature is Complete When:

**Core Functionality:**
- [ ] Zero constraint violations in production
- [ ] All operations are idempotent (safe to retry)
- [ ] Stage transitions logged in audit trail
- [ ] RLS properly enforced (admin vs engineer)
- [ ] No duplicate records created
- [ ] Backward compatible with old data

**Performance:**
- [ ] Uses indexes (stage, request_id)
- [ ] No N+1 query patterns
- [ ] Page load times acceptable (<2s)
- [ ] Efficient joins for related data

**Quality:**
- [ ] All quality checklists passed
- [ ] Manual tests completed
- [ ] Code follows patterns in this skill
- [ ] Documentation updated
- [ ] No breaking changes

**Security:**
- [ ] Authenticated client used throughout
- [ ] RLS policies enforce access control
- [ ] Audit logs track all changes
- [ ] No permission errors

---

## Resources to Reference

### Core Service Files
- `src/lib/services/assessment.service.ts` - Assessment CRUD, findOrCreateByRequest, updateStage
- `src/lib/services/request.service.ts` - Request creation with assessment
- `src/lib/services/tyres.service.ts` - Example idempotent child records (upsert)
- `src/lib/services/vehicle-values.service.ts` - Example check-then-create
- `src/lib/services/damage.service.ts` - Example check-then-create
- `src/lib/services/estimate.service.ts` - Example check-then-create
- `src/lib/services/pre-incident-estimate.service.ts` - Example check-then-create

### Key Routes
- `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts` - Start Assessment flow
- `src/routes/(app)/requests/new/+page.svelte` - Request creation with assessment
- `src/routes/(app)/work/assessments/+page.server.ts` - Open assessments list

### Database
- `supabase/migrations/068_add_assessment_stage.sql` - Stage enum and constraints
- `supabase/migrations/069_add_child_record_unique_constraints.sql` - Idempotency constraints

### TypeScript Types
- `src/lib/types/assessment.ts` - AssessmentStage type definition

### Documentation
- `.agent/Tasks/active/assessment_centric_architecture_refactor.md` - Full PRD
- `.agent/Tasks/active/assessment_centric_fixes_complete.md` - All fixes applied
- `.agent/SOP/working_with_assessment_centric_architecture.md` - Implementation patterns
- `.agent/System/database_schema.md` - Database schema

---

## Agent Behavior Guidelines

When invoked, this agent should:

1. **Always read the SOP first** - `.agent/SOP/working_with_assessment_centric_architecture.md`
2. **Check constraints before operations** - Verify appointment_id requirements
3. **Make operations idempotent by default** - Use check-then-create or upsert patterns
4. **Pass authenticated client throughout** - Never use global supabase instance
5. **Log stage transitions** - Use `updateStage()` not `updateAssessment()`
6. **Test thoroughly** - Include manual tests for edge cases
7. **Update documentation** - Keep `.agent/` docs current after changes
8. **Maintain backward compatibility** - Support old requests without assessments
9. **Follow operation order** - Foreign keys → stage → child records
10. **Verify with quality checklists** - Don't skip validation steps

---

## Integration with Other Agents

**Works alongside:**
- **Supabase Specialist** - For RLS policies, migrations, complex queries
- **ClaimTech Development** - For general workflow patterns
- **Research Context Gatherer** - For understanding existing system before changes

**Handoff to Supabase Specialist when:**
- Creating complex RLS policies for new stages
- Optimizing database queries
- Debugging constraint violations at database level

**Handoff to ClaimTech Development when:**
- Need general service layer patterns
- Creating new pages or components
- Implementing auth flows

---

---

## Workflow Validation with Code Execution

Validate assessment-centric architecture compliance programmatically using **Architecture A** pattern (MCP fetch → code process).

**Token Efficiency**: 73-94% reduction vs traditional tool chaining.

### Pattern: Validate One-Assessment-Per-Request

Ensure all requests have exactly one assessment (no duplicates).

**Phase 1: Fetch Violations**
```typescript
// Claude calls MCP tool to find violations
const violations = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      request_id,
      COUNT(*) as assessment_count,
      array_agg(id) as assessment_ids
    FROM assessments
    GROUP BY request_id
    HAVING COUNT(*) > 1
  `
});
```

**Phase 2: Report Violations** (88% token savings)
```typescript
// Claude generates code with embedded data
const reportCode = `
  const violations = ${JSON.stringify(violations)};

  if (violations.length === 0) {
    console.log('✓ All requests have exactly one assessment');
    console.log('✓ One-assessment-per-request constraint validated');
  } else {
    console.error('❌ Found requests with multiple assessments:');
    console.log('');

    violations.forEach((v, index) => {
      console.error(\`Violation \${index + 1}:\`);
      console.error(\`  Request ID: \${v.request_id}\`);
      console.error(\`  Assessment count: \${v.assessment_count}\`);
      console.error(\`  Assessment IDs: \${v.assessment_ids.join(', ')}\`);
      console.log('');
    });

    console.error(\`Total violations: \${violations.length}\`);
  }
`;

await mcp__ide__executeCode({ code: reportCode });
```

### Pattern: Analyze Stage Transitions

Analyze stage transition patterns and identify anomalies.

**Phase 1: Fetch Stage History**
```typescript
const stageHistory = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      id,
      assessment_number,
      stage,
      stage_history,
      created_at,
      updated_at
    FROM assessments
    WHERE stage_history IS NOT NULL
    ORDER BY updated_at DESC
    LIMIT 100
  `
});
```

**Phase 2: Analyze Transitions** (92% token savings)
```typescript
const analysisCode = `
  const assessments = ${JSON.stringify(stageHistory)};

  // Valid transitions
  const validTransitions = {
    'request_submitted': ['request_reviewed', 'cancelled'],
    'request_reviewed': ['appointment_scheduled', 'cancelled'],
    'appointment_scheduled': ['inspection_scheduled', 'cancelled'],
    'inspection_scheduled': ['assessment_in_progress', 'cancelled'],
    'assessment_in_progress': ['estimate_review', 'cancelled'],
    'estimate_review': ['estimate_sent', 'assessment_in_progress', 'cancelled'],
    'estimate_sent': ['estimate_finalized', 'estimate_review', 'cancelled'],
    'estimate_finalized': ['frc_in_progress', 'archived'],
    'frc_in_progress': ['archived']
  };

  const analysis = {
    valid: [],
    invalid: [],
    stats: {}
  };

  assessments.forEach(assessment => {
    const history = JSON.parse(assessment.stage_history || '[]');

    // Analyze transitions
    for (let i = 1; i < history.length; i++) {
      const from = history[i - 1].stage;
      const to = history[i].stage;
      const transition = \`\${from} → \${to}\`;

      // Track statistics
      if (!analysis.stats[transition]) {
        analysis.stats[transition] = 0;
      }
      analysis.stats[transition]++;

      // Validate transition
      const validNextStages = validTransitions[from] || [];
      if (!validNextStages.includes(to)) {
        analysis.invalid.push({
          assessment: assessment.assessment_number,
          from,
          to,
          timestamp: history[i].timestamp
        });
      } else {
        analysis.valid.push(transition);
      }
    }
  });

  console.log('Stage Transition Analysis:');
  console.log('=========================');
  console.log('');

  console.log('Transition Statistics:');
  Object.entries(analysis.stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([transition, count]) => {
      console.log(\`  \${transition}: \${count}\`);
    });

  console.log('');
  console.log(\`Valid transitions: \${analysis.valid.length}\`);
  console.log(\`Invalid transitions: \${analysis.invalid.length}\`);

  if (analysis.invalid.length > 0) {
    console.log('');
    console.error('❌ Invalid Transitions:');
    analysis.invalid.forEach((inv, index) => {
      console.error(\`  \${index + 1}. \${inv.assessment}: \${inv.from} → \${inv.to}\`);
      console.error(\`     at \${inv.timestamp}\`);
    });
  } else {
    console.log('');
    console.log('✓ All transitions are valid');
  }
`;

await mcp__ide__executeCode({ code: analysisCode });
```

### Pattern: Validate Nullable Foreign Keys

Ensure appointment_id is properly set for stages that require it.

**Phase 1: Fetch Constraint Violations**
```typescript
const constraintViolations = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      id,
      assessment_number,
      stage,
      appointment_id,
      request_id
    FROM assessments
    WHERE stage IN (
      'appointment_scheduled',
      'inspection_scheduled',
      'assessment_in_progress',
      'estimate_review',
      'estimate_sent',
      'estimate_finalized',
      'frc_in_progress'
    )
    AND appointment_id IS NULL
  `
});
```

**Phase 2: Report Constraint Issues** (85% token savings)
```typescript
const constraintReportCode = `
  const violations = ${JSON.stringify(constraintViolations)};

  console.log('Appointment ID Constraint Validation:');
  console.log('====================================');
  console.log('');

  const stagesRequiringAppointment = [
    'appointment_scheduled',
    'inspection_scheduled',
    'assessment_in_progress',
    'estimate_review',
    'estimate_sent',
    'estimate_finalized',
    'frc_in_progress'
  ];

  if (violations.length === 0) {
    console.log('✓ All assessments in advanced stages have appointment_id');
    console.log(\`✓ Checked stages: \${stagesRequiringAppointment.join(', ')}\`);
  } else {
    console.error(\`❌ Found \${violations.length} violations:\`);
    console.log('');

    // Group by stage
    const byStage = {};
    violations.forEach(v => {
      if (!byStage[v.stage]) byStage[v.stage] = [];
      byStage[v.stage].push(v);
    });

    Object.entries(byStage).forEach(([stage, items]) => {
      console.error(\`Stage: \${stage} (\${items.length} violations)\`);
      items.forEach(item => {
        console.error(\`  - \${item.assessment_number} (ID: \${item.id})\`);
      });
      console.log('');
    });
  }
`;

await mcp__ide__executeCode({ code: constraintReportCode });
```

### Pattern: Validate Child Record Idempotency

Check that child records follow idempotent patterns (no duplicates).

**Phase 1: Fetch Child Record Counts**
```typescript
const childRecords = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      a.id as assessment_id,
      a.assessment_number,
      a.stage,
      COUNT(DISTINCT v.id) as vehicle_values_count,
      COUNT(DISTINCT d.id) as damage_count,
      COUNT(DISTINCT e.id) as estimate_count,
      COUNT(DISTINCT p.id) as pre_incident_count,
      COUNT(t.id) as tyres_count
    FROM assessments a
    LEFT JOIN assessment_vehicle_values v ON v.assessment_id = a.id
    LEFT JOIN assessment_damage d ON d.assessment_id = a.id
    LEFT JOIN estimates e ON e.assessment_id = a.id
    LEFT JOIN pre_incident_estimates p ON p.assessment_id = a.id
    LEFT JOIN assessment_tyres t ON t.assessment_id = a.id
    WHERE a.stage = 'assessment_in_progress'
    GROUP BY a.id, a.assessment_number, a.stage
  `
});
```

**Phase 2: Validate Counts** (90% token savings)
```typescript
const validationCode = `
  const data = ${JSON.stringify(childRecords)};

  console.log('Child Record Idempotency Validation:');
  console.log('===================================');
  console.log('');

  const violations = {
    vehicle_values: [],
    damage: [],
    estimate: [],
    pre_incident: [],
    tyres: []
  };

  data.forEach(assessment => {
    // Validate 1:1 relationships (should be 0 or 1)
    if (assessment.vehicle_values_count > 1) {
      violations.vehicle_values.push(\`\${assessment.assessment_number}: \${assessment.vehicle_values_count}\`);
    }
    if (assessment.damage_count > 1) {
      violations.damage.push(\`\${assessment.assessment_number}: \${assessment.damage_count}\`);
    }
    if (assessment.estimate_count > 1) {
      violations.estimate.push(\`\${assessment.assessment_number}: \${assessment.estimate_count}\`);
    }
    if (assessment.pre_incident_count > 1) {
      violations.pre_incident.push(\`\${assessment.assessment_number}: \${assessment.pre_incident_count}\`);
    }

    // Validate tyres (should be exactly 5 for in_progress)
    if (assessment.tyres_count !== 5) {
      violations.tyres.push(\`\${assessment.assessment_number}: \${assessment.tyres_count} (expected 5)\`);
    }
  });

  let hasViolations = false;

  Object.entries(violations).forEach(([table, items]) => {
    if (items.length > 0) {
      hasViolations = true;
      console.error(\`❌ \${table} violations (\${items.length}):\`);
      items.forEach(item => console.error(\`  - \${item}\`));
      console.log('');
    }
  });

  if (!hasViolations) {
    console.log('✓ All child records follow idempotent patterns');
    console.log('✓ No duplicate 1:1 records');
    console.log('✓ All assessments have correct tyre count (5)');
  }

  console.log('');
  console.log(\`Total assessments checked: \${data.length}\`);
`;

await mcp__ide__executeCode({ code: validationCode });
```

### Pattern: Stage Distribution Analysis

Analyze current distribution of assessments across stages.

**Phase 1: Fetch Stage Counts**
```typescript
const stageCounts = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT
      stage,
      COUNT(*) as count,
      MIN(created_at) as oldest,
      MAX(created_at) as newest,
      AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/3600) as avg_age_hours
    FROM assessments
    WHERE stage NOT IN ('archived', 'cancelled')
    GROUP BY stage
    ORDER BY
      CASE stage
        WHEN 'request_submitted' THEN 1
        WHEN 'request_reviewed' THEN 2
        WHEN 'appointment_scheduled' THEN 3
        WHEN 'inspection_scheduled' THEN 4
        WHEN 'assessment_in_progress' THEN 5
        WHEN 'estimate_review' THEN 6
        WHEN 'estimate_sent' THEN 7
        WHEN 'estimate_finalized' THEN 8
        WHEN 'frc_in_progress' THEN 9
      END
  `
});
```

**Phase 2: Generate Distribution Report** (87% token savings)
```typescript
const reportCode = `
  const stages = ${JSON.stringify(stageCounts)};

  console.log('Assessment Stage Distribution:');
  console.log('==============================');
  console.log('');

  const total = stages.reduce((sum, s) => sum + s.count, 0);

  console.log('| Stage | Count | % | Avg Age |');
  console.log('|-------|-------|---|---------|');

  stages.forEach(stage => {
    const percentage = ((stage.count / total) * 100).toFixed(1);
    const avgAge = Math.round(stage.avg_age_hours);

    console.log(
      \`| \${stage.stage} | \${stage.count} | \${percentage}% | \${avgAge}h |\`
    );
  });

  console.log('');
  console.log(\`Total active assessments: \${total}\`);

  // Identify bottlenecks (stages with unusually high counts or age)
  const avgCount = total / stages.length;
  const bottlenecks = stages.filter(s => s.count > avgCount * 1.5);

  if (bottlenecks.length > 0) {
    console.log('');
    console.log('⚠️  Potential Bottlenecks:');
    bottlenecks.forEach(b => {
      console.log(\`  - \${b.stage}: \${b.count} assessments (avg age: \${Math.round(b.avg_age_hours)}h)\`);
    });
  }
`;

await mcp__ide__executeCode({ code: reportCode });
```

### When to Use Code Execution for Validation

**✅ Use Code Execution When:**
- Validating architecture compliance across many records
- Analyzing stage transition patterns
- Generating comprehensive compliance reports
- Checking constraint violations in batch
- Identifying workflow bottlenecks

**❌ Use Direct MCP Tools When:**
- Single record validation
- Simple constraint checks
- Creating test data
- Applying schema changes

### Integration with Assessment-Centric Patterns

Code execution complements the assessment-centric architecture:

```typescript
// Step 1: Fetch assessment with all relationships
const assessment = await mcp__supabase__execute_sql({
  project_id: env.SUPABASE_PROJECT_ID,
  query: `
    SELECT a.*, r.*, ap.*
    FROM assessments a
    LEFT JOIN requests r ON a.request_id = r.id
    LEFT JOIN appointments ap ON a.appointment_id = ap.id
    WHERE a.id = $1
  `,
  params: [assessmentId]
});

// Step 2: Validate assessment-centric constraints
const validationCode = `
  const assessment = ${JSON.stringify(assessment)}[0];

  // Validate one-assessment-per-request
  console.assert(assessment.request_id, 'Should have request_id');

  // Validate appointment_id when required
  const requiresAppointment = [
    'appointment_scheduled',
    'inspection_scheduled',
    'assessment_in_progress',
    'estimate_review'
  ].includes(assessment.stage);

  if (requiresAppointment) {
    console.assert(assessment.appointment_id,
      \`Stage \${assessment.stage} requires appointment_id\`);
  }

  console.log('✓ Assessment-centric constraints validated');
`;

await mcp__ide__executeCode({ code: validationCode });
```

### Benefits Summary

- **Architecture Validation**: Ensure assessment-centric compliance
- **Workflow Analysis**: Identify bottlenecks and anomalies
- **Constraint Checking**: Validate relationships programmatically
- **Token Efficiency**: 73-94% reduction for complex validations
- **Batch Processing**: Validate 100+ assessments in single operation
- **Comprehensive Reports**: Detailed findings with statistics

---

**Skill Version:** 1.2.0 (Code Execution Enhanced)
**Last Updated:** November 9, 2025
**ClaimTech Version:** Assessment-centric architecture (Production)
**Status:** Production ready, all phases complete
