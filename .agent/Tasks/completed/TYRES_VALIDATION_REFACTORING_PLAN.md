# Tyres Tab Validation Refactoring - Implementation Plan

**Date**: January 2025  
**Status**: ⏳ Ready to Execute  
**Estimated Time**: 1.5-2 hours  
**Complexity**: Medium (validation logic + component updates)  
**Type**: Feature Enhancement

---

## Executive Summary

**Objective**: Change tyres tab validation requirements from condition/tread depth to photo-based validation.

**Current Requirements**:
- ❌ Condition field (required)
- ❌ Tread Depth field (required)

**New Requirements**:
- ✅ At least 1 photo per tyre (required)
- ✅ Condition field (optional)
- ✅ Tread Depth field (optional)

**Benefits**:
- Simpler data entry workflow
- Better visual documentation
- Photo-first approach
- Consistent with other photo requirements (interior, exterior)

---

## Current State

### Validation Logic
**File**: `src/lib/utils/validation.ts` (lines 82-107)

```typescript
export function validateTyres(tyres: any[]): TabValidation {
  const missingFields: string[] = [];
  
  tyres.forEach((tyre, index) => {
    const tyreLabel = tyre.position_label || `Tyre ${index + 1}`;
    
    if (!tyre.condition) missingFields.push(`${tyreLabel}: Condition`);
    if (!tyre.tread_depth_mm) missingFields.push(`${tyreLabel}: Tread Depth`);
  });
  
  return {
    tabId: 'tyres',
    isComplete: missingFields.length === 0,
    missingFields
  };
}
```

### TyresTab Component
**File**: `src/lib/components/assessment/TyresTab.svelte`

- Lines 25-40: Props and state initialization
- Lines 30-40: `tyrePhotosMap` state management
- Lines 42-58: Validation (currently: `validateTyres(tyres)`)

### Photo System
- **Service**: `src/lib/services/tyre-photos.service.ts`
- **Component**: `src/lib/components/assessment/TyrePhotosPanel.svelte`
- **Table**: `assessment_tyre_photos` (tyre_id, assessment_id, photo_url, photo_path, label, display_order)

---

## Implementation Tasks

### Phase 1: Update Validation Functions (30 min)

#### Task 1.1: Update validateTyres() Function
- **File**: `src/lib/utils/validation.ts` (lines 82-107)
- **Changes**:
  1. Add optional `tyrePhotosMap?: Map<string, any[]>` parameter
  2. Remove condition requirement check
  3. Remove tread depth requirement check
  4. Add photo requirement check: `photos.length === 0`
  5. Error message: `"{tyreLabel}: At least 1 photo required"`
- **Backward Compatibility**: Function works with or without tyrePhotosMap

#### Task 1.2: Update validateAssessment() Function
- **File**: `src/lib/utils/validation.ts` (lines 140-165)
- **Changes**:
  1. Add `tyrePhotos?: any[]` to assessmentData parameter
  2. Build `tyrePhotosMap` from tyrePhotos array
  3. Pass `tyrePhotosMap` to `validateTyres()` call
  4. Handle case where tyrePhotos is undefined

#### Task 1.3: Update getTabCompletionStatus() Function
- **File**: `src/lib/utils/validation.ts` (lines 295-312)
- **Changes**:
  1. Add `tyrePhotos?: any[]` to assessmentData parameter
  2. Build `tyrePhotosMap` from tyrePhotos array
  3. Pass `tyrePhotosMap` to `validateTyres()` call

---

### Phase 2: Update TyresTab Component (15 min)

#### Task 2.1: Update Validation Call
- **File**: `src/lib/components/assessment/TyresTab.svelte` (lines 42-58)
- **Changes**:
  1. Update validation call to pass `tyrePhotosMap`
  2. Change from: `validateTyres(tyres)`
  3. Change to: `validateTyres(tyres, tyrePhotosMap)`

---

### Phase 3: Verify Page Server Load (10 min)

#### Task 3.1: Verify tyrePhotos are Loaded
- **File**: `src/routes/(app)/assessments/[id]/+page.server.ts`
- **Action**: Verify `tyrePhotos` are fetched and returned
- **Expected**: `const tyrePhotos = await tyrePhotosService.getPhotosByAssessment(...)`

---

### Phase 4: Testing (45-60 min)

#### Task 4.1: Functional Testing
- [ ] Test 1: Empty tyre (no photos) - verify error
- [ ] Test 2: Partial photos - verify selective errors
- [ ] Test 3: All tyres have photos - verify no errors
- [ ] Test 4: Condition/tread depth optional - verify no errors
- [ ] Test 5: Multiple photos per tyre - verify passes
- [ ] Test 6: Delete last photo - verify error appears
- [ ] Test 7: Additional tyres - verify photo requirement

#### Task 4.2: Edge Case Testing
- [ ] Edge Case 1: No tyres - verify "No tyres added" error
- [ ] Edge Case 2: Backward compatibility - call without tyrePhotosMap
- [ ] Edge Case 3: Finalize tab validation - verify photo requirement

#### Task 4.3: UI Testing
- [ ] Verify error messages display correctly
- [ ] Verify RequiredFieldsWarning component shows photo errors
- [ ] Verify condition/tread depth fields are still editable
- [ ] Verify no "(Required)" indicators on optional fields

---

## Files to Modify

| File | Lines | Changes | Priority |
|------|-------|---------|----------|
| `src/lib/utils/validation.ts` | 82-107 | Update `validateTyres()` | ⭐ CRITICAL |
| `src/lib/utils/validation.ts` | 140-165 | Update `validateAssessment()` | ⭐ CRITICAL |
| `src/lib/utils/validation.ts` | 295-312 | Update `getTabCompletionStatus()` | ⭐ CRITICAL |
| `src/lib/components/assessment/TyresTab.svelte` | 42-58 | Pass `tyrePhotosMap` to validation | ⭐ CRITICAL |
| `src/routes/(app)/assessments/[id]/+page.server.ts` | N/A | Verify tyrePhotos loaded | ✅ Verify |

---

## Success Criteria

1. ✅ Condition field no longer required
2. ✅ Tread depth field no longer required
3. ✅ Each tyre requires at least 1 photo
4. ✅ Error message: "{tyreLabel}: At least 1 photo required"
5. ✅ Validation passes when all tyres have photos
6. ✅ Backward compatible (works without tyrePhotosMap)
7. ✅ All functional tests passing
8. ✅ All edge cases handled
9. ✅ UI displays errors correctly
10. ✅ No regressions in other tabs

---

## Rollback Plan

If issues arise:
1. Revert `validateTyres()` to original logic (condition + tread depth checks)
2. Remove tyrePhotosMap parameter from all calls
3. Revert TyresTab component validation call
4. No database changes needed (backward compatible)

---

## Related Documentation

- `.agent/System/database_schema.md` - Tyres table schema
- `src/lib/services/tyre-photos.service.ts` - Photo service
- `src/lib/components/assessment/TyrePhotosPanel.svelte` - Photo component
- `src/lib/utils/validation.ts` - Validation utilities

---

*Created: January 2025*
*Status: Ready for implementation*

