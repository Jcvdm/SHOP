<!-- d7611226-44e5-4765-840b-0eb2c4b8b11b d18c144e-3398-41ad-9efd-4df8cdbc1b79 -->
# Redirect Cancelled Inspection Flow

## Implementation Summary

### Changes Made

1. **Updated inspection cancellation redirect** (`src/routes/(app)/work/inspections/[id]/+page.svelte`):
   - Changed line 139 from `goto('/work/inspections')` to `goto('/work/archive?tab=cancelled')`
   - Now matches the pattern used for assessment cancellations

2. **Updated archive page to read URL query parameter** (`src/routes/(app)/work/archive/+page.svelte`):
   - Added import for `page` store from `$app/stores`
   - Initialize `selectedType` from URL query parameter `tab` if present
   - Supports `?tab=cancelled` and `?tab=completed` query parameters

### Verified Behavior

- ✅ Archive page already lists cancelled inspections (lines 110-127)
- ✅ Archive page displays cancelled inspections with "Cancelled" status badge
- ✅ Inspection detail page shows "Reactivate Inspection" button for cancelled inspections (lines 361-366)
- ✅ Reactivation flow redirects back to `/work/inspections` (line 176)

## Manual Test Steps

### Test 1: Cancel Inspection and Verify Redirect

1. Navigate to an active inspection detail page (`/work/inspections/[id]`)
2. Click "Cancel Inspection" button
3. Confirm the cancellation dialog
4. **Expected Result**: 
   - Page redirects to `/work/archive?tab=cancelled`
   - Archive page loads with "Cancelled" tab automatically selected
   - Cancelled inspection appears in the archive list

### Test 2: Verify Cancelled Inspection in Archive

1. Navigate to Archive page (`/work/archive`)
2. Click on "Cancelled" tab
3. **Expected Result**:
   - Cancelled inspection appears in the list with:
     - Type badge showing "Inspection"
     - Status badge showing "Cancelled" (red)
     - Correct inspection number, client, vehicle details

### Test 3: Reactivate Inspection from Archive

1. From Archive page, click on a cancelled inspection row
2. **Expected Result**:
   - Navigates to inspection detail page
   - "Reactivate Inspection" button is visible in the header
3. Click "Reactivate Inspection" button
4. Confirm reactivation dialog
5. **Expected Result**:
   - Page redirects to `/work/inspections`
   - Inspection appears in active inspections list
   - Inspection status changes from "cancelled" to "pending"

### Test 4: Direct URL Access with Tab Parameter

1. Navigate directly to `/work/archive?tab=cancelled`
2. **Expected Result**:
   - Archive page loads with "Cancelled" tab selected
   - Only cancelled items are displayed

## Notes

- The redirect pattern now matches assessment cancellations for consistency
- Archive page gracefully handles invalid `tab` values (defaults to "all")
- Reactivation flow remains unchanged and functional

