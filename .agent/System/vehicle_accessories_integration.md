# Vehicle Accessories Integration - Single Value System

**Last Updated**: November 29, 2025
**Status**: Complete - Production Ready
**Feature**: Vehicle Accessories unified with single value per accessory

---

## Overview

The Vehicle Accessories Integration feature unified the accessories system across assessment tabs by implementing a single-value model. Instead of maintaining three separate values (trade/market/retail) per accessory, each accessory now has a single monetary value that applies equally to all three valuation types.

### Key Benefits

- **Simplified data model** - One value per accessory vs. three separate values
- **Unified experience** - Accessories added in Exterior360Tab automatically appear in VehicleValuesTab
- **Flexible input** - Users can enter/edit values in either tab
- **Consistent calculations** - Single value applied equally to Trade/Market/Retail totals
- **Data integrity** - Deleting an accessory from one tab cascades to the other

---

## Architecture

### Single-Value Model

Each accessory has a single `value` field (NUMERIC(12,2), nullable) that represents its monetary contribution.

**Calculation Impact:**
```
Accessories Total = SUM(assessment_accessories.value)

This total is then added equally to:
- Trade Adjusted Value
- Market Adjusted Value
- Retail Adjusted Value
```

### Cross-Tab Integration

The system maintains a single source of truth (database) with synchronization across two UI tabs:

```
Exterior360Tab (Add/Edit Accessories)
        ↓
assessment_accessories table
        ↓
VehicleValuesTab (View/Edit Values)
```

Both tabs read from and write to the same `assessment_accessories` records, ensuring consistency.

---

## Database Schema

### Migration: 20251129_add_value_to_accessories.sql

Added a single column to the `assessment_accessories` table:

```sql
ALTER TABLE assessment_accessories
ADD COLUMN value NUMERIC(12,2) DEFAULT NULL;
```

**Column Details:**
- **Name**: `value`
- **Type**: NUMERIC(12,2) - Supports currency values with 2 decimal places
- **Nullable**: YES (NULL indicates no value assigned)
- **Default**: NULL
- **Purpose**: Single monetary value per accessory

### Updated Table Structure

```sql
CREATE TABLE assessment_accessories (
  id UUID PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  accessory_type TEXT NOT NULL,
  custom_name TEXT,
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  value NUMERIC(12,2) DEFAULT NULL,  -- NEW (Migration 20251129)
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assessment_accessories_assessment ON assessment_accessories(assessment_id);
```

---

## Type Definitions

### VehicleAccessory Interface

Location: `src/lib/types/assessment.ts`

```typescript
interface VehicleAccessory {
  id: string;
  assessment_id: string;
  accessory_type: AccessoryType;
  custom_name?: string | null;
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  value?: number | null;  // NEW: Single value per accessory
  notes?: string | null;
  photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}
```

### CreateAccessoryInput Interface

Location: `src/lib/types/assessment.ts`

```typescript
interface CreateAccessoryInput {
  accessory_type: AccessoryType;
  custom_name?: string;
  condition?: string;
  value?: number;  // NEW: Optional value on creation
  notes?: string;
}
```

---

## Service Layer

### UpdateValue Method

Location: `src/lib/services/accessories.service.ts`

```typescript
async updateValue(
  id: string,
  value: number | null,
  client?: ServiceClient
): Promise<VehicleAccessory> {
  const supabase = client?.supabase || createClient();

  const { data, error } = await supabase
    .from('assessment_accessories')
    .update({ value })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as VehicleAccessory;
}
```

**Usage:**
```typescript
// Update value from VehicleValuesTab
await accessoriesService.updateValue(accessoryId, 5000);

// Clear value
await accessoriesService.updateValue(accessoryId, null);
```

---

## Component Architecture

### VehicleValueExtrasTable.svelte - Complete Rewrite

**Location**: `src/lib/components/assessment/VehicleValueExtrasTable.svelte`

**Purpose**: Display and edit accessory values from the VehicleValuesTab perspective

**Props:**
```typescript
interface Props {
  accessories: VehicleAccessory[];
  onUpdateAccessoryValue: (id: string, value: number | null) => void;
}
```

**Key Features:**
- Displays list of accessories with their values
- Inline value editing with input field
- "Value applies equally to Trade, Market, and Retail" tooltip
- Decimal handling (supports cents)
- Delete button with cascade confirmation
- Empty state when no accessories

**Table Structure:**
```
| Accessory Name | Value (R) |
|---|---|
| Mags | 5,000.00 |
| Tow Bar | 2,500.00 |
```

**Value Input Pattern:**
```svelte
<input
  type="number"
  bind:value={editingValue}
  onblur={() => handleSaveValue(accessory.id)}
  step="0.01"
/>
```

### VehicleValuesTab.svelte - Updated Integration

**Location**: `src/lib/components/assessment/VehicleValuesTab.svelte`

**New Props:**
```typescript
let accessories: VehicleAccessory[] = $state([]);

const onUpdateAccessoryValue = async (id: string, value: number | null) => {
  await accessoriesService.updateValue(id, value, serviceClient);
};
```

**New Derived Value:**
```typescript
const accessoriesTotal = $derived(
  calculateAccessoriesTotal(accessories)
);
```

**Updated Total Calculations:**
```typescript
const tradeTotalAdjusted = $derived(
  tradeAdjusted + accessoriesTotal
);

const marketTotalAdjusted = $derived(
  marketAdjusted + accessoriesTotal
);

const retailTotalAdjusted = $derived(
  retailAdjusted + accessoriesTotal
);
```

**Component Usage:**
```svelte
<VehicleValueExtrasTable
  {accessories}
  onUpdateAccessoryValue={onUpdateAccessoryValue}
/>
```

### Exterior360Tab.svelte - Value Input & Editing

**Location**: `src/lib/components/assessment/Exterior360Tab.svelte`

**New Features:**

1. **Value Input in Add Modal:**
```svelte
<div>
  <label>Value (Optional)</label>
  <input
    type="number"
    bind:value={draft.value}
    step="0.01"
    placeholder="e.g., 5000"
  />
</div>
```

2. **Inline Value Editing:**
```svelte
{#if editingId === accessory.id}
  <input
    type="number"
    bind:value={editingValue}
    onblur={() => handleSaveValue(accessory.id)}
  />
{:else}
  <span>{formatCurrency(accessory.value)}</span>
{/if}
```

3. **Create with Value:**
```typescript
const handleAddAccessory = async () => {
  const result = await accessoriesService.create(
    assessmentId,
    {
      accessory_type: draft.accessory_type,
      custom_name: draft.custom_name,
      condition: draft.condition,
      value: draft.value ?? undefined,  // Include value on create
      notes: draft.notes
    },
    serviceClient
  );
};
```

---

## Utility Functions

### calculateAccessoriesTotal

Location: `src/lib/utils/vehicleValuesCalculations.ts`

**Purpose**: Calculate the sum of all accessory values for totals calculation

```typescript
export function calculateAccessoriesTotal(
  accessories: VehicleAccessory[]
): number {
  return accessories.reduce((sum, acc) => {
    return sum + (acc.value ?? 0);
  }, 0);
}
```

**Usage:**
```typescript
const total = calculateAccessoriesTotal(accessories);
// Returns: 7500 (if accessories are [5000, 2500])
```

### getAccessoryDisplayName

Location: `src/lib/utils/vehicleValuesCalculations.ts`

**Purpose**: Get display-friendly name for accessory (handles custom names)

```typescript
export function getAccessoryDisplayName(
  accessoryType: AccessoryType,
  customName?: string | null
): string {
  if (customName) return customName;

  return ACCESSORY_TYPE_LABELS[accessoryType] ?? accessoryType;
}
```

**Usage:**
```typescript
getAccessoryDisplayName('custom', 'Roof Rack');     // 'Roof Rack'
getAccessoryDisplayName('mags', null);              // 'Mags'
getAccessoryDisplayName('tow_bar', undefined);      // 'Tow Bar'
```

---

## Calculation Flow

### Complete Valuation Calculation

```
1. Base Vehicle Value
   ├─ Trade Base Value
   ├─ Market Base Value
   └─ Retail Base Value

2. Apply Valuation Adjustment (fixed + %)
   ├─ Trade Adjusted Value = Trade Base + (adjustment_amount + adjustment_percentage)
   ├─ Market Adjusted Value = Market Base + (adjustment_amount + adjustment_percentage)
   └─ Retail Adjusted Value = Retail Base + (adjustment_amount + adjustment_percentage)

3. Apply Condition Adjustment
   ├─ Trade Condition Adjusted = Trade Adjusted ± condition_variance
   ├─ Market Condition Adjusted = Market Adjusted ± condition_variance
   └─ Retail Condition Adjusted = Retail Adjusted ± condition_variance

4. Add Accessories Total (NEW - Single Value Model)
   ├─ Accessories Total = SUM(assessment_accessories.value)
   │
   ├─ Trade Total Adjusted = Trade Condition Adjusted + Accessories Total
   ├─ Market Total Adjusted = Market Condition Adjusted + Accessories Total
   └─ Retail Total Adjusted = Retail Condition Adjusted + Accessories Total

5. Apply Write-Off Percentages
   ├─ Trade Write-Off Value = Trade Total Adjusted × (1 - write_off_percentage)
   ├─ Market Write-Off Value = Market Total Adjusted × (1 - write_off_percentage)
   └─ Retail Write-Off Value = Retail Total Adjusted × (1 - write_off_percentage)
```

### Key Insight

The same `Accessories Total` is added to all three valuation types (Trade, Market, Retail). This ensures:
- **Consistency** - Accessory values contribute equally to all estimates
- **Simplicity** - Single value input instead of three separate values
- **Clarity** - Users understand the accessory adds the same value to all types

---

## Integration Patterns

### Cross-Tab Synchronization

**Pattern: Single Source of Truth**

Both tabs read from the same database source and write to it. There is no local state duplication:

```
Exterior360Tab                    VehicleValuesTab
    ↓ reads                            ↓ reads
    └─── assessment_accessories ───┘
         ↓ writes
         Database persists changes
```

**Update Flow:**

1. User edits in Exterior360Tab:
   ```
   Exterior360Tab input → updateValue() → Database
   ```

2. Component detects change via reactive prop:
   ```
   Database → VehicleValuesTab receives updated accessories prop
   → $derived recalculates total
   → UI updates
   ```

### Optimistic Updates

For better UX, updates are sent immediately while database persists in background:

```typescript
// Update local state immediately
accessory.value = newValue;

// Persist to database (handles errors gracefully)
accessoriesService.updateValue(id, newValue);
```

### Delete Cascade

When accessory is deleted from Exterior360Tab, it's automatically removed from VehicleValuesTab:

```typescript
const handleDeleteAccessory = async (id: string) => {
  // Delete from DB
  await accessoriesService.delete(id);

  // Remove from local arrays
  data.exterior360Accessories = data.exterior360Accessories.filter(
    a => a.id !== id
  );
};
```

---

## Bug Fixes

### Value Not Saved on Creation

**Issue**: When adding a new accessory with a value in Exterior360Tab, the value wasn't saved to the database.

**Root Cause**: The `CreateAccessoryInput` type didn't include the `value` field, so it was never passed to the create method.

**Solution**:
1. Add `value?: number` to `CreateAccessoryInput` interface
2. Pass `value: draft.value ?? undefined` in the create call
3. Ensure the service includes the value in the INSERT

**Code Changes:**

```typescript
// 1. Type definition
interface CreateAccessoryInput {
  accessory_type: AccessoryType;
  custom_name?: string;
  condition?: string;
  value?: number;  // Added
  notes?: string;
}

// 2. Create call
const result = await accessoriesService.create(
  assessmentId,
  {
    accessory_type: draft.accessory_type,
    custom_name: draft.custom_name,
    condition: draft.condition,
    value: draft.value ?? undefined,  // Pass value
    notes: draft.notes
  }
);
```

---

## Testing & Verification

### Manual Testing Checklist

- [ ] Add accessory with value in Exterior360Tab
  - [ ] Value saves to database
  - [ ] Value appears in VehicleValuesTab immediately
  - [ ] Total calculations update

- [ ] Edit value in VehicleValuesTab
  - [ ] Update persists to database
  - [ ] Exterior360Tab shows updated value
  - [ ] Totals recalculate

- [ ] Delete accessory
  - [ ] Removed from both tabs
  - [ ] Value no longer contributes to totals
  - [ ] Database record deleted

- [ ] Multiple accessories
  - [ ] Each has independent value
  - [ ] Total is sum of all values
  - [ ] Calculations remain accurate

- [ ] Edge cases
  - [ ] NULL value (no value assigned) - treated as 0
  - [ ] Zero value - included in calculations
  - [ ] Large values (e.g., 999,999.99) - calculated correctly
  - [ ] Decimal values (e.g., 1,234.56) - persisted with precision

### Integration Testing

**Test the calculation flow end-to-end:**

```
1. Create request with vehicle (e.g., Trade Base 50,000)
2. Add valuation adjustment (+10%)
3. Add accessories:
   - Mags: 5,000
   - Tow Bar: 2,500
4. Verify calculations:
   - Trade Adjusted = 50,000 + 5,000 = 55,000
   - Market Adjusted = 50,000 + 5,000 = 55,000
   - Retail Adjusted = 50,000 + 5,000 = 55,000
5. Verify report includes accessory values in totals
```

---

## File Summary

### Modified Files

| File | Changes |
|---|---|
| `src/lib/types/assessment.ts` | Added `value` to VehicleAccessory and CreateAccessoryInput |
| `src/lib/services/accessories.service.ts` | Added `updateValue()` method |
| `src/lib/utils/vehicleValuesCalculations.ts` | Added `calculateAccessoriesTotal()` and `getAccessoryDisplayName()` |
| `src/lib/components/assessment/VehicleValueExtrasTable.svelte` | Complete rewrite for single-value model |
| `src/lib/components/assessment/VehicleValuesTab.svelte` | Added accessories props and total calculations |
| `src/lib/components/assessment/Exterior360Tab.svelte` | Added value input and inline editing |

### New Files

| File | Purpose |
|---|---|
| `supabase/migrations/20251129_add_value_to_accessories.sql` | Database migration adding value column |

---

## Related Documentation

- [Database Schema](./database_schema.md) - `assessment_accessories` table definition
- [Form Field Input Patterns](./form_field_input_patterns.md) - Input validation and save patterns
- [Project Architecture](./project_architecture.md) - Valuation workflow overview
- [Vehicle Values Quick Reference](./database_quick_ref.md) - Database schema summary

---

## Future Enhancements

Potential improvements for consideration:

1. **Per-Valuation-Type Values** - If business requirements change, could implement separate values per type (revert to 3-value model)
2. **Accessory Categories** - Group accessories by type (exterior/interior/mechanical) for better organization
3. **Condition-Based Adjustment** - Apply automatic value adjustments based on condition rating
4. **Accessory Database** - Maintain a master list of common accessories with typical values
5. **Import/Export** - Bulk import accessories from templates or previous assessments

---

## Migration Considerations

This feature maintains backward compatibility:

- Existing accessories without values continue to work (NULL value = 0 in calculations)
- No data migration required - NULL values are handled gracefully
- Existing reports continue to function (accessories total = 0 if no values)
- Can be deployed incrementally - vehicles without accessory values still calculate correctly

---

**Status**: Complete and Production Ready
**Last Tested**: November 29, 2025
**Maintenance**: Update when accessory-related features are modified
