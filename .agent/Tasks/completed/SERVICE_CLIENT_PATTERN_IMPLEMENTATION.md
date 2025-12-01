# ServiceClient Pattern Implementation - ClaimTech Services Refactor
**Date**: November 10, 2025  
**Status**: 🔴 READY FOR IMPLEMENTATION  
**Priority**: CRITICAL - RLS Policy Violations & 500 Error  
**Estimated Duration**: 6-8 hours

---

## ⚠️ IMPORTANT: COMMIT FIRST

**BEFORE STARTING THIS IMPLEMENTATION:**

```bash
# 1. Check current status
git status

# 2. Commit all current changes
git add .
git commit -m "chore: checkpoint before ServiceClient pattern refactor"

# 3. Create feature branch
git checkout -b fix/service-client-pattern

# 4. Verify clean state
git status
```

**Why?**
- This is a LARGE refactor affecting 10 services and 30+ call sites
- Easy rollback if issues arise
- Clear separation of concerns
- Safe to test incrementally

---

## 📋 Executive Summary

**Problem**: 10 services don't follow the ServiceClient injection pattern, causing:
- 🔴 500 Internal Server Error (tyre-photos.service.ts)
- ⚠️ RLS policy violations (Error 42501)
- ⚠️ Inconsistent authentication context
- ⚠️ Security risks

**Solution**: Update all services to accept optional `client?: ServiceClient` parameter and use `const db = client ?? supabase;` pattern.

**Impact**: 
- 10 services to update (~80 methods)
- 30+ call sites to update
- 5 API routes to refactor

---

## 🎯 Implementation Strategy

### Phase 1: Fix Blocking Error (CRITICAL)
Fix `tyre-photos.service.ts` to unblock development

### Phase 2: Update Core Services (HIGH PRIORITY)
Fix vehicle-identification, exterior-360, interior-mechanical services

### Phase 3: Update Photo Services (HIGH PRIORITY)
Fix all 6 photo services

### Phase 4: Update Call Sites (MEDIUM PRIORITY)
Update server routes and components to pass `locals.supabase`

### Phase 5: Refactor API Routes (MEDIUM PRIORITY)
Replace direct Supabase queries with service calls

### Phase 6: Testing & Verification (CRITICAL)
Test RLS policies and authentication

---

## 📝 PHASE 1: Fix Blocking Error (30 minutes)

### Task 1.1: Fix tyre-photos.service.ts

**File**: `src/lib/services/tyre-photos.service.ts` (168 lines)

**Changes Required**:

1. **Remove non-existent import** (Line 1):
```typescript
// ❌ REMOVE
import { BaseService } from './base.service';

// ✅ ADD
import { supabase } from '$lib/supabase';
import type { ServiceClient } from '$lib/types/service';
```

2. **Update class declaration** (Line 10):
```typescript
// ❌ REMOVE
class TyrePhotosService extends BaseService {

// ✅ REPLACE WITH
class TyrePhotosService {
```

3. **Update all methods** (8 methods total):
```typescript
// ❌ OLD PATTERN
async getPhotosByTyre(tyreId: string, client?: ServiceClient): Promise<TyrePhoto[]> {
  const supabase = client || this.getClient();
  
// ✅ NEW PATTERN
async getPhotosByTyre(tyreId: string, client?: ServiceClient): Promise<TyrePhoto[]> {
  const db = client ?? supabase;
```

**Methods to update**:
- `getPhotosByTyre()` - Line 14
- `getPhotosByAssessment()` - Line 30
- `createPhoto()` - Line 50
- `updatePhoto()` - Line 72
- `updatePhotoLabel()` - Line 95
- `deletePhoto()` - Line 108
- `reorderPhotos()` - Line 121
- `getNextDisplayOrder()` - Line 143

**Verification**:
```bash
# Test the assessment page loads without 500 error
npm run dev
# Navigate to: /work/assessments/[any-assessment-id]
# Should load successfully
```

---

## 📝 PHASE 2: Update Core Services (1 hour)

### Task 2.1: Fix vehicle-identification.service.ts

**File**: `src/lib/services/vehicle-identification.service.ts` (119 lines)

**Pattern to apply**:
```typescript
// Add import at top
import type { ServiceClient } from '$lib/types/service';

// Update each method signature
async create(input: CreateVehicleIdentificationInput, client?: ServiceClient): Promise<VehicleIdentification> {
  const db = client ?? supabase;
  const { data, error } = await db  // Change 'supabase' to 'db'
    .from('assessment_vehicle_identification')
    .insert(input)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

**Methods to update** (4 methods):
- `create(input, client?)` - Line 13
- `getByAssessment(assessmentId, client?)` - Line 43
- `update(assessmentId, input, client?)` - Line 61
- `upsert(assessmentId, input, client?)` - Line 103

### Task 2.2: Fix exterior-360.service.ts

**File**: `src/lib/services/exterior-360.service.ts` (113 lines)

**Methods to update** (4 methods):
- `create(input, client?)` - Line 13
- `getByAssessment(assessmentId, client?)` - Line 43
- `update(assessmentId, input, client?)` - Line 61
- `upsert(assessmentId, input, client?)` - Line 100

**Pattern**: Same as Task 2.1

### Task 2.3: Fix interior-mechanical.service.ts

**File**: `src/lib/services/interior-mechanical.service.ts` (119 lines)

**Methods to update** (4 methods):
- `create(input, client?)` - Line 13
- `getByAssessment(assessmentId, client?)` - Line 43
- `update(assessmentId, input, client?)` - Line 61
- `upsert(assessmentId, input, client?)` - Line 103

**Pattern**: Same as Task 2.1

**Verification**:
```bash
# Check TypeScript compilation
npm run check
# Should have no errors
```

---

## 📝 PHASE 3: Update Photo Services (2 hours)

### Task 3.1: Fix interior-photos.service.ts

**File**: `src/lib/services/interior-photos.service.ts` (147 lines)

**Methods to update** (7 methods):
- `getPhotosByAssessment(assessmentId, client?)` - Line 15
- `createPhoto(input, client?)` - Line 34
- `updatePhoto(photoId, input, client?)` - Line 56
- `updatePhotoLabel(photoId, label, client?)` - Line 78
- `deletePhoto(photoId, client?)` - Line 91
- `reorderPhotos(assessmentId, photoIds, client?)` - Line 104
- `getNextDisplayOrder(assessmentId, client?)` - Line 126

### Task 3.2: Fix exterior-360-photos.service.ts

**File**: `src/lib/services/exterior-360-photos.service.ts` (147 lines)

**Methods to update** (7 methods): Same structure as Task 3.1

### Task 3.3: Fix estimate-photos.service.ts

**File**: `src/lib/services/estimate-photos.service.ts` (147 lines)

**Methods to update** (7 methods): Same structure as Task 3.1

### Task 3.4: Fix pre-incident-estimate-photos.service.ts

**File**: `src/lib/services/pre-incident-estimate-photos.service.ts` (152 lines)

**Methods to update** (7 methods): Same structure as Task 3.1

### Task 3.5: Fix damage-photos.service.ts

**File**: `src/lib/services/damage-photos.service.ts` (157 lines)

**Methods to update** (8 methods):
- `getPhotosByAssessment(assessmentId, client?)` - Line 15
- `createPhoto(input, client?)` - Line 34
- `updatePhoto(photoId, input, client?)` - Line 59
- `updatePhotoLabel(photoId, label, client?)` - Line 85
- `updatePhotoPanel(photoId, panel, client?)` - Line 89
- `deletePhoto(photoId, client?)` - Line 93
- `reorderPhotos(assessmentId, photoIds, client?)` - Line 114
- `getNextDisplayOrder(assessmentId, client?)` - Line 137

### Task 3.6: Review additionals-photos.service.ts

**File**: `src/lib/services/additionals-photos.service.ts`

**Status**: ✅ ALREADY PARTIALLY CORRECT

**Action**: Verify all methods have `client?: ServiceClient` parameter
- `getPhotosByAdditionals()` - ✅ Already has client parameter
- Review remaining methods for consistency

**Verification**:
```bash
# Check TypeScript compilation
npm run check
# Should have no errors
```

---

## 📝 PHASE 4: Update Call Sites (1.5 hours)

### Task 4.1: Update Server Routes

**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts`

**Changes**:
```typescript
// Line 155: ❌ BEFORE
const interiorPhotos = await interiorPhotosService.getPhotosByAssessment(assessment.id);

// Line 155: ✅ AFTER
const interiorPhotos = await interiorPhotosService.getPhotosByAssessment(assessment.id, locals.supabase);

// Line 158: ❌ BEFORE
const exterior360Photos = await exterior360PhotosService.getPhotosByAssessment(assessment.id);

// Line 158: ✅ AFTER
const exterior360Photos = await exterior360PhotosService.getPhotosByAssessment(assessment.id, locals.supabase);
```

### Task 4.2: Update Component Calls (Optional)

**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`

**Note**: Client-side calls will use fallback `client ?? supabase` automatically. No changes required unless you want to pass explicit client.

**Locations** (for reference):
- Line 154: `vehicleIdentificationService.upsert()` - Uses fallback
- Line 165: `exterior360Service.upsert()` - Uses fallback
- Line 208: `interiorMechanicalService.upsert()` - Uses fallback
- Line 219: `interiorPhotosService.getPhotosByAssessment()` - Uses fallback
- Line 830: `estimatePhotosService.getPhotosByEstimate()` - Uses fallback

**Verification**:
```bash
# Test assessment page functionality
npm run dev
# Navigate to assessment page
# Test vehicle identification updates
# Test exterior 360 updates
# Test interior mechanical updates
# All should work without errors
```

---

## 📝 PHASE 5: Refactor API Routes (2 hours)

### Task 5.1: Refactor generate-report/+server.ts

**File**: `src/routes/api/generate-report/+server.ts`

**Current**: Lines 58-98 use direct Supabase queries
**Target**: Use services with `locals.supabase`

**Changes**:
```typescript
// ❌ BEFORE (Lines 58-68)
const [
  { data: vehicleIdentification },
  { data: exterior360 },
  { data: interiorMechanical },
  // ... more direct queries
] = await Promise.all([
  locals.supabase
    .from('assessment_vehicle_identification')
    .select('*')
    .eq('assessment_id', assessmentId)
    .single(),
  // ... more queries
]);

// ✅ AFTER
const [
  vehicleIdentification,
  exterior360,
  interiorMechanical,
  // ... more service calls
] = await Promise.all([
  vehicleIdentificationService.getByAssessment(assessmentId, locals.supabase),
  exterior360Service.getByAssessment(assessmentId, locals.supabase),
  interiorMechanicalService.getByAssessment(assessmentId, locals.supabase),
  // ... more service calls
]);
```

### Task 5.2: Refactor generate-estimate/+server.ts

**File**: `src/routes/api/generate-estimate/+server.ts`

**Current**: Lines 61-65 use direct Supabase queries
**Target**: Use services with `locals.supabase`

**Pattern**: Same as Task 5.1

### Task 5.3: Refactor generate-frc-report/+server.ts

**File**: `src/routes/api/generate-frc-report/+server.ts`

**Current**: Lines 82-86 use direct Supabase queries
**Target**: Use services with `locals.supabase`

**Pattern**: Same as Task 5.1

### Task 5.4: Refactor generate-photos-zip/+server.ts

**File**: `src/routes/api/generate-photos-zip/+server.ts`

**Current**: Lines 56-80 use direct Supabase queries for photos
**Target**: Use photo services with `locals.supabase`

**Changes**:
```typescript
// ❌ BEFORE
const { data: estimatePhotos } = await locals.supabase
  .from('estimate_photos')
  .select('*')
  .eq('estimate_id', estimate.id)
  .order('created_at', { ascending: true });

// ✅ AFTER
const estimatePhotos = await estimatePhotosService.getPhotosByEstimate(
  estimate.id,
  locals.supabase
);
```

### Task 5.5: Refactor generate-photos-pdf/+server.ts

**File**: `src/routes/api/generate-photos-pdf/+server.ts`

**Current**: Lines 114-160 use direct Supabase queries
**Target**: Use services with `locals.supabase`

**Pattern**: Same as Task 5.1 and 5.4

**Verification**:
```bash
# Test PDF generation
npm run dev
# Generate assessment report
# Generate estimate PDF
# Generate FRC report
# Generate photos ZIP
# Generate photos PDF
# All should work without errors
```

---

## 📝 PHASE 6: Testing & Verification (1 hour)

### Task 6.1: Manual Testing Checklist

**Assessment Page**:
- [ ] Load assessment page without 500 error
- [ ] Update vehicle identification (server-side)
- [ ] Update exterior 360 (server-side)
- [ ] Update interior mechanical (server-side)
- [ ] Upload interior photos
- [ ] Upload exterior 360 photos
- [ ] Upload estimate photos
- [ ] Upload pre-incident photos
- [ ] Edit photo labels
- [ ] Delete photos
- [ ] Reorder photos

**PDF Generation**:
- [ ] Generate assessment report
- [ ] Generate estimate PDF
- [ ] Generate FRC report
- [ ] Generate photos ZIP
- [ ] Generate photos PDF

**RLS Policy Testing**:
- [ ] Test as admin user (should have full access)
- [ ] Test as engineer user (should only see assigned assessments)
- [ ] Verify no 42501 RLS policy errors in console

### Task 6.2: TypeScript Compilation

```bash
# Check for TypeScript errors
npm run check

# Should output:
# Checking SvelteKit app...
# ✓ No errors found
```

### Task 6.3: Console Error Check

```bash
# Run dev server
npm run dev

# Open browser console (F12)
# Navigate through assessment pages
# Check for errors:
# - No 500 errors
# - No 42501 RLS policy errors
# - No "Failed to load" errors
```

### Task 6.4: Database Query Verification

**Check that services are being used**:
```bash
# In browser console, check Network tab
# Filter by "supabase"
# Verify queries are authenticated (have auth headers)
# Verify no direct table queries from client-side
```

---

## 📊 Implementation Checklist

### Services (10 files)
- [ ] `tyre-photos.service.ts` - Fix BaseService error
- [ ] `vehicle-identification.service.ts` - Add client parameter
- [ ] `exterior-360.service.ts` - Add client parameter
- [ ] `interior-mechanical.service.ts` - Add client parameter
- [ ] `interior-photos.service.ts` - Add client parameter
- [ ] `exterior-360-photos.service.ts` - Add client parameter
- [ ] `estimate-photos.service.ts` - Add client parameter
- [ ] `pre-incident-estimate-photos.service.ts` - Add client parameter
- [ ] `damage-photos.service.ts` - Add client parameter
- [ ] `additionals-photos.service.ts` - Review and verify

### Call Sites (2 files)
- [ ] `+page.server.ts` - Update 2 photo service calls
- [ ] `+page.svelte` - Verify client-side calls work with fallback

### API Routes (5 files)
- [ ] `generate-report/+server.ts` - Refactor to use services
- [ ] `generate-estimate/+server.ts` - Refactor to use services
- [ ] `generate-frc-report/+server.ts` - Refactor to use services
- [ ] `generate-photos-zip/+server.ts` - Refactor to use services
- [ ] `generate-photos-pdf/+server.ts` - Refactor to use services

### Testing
- [ ] Manual testing checklist complete
- [ ] TypeScript compilation passes
- [ ] No console errors
- [ ] RLS policies working correctly

---

## 🚨 Rollback Plan

If issues arise during implementation:

```bash
# 1. Stash current changes
git stash

# 2. Return to checkpoint
git checkout main

# 3. Verify app works
npm run dev

# 4. Review what went wrong
git stash show -p

# 5. Fix issues and retry
git checkout fix/service-client-pattern
git stash pop
```

---

## 📚 Related Documentation

- **Pattern Reference**: `.agent/SOP/service_client_authentication.md`
- **Service Patterns**: `.agent/SOP/working_with_services.md`
- **Skill Resource**: `.claude/skills/claimtech-development/resources/service-patterns.md`
- **Fix Inventory**: `.agent/Tasks/active/SERVICE_CLIENT_PATTERN_FIX_INVENTORY.md`

---

## ✅ Success Criteria

1. ✅ All 10 services follow ServiceClient pattern
2. ✅ No 500 errors on assessment pages
3. ✅ No RLS policy violations (Error 42501)
4. ✅ TypeScript compilation passes
5. ✅ All manual tests pass
6. ✅ PDF generation works correctly
7. ✅ Photo uploads/edits/deletes work correctly

---

## 📝 Post-Implementation

After successful implementation:

```bash
# 1. Commit changes
git add .
git commit -m "fix: implement ServiceClient pattern across all services

- Fix tyre-photos.service.ts BaseService error (blocking 500)
- Add client parameter to 9 services (80+ methods)
- Update server route call sites to pass locals.supabase
- Refactor 5 API routes to use services instead of direct queries
- Verify RLS policies work correctly
- All tests passing

Fixes #[issue-number]"

# 2. Push to remote
git push origin fix/service-client-pattern

# 3. Create PR
# Title: "Fix: Implement ServiceClient Pattern Across All Services"
# Description: Link to this implementation doc

# 4. Move task to completed
mv .agent/Tasks/active/SERVICE_CLIENT_PATTERN_IMPLEMENTATION.md \
   .agent/Tasks/completed/SERVICE_CLIENT_PATTERN_IMPLEMENTATION_NOV_10_2025.md
```

---

**Last Updated**: November 10, 2025
**Prepared by**: Claude Agent
**Estimated Total Time**: 6-8 hours

