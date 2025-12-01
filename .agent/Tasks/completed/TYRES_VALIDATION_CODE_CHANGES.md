# Tyres Tab Validation - Code Changes Reference

**Date**: January 2025  
**Status**: ✅ Complete  

---

## File 1: src/lib/utils/validation.ts

### Change 1.1: validateTyres() Function (lines 79-114)

**Before**:
```typescript
export function validateTyres(tyres: any[]): TabValidation {
  const missingFields: string[] = [];

  if (!tyres || tyres.length === 0) {
    missingFields.push('No tyres added');
    return { tabId: 'tyres', isComplete: false, missingFields };
  }

  tyres.forEach((tyre, index) => {
    const tyreLabel = tyre.position_label || `Tyre ${index + 1}`;
    
    if (!tyre.condition) missingFields.push(`${tyreLabel}: Condition`);
    if (!tyre.tread_depth_mm) missingFields.push(`${tyreLabel}: Tread Depth`);
  });

  return { tabId: 'tyres', isComplete: missingFields.length === 0, missingFields };
}
```

**After**:
```typescript
export function validateTyres(tyres: any[], tyrePhotosMap?: Map<string, any[]>): TabValidation {
  const missingFields: string[] = [];

  if (!tyres || tyres.length === 0) {
    missingFields.push('No tyres added');
    return { tabId: 'tyres', isComplete: false, missingFields };
  }

  tyres.forEach((tyre, index) => {
    const tyreLabel = tyre.position_label || `Tyre ${index + 1}`;
    
    // Photo requirement check
    if (tyrePhotosMap) {
      const photos = tyrePhotosMap.get(tyre.id) || [];
      if (photos.length === 0) {
        missingFields.push(`${tyreLabel}: At least 1 photo required`);
      }
    }
  });

  return { tabId: 'tyres', isComplete: missingFields.length === 0, missingFields };
}
```

**Key Changes**:
- Added optional `tyrePhotosMap?: Map<string, any[]>` parameter
- Removed condition requirement check
- Removed tread depth requirement check
- Added photo requirement check

---

### Change 1.2: validateAssessment() Function (lines 144-182)

**Before**:
```typescript
export function validateAssessment(assessmentData: {
  vehicleIdentification: any;
  exterior360: any;
  interiorMechanical: any;
  interiorPhotos?: any[];
  exterior360Photos?: any[];
  tyres: any[];
  damageRecords: any[];
}): ValidationResult {
  const validations = [
    validateVehicleIdentification(assessmentData.vehicleIdentification),
    validateExterior360(assessmentData.exterior360, assessmentData.exterior360Photos || []),
    validateInteriorMechanical(assessmentData.interiorMechanical, assessmentData.interiorPhotos || []),
    validateTyres(assessmentData.tyres),
    validateDamage(assessmentData.damageRecords)
  ];
  // ...
}
```

**After**:
```typescript
export function validateAssessment(assessmentData: {
  vehicleIdentification: any;
  exterior360: any;
  interiorMechanical: any;
  interiorPhotos?: any[];
  exterior360Photos?: any[];
  tyres: any[];
  tyrePhotos?: any[];
  damageRecords: any[];
}): ValidationResult {
  // Build tyrePhotosMap from tyrePhotos array
  const tyrePhotosMap = new Map<string, any[]>();
  if (assessmentData.tyrePhotos) {
    assessmentData.tyres.forEach(tyre => {
      const photos = assessmentData.tyrePhotos?.filter(p => p.tyre_id === tyre.id) || [];
      tyrePhotosMap.set(tyre.id, photos);
    });
  }

  const validations = [
    validateVehicleIdentification(assessmentData.vehicleIdentification),
    validateExterior360(assessmentData.exterior360, assessmentData.exterior360Photos || []),
    validateInteriorMechanical(assessmentData.interiorMechanical, assessmentData.interiorPhotos || []),
    validateTyres(assessmentData.tyres, tyrePhotosMap),
    validateDamage(assessmentData.damageRecords)
  ];
  // ...
}
```

**Key Changes**:
- Added `tyrePhotos?: any[]` to parameter interface
- Build tyrePhotosMap from tyrePhotos array
- Pass tyrePhotosMap to validateTyres()

---

### Change 1.3: getTabCompletionStatus() Function (lines 309-344)

**Before**:
```typescript
export function getTabCompletionStatus(assessmentData: {
  vehicleIdentification: any;
  exterior360: any;
  interiorMechanical: any;
  interiorPhotos?: any[];
  exterior360Photos?: any[];
  tyres: any[];
  damageRecord: any;
  vehicleValues: any;
  preIncidentEstimate: any;
  estimate: any;
}): TabValidation[] {
  return [
    validateVehicleIdentification(assessmentData.vehicleIdentification),
    validateExterior360(assessmentData.exterior360, assessmentData.exterior360Photos || []),
    validateInteriorMechanical(assessmentData.interiorMechanical, assessmentData.interiorPhotos || []),
    validateTyres(assessmentData.tyres),
    // ...
  ];
}
```

**After**:
```typescript
export function getTabCompletionStatus(assessmentData: {
  vehicleIdentification: any;
  exterior360: any;
  interiorMechanical: any;
  interiorPhotos?: any[];
  exterior360Photos?: any[];
  tyres: any[];
  tyrePhotos?: any[];
  damageRecord: any;
  vehicleValues: any;
  preIncidentEstimate: any;
  estimate: any;
}): TabValidation[] {
  // Build tyrePhotosMap from tyrePhotos array
  const tyrePhotosMap = new Map<string, any[]>();
  if (assessmentData.tyrePhotos) {
    assessmentData.tyres.forEach(tyre => {
      const photos = assessmentData.tyrePhotos?.filter(p => p.tyre_id === tyre.id) || [];
      tyrePhotosMap.set(tyre.id, photos);
    });
  }

  return [
    validateVehicleIdentification(assessmentData.vehicleIdentification),
    validateExterior360(assessmentData.exterior360, assessmentData.exterior360Photos || []),
    validateInteriorMechanical(assessmentData.interiorMechanical, assessmentData.interiorPhotos || []),
    validateTyres(assessmentData.tyres, tyrePhotosMap),
    // ...
  ];
}
```

**Key Changes**:
- Added `tyrePhotos?: any[]` to parameter interface
- Build tyrePhotosMap from tyrePhotos array
- Pass tyrePhotosMap to validateTyres()

---

## File 2: src/lib/components/assessment/TyresTab.svelte

### Change 2.1: Validation Call (lines 56-59)

**Before**:
```typescript
// Validation for warning banner
const validation = $derived.by(() => {
  return validateTyres(tyres);
});
```

**After**:
```typescript
// Validation for warning banner - pass tyrePhotosMap for photo requirement check
const validation = $derived.by(() => {
  return validateTyres(tyres, tyrePhotosMap);
});
```

**Key Changes**:
- Pass tyrePhotosMap parameter to validateTyres()
- Updated comment to explain photo requirement check

---

## File 3: src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts

**Status**: ✅ No changes needed

**Verification**:
- Line 161: `const tyrePhotos = await tyrePhotosService.getPhotosByAssessment(...)`
- Line 176: `tyrePhotos` returned in data object

Already implemented correctly.

---

## Summary of Changes

| File | Changes | Lines | Status |
|------|---------|-------|--------|
| validation.ts | 3 functions updated | ~50 | ✅ Complete |
| TyresTab.svelte | 1 validation call | 1 | ✅ Complete |
| +page.server.ts | Verified | 0 | ✅ Verified |

---

## Testing the Changes

1. Navigate to assessment page
2. Open Tyres tab
3. Try to finalize without photos → See error
4. Add photos to all tyres → Error disappears
5. Leave condition/tread depth empty → No error

---

*Code Changes Date: January 2025*
*Status: Production Ready*

