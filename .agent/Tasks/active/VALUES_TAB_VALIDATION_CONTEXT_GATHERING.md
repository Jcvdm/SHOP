# Values Tab Validation - Context Gathering

**Date**: January 2025  
**Status**: 📋 Context gathering complete  
**Goal**: Update Values tab validation to require: source code, warranty status, and vehicle values  

---

## 📊 Current State

### Current Validation Requirements
**File**: `src/lib/utils/validation.ts` (lines 273-310)

Currently validates:
1. ✅ At least one vehicle value (Trade, Market, or Retail)
2. ✅ Valuation source (`sourced_from`)
3. ✅ Sourced date (`sourced_date`)
4. ✅ Valuation report PDF (`valuation_pdf_url`)

**Missing from validation**:
- ❌ Source code (`sourced_code`)
- ❌ Warranty status (`warranty_status`)

---

## 🗂️ Component Structure

### VehicleValuesTab Component
**File**: `src/lib/components/assessment/VehicleValuesTab.svelte`

**Props**:
```typescript
interface Props {
  data: VehicleValues | null;
  assessmentId: string;
  client: Client | null;
  requestInfo?: {
    request_number?: string;
    claim_number?: string | null;
    date_of_loss?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    vehicle_year?: number | null;
    vehicle_vin?: string | null;
    vehicle_mileage?: number | null;
  };
  onUpdate: (data: Partial<VehicleValues>) => void;
}
```

**Current State Variables** (lines 59-113):
- `sourcedFrom` - Valuation source (text)
- `sourcedCode` - Source code (text) ← **NEEDS VALIDATION**
- `sourcedDate` - Sourced date (date)
- `warrantyStatus` - Warranty status (enum) ← **NEEDS VALIDATION**
- `warrantyPeriodYears` - Warranty period (number)
- `warrantyStartDate` - Warranty start (date)
- `warrantyEndDate` - Warranty end (date)
- `warrantyExpiryMileage` - Warranty mileage (text)
- `serviceHistoryStatus` - Service history (enum)
- `warrantyNotes` - Warranty notes (text)
- `tradeValue`, `marketValue`, `retailValue` - Base values
- `valuationPdfUrl`, `valuationPdfPath` - PDF upload

---

## 📋 Data Types

### VehicleValues Interface
**File**: `src/lib/types/assessment.ts` (lines 616-687)

```typescript
export interface VehicleValues {
  id: string;
  assessment_id: string;
  
  // Source information
  sourced_from?: string | null;
  sourced_code?: string | null;        // ← NEEDS VALIDATION
  sourced_date?: string | null;
  
  // Warranty / Service Details
  warranty_status?: WarrantyStatus | null;  // ← NEEDS VALIDATION
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

### Warranty Status Type
**File**: `src/lib/types/assessment.ts` (lines 607-614)

```typescript
export type WarrantyStatus = 'active' | 'expired' | 'void' | 'transferred' | 'unknown';

export type ServiceHistoryStatus =
  | 'checked'
  | 'not_checked'
  | 'incomplete'
  | 'up_to_date'
  | 'overdue'
  | 'unknown';
```

---

## 🔄 Data Flow

### Page Server Load
**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts` (lines 98-190)

Loads vehicle values:
```typescript
vehicleValues = await vehicleValuesService.getByAssessment(assessment.id, locals.supabase)
```

Returns to page component with:
- `data.vehicleValues` - VehicleValues record
- `data.request` - Request info (vehicle details)
- `data.client` - Client info (write-off percentages)

### Page Component
**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte` (lines 798-812)

Passes to VehicleValuesTab:
```typescript
<VehicleValuesTab
  data={data.vehicleValues}
  assessmentId={data.assessment.id}
  client={data.client}
  requestInfo={{
    request_number: data.request?.request_number,
    claim_number: data.request?.claim_number,
    date_of_loss: data.request?.date_of_loss,
    vehicle_make: data.request?.vehicle_make,
    vehicle_model: data.request?.vehicle_model,
    vehicle_year: data.request?.vehicle_year,
    vehicle_vin: data.request?.vehicle_vin,
    vehicle_mileage: data.request?.vehicle_mileage
  }}
  onUpdate={handleUpdateVehicleValues}
/>
```

---

## 🎯 Required Changes

### 1. Update Validation Logic
**File**: `src/lib/utils/validation.ts`

Add validation for:
- ✅ `sourced_code` - Source code required
- ✅ `warranty_status` - Warranty status required

### 2. Update Component Display
**File**: `src/lib/components/assessment/VehicleValuesTab.svelte`

Ensure fields are visible and marked as required:
- Source Code field (already exists, line 61)
- Warranty Status field (already exists, line 65)

### 3. Update Validation Call
**File**: `src/lib/components/assessment/VehicleValuesTab.svelte` (lines 324-333)

Currently validates:
```typescript
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

Needs to add:
- `sourced_code: sourcedCode`
- `warranty_status: warrantyStatus`

---

## 📝 New Required Fields Message

**Current**:
```
Please complete the following required fields:
- At least one vehicle value (Trade, Market, or Retail) is required
- Valuation source is required
- Sourced date is required
- Valuation report PDF is required
```

**Updated**:
```
Please complete the following required fields:
- At least one vehicle value (Trade, Market, or Retail) is required
- Valuation source is required
- Source code is required
- Sourced date is required
- Warranty status is required
- Valuation report PDF is required
```

---

## 🔗 Related Files

1. `src/lib/utils/validation.ts` - Validation logic
2. `src/lib/components/assessment/VehicleValuesTab.svelte` - Component
3. `src/lib/types/assessment.ts` - Type definitions
4. `src/lib/services/vehicle-values.service.ts` - Service layer
5. `supabase/migrations/028_add_warranty_service_details.sql` - Database schema

---

## ✅ Implementation Checklist

- [ ] Update `validateVehicleValues()` to check `sourced_code`
- [ ] Update `validateVehicleValues()` to check `warranty_status`
- [ ] Update validation call in VehicleValuesTab to pass new fields
- [ ] Verify form fields are marked as required (UI)
- [ ] Test validation badge updates correctly
- [ ] Test error messages display correctly
- [ ] Verify no data loss on tab switch

---

*Context gathering complete. Ready for implementation.*

