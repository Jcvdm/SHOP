# ServiceClient Pattern Fix Inventory
**Date**: November 10, 2025  
**Status**: CONTEXT GATHERING COMPLETE  
**Priority**: CRITICAL - RLS Policy Violations

---

## 🎯 Executive Summary

**10 services** need to be updated to follow the ServiceClient injection pattern. This prevents RLS policy violations (Error 42501) and ensures proper authentication.

**Pattern**: `async method(params, client?: ServiceClient): Promise<Result>` with `const db = client ?? supabase;`

---

## 📋 SERVICES REQUIRING FIXES

### TIER 1: CRITICAL (Blocking Errors)

#### 1. `src/lib/services/tyre-photos.service.ts` (168 lines)
**Status**: 🔴 BLOCKING - Non-existent BaseService import
**Issue**: Extends non-existent `BaseService` class, uses `this.getClient()`
**Methods to fix**: 
- `getPhotosByTyre(tyreId, client?)` - Line 14
- `getPhotosByAssessment(assessmentId, client?)` - Line 30
- `createPhoto(input, client?)` - Line 50
- `updatePhoto(photoId, input, client?)` - Line 72
- `updatePhotoLabel(photoId, label, client?)` - Line 95
- `deletePhoto(photoId, client?)` - Line 108
- `reorderPhotos(assessmentId, photoIds, client?)` - Line 121
- `getNextDisplayOrder(assessmentId, client?)` - Line 143

**Fix**: Remove BaseService, add `import { supabase }`, change `const supabase = client || this.getClient();` to `const db = client ?? supabase;`

---

### TIER 2: HIGH PRIORITY (RLS Risks)

#### 2. `src/lib/services/vehicle-identification.service.ts` (119 lines)
**Status**: ⚠️ Missing client parameter on ALL methods
**Methods**: create, getByAssessment, update, upsert
**Call sites**:
- ✅ `+page.server.ts:115` - Already passing `locals.supabase`
- ❌ `+page.svelte:154` - NOT passing client (upsert call)

#### 3. `src/lib/services/exterior-360.service.ts` (112 lines)
**Status**: ⚠️ Missing client parameter on ALL methods
**Methods**: create, getByAssessment, update, upsert
**Call sites**:
- ✅ `+page.server.ts:116` - Already passing `locals.supabase`
- ❌ `+page.svelte:165` - NOT passing client (upsert call)

#### 4. `src/lib/services/interior-mechanical.service.ts` (119 lines)
**Status**: ⚠️ Missing client parameter on ALL methods
**Methods**: create, getByAssessment, update, upsert
**Call sites**:
- ✅ `+page.server.ts:118` - Already passing `locals.supabase`
- ❌ `+page.svelte:208` - NOT passing client (upsert call)

---

### TIER 3: PHOTO SERVICES (RLS Risks)

#### 5. `src/lib/services/interior-photos.service.ts` (147 lines)
**Status**: ⚠️ Missing client parameter on ALL methods
**Methods**: getPhotosByAssessment, createPhoto, updatePhoto, updatePhotoLabel, deletePhoto, reorderPhotos, getNextDisplayOrder
**Call sites**:
- ❌ `+page.server.ts:155` - NOT passing client
- ❌ `InteriorPhotosPanel.svelte:103` - createPhoto (no client)
- ❌ `InteriorPhotosPanel.svelte:125` - updatePhotoLabel (no client)
- ❌ `InteriorPhotosPanel.svelte:144` - deletePhoto (no client)
- ❌ `InteriorMechanicalTab.svelte:219` - getPhotosByAssessment (no client)

#### 6. `src/lib/services/exterior-360-photos.service.ts` (145 lines)
**Status**: ⚠️ Missing client parameter on ALL methods
**Methods**: getPhotosByAssessment, createPhoto, updatePhoto, updatePhotoLabel, deletePhoto, reorderPhotos, getNextDisplayOrder
**Call sites**:
- ❌ `+page.server.ts:158` - NOT passing client
- ❌ `Exterior360PhotosPanel.svelte:103` - createPhoto (no client)
- ❌ `Exterior360PhotosPanel.svelte:125` - updatePhotoLabel (no client)
- ❌ `Exterior360PhotosPanel.svelte:142` - deletePhoto (no client)

#### 7. `src/lib/services/estimate-photos.service.ts` (145 lines)
**Status**: ⚠️ Missing client parameter on ALL methods
**Methods**: getPhotosByEstimate, createPhoto, updatePhoto, updatePhotoLabel, deletePhoto, reorderPhotos, getNextDisplayOrder
**Call sites**:
- ✅ `+page.server.ts:146` - Already passing `locals.supabase`
- ❌ `+page.svelte:830` - getPhotosByEstimate (no client)
- ❌ `EstimatePhotosPanel.svelte:103` - getNextDisplayOrder (no client)
- ❌ `EstimatePhotosPanel.svelte:106` - createPhoto (no client)
- ❌ `EstimatePhotosPanel.svelte:125` - updatePhotoLabel (no client)
- ❌ `EstimatePhotosPanel.svelte:144` - deletePhoto (no client)

#### 8. `src/lib/services/pre-incident-estimate-photos.service.ts` (151 lines)
**Status**: ⚠️ Missing client parameter on ALL methods
**Methods**: getPhotosByEstimate, createPhoto, updatePhoto, updatePhotoLabel, deletePhoto, reorderPhotos, getNextDisplayOrder
**Call sites**:
- ✅ `+page.server.ts:151` - Already passing `locals.supabase`
- ❌ `PreIncidentPhotosPanel.svelte:103` - getNextDisplayOrder (no client)
- ❌ `PreIncidentPhotosPanel.svelte:106` - createPhoto (no client)
- ❌ `PreIncidentPhotosPanel.svelte:125` - updatePhotoLabel (no client)
- ❌ `PreIncidentPhotosPanel.svelte:144` - deletePhoto (no client)

#### 9. `src/lib/services/damage-photos.service.ts` (156 lines)
**Status**: ⚠️ Missing client parameter on ALL methods
**Methods**: getPhotosByAssessment, createPhoto, updatePhoto, updatePhotoLabel, updatePhotoPanel, deletePhoto, reorderPhotos, getNextDisplayOrder
**Call sites**:
- ❌ `DamageTab.svelte` - Multiple calls without client

#### 10. `src/lib/services/additionals-photos.service.ts`
**Status**: ✅ PARTIALLY CORRECT - Some methods have client parameter
**Note**: Already has `client?: ServiceClient` on `getPhotosByAdditionals` (Line 16)
**Methods needing review**: createPhoto, updatePhoto, updatePhotoLabel, deletePhoto, reorderPhotos, getNextDisplayOrder

---

## 🔗 CALL SITES REQUIRING UPDATES

### Server Routes (+page.server.ts)
- `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts:155` - interiorPhotosService.getPhotosByAssessment()
- `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts:158` - exterior360PhotosService.getPhotosByAssessment()

### Components (+page.svelte)
- `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte:154` - vehicleIdentificationService.upsert()
- `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte:165` - exterior360Service.upsert()
- `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte:208` - interiorMechanicalService.upsert()
- `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte:219` - interiorPhotosService.getPhotosByAssessment()
- `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte:830` - estimatePhotosService.getPhotosByEstimate()

### Photo Panels (Svelte Components)
- `InteriorPhotosPanel.svelte` - 4 service calls without client
- `Exterior360PhotosPanel.svelte` - 4 service calls without client
- `EstimatePhotosPanel.svelte` - 5 service calls without client
- `PreIncidentPhotosPanel.svelte` - 4 service calls without client
- `DamageTab.svelte` - Multiple calls without client

### API Routes (+server.ts)
- `src/routes/api/generate-report/+server.ts:58-98` - Direct Supabase queries (should use services)
- `src/routes/api/generate-estimate/+server.ts:61-65` - Direct Supabase queries (should use services)
- `src/routes/api/generate-frc-report/+server.ts:82-86` - Direct Supabase queries (should use services)
- `src/routes/api/generate-photos-zip/+server.ts:55-81` - Direct Supabase queries (should use services)
- `src/routes/api/generate-photos-pdf/+server.ts:114-160` - Direct Supabase queries (should use services)

---

## 📊 IMPACT ANALYSIS

| Category | Count | Status |
|----------|-------|--------|
| Services to fix | 10 | ⚠️ CRITICAL |
| Service methods to update | ~80 | ⚠️ CRITICAL |
| Call sites in +page.server.ts | 2 | ⚠️ HIGH |
| Call sites in +page.svelte | 5 | ⚠️ HIGH |
| Call sites in components | 20+ | ⚠️ HIGH |
| API routes with direct queries | 5 | ⚠️ MEDIUM |

---

## ✅ NEXT STEPS

1. **Fix tyre-photos.service.ts** (BLOCKING)
2. **Update 9 remaining services** with client parameter
3. **Update all call sites** to pass `locals.supabase` (server) or handle client-side appropriately
4. **Refactor API routes** to use services instead of direct queries
5. **Test RLS policies** to verify authentication works correctly

