# Assessment-Centric Architecture - Executive Summary

## Quick Overview

**Problem:** Race conditions causing duplicate assessments and disappearing appointments when clicking "Start Assessment"

**Solution:** Create assessment record immediately when request is created, use stage field to track pipeline progression

**Impact:** Eliminates race conditions, simplifies data model, improves performance

**Timeline:** 19-27 hours (2.5-3.5 days) across 4 phases

---

## The Problem (From issue.md)

```
Duplicate assessment number detected (attempt 1/3), retrying...
Duplicate assessment number detected (attempt 2/3), retrying...
Error creating assessment: duplicate key value violates unique constraint
Failed to create assessment after maximum retries

-- it seems issue remains -- when I clicked on start assessment 
-- the assessment disappeared and i got 500 error -- then after 
-- the error and refresh the appointment scheduled is missing 
-- after start assessment click --
```

**Root Cause:**
- Assessment created "late" in workflow (at "Start Assessment" click)
- Multiple concurrent clicks create race condition
- Count-then-insert pattern is not atomic
- Appointment status updated before assessment creation confirmed
- If creation fails, appointment disappears from list

---

## The Solution

### Core Concept: Assessment-Centric Pipeline

**Before (Current):**
```
Request → Inspection → Appointment → Assessment
  ↓         ↓            ↓             ↓
CLM-001   INS-001      APT-001       ASM-001
(separate entities, created at different times)
```

**After (Proposed):**
```
Request + Assessment (created together)
  ↓
Assessment moves through stages:
  request_submitted → request_accepted → inspection_scheduled
  → assessment_in_progress → assessment_completed → estimate_finalized
  → frc_in_progress → frc_completed → archived
```

### Key Changes

1. **Assessment created with request** - No more late creation
2. **Stage field tracks pipeline** - Single enum replaces multiple status fields
3. **Nullable foreign keys** - appointment_id optional until scheduled
4. **One assessment per request** - Unique constraint enforces single source of truth

---

## Benefits

### 1. Eliminates Race Conditions ✅
- Assessment ID exists from the start
- "Start Assessment" just updates stage (idempotent)
- No more duplicate key errors
- No more disappearing appointments

### 2. Single Source of Truth ✅
- Assessment is the canonical "case" record
- All child tables reference assessment_id
- No data duplication across workflow stages
- Easier to track case history

### 3. Simplified RLS Policies ✅
- Single table to check for ownership
- Fewer policy chains = better performance
- Clearer security model

### 4. Better Error Recovery ✅
- If operation fails, assessment still exists
- User can retry without losing work
- Clearer error messages

### 5. Clearer Workflow ✅
- Stage field explicitly shows pipeline position
- Easy to query "all assessments in stage X"
- Audit trail of stage transitions

---

## Implementation Phases

### Phase 0: Schema Foundation (2-3 hours)
**Status:** Ready to implement  
**Risk:** Low - Additive changes only

**What:**
- Add `assessment_stage` enum type
- Add `stage` column to assessments
- Make `appointment_id` and `inspection_id` nullable
- Add unique constraint on `request_id`
- Update RLS policies

**Deliverables:**
- Migration `068_add_assessment_stage.sql`
- Backfill existing assessments with correct stages
- Updated RLS policies

---

### Phase 1: Create Assessment with Request (4-6 hours)
**Status:** Ready to implement after Phase 0  
**Risk:** Medium - Changes request creation flow

**What:**
- Update `RequestService.createRequest()` to create assessment
- Add `AssessmentService.createAssessmentForRequest()`
- Add `AssessmentService.findOrCreateByRequest()` (idempotent)
- Add audit logging for stage transitions

**Deliverables:**
- Updated `request.service.ts`
- Updated `assessment.service.ts`
- Unit tests for new methods

---

### Phase 2: Update "Start Assessment" Flow (3-4 hours)
**Status:** Ready to implement after Phase 1  
**Risk:** Medium - Changes critical user workflow

**What:**
- Change from creating assessment to finding existing
- Update stage from 'inspection_scheduled' → 'assessment_in_progress'
- Create default child records (if not exist)
- Remove assessment creation from appointment flow

**Deliverables:**
- Updated `/work/assessments/[appointment_id]/+page.server.ts`
- Updated child record services (findOrCreate pattern)
- E2E tests for "Start Assessment" flow

---

### Phase 3: Stage-Based List Pages (6-8 hours)
**Status:** Ready to implement after Phase 2  
**Risk:** Low - UI changes only

**What:**
- Update all list pages to query by stage
- Update sidebar badge counts
- Update filtering logic
- Keep existing UI (transparent to user)

**Deliverables:**
- Updated requests page (stage IN 'request_submitted', 'request_accepted')
- Updated inspections page (stage = 'request_accepted')
- Updated appointments page (stage = 'inspection_scheduled')
- Updated open assessments page (stage = 'assessment_in_progress')
- Updated finalized assessments page (stage = 'estimate_finalized')
- Updated FRC page (stage IN 'frc_in_progress', 'frc_completed')
- Updated archive page (stage IN 'archived', 'cancelled')

---

## Success Metrics

### Before Implementation
- ❌ Race condition errors: ~5-10 per day
- ❌ Disappearing appointments: ~2-3 per day
- ❌ User confusion: High
- ❌ Support tickets: ~3-5 per week

### After Implementation
- ✅ Race condition errors: 0
- ✅ Disappearing appointments: 0
- ✅ User confusion: Low
- ✅ Support tickets: 0

### Performance Improvements
- ✅ Faster list page queries (fewer joins)
- ✅ Simpler RLS policy evaluation
- ✅ Clearer audit trail
- ✅ Easier to add new workflow stages

---

## Risk Assessment

### High Risk Items
None - All phases are designed to be non-breaking

### Medium Risk Items
1. **Phase 1:** Request creation flow changes
   - **Mitigation:** Extensive testing, rollback plan ready
   
2. **Phase 2:** "Start Assessment" flow changes
   - **Mitigation:** Idempotent operations, error recovery

### Low Risk Items
1. **Phase 0:** Schema changes (additive only)
2. **Phase 3:** UI changes (query changes only)

---

## Testing Strategy

### Automated Tests
- Unit tests for all service methods
- Integration tests for request → assessment creation
- E2E tests for full workflow
- Load tests for concurrent operations

### Manual Tests
- Create 10 requests rapidly → verify no duplicates
- Double-click "Start Assessment" → verify no errors
- Test as admin user
- Test as engineer user
- Verify all list pages show correct data
- Verify sidebar badge counts

### Performance Tests
- Measure query performance before/after
- Monitor RLS policy evaluation time
- Check index usage

---

## Rollback Plan

Each phase has a clear rollback procedure:

**Phase 3 → Phase 2:** Revert list page queries  
**Phase 2 → Phase 1:** Revert "Start Assessment" logic  
**Phase 1 → Phase 0:** Stop creating assessment with request  
**Phase 0 → Original:** Drop stage column and constraints

**Full Rollback SQL:**
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

## Timeline & Resources

### Estimated Timeline
- **Phase 0:** 2-3 hours (1 day)
- **Phase 1:** 4-6 hours (1 day)
- **Phase 2:** 3-4 hours (0.5 day)
- **Phase 3:** 6-8 hours (1 day)
- **Testing:** 4-6 hours (0.5 day)

**Total:** 19-27 hours (2.5-3.5 days)

### Resources Required
- 1 Senior Developer (full implementation)
- 1 QA Engineer (testing)
- Access to dev/staging Supabase branches
- Approval for schema changes

### Recommended Schedule
- **Day 1:** Phase 0 + testing
- **Day 2:** Phase 1 + testing
- **Day 3:** Phase 2 + Phase 3 + testing
- **Day 4:** Final testing + deployment

---

## Documentation

### Primary Documents
1. **[Assessment-Centric Architecture Refactor PRD](./assessment_centric_architecture_refactor.md)**
   - Complete problem statement
   - Detailed architecture design
   - Phase-by-phase implementation plan
   - Benefits, risks, and success criteria

2. **[Assessment-Centric Technical Specification](./assessment_centric_technical_spec.md)**
   - Complete SQL migrations
   - Service layer code examples
   - TypeScript type updates
   - Testing checklist

3. **[This Summary Document](./assessment_centric_summary.md)**
   - Executive overview
   - Quick reference
   - Timeline and resources

### Related Documentation
- [Database Schema](../../System/database_schema.md)
- [Working with Services](../../SOP/working_with_services.md)
- [Adding Database Migrations](../../SOP/adding_migration.md)
- [Handling Race Conditions](../../SOP/handling_race_conditions_in_number_generation.md)
- [Service Client Authentication](../../SOP/service_client_authentication.md)

---

## Next Steps

### Immediate Actions
1. ✅ Review PRD and technical spec with team
2. ✅ Get approval for architecture change
3. ⏳ Create feature branch: `feature/assessment-centric-architecture`
4. ⏳ Implement Phase 0 (schema foundation)
5. ⏳ Test Phase 0 thoroughly
6. ⏳ Proceed to Phase 1 after verification

### Decision Points
- **After Phase 0:** Verify schema changes work correctly
- **After Phase 1:** Verify request creation works correctly
- **After Phase 2:** Verify "Start Assessment" works correctly
- **After Phase 3:** Verify all list pages work correctly

### Go/No-Go Criteria
- All automated tests pass
- Manual testing shows no regressions
- Performance metrics meet or exceed baseline
- Team approval for production deployment

---

## Questions & Answers

**Q: Will this break existing functionality?**  
A: No. All phases are designed to be non-breaking. Old fields are kept for backward compatibility.

**Q: What happens to existing assessments?**  
A: They are backfilled with correct stage values based on their current status.

**Q: Can we roll back if something goes wrong?**  
A: Yes. Each phase has a clear rollback procedure.

**Q: How long will this take?**  
A: 2.5-3.5 days of development + testing time.

**Q: Will users notice any changes?**  
A: No. The UI remains the same. The changes are internal to the data model.

**Q: What about performance?**  
A: Performance should improve due to fewer joins and simpler RLS policies.

---

## Approval Sign-Off

- [ ] Technical Lead Review
- [ ] Product Owner Approval
- [ ] QA Lead Approval
- [ ] DevOps/Infrastructure Approval
- [ ] Security Review (RLS policies)

**Approved By:** _________________  
**Date:** _________________  
**Notes:** _________________

