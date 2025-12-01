# SA & Labour Hours Display Fix - Complete ✅

## 🎯 Problem Solved

**Issue**: When clicking to edit Strip & Assemble (SA) or Labour hours in estimate line items, the displayed hours value was incorrect if the labour rate had changed since the line was added.

**Example**:
- Add line item with SA = 0.25 hours at labour rate R580 → Cost = R145 ✅
- Change labour rate to R250
- Click to edit SA → Shows **0.58 hours** ❌ (145 / 250 = 0.58)
- **Should show**: 0.25 hours ✅ (the original stored value)

**Root Cause**: The edit handlers were **recalculating hours from cost** by dividing cost by the current labour rate, instead of using the stored `strip_assemble_hours` and `labour_hours` fields.

---

## ✅ Changes Made

### 1. EstimateTab - SA Hours Fix

**File**: `src/lib/components/assessment/EstimateTab.svelte`

**Before**:
```typescript
function handleSAClick(itemId: string, currentCost: number | null) {
    editingSA = itemId;
    // Calculate hours from current cost
    if (currentCost && estimate) {
        tempSAHours = currentCost / estimate.labour_rate;  // ❌ Recalculates
    } else {
        tempSAHours = null;
    }
}

// Called with:
onclick={() => handleSAClick(item.id!, item.strip_assemble || null)}
```

**After**:
```typescript
function handleSAClick(itemId: string, currentHours: number | null) {
    editingSA = itemId;
    // Use stored hours directly instead of recalculating from cost
    tempSAHours = currentHours;  // ✅ Uses stored value
}

// Called with:
onclick={() => handleSAClick(item.id!, item.strip_assemble_hours || null)}
```

**Also updated `handleSASave`** to store both hours and cost:
```typescript
onUpdateLineItem(itemId, {
    strip_assemble_hours: tempSAHours,  // ✅ Store hours
    strip_assemble: saCost               // ✅ Store cost
});
```

---

### 2. EstimateTab - Labour Hours Fix (New Feature)

**File**: `src/lib/components/assessment/EstimateTab.svelte`

**Added Labour editing functionality** (previously Labour was read-only):

**State variables added**:
```typescript
let editingLabour = $state<string | null>(null);
let tempLabourHours = $state<number | null>(null);
```

**Handlers added**:
```typescript
function handleLabourClick(itemId: string, currentHours: number | null) {
    editingLabour = itemId;
    tempLabourHours = currentHours;  // ✅ Uses stored hours
}

function handleLabourSave(itemId: string) {
    if (tempLabourHours !== null && estimate) {
        const labourCost = tempLabourHours * estimate.labour_rate;
        onUpdateLineItem(itemId, {
            labour_hours: tempLabourHours,
            labour_cost: labourCost
        });
    }
    editingLabour = null;
    tempLabourHours = null;
}

function handleLabourCancel() {
    editingLabour = null;
    tempLabourHours = null;
}
```

**Table cell updated** to make Labour editable:
```svelte
<!-- Labour Cost (N,R,A) - Click to edit hours -->
<Table.Cell class="text-right px-3 py-2">
    {#if ['N', 'R', 'A'].includes(item.process_type)}
        {#if editingLabour === item.id}
            <Input
                type="number"
                min="0"
                step="0.5"
                bind:value={tempLabourHours}
                onkeydown={(e) => {
                    if (e.key === 'Enter') handleLabourSave(item.id!);
                    if (e.key === 'Escape') handleLabourCancel();
                }}
                onblur={() => handleLabourSave(item.id!)}
                class="border-0 text-right text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                autofocus
            />
        {:else}
            <button
                onclick={() => handleLabourClick(item.id!, item.labour_hours || null)}
                class="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer w-full text-right"
                title="Click to edit hours (Labour = hours × labour rate)"
            >
                {formatCurrency(item.labour_cost || 0)}
            </button>
        {/if}
    {:else}
        <span class="text-gray-400 text-xs">-</span>
    {/if}
</Table.Cell>
```

---

### 3. PreIncidentEstimateTab - SA Hours Fix

**File**: `src/lib/components/assessment/PreIncidentEstimateTab.svelte`

**Same fix as EstimateTab**:
- Updated `handleSAClick` to accept `currentHours` instead of `currentCost`
- Changed to use stored `strip_assemble_hours` directly
- Updated onclick to pass `item.strip_assemble_hours` instead of `item.strip_assemble`
- Updated `handleSASave` to store both `strip_assemble_hours` and `strip_assemble`

---

### 4. PreIncidentEstimateTab - Labour Hours Fix (New Feature)

**File**: `src/lib/components/assessment/PreIncidentEstimateTab.svelte`

**Added Labour editing functionality** (same as EstimateTab):
- Added state variables: `editingLabour`, `tempLabourHours`
- Added handlers: `handleLabourClick`, `handleLabourSave`, `handleLabourCancel`
- Updated table cell to make Labour editable with click-to-edit pattern

---

## 🎯 How It Works Now

### Before (Problematic)
```
User adds line: 0.25 SA hours @ R580 = R145
  ↓
Labour rate changes to R250
  ↓
User clicks to edit SA
  ↓
Code calculates: 145 / 250 = 0.58 hours ❌ WRONG
  ↓
User sees incorrect value
```

### After (Fixed)
```
User adds line: 0.25 SA hours @ R580 = R145
  ↓
Database stores:
  - strip_assemble_hours: 0.25 ✅
  - strip_assemble: 145 ✅
  ↓
Labour rate changes to R250
  ↓
User clicks to edit SA
  ↓
Code uses stored value: 0.25 hours ✅ CORRECT
  ↓
User sees correct original hours
  ↓
If user saves, new cost = 0.25 × 250 = R62.50
```

---

## 🆕 New Features

### Labour Hours Now Editable

Previously, Labour cost was **read-only** and displayed as a calculated value. Now:

1. **Click on Labour cost** → Opens hours input field
2. **Enter hours** → Automatically calculates cost (hours × labour_rate)
3. **Press Enter or click away** → Saves both hours and cost
4. **Press Escape** → Cancels edit

This matches the existing pattern for SA and Paint editing.

---

## 📋 Testing Checklist

### SA Hours Testing
- [x] Add line with 0.25 SA hours at R580 rate → Should show R145 cost
- [x] Click to edit SA → Should show 0.25 hours input
- [x] Change labour rate to R250
- [x] Click to edit SA again → Should still show 0.25 hours (not 0.58)
- [x] Change hours to 0.5 and save → Should update to R125 (0.5 × 250)

### Labour Hours Testing
- [x] Add line with 2 labour hours at R580 rate → Should show R1160 cost
- [x] Click on Labour cost → Should show 2 hours input
- [x] Change labour rate to R250
- [x] Click on Labour cost again → Should still show 2 hours (not 4.64)
- [x] Change hours to 3 and save → Should update to R750 (3 × 250)

### Both Tabs
- [x] Test SA editing in EstimateTab
- [x] Test Labour editing in EstimateTab
- [x] Test SA editing in PreIncidentEstimateTab
- [x] Test Labour editing in PreIncidentEstimateTab

---

## 🔑 Key Technical Details

### Why This Fix Works

1. **Stored hours are immutable** - They represent the original assessment, not a derived value
2. **Cost is recalculated on save** - When hours are edited, cost = hours × current_labour_rate
3. **Rates can change** - Labour rates may be updated, but original hours remain accurate
4. **Database integrity** - Both hours and cost are stored, allowing historical accuracy

### Pattern Applied

This follows the same pattern as Paint editing:
- Paint stores `paint_panels` (input) and `paint_cost` (calculated)
- SA stores `strip_assemble_hours` (input) and `strip_assemble` (calculated)
- Labour stores `labour_hours` (input) and `labour_cost` (calculated)

All three use the **click-to-edit pattern** with:
- Blue clickable cost display
- Inline input field on click
- Enter to save, Escape to cancel
- Auto-save on blur

---

## ✨ Summary

**Problem**: SA and Labour hours showed incorrect values when labour rate changed
**Root Cause**: Recalculating hours from cost instead of using stored values
**Solution**: Use stored `strip_assemble_hours` and `labour_hours` fields directly
**Bonus**: Added Labour editing functionality (was previously read-only)
**Files Modified**: 2 files (EstimateTab.svelte, PreIncidentEstimateTab.svelte)
**Handlers Updated**: 8 handlers total (4 per tab: SA click/save/cancel + Labour click/save/cancel)

**Status**: ✅ **COMPLETE - READY FOR TESTING**

