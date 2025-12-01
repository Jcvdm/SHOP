# Additionals Letter Template Fix - November 20, 2025

## Issue
Additionals report generation did not correctly reflect the visible values on the UI tab. Specifically:
- Removed original lines were incorrectly appearing in both the "APPROVED ADDITIONALS" table and "REMOVED ORIGINAL LINES" section
- Totals calculation text was misleading about how removed lines affect the payable total

## Root Cause Analysis
The Additionals Letter template (`src/lib/templates/additionals-letter-template.ts`) was filtering items incorrectly:

1. **Approved Items Filter**: Used `status === 'approved' && action !== 'reversal'` which included removed lines (`action === 'removed'`) in the approved table
2. **Explanatory Text**: Stated that removed original lines were "excluded from the payable total" when they're actually included as negative adjustments
3. **Footer Summary**: Listed both declined and removed items as "excluded", with removed items actually affecting the total

## Fix Implementation

### 1. Fixed Approved Items Filter
```typescript
// Before
const approvedItems = (additionals?.line_items || []).filter(
  (li) => li.status === 'approved' && li.action !== 'reversal'
);

// After  
const approvedItems = (additionals?.line_items || []).filter(
  (li) => li.status === 'approved' && li.action === 'added'
);
```

### 2. Updated Explanatory Text
Changed "REMOVED ORIGINAL LINES" section description to clarify these are audit trail items that reduce the payable total.

### 3. Improved Calculation Summary Note
Added note: "Approved removals and reversals are included as negative adjustments."

### 4. Fixed Footer Summary
Changed from "Excluded from payable total" to "Notes about payable total" and:
- Removed declined items note (declined items are already properly excluded)
- Clarified removed lines reduce the payable total

## Files Modified
- `src/lib/templates/additionals-letter-template.ts`

## Verification
- Removed original lines now appear only in the "REMOVED ORIGINAL LINES" section
- Totals calculation correctly includes negative adjustments
- Explanatory text now matches the backend calculation logic
- PDF output aligns with what users see on the Additionals tab

## Related Components
- The UI already calculated totals correctly via `AdditionalsService.calculateApprovedTotals`
- `CombinedTotalsSummary.svelte` already correctly explained behavior
- Only the letter template was misaligned

## Impact
This fix ensures generated Additionals Letters match:
1. The visual representation in the Additionals tab
2. The actual totals calculations
3. User expectations for how removed lines affect the payable total

## Testing Recommendations
- Generate an additionals letter for a case with:
  - Approved added items
  - Declined items  
  - Removed original lines
- Verify removed lines only appear once in the "REMOVED" section
- Confirm totals match what's shown in the UI