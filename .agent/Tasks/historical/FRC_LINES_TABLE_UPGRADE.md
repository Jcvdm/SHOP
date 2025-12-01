# FRC Lines Table Upgrade - Implementation Summary

## Overview
Upgraded the FRC (Final Repair Costing) line items display from a compact breakdown view to a full-width table matching the design patterns used in EstimateTab and AdditionalsTab. This provides better visibility of component-level pricing and makes it easier to compare quoted vs actual values.

## Changes Made

### 1. Created FRCLinesTable Component
**File:** `src/lib/components/assessment/FRCLinesTable.svelte`

A new reusable component that displays FRC line items in a comprehensive table format.

**Features:**
- **Full-width table layout** with 10 columns:
  - Type (process type badge)
  - Description (with source and adjust reason)
  - Parts (nett)
  - S&A (Strip & Assemble)
  - Labour
  - Paint
  - Outwork
  - Total
  - Status (badge)
  - Actions (Agree/Adjust buttons)

- **Quoted vs Actual display** for each component:
  - Top row: Quoted amount (muted gray text)
  - Middle row: Actual amount (bold text)
  - Bottom row: Delta with color coding (red for over, green for under)

- **Smart column visibility:**
  - Parts (nett) only shown for process type 'N' (New)
  - S&A shown for 'N', 'R', 'P', 'B'
  - Labour shown for 'N', 'R', 'A'
  - Paint shown for 'N', 'R', 'P', 'B'
  - Outwork only shown for 'O'

- **Hours/panels display:**
  - Shows hours for S&A and Labour (e.g., "R 500.00 (2h)")
  - Shows panels for Paint (e.g., "R 800.00 (4p)")

- **Status badges:**
  - Pending: Gray with clock icon
  - Agreed: Green with check icon
  - Adjusted: Orange with alert icon

- **Action buttons:**
  - Agree button (disabled if already agreed)
  - Adjust button (opens modal)
  - Both hidden when FRC is completed

### 2. Refactored FRCTab Component
**File:** `src/lib/components/assessment/FRCTab.svelte`

**Changes:**
- Replaced the old inline table with `<FRCLinesTable>` component
- Removed unused imports (Table components, Check, X, Clock icons)
- Removed `getDecisionBadge()` function (now in FRCLinesTable)
- Kept all existing functionality:
  - Adjust modal with component-based inputs
  - Agree handler
  - Document upload
  - Totals summary
  - Complete FRC button

**Before:**
```svelte
<Table.Root>
  <!-- Complex inline table with small breakdown text -->
</Table.Root>
```

**After:**
```svelte
<FRCLinesTable
  {frc}
  onAgree={handleAgree}
  onAdjust={openAdjustModal}
/>
```

## Benefits

### 1. **Improved Readability**
- Larger text for component values
- Clear separation between quoted and actual amounts
- Color-coded deltas make variances immediately visible

### 2. **Consistent Design**
- Matches EstimateTab and AdditionalsTab table layouts
- Uses same badge styles and process type colors
- Familiar column structure for users

### 3. **Better Data Visibility**
- All component breakdowns visible at a glance
- No need to expand or hover to see details
- Hours/panels shown inline with costs

### 4. **Maintainability**
- Reusable component can be used elsewhere if needed
- Cleaner separation of concerns
- Easier to update table styling globally

### 5. **Responsive Design**
- Horizontal scroll on smaller screens
- Fixed column widths prevent layout shifts
- Proper spacing and padding throughout

## Technical Details

### Component Props
```typescript
interface Props {
  frc: FinalRepairCosting;
  onAgree: (line: FRCLineItem) => void;
  onAdjust: (line: FRCLineItem) => void;
}
```

### Delta Calculation
```typescript
function getDeltaDisplay(quoted: number, actual: number | null) {
  if (actual === null) return { text: '-', class: 'text-gray-400' };
  const delta = actual - quoted;
  return {
    text: `${delta > 0 ? '+' : ''}${formatCurrency(delta)}`,
    class: delta > 0 ? 'text-red-600' : 'text-green-600'
  };
}
```

### Process Type Visibility Logic
```typescript
function showParts(processType: string) {
  return processType === 'N';
}

function showSA(processType: string) {
  return ['N', 'R', 'P', 'B'].includes(processType);
}

function showLabour(processType: string) {
  return ['N', 'R', 'A'].includes(processType);
}

function showPaint(processType: string) {
  return ['N', 'R', 'P', 'B'].includes(processType);
}

function showOutwork(processType: string) {
  return processType === 'O';
}
```

## Data Flow

1. **FRCTab** loads FRC data from service
2. **FRCTab** passes FRC object and handlers to **FRCLinesTable**
3. **FRCLinesTable** renders each line with:
   - Quoted values from `quoted_*` fields
   - Actual values from `actual_*` fields
   - Calculated deltas
4. User clicks **Agree** → calls `onAgree(line)` → updates FRC
5. User clicks **Adjust** → calls `onAdjust(line)` → opens modal in FRCTab

## Testing Checklist

- [x] Table displays correctly with all columns
- [x] Quoted values show in muted gray
- [x] Actual values show in bold (or "-" if pending)
- [x] Deltas calculate correctly and show proper colors
- [x] Process type badges display with correct colors
- [x] Hours/panels show inline with costs
- [x] Status badges show correct variant and icon
- [x] Agree button works and disables after agreeing
- [x] Adjust button opens modal correctly
- [x] Actions hidden when FRC is completed
- [x] Component visibility logic works per process type
- [x] No TypeScript errors
- [x] Responsive on different screen sizes

## Future Enhancements

1. **Sorting:** Add column sorting (by type, quoted, actual, delta)
2. **Filtering:** Filter by status (pending/agreed/adjusted)
3. **Export:** Export table to CSV/Excel
4. **Bulk Actions:** Select multiple lines and agree/adjust in bulk
5. **Inline Editing:** Edit actual values directly in table (quick adjust)
6. **Comparison View:** Toggle between showing all components vs only changed ones

## Files Modified

- `src/lib/components/assessment/FRCLinesTable.svelte` (NEW)
- `src/lib/components/assessment/FRCTab.svelte` (MODIFIED)

## Backward Compatibility

✅ **Fully backward compatible**
- No database schema changes required
- Existing FRC data displays correctly
- All existing functionality preserved
- Adjust modal unchanged

## Performance

- No performance impact
- Same number of DOM elements (just reorganized)
- No additional API calls
- Efficient rendering with Svelte's reactivity

---

**Implementation Date:** 2025-10-16  
**Status:** ✅ Complete and tested

