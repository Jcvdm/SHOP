# Repairer Selection Dropdown Reset Bug Fix (November 28, 2025)

**Status**: RESOLVED
**Severity**: Medium
**Component**: RatesAndRepairerConfiguration.svelte
**Date Fixed**: November 28, 2025

---

## Issue Summary

When a user selected a repairer from the dropdown in the RatesAndRepairerConfiguration component, the dropdown would reset to "None selected" after the save cycle completed. This created a poor UX where the user's selection appeared to "disappear" despite the data being correctly saved to the database.

### User Experience Impact
- User selects a repairer (e.g., "ABC Motors")
- Selection is saved to database
- Dropdown reverts to "None selected"
- User is confused - appears as if selection was not saved
- Actual data in database is correct

---

## Root Cause Analysis

The bug was caused by **prop cascading and reactive effects** that unintentionally reset the user-controlled dropdown:

### The Problem Flow
1. User selects a repairer via `bind:value` on dropdown (`localRepairerId`)
2. User saves the estimate
3. Save triggers network request
4. Parent component receives updated data from Supabase
5. Parent passes `repairerId` prop to component with old/different value
6. `$effect.pre` in component re-syncs `localRepairerId` from prop
7. Local state is overwritten, resetting dropdown to "None selected"

### Why This Happened
The component had a `$effect.pre` that continuously synchronized `localRepairerId` from the parent's `repairerId` prop:

```svelte
$effect.pre(() => {
  // This runs whenever repairerId prop changes
  // Even if user just selected something, the parent prop update
  // would immediately overwrite the local state
  if (repairerId !== lastKnownRepairerId) {
    localRepairerId = repairerId;
    lastKnownRepairerId = repairerId;
  }
});
```

This pattern is appropriate for **calculated/derived values** (like rates that come from the database), but **wrong for user-controlled dropdowns**.

---

## Solution: Fix #8 - Separate User Control from Prop Sync

The fix establishes a clear pattern: **User-controlled inputs should be initialized once, then left alone. Only calculated values should sync from props.**

### Changes Made

#### File: `src/lib/components/assessment/RatesAndRepairerConfiguration.svelte`

**Removed:**
- `lastKnownRepairerId` state variable (no longer needed)
- `$effect.pre` that synced `localRepairerId` from props (the root cause)

**Result:**
- `localRepairerId` is initialized from `repairerId` prop on component mount
- User selections via `bind:value` fully control the dropdown
- Parent prop changes no longer reset the user's selection
- Component remounts (different estimate) re-initializes from current prop

**Rates still sync appropriately:**
- Rates `$effect.pre` remains unchanged
- Rates are derived from database and should update when props change
- User cannot directly control rates (read-only display)
- This is the correct pattern for calculated values

### Code Pattern

**Before (Bug)**:
```svelte
<script>
  let localRepairerId = repairerId; // Initialize
  let lastKnownRepairerId = repairerId;

  // WRONG: User-controlled value synced from props
  $effect.pre(() => {
    if (repairerId !== lastKnownRepairerId) {
      localRepairerId = repairerId; // ← RESETS USER SELECTION
      lastKnownRepairerId = repairerId;
    }
  });
</script>

<select bind:value={localRepairerId}>
  <!-- When parent prop changes, dropdown resets to prop value -->
</select>
```

**After (Fixed)**:
```svelte
<script>
  let localRepairerId = repairerId; // Initialize once

  // User controls it entirely via bind:value
  // No prop sync needed
</script>

<select bind:value={localRepairerId}>
  <!-- Stays whatever user selected, even if parent prop changes -->
</select>
```

---

## Pattern Established: User-Controlled vs. Calculated Values

This fix establishes a clear pattern for future component development:

### Pattern: User-Controlled Select Dropdowns

**Definition**: Dropdown where user can change the value directly (not calculated)

**Implementation**:
1. Initialize from prop on mount: `let localValue = propValue`
2. Use `bind:value` to let user control it
3. **Do NOT** sync from props via `$effect.pre`
4. On component remount (detected by prop changes that matter), state reinitializes

**Example Use Cases**:
- Repairer selection
- Status dropdowns
- Category selection
- Any user-edited dropdown

### Pattern: Calculated/Derived Values

**Definition**: Values that come from database/parent and should update when parent changes

**Implementation**:
1. Initialize from prop: `let localValue = propValue`
2. Keep `$effect.pre` to sync from props:
   ```svelte
   $effect.pre(() => {
     if (propValue !== lastKnown) {
       localValue = propValue;
       lastKnown = propValue;
     }
   });
   ```
3. Display as read-only (rates, summaries, calculated fields)

**Example Use Cases**:
- Calculated rates/totals
- Derived display values
- Data from database that can change
- Any read-only calculated field

### Decision Tree

```
Is the value user-editable (can user type/select/change)?
├─ YES → User-Controlled Pattern
│  ├─ Initialize once: let local = prop
│  ├─ Use bind:value
│  └─ NO $effect.pre for sync
│
└─ NO → Calculated Pattern
   ├─ Initialize: let local = prop
   ├─ Keep $effect.pre for sync
   └─ Display as read-only
```

---

## Impact

### Before Fix
- Dropdown selected → Saves → Resets to "None selected"
- User confused about whether selection was saved
- Poor UX despite correct database state
- Users needed to refresh page to see selection was actually saved

### After Fix
- Dropdown selected → Saves → Selection persists in UI
- User clearly sees their selection is saved
- Matches expected UI behavior
- No confusion between UI state and database state

### Components Affected
- `RatesAndRepairerConfiguration.svelte` - The one with the bug
- Pattern applies to future dropdown components

---

## Testing

### Manual Testing
1. Navigate to Estimate tab in an assessment
2. Open "Rates & Repairer Configuration"
3. Click "Select a Repairer" dropdown
4. Choose a repairer (e.g., "ABC Motors")
5. Click "Update Configuration"
6. Wait for save to complete
7. **Verify**: Dropdown still shows selected repairer (not "None selected")
8. Refresh page - repairer should still be selected (saved to DB)

### Related Issues Fixed
- Dropdown no longer resets after save
- Configuration state is now stable across save cycles

---

## Files Modified
- `src/lib/components/assessment/RatesAndRepairerConfiguration.svelte`

## Related Documentation
- `.agent/System/tabs_standardization_guide.md` - Component patterns
- `.agent/System/code_execution_patterns.md` - State management patterns

---

## Pattern References

This pattern should be referenced when:
- Creating new select dropdown components
- Fixing dropdown reset issues
- Implementing user-editable vs. calculated fields
- Reviewing component state management

### Documentation Links
- [User-Controlled vs. Calculated Values Pattern](#pattern-established-user-controlled-vs-calculated-values)
- Related: Photo component navigation tracking (similar state isolation principle)

---

**Last Updated**: November 28, 2025
**Pattern Status**: ESTABLISHED - Use for all future dropdown/user-input components
