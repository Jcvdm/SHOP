# Values Tab - Code Reference

**Purpose**: Complete code reference for Values tab validation update  
**Status**: 📖 Reference document  

---

## 1️⃣ Validation Function

**File**: `src/lib/utils/validation.ts` (lines 273-310)

### Current Code
```typescript
export function validateVehicleValues(vehicleValues: any): TabValidation {
  const missingFields: string[] = [];

  if (!vehicleValues) {
    missingFields.push('Vehicle values data not found');
    return {
      tabId: 'values',
      isComplete: false,
      missingFields
    };
  }

  // Required: At least one value type must be entered
  if (!vehicleValues.trade_value && !vehicleValues.market_value && !vehicleValues.retail_value) {
    missingFields.push('At least one vehicle value (Trade, Market, or Retail) is required');
  }

  // Required: Valuation source
  if (!vehicleValues.sourced_from) {
    missingFields.push('Valuation source is required');
  }

  // Required: Sourced date
  if (!vehicleValues.sourced_date) {
    missingFields.push('Sourced date is required');
  }

  // Required: PDF proof
  if (!vehicleValues.valuation_pdf_url) {
    missingFields.push('Valuation report PDF is required');
  }

  return {
    tabId: 'values',
    isComplete: missingFields.length === 0,
    missingFields
  };
}
```

### What Needs to Change
Add two new validation checks:
1. Check `sourced_code` is not empty
2. Check `warranty_status` is not empty

---

## 2️⃣ Component Validation Call

**File**: `src/lib/components/assessment/VehicleValuesTab.svelte` (lines 324-333)

### Current Code
```typescript
// Validation for warning banner
const validation = $derived.by(() => {
  return validateVehicleValues({
    trade_value: tradeValue,
    market_value: marketValue,
    retail_value: retailValue,
    sourced_from: sourcedFrom,
    sourced_date: sourcedDate,
    valuation_pdf_url: valuationPdfUrl
  });
});
```

### What Needs to Change
Add two new fields to the validation object:
- `sourced_code: sourcedCode`
- `warranty_status: warrantyStatus`

---

## 3️⃣ State Variables

**File**: `src/lib/components/assessment/VehicleValuesTab.svelte` (lines 59-73)

### Current Code
```typescript
// Source information
let sourcedFrom = $state(data?.sourced_from || '');
let sourcedCode = $state(data?.sourced_code || '');  // ← Already exists
let sourcedDate = $state(data?.sourced_date || '');

// Warranty / Service Details
let warrantyStatus = $state<WarrantyStatus | ''>(data?.warranty_status || '');  // ← Already exists
let warrantyPeriodYears = $state(data?.warranty_period_years || null);
let warrantyStartDate = $state(data?.warranty_start_date || '');
let warrantyEndDate = $state(data?.warranty_end_date || '');
let warrantyExpiryMileage = $state(data?.warranty_expiry_mileage || '');
let serviceHistoryStatus = $state<ServiceHistoryStatus | ''>(
  data?.service_history_status || ''
);
let warrantyNotes = $state(data?.warranty_notes || '');
```

**Status**: ✅ Both state variables already exist!

---

## 4️⃣ Form Fields in Component

**File**: `src/lib/components/assessment/VehicleValuesTab.svelte`

### Source Code Field
Located around line 400-420 (in Valuation Source section)

```typescript
<FormField
  name="sourced_code"
  label="Source Code"
  type="text"
  value={sourcedCode}
  oninput={(e: Event) => {
    sourcedCode = (e.target as HTMLInputElement).value;
    debouncedSave();
  }}
  placeholder="e.g., NADA, KBB, Local Market"
  required  // ← Check if this is set
/>
```

### Warranty Status Field
Located around line 450-480 (in Warranty section)

```typescript
<FormField
  name="warranty_status"
  label="Warranty Status"
  type="select"
  value={warrantyStatus}
  onchange={(value: string) => {
    warrantyStatus = value as WarrantyStatus;
    debouncedSave();
  }}
  options={[
    { value: '', label: 'Select warranty status' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'void', label: 'Void' },
    { value: 'transferred', label: 'Transferred' },
    { value: 'unknown', label: 'Unknown' }
  ]}
  required  // ← Check if this is set
/>
```

---

## 5️⃣ Type Definitions

**File**: `src/lib/types/assessment.ts`

### WarrantyStatus Type (line 607)
```typescript
export type WarrantyStatus = 'active' | 'expired' | 'void' | 'transferred' | 'unknown';
```

### VehicleValues Interface (lines 616-687)
```typescript
export interface VehicleValues {
  id: string;
  assessment_id: string;

  // Source information
  sourced_from?: string | null;
  sourced_code?: string | null;        // ← Source code field
  sourced_date?: string | null;

  // Warranty / Service Details
  warranty_status?: WarrantyStatus | null;  // ← Warranty status field
  warranty_period_years?: number | null;
  warranty_start_date?: string | null;
  warranty_end_date?: string | null;
  warranty_expiry_mileage?: string | null;
  service_history_status?: ServiceHistoryStatus | null;
  warranty_notes?: string | null;

  // Base values
  trade_value?: number | null;
  market_value?: number | null;
  retail_value?: number | null;
  
  // ... other fields
}
```

---

## 6️⃣ Database Schema

**File**: `supabase/migrations/028_add_warranty_service_details.sql`

```sql
ALTER TABLE assessment_vehicle_values
  ADD COLUMN warranty_status TEXT CHECK (warranty_status IN ('active', 'expired', 'void', 'transferred', 'unknown')),
  ADD COLUMN warranty_period_years INTEGER,
  ADD COLUMN warranty_start_date DATE,
  ADD COLUMN warranty_end_date DATE,
  ADD COLUMN warranty_expiry_mileage TEXT,
  ADD COLUMN service_history_status TEXT CHECK (service_history_status IN ('checked', 'not_checked', 'incomplete', 'up_to_date', 'overdue', 'unknown')),
  ADD COLUMN warranty_notes TEXT;
```

---

## 7️⃣ Service Layer

**File**: `src/lib/services/vehicle-values.service.ts`

### Get by Assessment (line 16)
```typescript
async getByAssessment(assessmentId: string, client?: ServiceClient): Promise<VehicleValues | null> {
  const db = client ?? supabase;
  const { data, error } = await db
    .from('assessment_vehicle_values')
    .select('*')
    .eq('assessment_id', assessmentId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching vehicle values:', error);
    return null;
  }

  return data;
}
```

### Update (line 126)
```typescript
async update(
  id: string,
  input: UpdateVehicleValuesInput,
  writeOffPercentages: WriteOffPercentages,
  client?: ServiceClient
): Promise<VehicleValues> {
  // ... implementation
}
```

---

## 📊 Summary of Changes Needed

| File | Lines | Change |
|------|-------|--------|
| `validation.ts` | 273-310 | Add 2 validation checks |
| `VehicleValuesTab.svelte` | 324-333 | Add 2 fields to validation call |
| Form fields | ~400-480 | Verify `required` attribute set |

**Total Changes**: 3 files, ~10 lines of code

---

*Reference complete. Ready for implementation.*

