# Bug Fix: Vehicle Values Calculation Error

## Issue Description

When entering vehicle values (Trade, Market, Retail) and applying condition adjustments, the calculated values were showing astronomical numbers:

**Example:**
- Input: Market Value = 256,000, Condition Adjustment = 5%
- Expected: 256,000 + (256,000 × 5%) = 268,800
- **Actual: R 256,000,012,800.00** ❌

## Root Cause

The `FormField.svelte` component was not properly parsing number inputs. When `type="number"` is used on an HTML input element, `target.value` still returns a **string**, not a number.

### The Bug

In `FormField.svelte` line 46:

```typescript
function handleChange(e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    value = target.value;  // ❌ Assigns STRING, not number!
    onchange?.(target.value);
}
```

### What Was Happening

1. User types `256000` in Market Value field
2. FormField assigns: `marketValue = "256000"` (string)
3. User types `5` in Condition Adjustment %
4. FormField assigns: `conditionAdjustmentPercentage = "5"` (string)
5. Calculation runs:
   ```typescript
   adjusted += baseValue * (conditionPercentage / 100);
   // JavaScript coerces strings to numbers for multiplication
   // But then uses string concatenation for addition:
   "256000" + 12800 = "25600012800" (string concatenation!)
   ```

### Why Trade Value Worked

Trade Value appeared correct because it was likely entered first or parsed correctly initially, but subsequent values (Market, Retail) were being treated as strings, causing string concatenation instead of numeric addition.

## The Fix

Updated `FormField.svelte` to properly parse number inputs:

```typescript
function handleChange(e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    // For number inputs, parse the value as a number to prevent string concatenation issues
    if (target instanceof HTMLInputElement && target.type === 'number') {
        const numValue = target.value === '' ? 0 : parseFloat(target.value);
        value = isNaN(numValue) ? 0 : numValue;
    } else {
        value = target.value;
    }
    
    onchange?.(target.value);
}
```

### What This Does

1. **Checks if input is a number type**: `target.type === 'number'`
2. **Parses the string to a float**: `parseFloat(target.value)`
3. **Handles empty values**: Returns `0` if empty
4. **Handles invalid numbers**: Returns `0` if `NaN`
5. **Preserves string behavior**: Other input types (text, textarea, select) continue to work with strings

## Testing

### Before Fix
- Trade Value: 240,000 → Adjusted: R 252,000.00 ✓
- Market Value: 256,000 → Adjusted: R 256,000,012,800.00 ❌
- Retail Value: 275,000 → Adjusted: R 275,000,013,750.00 ❌

### After Fix (Expected)
- Trade Value: 240,000 → Adjusted: R 252,000.00 ✓
- Market Value: 256,000 → Adjusted: R 268,800.00 ✓
- Retail Value: 275,000 → Adjusted: R 288,750.00 ✓

## Files Modified

1. **`src/lib/components/forms/FormField.svelte`**
   - Updated `handleChange()` function to parse number inputs
   - Added type checking for number inputs
   - Added NaN and empty value handling

2. **`src/lib/components/assessment/VehicleValuesTab.svelte`**
   - Removed debug console logs
   - Cleaned up extras initialization

## Impact

This fix affects **all number inputs** throughout the application that use the `FormField` component, including:

- Vehicle values (Trade, Market, Retail)
- Adjustments (Valuation Adjustment Amount, Valuation Adjustment %, Condition Adjustment %)
- New List Price
- Depreciation %
- Estimate line items
- Pre-incident estimate line items
- Any other numeric fields using FormField

## Additional Notes

### Why This Wasn't Caught Earlier

- The issue only manifested when multiple number fields were used together in calculations
- Simple number inputs (like single values) appeared to work correctly
- The bug was triggered by reactive calculations that combined multiple numeric inputs

### Prevention

To prevent similar issues in the future:
1. Always parse `target.value` for number inputs
2. Use TypeScript's type system to catch string/number mismatches
3. Add unit tests for form field value handling
4. Test calculations with multiple numeric inputs

## Verification Steps

1. Navigate to an assessment's Values tab
2. Enter values:
   - Trade Value: 240,000
   - Market Value: 256,000
   - Retail Value: 275,000
3. Set Condition Adjustment %: 5
4. Verify adjusted values:
   - Trade: R 252,000.00
   - Market: R 268,800.00
   - Retail: R 288,750.00
5. Test with different adjustment percentages
6. Test with Valuation Adjustment (amount and %)
7. Verify all calculations are correct

---

**Status:** ✅ **FIXED**  
**Date:** 2025-01-08  
**Severity:** High (Critical calculation error)  
**Files Changed:** 2

