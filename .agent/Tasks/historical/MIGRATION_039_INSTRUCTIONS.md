# 🚀 Migration 039: Add Cancelled Status to Assessments

## 📋 Overview

This migration adds the ability to cancel assessments at any stage and simplifies the archive system to show only two outcomes: **Completed** or **Cancelled**.

---

## 🔧 Migration Steps

### Step 1: Access Supabase Dashboard
- Navigate to: **https://cfblmkzleqtvtfxujikf.supabase.co**
- Log in to the SVA project dashboard

### Step 2: Open SQL Editor
- In the left sidebar, click on **SQL Editor** (icon looks like `</>`)
- Click the **New Query** button in the top right

### Step 3: Copy Migration SQL
- Open file: `supabase/migrations/039_add_cancelled_status_to_assessments.sql`
- Copy **ALL** contents (30 lines total)

**What the migration does:**
- ✅ Drops old CHECK constraint on assessments.status
- ✅ Adds new CHECK constraint including 'cancelled'
- ✅ Adds `cancelled_at` TIMESTAMPTZ column
- ✅ Adds helpful column comments
- ✅ Creates 2 performance indexes

### Step 4: Execute Migration
- Paste the SQL into the Supabase SQL Editor
- Click **Run** button (or press Ctrl+Enter)
- **Expected result**: "Success. No rows returned"

### Step 5: Verify Schema Changes
In Supabase Dashboard:
1. Go to **Table Editor** → **assessments** table
2. Verify `cancelled_at` column exists (TIMESTAMPTZ type)
3. Verify `status` column allows 'cancelled' value
4. Go to **Database** → **Indexes**
5. Verify these indexes exist:
   - `idx_assessments_cancelled`
   - `idx_assessments_cancelled_at`

---

## 🧪 Testing Checklist

### Test 1: Verify Inspections Page Simplified ✅
**Navigate to**: `/work/inspections`

**Verify:**
- [ ] No status filter tabs visible (All/Pending/Scheduled/etc removed)
- [ ] All inspections shown in single list
- [ ] Status column still visible in table

---

### Test 2: Test Assessment Cancellation ✅
**Steps:**
1. Navigate to an `in_progress` assessment
2. Verify red **Cancel Assessment** button appears in header (with trash icon)
3. Click Cancel button
4. Confirm dialog appears with warning message
5. Click OK
6. Verify navigation to `/work/archive?tab=cancelled`
7. Verify assessment appears in Cancelled tab with red badge

---

### Test 3: Verify Archive Page Structure ✅
**Navigate to**: `/work/archive`

**Verify:**
- [ ] Only 3 tabs visible: **All | Completed | Cancelled**
- [ ] Tab counts show correct numbers
- [ ] Table columns: Type, Number, Client, Client Type, Vehicle, Registration, Status, Date
- [ ] Status badges: 
  - Green for "Completed"
  - Red for "Cancelled"

---

### Test 4: Test Completed Assessment Flow ✅
**Steps:**
1. Complete an assessment through entire workflow:
   - Finalize estimate
   - Create FRC
   - Sign off FRC
2. Verify assessment status becomes `archived`
3. Navigate to `/work/archive`
4. Verify assessment appears in **Completed** tab with green status badge
5. Click row to verify navigation works

---

### Test 5: Test Archive Search and Filtering ✅
**In** `/work/archive`:

**Test search by:**
- [ ] Assessment number
- [ ] Client name
- [ ] Vehicle make/model
- [ ] Registration number

**Test filtering:**
- [ ] Switch between All/Completed/Cancelled tabs
- [ ] Verify filtering works correctly
- [ ] Verify counts update correctly

---

### Test 6: Verify All Entity Types in Archive ✅
**Test cancelled entities appear with correct type badges:**

1. **Cancel a request** → Verify appears in Cancelled tab
   - [ ] Type badge: "Request" (gray background)

2. **Cancel an inspection** → Verify appears in Cancelled tab
   - [ ] Type badge: "Inspection" (blue background)

3. **Cancel an appointment** → Verify appears in Cancelled tab
   - [ ] Type badge: "Appointment" (yellow background)

4. **Cancel an assessment** → Verify appears in Cancelled tab
   - [ ] Type badge: "Assessment" (purple background)

---

### Test 7: Verify Navigation from Archive ✅
**From** `/work/archive`, **click on different archived items:**

**Verify correct navigation:**
- [ ] Request → `/requests/[id]`
- [ ] Inspection → `/work/inspections/[id]`
- [ ] Appointment → `/work/appointments/[id]`
- [ ] Assessment → `/work/assessments/[appointment_id]`

---

## 📊 What Changed

### Database Schema
- **Table**: `assessments`
- **New Column**: `cancelled_at` (TIMESTAMPTZ, nullable)
- **Updated Constraint**: `assessments_status_check` now includes 'cancelled'
- **New Indexes**: 
  - `idx_assessments_cancelled` (partial index on status)
  - `idx_assessments_cancelled_at` (partial index on cancelled_at)

### Code Changes
1. **Types** (`src/lib/types/assessment.ts`)
   - Added `'cancelled'` to `AssessmentStatus` type
   - Added `cancelled_at?: string | null` to Assessment interface

2. **Services** (4 files updated)
   - `assessment.service.ts`: Added `listCancelledAssessments()`
   - `request.service.ts`: Added `listCancelledRequests()`
   - `inspection.service.ts`: Added `listCancelledInspections()`
   - `appointment.service.ts`: Added `listCancelledAppointments()`

3. **UI Components** (3 files updated)
   - `src/routes/(app)/work/inspections/+page.svelte`: Removed status tabs
   - `src/lib/components/assessment/AssessmentLayout.svelte`: Added cancel button
   - `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`: Added cancel handler

4. **Archive System** (2 files rewritten)
   - `src/routes/(app)/work/archive/+page.server.ts`: Fetch completed + cancelled entities
   - `src/routes/(app)/work/archive/+page.svelte`: Simplified to 3 tabs (All/Completed/Cancelled)

---

## 🎯 Expected Behavior

### Before Migration
- Assessments could only be: `in_progress`, `completed`, `submitted`, `archived`
- Archive had 5 tabs: All | Requests | Inspections | Assessments | FRC
- Inspections page had 6 status filter tabs

### After Migration
- Assessments can now be: `in_progress`, `completed`, `submitted`, `archived`, **`cancelled`**
- Archive has 3 tabs: All | **Completed** | **Cancelled**
- Inspections page has **no status tabs** (single unified list)
- Cancel button appears on in-progress assessments
- Cancelled items from any stage (request/inspection/appointment/assessment) appear in archive

---

## 🚨 Troubleshooting

### Migration Fails
**Error**: "constraint already exists"
- **Solution**: The constraint might already be updated. Check if `cancelled_at` column exists in assessments table.

### Cancel Button Not Appearing
- **Check**: Assessment status must be `in_progress`
- **Check**: Browser cache - try hard refresh (Ctrl+Shift+R)

### Archive Not Showing Cancelled Items
- **Check**: Migration was applied successfully
- **Check**: Service methods are returning data (check browser console for errors)
- **Check**: Items actually have `status = 'cancelled'`

---

## ✅ Success Criteria

Migration is successful when:
1. ✅ Migration executes without errors
2. ✅ `cancelled_at` column exists in assessments table
3. ✅ Cancel button appears on in-progress assessments
4. ✅ Clicking cancel updates status and navigates to archive
5. ✅ Archive shows 3 tabs (All/Completed/Cancelled)
6. ✅ Cancelled items appear in Cancelled tab with red badge
7. ✅ Completed items appear in Completed tab with green badge
8. ✅ Search and filtering work correctly
9. ✅ Navigation from archive items works correctly

---

## 📝 Notes

- The migration is **safe** and uses `IF NOT EXISTS` / `IF EXISTS` clauses
- Existing data is **not affected** - only schema changes
- The migration is **idempotent** - can be run multiple times safely
- No downtime required - changes are additive

---

## 🔗 Related Files

- Migration: `supabase/migrations/039_add_cancelled_status_to_assessments.sql`
- Types: `src/lib/types/assessment.ts`
- Services: `src/lib/services/*.service.ts`
- UI: `src/routes/(app)/work/archive/+page.svelte`
- Layout: `src/lib/components/assessment/AssessmentLayout.svelte`

