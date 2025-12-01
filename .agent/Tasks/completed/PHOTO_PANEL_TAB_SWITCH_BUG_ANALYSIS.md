# Photo Panel Tab Switch Bug - Comprehensive Analysis

**Bug Description**: When photos are uploaded to a panel and user clicks away to another tab, then returns to the original tab, photos disappear. However, when adding another photo, all photos (including the previously uploaded ones) reappear.

**Status**: 🔴 RECURRING BUG - Root causes identified

---

## 🎯 ROOT CAUSES IDENTIFIED

### Issue 1: Missing `onPhotosUpdate` Callback in Some Tabs
**Severity**: 🔴 CRITICAL

**Affected Components**:
- `InteriorMechanicalTab.svelte` - Has `onPhotosUpdate` callback ✅
- `Exterior360Tab.svelte` - Has `onPhotosUpdate` callback ✅
- `EstimateTab.svelte` - Has `onPhotosUpdate` callback ✅
- `PreIncidentEstimateTab.svelte` - **MISSING** ❌
- `AdditionalsTab.svelte` - **MISSING** ❌
- `FRCTab.svelte` - **MISSING** ❌

**What This Means**:
When photos are uploaded in tabs WITHOUT `onPhotosUpdate`, the parent component (`+page.svelte`) is never notified to refresh the photo data from the database.

**Code Pattern - WORKING** (EstimateTab):
```typescript
onPhotosUpdate={async () => {
  if (estimate) {
    const updatedPhotos = await estimatePhotosService.getPhotosByEstimate(estimate.id);
    data.estimatePhotos = updatedPhotos;  // ← Direct state update triggers reactivity
  }
}}
```

**Code Pattern - BROKEN** (PreIncidentEstimateTab):
```typescript
// No onPhotosUpdate callback passed!
// Photos uploaded but parent never refreshes data
```

---

### Issue 2: Tab Switch Doesn't Refresh Photo Data
**Severity**: 🟡 MEDIUM

**Location**: `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte` (lines 68-86)

**Current Code**:
```typescript
async function handleTabChange(tabId: string) {
  // Auto-save current tab if leaving it with unsaved changes
  if (currentTab === 'estimate' && estimateTabSaveFn) {
    await estimateTabSaveFn();
  } else if (currentTab === 'pre-incident' && preIncidentEstimateTabSaveFn) {
    await preIncidentEstimateTabSaveFn();
  }

  // Auto-save before switching tabs
  await handleSave();

  // Refresh notes from database when switching tabs
  const updatedNotes = await assessmentNotesService.getNotesByAssessment(data.assessment.id);
  data.notes = updatedNotes;

  currentTab = tabId;
  await assessmentService.updateCurrentTab(data.assessment.id, tabId);
}
```

**Problem**: 
- Refreshes notes when switching tabs ✅
- Does NOT refresh photos when switching tabs ❌
- If photos were uploaded but `onPhotosUpdate` wasn't called, they stay stale

---

### Issue 3: useOptimisticArray Getter Function Dependency
**Severity**: 🟡 MEDIUM

**Location**: All photo panels use this pattern:
```typescript
const photos = useOptimisticArray(() => props.photos);
```

**How It Works**:
1. Getter function `() => props.photos` is called fresh each time
2. `$derived.by()` inside utility detects when returned array changes
3. `$effect` re-runs and syncs `localArray` with new data
4. UI updates automatically

**When It Breaks**:
- If parent never updates `data.estimatePhotos` (no `onPhotosUpdate` callback)
- Getter returns same array reference
- `$derived.by()` doesn't detect change
- `$effect` doesn't re-run
- Photos stay in old state

**Why Adding Another Photo Fixes It**:
```typescript
// When user adds another photo:
photos.add(newPhoto);  // ← Optimistic update (immediate UI change)

// Then onPhotosUpdate callback fires:
await onPhotosUpdate();  // ← Refreshes from database

// Parent updates data:
data.estimatePhotos = updatedPhotos;  // ← New array reference

// Getter detects change:
() => props.photos  // ← Returns new array

// Sync happens:
$effect re-runs → localArray syncs → UI shows all photos ✅
```

---

## 📊 AFFECTED PHOTO PANELS

| Panel | Tab | Has onPhotosUpdate | Status |
|-------|-----|-------------------|--------|
| EstimatePhotosPanel | Estimate | ✅ YES | WORKING |
| InteriorPhotosPanel | Interior | ✅ YES | WORKING |
| Exterior360PhotosPanel | 360° | ✅ YES | WORKING |
| PreIncidentPhotosPanel | Pre-Incident | ❌ NO | **BROKEN** |
| AdditionalsPhotosPanel | Additionals | ❌ NO | **BROKEN** |
| DamagePhotosPanel | Damage | ❌ NO | **BROKEN** |
| TyrePhotosPanel | Tyres | ✅ YES | WORKING |

---

## 🔍 DETAILED FLOW ANALYSIS

### ✅ WORKING FLOW (EstimateTab)
```
1. User uploads photo
   ↓
2. EstimatePhotosPanel.handleFileSelect() fires
   ↓
3. photos.add(newPhoto) - Optimistic update (UI shows immediately)
   ↓
4. onPhotosUpdate() callback fires
   ↓
5. Parent fetches: data.estimatePhotos = await estimatePhotosService.getPhotosByEstimate()
   ↓
6. Parent prop changes (new array reference)
   ↓
7. Getter: () => props.photos returns new array
   ↓
8. $derived.by() detects change
   ↓
9. $effect re-runs: localArray = [...newArray]
   ↓
10. UI renders all photos ✅
```

### ❌ BROKEN FLOW (PreIncidentEstimateTab)
```
1. User uploads photo
   ↓
2. PreIncidentPhotosPanel.handleFileSelect() fires
   ↓
3. photos.add(newPhoto) - Optimistic update (UI shows immediately)
   ↓
4. onPhotosUpdate() callback fires
   ↓
5. ❌ NO CALLBACK DEFINED - Nothing happens
   ↓
6. Parent data never updates
   ↓
7. Getter: () => props.photos returns SAME array reference
   ↓
8. $derived.by() doesn't detect change (same reference)
   ↓
9. $effect doesn't re-run
   ↓
10. User clicks away to another tab
    ↓
11. Component unmounts/remounts
    ↓
12. useOptimisticArray re-initializes with empty localArray
    ↓
13. Parent prop still has old data (never refreshed)
    ↓
14. Photos disappear ❌
```

### ✅ WHY ADDING ANOTHER PHOTO FIXES IT
```
1. User adds another photo
   ↓
2. photos.add(newPhoto2) - Optimistic update
   ↓
3. onPhotosUpdate() fires (still no callback, but...)
   ↓
4. User manually refreshes or navigates
   ↓
5. Page reloads from server
   ↓
6. +page.server.ts fetches fresh photos from database
   ↓
7. Parent data updates with ALL photos (including the "lost" ones)
   ↓
8. Getter detects new array reference
   ↓
9. $effect syncs and UI shows all photos ✅
```

---

## 📋 MISSING IMPLEMENTATIONS

### Missing onPhotosUpdate Callbacks

**PreIncidentEstimateTab** - Line ~700 in +page.svelte:
```typescript
// ❌ MISSING
onPhotosUpdate={async () => {
  if (preIncidentEstimate) {
    const updatedPhotos = await preIncidentEstimatePhotosService.getPhotosByEstimate(preIncidentEstimate.id);
    data.preIncidentEstimatePhotos = updatedPhotos;
  }
}}
```

**AdditionalsTab** - Line ~850 in +page.svelte:
```typescript
// ❌ MISSING
onPhotosUpdate={async () => {
  // Refresh additionals photos
}}
```

**FRCTab** - Line ~880 in +page.svelte:
```typescript
// ❌ MISSING
onPhotosUpdate={async () => {
  // Refresh FRC photos
}}
```

---

## 🎯 SUMMARY OF ISSUES

1. **Missing Callbacks** - 3 tabs don't notify parent when photos are uploaded
2. **No Tab Switch Refresh** - Photos aren't refreshed when switching tabs
3. **Reactivity Dependency** - Without parent update, getter returns same reference and $effect doesn't re-run
4. **Component Lifecycle** - When tab switches, component remounts with stale data

---

## 📝 NEXT STEPS FOR FIX

1. Add `onPhotosUpdate` callbacks to all missing tabs
2. Optionally: Add photo refresh to `handleTabChange()` for all photo-containing tabs
3. Ensure all photo panels pass `onPhotosUpdate` callback to their photo panel components
4. Test tab switching with photo uploads


