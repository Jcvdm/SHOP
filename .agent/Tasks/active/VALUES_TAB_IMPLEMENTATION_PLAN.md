# Values Tab Validation - Implementation Plan

**Date**: January 2025  
**Status**: 📋 Ready for implementation  
**Goal**: Add source code and warranty status to required fields validation  

---

## 🎯 Objective

Update the Values tab to require:
1. ✅ At least one vehicle value (Trade, Market, or Retail)
2. ✅ Valuation source (`sourced_from`)
3. ✅ Source code (`sourced_code`) ← **NEW**
4. ✅ Sourced date (`sourced_date`)
5. ✅ Warranty status (`warranty_status`) ← **NEW**
6. ✅ Valuation report PDF (`valuation_pdf_url`)

---

## 📝 Current State

### Form Fields Status
**File**: `src/lib/components/assessment/VehicleValuesTab.svelte`

#### Valuation Source Section (lines 390-429)
```
✅ Sourced From (required) - line 396-404
❌ Source Code (NOT required) - line 405-411  ← NEEDS REQUIRED
✅ Sourced Date (required) - line 414-421
```

#### Warranty Section (lines 431-450)
```
❌ Warranty Status (NOT required) - line 437-450  ← NEEDS REQUIRED
```

---

## 🔧 Implementation Steps

### Step 1: Update Validation Function
**File**: `src/lib/utils/validation.ts` (lines 273-310)

**Add after line 294** (after sourced_from check):
```typescript
// Required: Source code
if (!vehicleValues.sourced_code) {
  missingFields.push('Source code is required');
}
```

**Add after line 304** (after PDF check):
```typescript
// Required: Warranty status
if (!vehicleValues.warranty_status) {
  missingFields.push('Warranty status is required');
}
```

---

### Step 2: Update Validation Call
**File**: `src/lib/components/assessment/VehicleValuesTab.svelte` (lines 324-333)

**Change from**:
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

**Change to**:
```typescript
const validation = $derived.by(() => {
  return validateVehicleValues({
    trade_value: tradeValue,
    market_value: marketValue,
    retail_value: retailValue,
    sourced_from: sourcedFrom,
    sourced_code: sourcedCode,           // ← ADD THIS
    sourced_date: sourcedDate,
    warranty_status: warrantyStatus,     // ← ADD THIS
    valuation_pdf_url: valuationPdfUrl
  });
});
```

---

### Step 3: Add Required Attribute to Form Fields
**File**: `src/lib/components/assessment/VehicleValuesTab.svelte`

#### Source Code Field (line 405-411)
**Add `required` attribute**:
```typescript
<FormField
  name="sourced_code"
  label="Source Code"
  type="text"
  bind:value={sourcedCode}
  placeholder="e.g., 22035630"
  required  // ← ADD THIS
/>
```

#### Warranty Status Field (line 437-450)
**Add `required` attribute**:
```typescript
<FormField
  name="warranty_status"
  label="Status"
  type="select"
  bind:value={warrantyStatus}
  placeholder="Select status..."
  required  // ← ADD THIS
  options={[
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'void', label: 'Void' },
    { value: 'transferred', label: 'Transferred' },
    { value: 'unknown', label: 'Unknown' }
  ]}
/>
```

---

## 📊 Expected Results

### Before Implementation
**Badge shows**: "2" (missing fields)
**Error message**:
```
Please complete the following required fields:
- At least one vehicle value (Trade, Market, or Retail) is required
- Valuation source is required
- Sourced date is required
- Valuation report PDF is required
```

### After Implementation
**Badge shows**: "0" (when all fields filled)
**Error message** (if source code missing):
```
Please complete the following required fields:
- Source code is required
```

**Error message** (if warranty status missing):
```
Please complete the following required fields:
- Warranty status is required
```

---

## 🧪 Testing Checklist

- [ ] Badge shows correct count when fields missing
- [ ] Badge shows "0" when all required fields filled
- [ ] Source code field shows as required (red asterisk)
- [ ] Warranty status field shows as required (red asterisk)
- [ ] Error message includes "Source code is required"
- [ ] Error message includes "Warranty status is required"
- [ ] No data loss on tab switch
- [ ] Auto-save works correctly
- [ ] Form validation updates in real-time

---

## 📁 Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/lib/utils/validation.ts` | 273-310 | Add 2 validation checks |
| `src/lib/components/assessment/VehicleValuesTab.svelte` | 324-333 | Add 2 fields to validation call |
| `src/lib/components/assessment/VehicleValuesTab.svelte` | 405-411 | Add `required` to source code |
| `src/lib/components/assessment/VehicleValuesTab.svelte` | 437-450 | Add `required` to warranty status |

**Total**: 4 edits across 2 files

---

## ✅ Verification

After implementation:
1. ✅ Validation function checks all 6 required fields
2. ✅ Component passes all 6 fields to validation
3. ✅ Form fields marked as required (UI)
4. ✅ Badge updates correctly
5. ✅ Error messages display correctly
6. ✅ No breaking changes
7. ✅ Backward compatible

---

## 🚀 Ready for Implementation

All context gathered. Code references prepared. Ready to implement.

**Next Steps**:
1. Implement changes in validation.ts
2. Update validation call in VehicleValuesTab.svelte
3. Add required attributes to form fields
4. Test validation behavior
5. Verify badge updates correctly

---

*Implementation plan complete. Ready to code.*

