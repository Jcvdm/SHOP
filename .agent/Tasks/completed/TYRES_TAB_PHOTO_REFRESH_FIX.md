# Tyres Tab Photo Refresh Fix - Implementation Plan

**Date**: November 10, 2025  
**Priority**: 🔴 HIGH  
**Status**: 📋 READY FOR IMPLEMENTATION

---

## 🎯 PROBLEM STATEMENT

**Symptom**:
- User uploads photos to a tyre
- Photos are saved to database ✅
- Photos don't display in TyrePhotosPanel ❌
- User uploads another photo
- ALL photos suddenly appear ✅

**User Impact**: Confusing UX - users think photos aren't being saved

---

## 🔍 ROOT CAUSE ANALYSIS

### Missing Parent Refresh Pattern

**Current Flow (BROKEN)**:
```
User uploads photo
    ↓
TyrePhotosPanel saves to DB ✅
    ↓
TyrePhotosPanel calls onPhotosUpdate(photos.value) ✅
    ↓
TyresTab updates local tyrePhotosMap ✅
    ↓
Parent page data.tyrePhotos NOT refreshed ❌
    ↓
User clicks away and returns
    ↓
TyresTab $effect rebuilds Map from stale tyrePhotosProp ❌
    ↓
Photos disappear ❌
```

**Working Pattern (EstimateTab & PreIncidentEstimateTab)**:
```
User uploads photo
    ↓
EstimatePhotosPanel saves to DB ✅
    ↓
EstimatePhotosPanel calls onUpdate() ✅
    ↓
Parent page reloads from DB ✅
    ↓
Parent updates data.estimatePhotos ✅
    ↓
EstimatePhotosPanel receives fresh props ✅
    ↓
Photos display immediately ✅
```

### Code Evidence

**EstimateTab (WORKING)** - `+page.svelte` lines 835-841:
```typescript
onPhotosUpdate={async () => {
  if (estimate) {
    const updatedPhotos = await estimatePhotosService.getPhotosByEstimate(estimate.id);
    data.estimatePhotos = updatedPhotos;  // ← Parent state updated
  }
}}
```

**PreIncidentEstimateTab (WORKING)** - `+page.svelte` lines 806-815:
```typescript
onPhotosUpdate={async () => {
  if (preIncidentEstimate) {
    const updatedPhotos = await preIncidentEstimatePhotosService.getPhotosByEstimate(
      preIncidentEstimate.id
    );
    data.preIncidentEstimatePhotos = updatedPhotos;  // ← Parent state updated
  }
}}
```

**TyresTab (BROKEN)** - `+page.svelte` lines 760-776:
```typescript
<TyresTab
  tyres={data.tyres}
  tyrePhotos={data.tyrePhotos}
  assessmentId={data.assessment.id}
  onUpdateTyre={handleUpdateTyre}
  onAddTyre={handleAddTyre}
  onDeleteTyre={handleDeleteTyre}
  onNotesUpdate={async () => { ... }}
  onRegisterSave={(saveFn) => { ... }}
/>
<!-- ❌ NO onPhotosUpdate callback! -->
```

---

## ✅ SOLUTION: Add Parent Refresh Pattern

### Implementation Overview

**3 Files to Modify**:
1. `src/lib/components/assessment/TyresTab.svelte` - Accept onPhotosUpdate prop
2. `src/lib/components/assessment/TyresTab.svelte` - Forward callback to TyrePhotosPanel
3. `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte` - Add refresh callback

---

## 📋 IMPLEMENTATION STEPS

### Step 1: Update TyresTab Props Interface

**File**: `src/lib/components/assessment/TyresTab.svelte`  
**Location**: Lines 13-22 (Props interface)

**Add**:
```typescript
interface Props {
  tyres: Tyre[];
  tyrePhotos: TyrePhoto[];
  assessmentId: string;
  onUpdateTyre: (id: string, data: Partial<Tyre>) => void;
  onAddTyre: () => void;
  onDeleteTyre: (id: string) => void;
  onNotesUpdate?: () => Promise<void>;
  onRegisterSave?: (saveFn: () => Promise<void>) => void;
  onPhotosUpdate?: () => Promise<void>;  // ← ADD THIS
}
```

**Update destructuring** (line 24):
```typescript
let { 
  tyres: tyresProp, 
  tyrePhotos: tyrePhotosProp, 
  assessmentId, 
  onUpdateTyre, 
  onAddTyre, 
  onDeleteTyre, 
  onNotesUpdate, 
  onRegisterSave,
  onPhotosUpdate  // ← ADD THIS
}: Props = $props();
```

---

### Step 2: Update handleTyrePhotosUpdate Function

**File**: `src/lib/components/assessment/TyresTab.svelte`  
**Location**: Lines 42-51 (handleTyrePhotosUpdate function)

**Current Code**:
```typescript
function handleTyrePhotosUpdate(tyreId: string, updatedPhotos: TyrePhoto[]) {
  // Update local state
  tyrePhotosMap.set(tyreId, updatedPhotos);
  tyrePhotosMap = new Map(tyrePhotosMap);

  // Notify parent with updated photos (direct state update pattern)
  // Parent will update data.tyrePhotos which triggers reactivity
  onUpdateTyre(tyreId, {});
}
```

**Updated Code**:
```typescript
async function handleTyrePhotosUpdate(tyreId: string, updatedPhotos: TyrePhoto[]) {
  // Update local state immediately (optimistic update)
  tyrePhotosMap.set(tyreId, updatedPhotos);
  tyrePhotosMap = new Map(tyrePhotosMap);

  // Notify parent to refresh photos from database
  // This ensures data.tyrePhotos is updated for future tab switches
  if (onPhotosUpdate) {
    await onPhotosUpdate();
  }
}
```

---

### Step 3: Update TyrePhotosPanel Prop Passing

**File**: `src/lib/components/assessment/TyresTab.svelte`  
**Location**: Lines 311-317 (TyrePhotosPanel component)

**Current Code**:
```typescript
<TyrePhotosPanel
  tyreId={tyre.id}
  {assessmentId}
  tyrePosition={tyre.position}
  photos={tyrePhotosMap.get(tyre.id) || []}
  onPhotosUpdate={(updatedPhotos) => handleTyrePhotosUpdate(tyre.id, updatedPhotos)}
/>
```

**No changes needed** - Already correctly wired!

---

### Step 4: Add Parent Refresh Callback

**File**: `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`  
**Location**: Lines 760-776 (TyresTab component)

**Current Code**:
```typescript
{:else if currentTab === 'tyres'}
  <TyresTab
    tyres={data.tyres}
    tyrePhotos={data.tyrePhotos}
    assessmentId={data.assessment.id}
    onUpdateTyre={handleUpdateTyre}
    onAddTyre={handleAddTyre}
    onDeleteTyre={handleDeleteTyre}
    onNotesUpdate={async () => {
      const updatedNotes = await assessmentNotesService.getNotesByAssessment(data.assessment.id);
      notes = updatedNotes;
    }}
    onRegisterSave={(saveFn) => {
      tyresTabSaveFn = saveFn;
    }}
  />
```

**Updated Code**:
```typescript
{:else if currentTab === 'tyres'}
  <TyresTab
    tyres={data.tyres}
    tyrePhotos={data.tyrePhotos}
    assessmentId={data.assessment.id}
    onUpdateTyre={handleUpdateTyre}
    onAddTyre={handleAddTyre}
    onDeleteTyre={handleDeleteTyre}
    onNotesUpdate={async () => {
      const updatedNotes = await assessmentNotesService.getNotesByAssessment(data.assessment.id);
      notes = updatedNotes;
    }}
    onRegisterSave={(saveFn) => {
      tyresTabSaveFn = saveFn;
    }}
    onPhotosUpdate={async () => {
      // Reload tyre photos from database
      const updatedPhotos = await tyrePhotosService.getPhotosByAssessment(data.assessment.id);
      // Update local state (triggers reactivity)
      data.tyrePhotos = updatedPhotos;
    }}
  />
```

**Add import** at top of file (if not already present):
```typescript
import { tyrePhotosService } from '$lib/services/tyre-photos.service';
```

---

## 🧪 TESTING CHECKLIST

### Test Case 1: Upload Photo
- [ ] Navigate to Tyres tab
- [ ] Upload photo to any tyre
- [ ] **Verify**: Photo displays immediately ✅
- [ ] Click away to another tab
- [ ] Return to Tyres tab
- [ ] **Verify**: Photo still displays ✅

### Test Case 2: Multiple Photos
- [ ] Upload 3 photos to same tyre
- [ ] **Verify**: All 3 display immediately ✅
- [ ] Click away and return
- [ ] **Verify**: All 3 still display ✅

### Test Case 3: Multiple Tyres
- [ ] Upload photo to Front Left tyre
- [ ] Upload photo to Front Right tyre
- [ ] **Verify**: Both display correctly ✅
- [ ] Click away and return
- [ ] **Verify**: Both still display ✅

### Test Case 4: Delete Photo
- [ ] Delete a photo
- [ ] **Verify**: Photo removed immediately ✅
- [ ] Click away and return
- [ ] **Verify**: Photo still deleted ✅

### Test Case 5: Label Update
- [ ] Update photo label
- [ ] **Verify**: Label updates immediately ✅
- [ ] Click away and return
- [ ] **Verify**: Label persists ✅

---

## 📊 SUMMARY

| Aspect | Before | After |
|--------|--------|-------|
| **Photos display after upload** | ❌ No | ✅ Yes |
| **Photos persist on tab switch** | ❌ No | ✅ Yes |
| **Pattern consistency** | ❌ Different from Estimate | ✅ Same as Estimate |
| **Files modified** | 0 | 3 |
| **Lines added** | 0 | ~15 |
| **Complexity** | N/A | 🟢 Low |

---

## 🔗 RELATED DOCUMENTATION

- `.agent/Tasks/active/TYRES_TAB_PHOTO_DISPLAY_BUG_ANALYSIS.md` - Root cause analysis
- `.agent/Tasks/active/PHOTO_PANEL_TAB_SWITCH_BUG_ANALYSIS.md` - Original bug investigation
- `.claude/skills/photo-component-development/resources/pattern-templates.md` - Photo panel patterns
- `src/lib/services/tyre-photos.service.ts` - Service with getPhotosByAssessment method

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Photos display immediately after upload
- [ ] Photos persist when switching tabs
- [ ] Pattern matches EstimateTab and PreIncidentEstimateTab
- [ ] All test cases pass
- [ ] No console errors
- [ ] Code committed with descriptive message

---

**Implementation Time Estimate**: 15-20 minutes  
**Testing Time Estimate**: 10 minutes  
**Total**: ~30 minutes

