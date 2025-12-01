# Photo Panel Display Fix - November 9, 2025

## Problem Statement

Photo panels were not displaying uploaded photos after upload or tab switching. Symptoms:
- Photos didn't appear in grid after upload
- Upload corner wasn't visible (only large centered upload zone showed)
- Tab switching showed empty photo panels
- Page reload didn't load photos from database

## Root Cause Analysis

The issue was in the **parent component's `onPhotosUpdate` callback pattern**.

### Why It Failed

1. **InteriorMechanicalTab** used generic `handleRefreshData()` callback
2. `handleRefreshData()` called `invalidateAll()` to reload page data
3. While page data reloaded, the **prop reference didn't change**
4. `useOptimisticArray(() => props.photos)` getter returned same array reference
5. `$effect` didn't re-run (no reactive dependency change detected)
6. Photos didn't sync to UI

### Comparison: Working vs Broken

**✅ WORKING - EstimateTab** (lines 820-826):
```typescript
onPhotosUpdate={async () => {
  if (estimate) {
    const updatedPhotos = await estimatePhotosService.getPhotosByEstimate(estimate.id);
    data.estimatePhotos = updatedPhotos;  // ← Direct state update
  }
}}
```

**❌ BROKEN - InteriorMechanicalTab** (line 747):
```typescript
onPhotosUpdate={handleRefreshData}  // ← Generic refresh, no direct update
```

## Solution Implemented

Updated `onPhotosUpdate` callbacks to **directly update parent state** instead of using generic refresh.

### Changes Made

#### 1. Added Missing Imports (lines 31-32)
```typescript
import { interiorPhotosService } from '$lib/services/interior-photos.service';
import { exterior360PhotosService } from '$lib/services/exterior-360-photos.service';
```

#### 2. Fixed InteriorMechanicalTab (lines 748-753)
**Before:**
```typescript
onPhotosUpdate={handleRefreshData}
```

**After:**
```typescript
onPhotosUpdate={async () => {
  // Reload interior photos from database
  const updatedPhotos = await interiorPhotosService.getPhotosByAssessment(data.assessment.id);
  // Update local state (triggers reactivity)
  data.interiorPhotos = updatedPhotos;
}}
```

#### 3. Optimized Exterior360Tab (lines 735-740)
**Before:**
```typescript
onPhotosUpdate={async () => {
  const { exterior360PhotosService } = await import('$lib/services/exterior-360-photos.service');
  const updatedPhotos = await exterior360PhotosService.getPhotosByAssessment(data.assessment.id);
  data.exterior360Photos = updatedPhotos;
}}
```

**After:**
```typescript
onPhotosUpdate={async () => {
  // Reload exterior 360 photos from database
  const updatedPhotos = await exterior360PhotosService.getPhotosByAssessment(data.assessment.id);
  // Update local state (triggers reactivity)
  data.exterior360Photos = updatedPhotos;
}}
```

## How It Works Now

1. **User uploads photo** → Photo saved to database ✅
2. **Panel calls `onUpdate()`** → Triggers `onPhotosUpdate()` callback
3. **Callback fetches photos** → `getPhotosByAssessment()` returns updated array
4. **Direct state update** → `data.interiorPhotos = updatedPhotos` ← KEY!
5. **Prop changes** → Parent prop reference changes
6. **Getter function runs** → `() => props.photos` returns new array
7. **`$derived` detects change** → Reactive dependency tracked
8. **`$effect` re-runs** → `localArray` syncs with new photos
9. **UI updates** → Photos display in grid ✅
10. **Upload corner visible** → Grid shows upload zone as first item ✅

## Reactivity Chain

```
User uploads photo
    ↓
onPhotosUpdate() callback triggered
    ↓
Fetch photos from database
    ↓
data.interiorPhotos = updatedPhotos (direct state update)
    ↓
Parent prop changes (new array reference)
    ↓
Getter function: () => props.photos
    ↓
$derived.by() evaluates getter
    ↓
$effect detects change in parentArrayValue
    ↓
localArray syncs with new photos
    ↓
UI renders photos in grid ✅
```

## Files Modified

- `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`
  - Added imports: `interiorPhotosService`, `exterior360PhotosService`
  - Updated InteriorMechanicalTab `onPhotosUpdate` callback
  - Optimized Exterior360Tab `onPhotosUpdate` callback

## Testing Checklist

- [ ] Upload photo to interior tab → Photo appears in grid
- [ ] Upload corner visible in top-left of grid
- [ ] Switch tabs → Photos persist
- [ ] Reload page → Photos load from database
- [ ] Click photo → Opens fullscreen viewer
- [ ] Upload to exterior 360 tab → Photos appear in grid
- [ ] Upload to estimate tab → Photos appear in grid (already working)

## Related Documentation

- `.agent/Tasks/completed/OPTIMISTIC_ARRAY_BUG_FIX_RESEARCH_NOV_9_2025.md` - Svelte 5 reactivity bug fix
- `.agent/Tasks/completed/DOCUMENTATION_UPDATES_USEOPTIMISTICARRAY_NOV_9_2025.md` - Documentation updates
- `.claude/skills/photo-component-development/resources/pattern-templates.md` - Photo component patterns

## Key Learnings

1. **Direct state updates are critical** for reactive prop changes
2. **Getter functions enable reactive dependency tracking** in Svelte 5
3. **Generic refresh callbacks break optimistic array pattern** - use specific state updates
4. **Consistency matters** - all photo panels should follow same pattern

