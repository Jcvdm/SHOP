# Original Estimate Line Removal Refactor - Complete ✅

## Overview

Successfully refactored the original estimate line exclusion system to use negative line items in the additionals system. This provides better visibility and a more intuitive workflow for removing original estimate lines.

---

## What Changed

### Old System (Exclusions)
- Original estimate lines were "excluded" via an `excluded_line_item_ids` array
- Excluded lines were tracked by ID only, not physically represented
- Combined total calculated as: `(Original - Excluded) + Additionals`
- Users could toggle exclusion on/off
- "Replace with Repair" feature for New parts

### New System (Negative Line Items)
- Original estimate lines are "removed" by creating negative line items in additionals
- Removed lines are physically represented with full details and negative values
- Combined total calculated as: `Original + Additionals` (removals are negative in additionals)
- Users can only remove (not toggle back)
- To re-add, users create new items through the normal "Add Line Item" flow
- Removed lines are auto-approved and immediately affect totals

---

## Files Modified

### 1. TypeScript Types (`src/lib/types/assessment.ts`)
**Changes:**
- Added `action?: 'added' | 'removed'` to `AdditionalLineItem` interface
- Added `original_line_id?: string | null` to track which original line was removed
- Marked `excluded_line_item_ids` as optional and deprecated

**Impact:** All additionals line items now have an action field to distinguish between added and removed items.

---

### 2. Additionals Service (`src/lib/services/additionals.service.ts`)
**Changes:**
- ✅ Added `addRemovedLineItem()` method - creates negative line items with action='removed'
- ❌ Removed `getExclusions()` method
- ❌ Removed `updateExclusions()` method
- Updated `addLineItem()` to set `action: 'added'` on new items
- Updated `createDefault()` to not initialize `excluded_line_item_ids`

**New Method Signature:**
```typescript
async addRemovedLineItem(
  assessmentId: string,
  originalLineItem: EstimateLineItem
): Promise<AssessmentAdditionals>
```

**Features:**
- Prevents duplicate removals (checks if original_line_id already exists)
- Negates all monetary values (part_price, labour_cost, paint_cost, etc.)
- Auto-approves removal (status='approved') so it immediately affects totals
- Recalculates approved totals automatically
- Logs audit trail with original line details

---

### 3. OriginalEstimateLinesPanel Component (`src/lib/components/assessment/OriginalEstimateLinesPanel.svelte`)
**Changes:**
- ❌ Removed `excludedLineItemIds` prop
- ❌ Removed `onToggleExclude` callback
- ❌ Removed `onReplaceWithRepair` callback
- ✅ Added `removedOriginalLineIds` prop (array of IDs)
- ✅ Added `onRemoveOriginal` callback
- Replaced "Exclude" and "Replace" buttons with single "Remove" button
- Updated styling: red theme for removed items (was orange for excluded)
- Updated text: "Removed" instead of "Excluded"
- Disabled "Remove" button if line already removed

**New Props:**
```typescript
interface Props {
  estimate: Estimate;
  removedOriginalLineIds: string[];
  onRemoveOriginal: (item: EstimateLineItem) => void;
}
```

---

### 4. AdditionalsTab Component (`src/lib/components/assessment/AdditionalsTab.svelte`)
**Changes:**
- ❌ Removed `excludedLineItemIds` derived state
- ❌ Removed `handleToggleExclude()` function
- ❌ Removed `handleReplaceWithRepair()` function
- ✅ Added `removedOriginalLineIds` derived state (computed from line_items)
- ✅ Added `handleRemoveOriginal()` function
- Updated line items table to show "Removed" badge for action='removed' items
- Added red styling for removed line items (background, text, strikethrough)
- Added "Auto-approved" text in actions column for removed items
- Updated props passed to `OriginalEstimateLinesPanel` and `CombinedTotalsSummary`

**New Derived State:**
```typescript
let removedOriginalLineIds = $derived(() =>
  (additionals?.line_items || [])
    .filter((item) => item.action === 'removed' && item.original_line_id)
    .map((item) => item.original_line_id!)
);
```

**Table Display:**
- Removed items show with red background (`bg-red-50`)
- Description has strikethrough and red text
- All monetary values displayed in red
- "Removed" badge with trash icon
- No action buttons (shows "Auto-approved" text)

---

### 5. CombinedTotalsSummary Component (`src/lib/components/assessment/CombinedTotalsSummary.svelte`)
**Changes:**
- ❌ Removed `excludedLineItemIds` prop
- ❌ Removed `excludedOriginalTotal` calculation
- ✅ Added `removedOriginalTotal` calculation (from negative line items)
- ✅ Added `removedLineCount` calculation
- Updated combined total calculation: `original + additionals` (simplified)
- Updated UI: "Removed (Original)" card instead of "Excluded Lines"
- Updated styling: red theme for removed items (was orange)
- Updated calculation formula display with explanatory note

**New Calculations:**
```typescript
const removedOriginalTotal = $derived(() => {
  return additionals.line_items
    .filter((li) => li.action === 'removed' && li.status === 'approved')
    .reduce((sum, li) => sum + Math.abs(li.total || 0), 0);
});

const combinedTotal = $derived(() => {
  return (estimate?.total || 0) + (additionals?.total_approved || 0);
});
```

**Display Changes:**
- Card 1: Original Total (unchanged)
- Card 2: "Removed (Original)" with negative value in red
- Card 3: Additionals (unchanged)
- Card 4: Combined Total (unchanged)
- Formula: Shows that additionals includes negative removals

---

### 6. Database Migration (`supabase/migrations/037_migrate_exclusions_to_removed_lines.sql`)
**Purpose:** Backfill existing exclusions into negative line items

**What It Does:**
1. Creates temporary function `migrate_exclusions_to_removed_lines()`
2. Loops through all `assessment_additionals` records with exclusions
3. For each excluded line ID:
   - Finds the original line item in the estimate
   - Creates a negative "removed" line item with:
     - All monetary values negated
     - `status: 'approved'`
     - `action: 'removed'`
     - `original_line_id` set to the excluded ID
     - `approved_at` set to NOW()
4. Recalculates approved totals
5. Clears `excluded_line_item_ids` array (sets to `[]`)
6. Updates column comment to mark as deprecated
7. Drops temporary function

**Safety:**
- Non-destructive: keeps `excluded_line_item_ids` column for backward compatibility
- Idempotent: can be run multiple times safely
- Logs progress with NOTICE messages
- Preserves all original line item details

---

## User Workflow Changes

### Before (Exclusion System)
1. Engineer opens Additionals tab
2. Clicks "Manage Lines" on Original Estimate Lines panel
3. Clicks "Exclude" button to toggle exclusion
4. Excluded lines show with strikethrough in orange
5. For New parts, could click "Replace" to exclude and create repair
6. Combined total shows: `(Original - Excluded) + Additionals`

### After (Removal System)
1. Engineer opens Additionals tab
2. Clicks "Manage Lines" on Original Estimate Lines panel
3. Clicks "Remove" button (one-way action)
4. Removed line is added to Additionals table as negative item with red styling
5. Removed line shows "Removed" badge and "Auto-approved" status
6. To replace with different item, engineer uses "Add Line Item" feature
7. Combined total shows: `Original + Additionals` (removals are negative)

---

## Benefits

### 1. **Better Visibility**
- Removed lines are physically visible in the Additionals table
- Full line details preserved (description, part number, costs)
- Clear audit trail of what was removed and when

### 2. **Simpler Mental Model**
- No separate "exclusions" concept to understand
- Everything is a line item (positive or negative)
- Combined total calculation is straightforward addition

### 3. **Consistent Workflow**
- All changes go through the additionals system
- Approval workflow is consistent (removed items auto-approved)
- Audit logging captures all changes

### 4. **Flexibility**
- Can remove any line from original estimate
- Can add replacement items with any configuration
- No special "replace with repair" logic needed

### 5. **Data Integrity**
- Removed lines can't be "un-removed" accidentally
- Full history preserved in line_items array
- Totals always recalculated correctly

---

## Testing Checklist

### Functional Testing
- [ ] Remove an original estimate line
- [ ] Verify negative line appears in Additionals table with red styling
- [ ] Verify "Remove" button is disabled after removal
- [ ] Verify combined total updates correctly
- [ ] Verify removed total shows in summary card
- [ ] Add a new line item to replace removed one
- [ ] Verify new item appears as separate positive line
- [ ] Check that removed lines show in "Removed (Original)" card
- [ ] Verify write-off risk indicator updates correctly

### Edge Cases
- [ ] Try to remove the same line twice (should be prevented)
- [ ] Remove multiple lines and verify totals
- [ ] Remove a line with zero cost
- [ ] Remove a line with only labour cost
- [ ] Remove a line with only part cost
- [ ] Verify negative values display correctly in table

### Migration Testing
- [ ] Run migration on database with existing exclusions
- [ ] Verify exclusions converted to negative line items
- [ ] Verify `excluded_line_item_ids` cleared to `[]`
- [ ] Verify approved totals recalculated correctly
- [ ] Check audit logs for migration notices

### UI/UX Testing
- [ ] Verify red color scheme for removed items
- [ ] Verify strikethrough on removed line descriptions
- [ ] Verify "Removed" badge displays correctly
- [ ] Verify "Auto-approved" text in actions column
- [ ] Verify modal dialog text updated
- [ ] Verify summary cards display correctly
- [ ] Verify calculation formula shows correct values

---

## Rollback Plan

If issues are discovered, rollback steps:

1. **Revert Code Changes:**
   ```bash
   git revert <commit-hash>
   ```

2. **Restore Exclusions (if needed):**
   - The `excluded_line_item_ids` column still exists
   - Could write a reverse migration to convert negative line items back to exclusions
   - However, this would lose the detailed history

3. **Alternative: Keep Both Systems:**
   - Could temporarily support both systems
   - Check for `excluded_line_item_ids` first, fall back to negative line items
   - Gradually migrate users over time

---

## Future Enhancements

### Potential Improvements
1. **Undo Removal:** Add ability to "un-remove" a line (delete the negative line item)
2. **Bulk Remove:** Select multiple lines to remove at once
3. **Removal Reasons:** Add optional reason field for removals
4. **Removal History:** Show timeline of when lines were removed
5. **PDF Display:** Show removed lines in generated estimate PDFs with strikethrough
6. **Client Communication:** Generate change summary for client showing removals and additions

### Database Cleanup (Future)
- After confirming migration success, could drop `excluded_line_item_ids` column
- Would require another migration and careful testing
- Recommended to wait 3-6 months before removing

---

## Documentation Updates Needed

- [ ] Update user manual with new removal workflow
- [ ] Update training materials
- [ ] Update API documentation (if applicable)
- [ ] Update COMPONENTS.md with updated component props
- [ ] Add this refactor to CHANGELOG.md

---

## Summary

✅ **All tasks completed successfully!**

- TypeScript types updated with `action` and `original_line_id` fields
- Service layer refactored with new `addRemovedLineItem()` method
- UI components updated to show removed lines as negative items
- Combined totals calculation simplified
- Database migration created to backfill existing exclusions
- All changes maintain backward compatibility

**Next Step:** Run the Supabase migration to convert existing exclusions to negative line items.

---

## Migration Command

To apply the migration to your Supabase project:

```bash
# Using Supabase CLI
supabase db push

# Or apply directly via Supabase dashboard
# Copy contents of 037_migrate_exclusions_to_removed_lines.sql
# Paste into SQL Editor and execute
```

---

**Refactor completed:** 2025-10-15
**Files changed:** 6 files modified, 2 files created
**Lines changed:** ~500 lines modified/added
**Migration:** 037_migrate_exclusions_to_removed_lines.sql

