# Assessment-Centric Architecture - Quick Start Guide

## 🚀 Ready to Implement?

This guide provides step-by-step instructions for implementing the assessment-centric architecture refactor.

**Prerequisites:**
- Read [Executive Summary](./assessment_centric_summary.md)
- Read [Full PRD](./assessment_centric_architecture_refactor.md)
- Review [Technical Specification](./assessment_centric_technical_spec.md)

---

## Phase 0: Schema Foundation

### Step 1: Create Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/assessment-centric-architecture
```

### Step 2: Create Migration File
```bash
# Create new migration file
touch supabase/migrations/068_add_assessment_stage.sql
```

### Step 3: Copy Migration SQL
Copy the complete migration from [Technical Specification](./assessment_centric_technical_spec.md#migration-068-add-assessment-stage) into `068_add_assessment_stage.sql`

### Step 4: Apply Migration (Dev Branch)
```bash
# Using Supabase CLI
supabase db push

# OR using Supabase MCP (if available)
# Use the Supabase MCP tool to apply migration
```

### Step 5: Verify Migration
```sql
-- Check stage column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assessments' AND column_name = 'stage';

-- Check enum type exists
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'assessment_stage'::regtype
ORDER BY enumsortorder;

-- Check existing assessments have stage values
SELECT stage, COUNT(*) as count
FROM assessments
GROUP BY stage;

-- Check constraints exist
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'assessments'::regclass
AND conname IN ('uq_assessments_request', 'require_appointment_when_scheduled');
```

### Step 6: Test RLS Policies
```sql
-- Test admin can insert without appointment_id
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"role": "admin"}';

INSERT INTO assessments (request_id, assessment_number, stage)
VALUES (
  (SELECT id FROM requests LIMIT 1),
  'TEST-2025-999',
  'request_submitted'
);

-- Clean up test
DELETE FROM assessments WHERE assessment_number = 'TEST-2025-999';
```

### ✅ Phase 0 Complete Checklist
- [ ] Migration file created
- [ ] Migration applied successfully
- [ ] Stage column exists and is populated
- [ ] Enum type created with all values
- [ ] Unique constraint on request_id works
- [ ] Check constraint on appointment_id works
- [ ] Indexes created
- [ ] RLS policies updated
- [ ] Admin can insert without appointment_id
- [ ] Engineers still restricted correctly

---

## Phase 1: Create Assessment with Request

### Step 1: Update AssessmentService
Open `src/lib/services/assessment.service.ts` and add the new methods from [Technical Specification](./assessment_centric_technical_spec.md#service-layer-changes)

**Key methods to add:**
- `createAssessmentForRequest()`
- `findOrCreateByRequest()`
- `updateStage()`

### Step 2: Update RequestService
Open `src/lib/services/request.service.ts` and modify `createRequest()` to create assessment automatically.

**Key changes:**
- Import `AssessmentService`
- Call `assessmentService.createAssessmentForRequest()` after creating request
- Return both request and assessment
- Update audit logging

### Step 3: Update TypeScript Types
Open `src/lib/types/assessment.ts` and add:
- `AssessmentStage` type
- Update `Assessment` interface (make appointment_id nullable, add stage field)
- Update `CreateAssessmentInput` interface

### Step 4: Update Request Creation UI
Open `src/routes/(app)/requests/new/+page.server.ts` and update form action:

```typescript
export const actions = {
  default: async ({ request, locals }) => {
    // ... form validation ...
    
    // Create request + assessment
    const { request: newRequest, assessment } = await requestService.createRequest(
      requestData,
      locals.supabase
    );
    
    // ... rest of logic ...
  }
};
```

### Step 5: Write Unit Tests
Create `src/lib/services/__tests__/assessment.service.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { AssessmentService } from '../assessment.service';

describe('AssessmentService', () => {
  it('should create assessment for request', async () => {
    // Test createAssessmentForRequest
  });
  
  it('should find or create assessment (idempotent)', async () => {
    // Test findOrCreateByRequest
  });
  
  it('should update stage with audit logging', async () => {
    // Test updateStage
  });
});
```

### Step 6: Test Manually
```bash
# Start dev server
npm run dev

# Navigate to /requests/new
# Create a new request
# Check database to verify assessment was created
```

```sql
-- Verify assessment created with request
SELECT r.request_number, a.assessment_number, a.stage
FROM requests r
JOIN assessments a ON a.request_id = r.id
ORDER BY r.created_at DESC
LIMIT 5;
```

### ✅ Phase 1 Complete Checklist
- [ ] AssessmentService methods added
- [ ] RequestService updated
- [ ] TypeScript types updated
- [ ] Request creation UI updated
- [ ] Unit tests written and passing
- [ ] Manual testing successful
- [ ] Assessment created automatically with request
- [ ] Assessment has correct stage ('request_submitted')
- [ ] Audit logs track creation
- [ ] No duplicate errors

---

## Phase 2: Update "Start Assessment" Flow

### Step 1: Update Assessment Page Server
Open `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts`

**Key changes:**
- Replace `createAssessment()` with `findOrCreateByRequest()`
- Add stage transition logic
- Make child record creation conditional (only if not exists)

### Step 2: Update Child Record Services
Add `findOrCreate()` methods to:
- `vehicle-identification.service.ts`
- `tyres.service.ts`
- `damage.service.ts`
- Other child record services

**Pattern:**
```typescript
async findOrCreate(assessmentId: string, client?: ServiceClient): Promise<Record> {
  const db = client ?? supabase;
  
  // Try to find existing
  const existing = await this.getByAssessment(assessmentId, client);
  if (existing) return existing;
  
  // Create if not found
  return this.createDefault(assessmentId, client);
}
```

### Step 3: Test "Start Assessment" Flow
```bash
# Start dev server
npm run dev

# Navigate to /work/appointments
# Click "Start Assessment" on an appointment
# Verify assessment loads without errors
# Check database to verify stage updated
```

```sql
-- Verify stage transition
SELECT assessment_number, stage, appointment_id
FROM assessments
WHERE stage = 'assessment_in_progress'
ORDER BY updated_at DESC
LIMIT 5;
```

### Step 4: Test Double-Click Scenario
```bash
# In browser console, rapidly click "Start Assessment" multiple times
# Verify no duplicate errors
# Verify appointment doesn't disappear
# Verify assessment loads correctly
```

### ✅ Phase 2 Complete Checklist
- [ ] Assessment page server updated
- [ ] Child record services have findOrCreate methods
- [ ] "Start Assessment" finds existing assessment
- [ ] Stage transitions correctly
- [ ] Default child records created
- [ ] Double-click doesn't cause errors
- [ ] Appointment doesn't disappear on error
- [ ] Assessment loads correctly

---

## Phase 3: Stage-Based List Pages

### Step 1: Update Requests Page
Open `src/routes/(app)/requests/+page.server.ts`

```typescript
// Query assessments by stage instead of requests by status
const { data: assessments } = await locals.supabase
  .from('assessments')
  .select(`
    *,
    requests!inner(*)
  `)
  .in('stage', ['request_submitted', 'request_accepted'])
  .order('created_at', { ascending: false });
```

### Step 2: Update Inspections Page
Open `src/routes/(app)/work/inspections/+page.server.ts`

```typescript
// Query assessments in 'request_accepted' stage
const { data: assessments } = await locals.supabase
  .from('assessments')
  .select(`
    *,
    requests!inner(*),
    inspections!inner(*)
  `)
  .eq('stage', 'request_accepted')
  .order('created_at', { ascending: false });
```

### Step 3: Update Appointments Page
Open `src/routes/(app)/work/appointments/+page.server.ts`

```typescript
// Query assessments in 'inspection_scheduled' stage
const { data: assessments } = await locals.supabase
  .from('assessments')
  .select(`
    *,
    appointments!inner(*)
  `)
  .eq('stage', 'inspection_scheduled')
  .order('created_at', { ascending: false });
```

### Step 4: Update Other List Pages
- Open Assessments: `stage = 'assessment_in_progress'`
- Finalized Assessments: `stage = 'estimate_finalized'`
- FRC: `stage IN ('frc_in_progress', 'frc_completed')`
- Archive: `stage IN ('archived', 'cancelled')`

### Step 5: Update Sidebar Badge Counts
Open `src/lib/components/Sidebar.svelte` and update count queries to use stage field.

### Step 6: Test All List Pages
```bash
# Navigate through all list pages
# Verify correct assessments appear in each stage
# Verify counts in sidebar badges
# Test filtering by engineer (if engineer user)
```

### ✅ Phase 3 Complete Checklist
- [ ] Requests page updated
- [ ] Inspections page updated
- [ ] Appointments page updated
- [ ] Open Assessments page updated
- [ ] Finalized Assessments page updated
- [ ] FRC page updated
- [ ] Archive page updated
- [ ] Sidebar badge counts updated
- [ ] All pages show correct data
- [ ] Engineer filtering works
- [ ] No regressions in functionality

---

## Final Testing

### Automated Tests
```bash
# Run all tests
npm run test

# Run E2E tests
npm run test:e2e
```

### Manual Testing Checklist
- [ ] Create 10 requests rapidly → no duplicates
- [ ] Double-click "Start Assessment" → no errors
- [ ] Test as admin user → full access
- [ ] Test as engineer user → filtered access
- [ ] Verify all list pages show correct data
- [ ] Verify sidebar badge counts accurate
- [ ] Check browser console for errors
- [ ] Check server logs for errors

### Performance Testing
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM assessments
WHERE stage = 'assessment_in_progress'
ORDER BY created_at DESC;

-- Verify indexes are used
-- Should see "Index Scan using idx_assessments_stage"
```

---

## Deployment

### Step 1: Merge to Main
```bash
git add .
git commit -m "feat: implement assessment-centric architecture"
git push origin feature/assessment-centric-architecture

# Create PR and get approval
# Merge to main
```

### Step 2: Deploy to Staging
```bash
# Deploy to staging environment
# Run migration on staging database
# Test thoroughly on staging
```

### Step 3: Deploy to Production
```bash
# Deploy to production environment
# Run migration on production database
# Monitor for errors
```

### Step 4: Monitor
- Check error logs
- Monitor performance metrics
- Watch for user reports
- Verify no race condition errors

---

## Rollback (If Needed)

If issues arise, follow the rollback plan in [Full PRD](./assessment_centric_architecture_refactor.md#rollback-plan).

**Quick rollback SQL:**
```sql
-- Rollback Phase 0 changes
ALTER TABLE assessments
  DROP CONSTRAINT uq_assessments_request,
  DROP CONSTRAINT require_appointment_when_scheduled,
  DROP COLUMN stage,
  ALTER COLUMN appointment_id SET NOT NULL,
  ALTER COLUMN inspection_id SET NOT NULL;

DROP TYPE assessment_stage;
```

---

## Success!

Once all phases are complete and deployed:
- ✅ No more race condition errors
- ✅ No more disappearing appointments
- ✅ Clearer workflow
- ✅ Better performance
- ✅ Easier to maintain

**Celebrate!** 🎉

---

## Support

If you encounter issues:
1. Check [Technical Specification](./assessment_centric_technical_spec.md) for detailed code examples
2. Review [Full PRD](./assessment_centric_architecture_refactor.md) for architecture details
3. Check [Executive Summary](./assessment_centric_summary.md) for quick reference
4. Consult related SOPs in `.agent/SOP/` folder

---

## Related Documentation

- [Assessment-Centric Architecture Refactor PRD](./assessment_centric_architecture_refactor.md)
- [Executive Summary](./assessment_centric_summary.md)
- [Technical Specification](./assessment_centric_technical_spec.md)
- [Database Schema](../../System/database_schema.md)
- [Working with Services](../../SOP/working_with_services.md)
- [Adding Database Migrations](../../SOP/adding_migration.md)

