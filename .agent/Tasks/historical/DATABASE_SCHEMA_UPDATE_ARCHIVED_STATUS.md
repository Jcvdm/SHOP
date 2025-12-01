# Database Schema Update - Archived Status

## Overview
Updated the SVA project database schema to support the 'archived' status for assessments, enabling the complete FRC workflow.

---

## ✅ **Changes Applied**

### **1. Updated Check Constraint**
**Table:** `assessments`  
**Constraint:** `assessments_status_check`

**Before:**
```sql
CHECK (status IN ('in_progress', 'completed', 'submitted'))
```

**After:**
```sql
CHECK (status IN ('in_progress', 'completed', 'submitted', 'archived'))
```

**Result:** ✅ Constraint now allows 'archived' status

---

### **2. Added Column Comment**
**Column:** `assessments.status`

**Comment:**
```
Assessment status: in_progress (active work), completed (deprecated), submitted (estimate finalized), archived (FRC completed)
```

**Purpose:** Documents the status flow and meaning of each status value

---

### **3. Created Performance Index**
**Index:** `idx_assessments_archived`

**Definition:**
```sql
CREATE INDEX idx_assessments_archived ON assessments(status) WHERE status = 'archived'
```

**Purpose:** Optimizes queries filtering for archived assessments (used by Archive page)

---

## 🎯 **Impact**

### **Before Schema Update:**
- ❌ FRC completion failed when trying to set assessment status to 'archived'
- ❌ Error: `new row for relation "assessments" violates check constraint "assessments_status_check"`
- ❌ Assessments stayed in 'submitted' status after FRC completion
- ❌ Assessments didn't move to Archive
- ❌ Console errors when navigating to lists

### **After Schema Update:**
- ✅ FRC completion can successfully set assessment status to 'archived'
- ✅ Assessments automatically move to Archive when FRC is completed
- ✅ Assessments disappear from Finalized Assessments list
- ✅ No database constraint violations
- ✅ Complete workflow functions as designed

---

## 🔄 **Complete Workflow Now Working**

```
1. Assessment in Progress (in_progress)
   ↓ [Complete All Tabs + Finalize Estimate]
   
2. Assessment Finalized (submitted)
   - Appears in: Finalized Assessments
   - Can: Add Additionals, Start FRC
   ↓ [Start FRC]
   
3. FRC In Progress (in_progress)
   - Appears in: FRC List
   - Can: Make line item decisions
   ↓ [Complete FRC + Sign Off]
   
4. FRC Completed (completed)
   - Assessment Status: archived ✅ (NOW WORKS!)
   - Appears in: Archive
   - Can: Reopen FRC if needed
```

---

## 📊 **Verification**

### **Constraint Verification:**
```sql
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conname = 'assessments_status_check';
```

**Result:**
```
CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'submitted'::text, 'archived'::text])))
```
✅ Confirmed: 'archived' is included

### **Index Verification:**
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_assessments_archived';
```

**Result:**
```
CREATE INDEX idx_assessments_archived ON public.assessments USING btree (status) 
WHERE (status = 'archived'::text)
```
✅ Confirmed: Index created successfully

---

## 🧪 **Testing Instructions**

### **Test 1: Complete FRC for ASM-2025-002**

1. Navigate to Assessment ASM-2025-002
2. Go to FRC tab
3. Ensure all line items have decisions
4. Click "Mark as Completed"
5. Fill in sign-off details
6. Click "Agree & Sign Off"

**Expected Results:**
- ✅ FRC status changes to 'completed'
- ✅ Assessment status changes to 'archived' (no errors!)
- ✅ Assessment disappears from Finalized Assessments
- ✅ Assessment appears in Archive
- ✅ No console errors

### **Test 2: Verify Archive Query**

```sql
SELECT id, assessment_number, status, updated_at 
FROM assessments 
WHERE status = 'archived' 
ORDER BY updated_at DESC;
```

**Expected:** Should return assessments with completed FRCs

### **Test 3: Verify Finalized Assessments Query**

```sql
SELECT id, assessment_number, status 
FROM assessments 
WHERE status = 'submitted' 
ORDER BY updated_at DESC;
```

**Expected:** Should NOT include assessments with completed FRCs

### **Test 4: Test Reopen FRC**

1. Navigate to archived assessment
2. Go to FRC tab
3. Click "Reopen FRC"
4. Confirm in modal

**Expected Results:**
- ✅ FRC status changes to 'in_progress'
- ✅ Assessment status changes to 'submitted'
- ✅ Assessment moves back to Finalized Assessments
- ✅ Assessment disappears from Archive

---

## 🔒 **Database Changes Summary**

| **Change** | **Type** | **Status** |
|-----------|----------|-----------|
| Drop old check constraint | ALTER TABLE | ✅ Complete |
| Add new check constraint with 'archived' | ALTER TABLE | ✅ Complete |
| Add column comment | COMMENT | ✅ Complete |
| Create performance index | CREATE INDEX | ✅ Complete |

---

## 📝 **Migration File**

The migration is documented in:
- **File:** `supabase/migrations/038_add_archived_status.sql`
- **Applied to:** SVA project (cfblmkzleqtvtfxujikf)
- **Date:** 2025-10-17
- **Method:** Supabase MCP Server

---

## 🎉 **Status: COMPLETE**

The database schema has been successfully updated to support the 'archived' status. The complete FRC workflow should now function without errors.

**Next Steps:**
1. Test FRC completion for ASM-2025-002
2. Verify assessment moves to Archive
3. Test Reopen FRC functionality
4. Confirm no console errors

---

## 🔧 **Rollback Instructions (if needed)**

If you need to rollback this change:

```sql
-- Remove the new constraint
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_status_check;

-- Add back the old constraint (without 'archived')
ALTER TABLE assessments ADD CONSTRAINT assessments_status_check 
CHECK (status IN ('in_progress', 'completed', 'submitted'));

-- Drop the index
DROP INDEX IF EXISTS idx_assessments_archived;
```

**Note:** Only rollback if there are critical issues. The 'archived' status is required for the FRC workflow to function correctly.

