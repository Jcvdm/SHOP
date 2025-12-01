# Workflow Fixes Summary

## Overview
This document summarizes the fixes implemented to correct the assessment workflow issues where items were disappearing from lists and not moving through the proper phases.

---

## 🔧 **Fixes Implemented**

### **Fix #1: Assessment Status Flow Correction**

**Problem:** When completing the estimate, the assessment status was set to 'completed', causing it to disappear from all lists (Open Assessments shows 'in_progress', Finalized shows 'submitted', but nothing showed 'completed').

**Solution:** 
- Changed `handleCompleteEstimate()` to redirect to the Finalize tab instead of changing status
- Assessment remains 'in_progress' until the estimate is finalized
- This keeps the assessment visible in Open Assessments until the user explicitly finalizes

**Files Modified:**
- `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte` (Line 578-584)

**Code Change:**
```typescript
// BEFORE:
async function handleCompleteEstimate() {
    await assessmentService.markTabCompleted(data.assessment.id, 'estimate');
    await assessmentService.updateAssessmentStatus(data.assessment.id, 'completed');
    goto(`/work/appointments/${data.appointment.id}`);
}

// AFTER:
async function handleCompleteEstimate() {
    await assessmentService.markTabCompleted(data.assessment.id, 'estimate');
    // Note: Status remains 'in_progress' until estimate is finalized
    // This keeps the assessment in the Open Assessments list
    // Redirect to finalize tab to complete the process
    goto(`/work/assessments/${data.appointment.id}?tab=finalize`);
}
```

---

### **Fix #2: Added 'archived' Status**

**Problem:** No clear way to distinguish between finalized assessments and those with completed FRC.

**Solution:**
- Added new 'archived' status to assessment types
- Flow: `in_progress` → `submitted` (finalized) → `archived` (FRC completed)
- Deprecated 'completed' status (kept for backward compatibility)

**Files Modified:**
- `src/lib/types/assessment.ts` (Line 1-4)
- `src/lib/services/assessment.service.ts` (Line 233-251)
- `supabase/migrations/038_add_archived_status.sql` (NEW)

**Code Changes:**
```typescript
// assessment.ts
export type AssessmentStatus = 'in_progress' | 'completed' | 'submitted' | 'archived';

// assessment.service.ts - Updated updateAssessmentStatus to support 'archived'
async updateAssessmentStatus(
    id: string,
    status: 'in_progress' | 'completed' | 'submitted' | 'archived'
): Promise<Assessment>
```

**Database Migration:**
```sql
-- Add 'archived' status to assessments table
ALTER TABLE assessments 
DROP CONSTRAINT IF EXISTS assessments_status_check;

ALTER TABLE assessments 
ADD CONSTRAINT assessments_status_check 
CHECK (status IN ('in_progress', 'completed', 'submitted', 'archived'));

-- Create index for archived assessments
CREATE INDEX IF NOT EXISTS idx_assessments_archived 
ON assessments(status) WHERE status = 'archived';
```

---

### **Fix #3: FRC Completion Hook**

**Problem:** When FRC was completed and signed off, the assessment remained in Finalized Assessments list instead of moving to Archive.

**Solution:**
- Updated `completeFRC()` method to automatically set assessment status to 'archived'
- Added audit logging for the status change
- Assessment now automatically moves to Archive when FRC is signed off

**Files Modified:**
- `src/lib/services/frc.service.ts` (Line 375-479)

**Code Change:**
```typescript
async completeFRC(frcId: string, signOffData: {...}): Promise<FinalRepairCosting> {
    // ... existing FRC completion code ...
    
    // NEW: Update assessment status to 'archived' when FRC is completed
    try {
        const { error: assessmentError } = await supabase
            .from('assessments')
            .update({ status: 'archived', updated_at: now })
            .eq('id', frc.assessment_id);

        if (!assessmentError) {
            // Log assessment status change
            await auditService.logChange({
                entity_type: 'assessment',
                entity_id: frc.assessment_id,
                action: 'status_changed',
                field_name: 'status',
                old_value: 'submitted',
                new_value: 'archived',
                metadata: {
                    reason: 'FRC completed and signed off',
                    frc_id: frcId
                }
            });
        }
    } catch (assessmentUpdateError) {
        console.error('Error in assessment status update:', assessmentUpdateError);
        // Continue - FRC completion is the primary operation
    }
    
    // ... rest of code ...
}
```

---

### **Fix #4: Archive Query Update**

**Problem:** Archive was fetching assessments with status 'completed', but finalized assessments have status 'submitted'. After FRC completion, they should have status 'archived'.

**Solution:**
- Created new `listArchivedAssessments()` method that fetches assessments with status 'archived'
- Updated archive page to use the new method
- Deprecated old `listCompletedAssessments()` method

**Files Modified:**
- `src/lib/services/assessment.service.ts` (Line 417-464)
- `src/routes/(app)/work/archive/+page.server.ts` (Line 7-34)
- `src/routes/(app)/work/archive/+page.svelte` (Line 81-82)

**Code Changes:**
```typescript
// assessment.service.ts
async listArchivedAssessments(): Promise<any[]> {
    const { data, error } = await supabase
        .from('assessments')
        .select(`...`)
        .eq('status', 'archived')  // Only fetch archived assessments
        .order('updated_at', { ascending: false });
    
    return data || [];
}

// archive/+page.server.ts
const [completedRequests, completedInspections, archivedAssessments, completedFRC] =
    await Promise.all([
        requestService.listRequests({ status: 'completed' }),
        inspectionService.listCompletedInspections(),
        assessmentService.listArchivedAssessments(), // Use new method
        frcService.listFRC({ status: 'completed' })
    ]);
```

---

### **Fix #5: Documentation Updates**

**Problem:** Documentation didn't reflect the corrected workflow and status flow.

**Solution:**
- Added comprehensive "Assessment Status Flow" section
- Updated workflow diagram to show all phases with statuses
- Updated badge indicators to show correct statuses
- Updated "Getting Started" workflow steps

**Files Modified:**
- `WORKFLOW.md` (Multiple sections updated)

**Key Additions:**
- Assessment Status Flow table showing status meanings and transitions
- Key Workflow Points explaining each step in detail
- Updated workflow diagram with status annotations
- Corrected badge indicator descriptions

---

## 📊 **Corrected Workflow**

### **Complete Flow:**
```
Request (submitted)
    ↓ [Accept]
Inspection (pending)
    ↓ [Appoint Engineer + Schedule]
Appointment (scheduled)
    ↓ [Start Assessment]
Assessment (in_progress) ← Shows in "Open Assessments"
    ↓ [Complete All Tabs + Finalize Estimate]
Assessment (submitted) ← Shows in "Finalized Assessments"
    ↓ [Can add Additionals]
    ↓ [Start FRC]
FRC (in_progress) ← Shows in "FRC List"
    ↓ [Complete FRC + Sign Off]
Assessment (archived) ← Shows in "Archive"
```

### **Status Meanings:**
- **in_progress**: Assessment is being worked on (Open Assessments)
- **submitted**: Estimate finalized and sent to client (Finalized Assessments)
- **archived**: FRC completed and signed off (Archive)
- **completed**: ⚠️ DEPRECATED - Should not be used

---

## ✅ **Testing Checklist**

To verify the fixes work correctly, test the following workflow:

1. ✅ **Create and Accept Request** → Should appear in Inspections
2. ✅ **Appoint Engineer + Schedule Appointment** → Should appear in Appointments
3. ✅ **Start Assessment** → Should appear in Open Assessments (status: in_progress)
4. ✅ **Complete Estimate Tab** → Should redirect to Finalize tab, still in Open Assessments
5. ✅ **Finalize Estimate** → Should move to Finalized Assessments (status: submitted)
6. ✅ **Add Additionals** → Should appear in Additionals list
7. ✅ **Start FRC** → Should appear in FRC list
8. ✅ **Complete FRC + Sign Off** → Assessment should automatically move to Archive (status: archived)
9. ✅ **Search in Archive** → Should find the completed assessment

---

## 🚀 **Next Steps**

1. **Apply Database Migration:**
   ```bash
   # Run the migration to add 'archived' status support
   supabase db push
   ```

2. **Test the Workflow:**
   - Use Assessment ASM-2025-002 or create a new test assessment
   - Follow the complete workflow from start to archive
   - Verify items appear in the correct lists at each stage

3. **Monitor for Issues:**
   - Check that no assessments are stuck in 'completed' status
   - Verify badge counts update correctly
   - Ensure audit logs are being created properly

---

## 📝 **Notes**

- The 'completed' status is kept for backward compatibility but should not be used going forward
- All existing assessments with 'completed' status should be manually reviewed and updated to either 'submitted' or 'archived' as appropriate
- The FRC completion automatically updates assessment status, so no manual intervention is needed
- Archive now only shows assessments with 'archived' status, ensuring only fully completed work appears there

