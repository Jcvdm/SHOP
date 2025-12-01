# Vehicle Values: Condition Adjustment Update

## Overview
Changed the condition adjustment field from percentage-based to value-based input. Users now enter the actual adjustment amount, and the system automatically calculates the percentage for display purposes.

---

## Changes Made

### **1. Database Schema** ✅
**Migration**: `027_change_condition_adjustment_to_value.sql`

Changed column name in `assessment_vehicle_values` table:
- **Old**: `condition_adjustment_percentage` (DECIMAL - percentage value)
- **New**: `condition_adjustment_value` (DECIMAL - actual amount)

```sql
ALTER TABLE assessment_vehicle_values 
  RENAME COLUMN condition_adjustment_percentage TO condition_adjustment_value;
```

---

### **2. TypeScript Types** ✅
**File**: `src/lib/types/assessment.ts`

Updated `VehicleValues` interface:
```typescript
// Old
condition_adjustment_percentage?: number | null;

// New
condition_adjustment_value?: number | null; // User enters value, system calculates %
```

---

### **3. Calculation Utilities** ✅
**File**: `src/lib/utils/vehicleValuesCalculations.ts`

#### Updated `calculateAdjustedValue()` function:
```typescript
// Old logic
if (conditionAdjustmentPercentage > 0) {
    adjusted += baseValue * (conditionAdjustmentPercentage / 100);
}

// New logic
adjusted += conditionAdjustmentValue; // Direct addition
```

#### Added new helper function:
```typescript
export function calculateConditionAdjustmentPercentage(
    baseValue: number,
    adjustmentValue: number
): number {
    if (baseValue === 0) return 0;
    return Math.round((adjustmentValue / baseValue) * 100 * 100) / 100;
}
```

---

### **4. UI Component** ✅
**File**: `src/lib/components/assessment/VehicleValuesTab.svelte`

#### Changed state variable:
```typescript
// Old
let conditionAdjustmentPercentage = $state(data?.condition_adjustment_percentage || 0);

// New
let conditionAdjustmentValue = $state(data?.condition_adjustment_value || 0);
```

#### Added calculated percentages for display:
```typescript
const tradeConditionPercentage = $derived(
    calculateConditionAdjustmentPercentage(tradeValue, conditionAdjustmentValue)
);
const marketConditionPercentage = $derived(
    calculateConditionAdjustmentPercentage(marketValue, conditionAdjustmentValue)
);
const retailConditionPercentage = $derived(
    calculateConditionAdjustmentPercentage(retailValue, conditionAdjustmentValue)
);
```

#### Updated UI:
- Changed input field from "Condition Adjustment %" to "Condition Adjustment Value"
- Added calculated percentage display showing Trade/Market/Retail percentages
- Input accepts actual currency amount (e.g., 12,000)
- System displays calculated percentages (e.g., 5.00%)

---

### **5. Service Layer** ✅
**File**: `src/lib/services/vehicle-values.service.ts`

Updated all references from `condition_adjustment_percentage` to `condition_adjustment_value`:
- `createDefault()` method
- `update()` method
- `calculateVehicleValues()` call

---

## How It Works

### **User Workflow:**

1. **User enters base values:**
   - Trade Value: 240,000
   - Market Value: 256,000
   - Retail Value: 275,000

2. **User enters condition adjustment value:**
   - Condition Adjustment Value: 12,000

3. **System automatically calculates percentages:**
   - Trade: 12,000 / 240,000 × 100 = **5.00%**
   - Market: 12,000 / 256,000 × 100 = **4.69%**
   - Retail: 12,000 / 275,000 × 100 = **4.36%**

4. **System calculates adjusted values:**
   - Trade Adjusted: 240,000 + 12,000 = **252,000**
   - Market Adjusted: 256,000 + 12,000 = **268,000**
   - Retail Adjusted: 275,000 + 12,000 = **287,000**

---

## Calculation Formula

### **Old Formula (Percentage-based):**
```
Adjusted Value = Base Value + (Base Value × Condition Adjustment %)
```

**Example:**
- Base: 240,000
- Percentage: 5%
- Adjusted: 240,000 + (240,000 × 0.05) = 252,000

### **New Formula (Value-based):**
```
Adjusted Value = Base Value + Condition Adjustment Value
Percentage = (Adjustment Value / Base Value) × 100
```

**Example:**
- Base: 240,000
- Adjustment Value: 12,000
- Adjusted: 240,000 + 12,000 = 252,000
- Calculated %: (12,000 / 240,000) × 100 = 5.00%

---

## UI Changes

### **Before:**
```
Condition Adjustment %: [5.00] (input field)
```

### **After:**
```
Condition Adjustment Value: [12000.00] (input field)

Calculated Percentages:
Trade: 5.00% | Market: 4.69% | Retail: 4.36%
```

---

## Benefits

1. **More Intuitive**: Users think in actual amounts, not percentages
2. **Accurate**: Direct amount entry eliminates rounding errors
3. **Transparent**: Shows calculated percentages for all three value types
4. **Flexible**: Different base values result in different percentages automatically

---

## Testing

### **Test Case 1: Basic Calculation**
**Input:**
- Trade Value: 240,000
- Condition Adjustment Value: 12,000

**Expected Output:**
- Trade Adjusted: 252,000
- Calculated %: 5.00%

### **Test Case 2: Different Base Values**
**Input:**
- Trade Value: 240,000
- Market Value: 256,000
- Retail Value: 275,000
- Condition Adjustment Value: 12,000

**Expected Output:**
- Trade Adjusted: 252,000 (5.00%)
- Market Adjusted: 268,000 (4.69%)
- Retail Adjusted: 287,000 (4.36%)

### **Test Case 3: Zero Adjustment**
**Input:**
- Trade Value: 240,000
- Condition Adjustment Value: 0

**Expected Output:**
- Trade Adjusted: 240,000
- Calculated %: 0.00%

### **Test Case 4: With Other Adjustments**
**Input:**
- Trade Value: 240,000
- Valuation Adjustment: 5,000
- Valuation Adjustment %: 2%
- Condition Adjustment Value: 12,000

**Expected Calculation:**
```
Step 1: Base + Valuation Adjustment = 240,000 + 5,000 = 245,000
Step 2: + (Base × Valuation %) = 245,000 + (240,000 × 0.02) = 245,000 + 4,800 = 249,800
Step 3: + Condition Adjustment Value = 249,800 + 12,000 = 261,800
```

**Expected Output:**
- Trade Adjusted: 261,800

---

## Files Modified

1. `supabase/migrations/027_change_condition_adjustment_to_value.sql` (NEW)
2. `src/lib/types/assessment.ts`
3. `src/lib/utils/vehicleValuesCalculations.ts`
4. `src/lib/components/assessment/VehicleValuesTab.svelte`
5. `src/lib/services/vehicle-values.service.ts`

---

## Migration Applied

✅ Migration 027 applied to Supabase database
✅ Column renamed: `condition_adjustment_percentage` → `condition_adjustment_value`
✅ All existing data preserved (values remain the same, just interpreted differently)

---

**Status:** ✅ **COMPLETE**  
**Date:** 2025-01-08  
**Impact:** Medium (Changes calculation logic and UI for condition adjustments)

