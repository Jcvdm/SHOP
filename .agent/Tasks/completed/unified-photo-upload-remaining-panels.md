# Unified Photo Upload Panel - Remaining Panels

**Created**: 2025-01-XX
**Status**: Planning
**Related**: Interior Photos Panel implementation completed

## Overview

Consolidate the two-card layout (upload zone + gallery) into a single unified card for the remaining photo upload panels: Estimate, Additional, and Pre-Incident. The upload zone will appear as the first item in the photo grid, creating a more compact and modern interface consistent with the Interior Photos panel.

## Reference Implementation

The Interior Photos panel (`src/lib/components/assessment/InteriorPhotosPanel.svelte`) has been successfully refactored and serves as the pattern to follow for these remaining panels.

**Key Pattern**:
- Single `Card` component instead of two separate cards
- Conditional title: "Panel Name" when empty, "Panel Name (N)" when photos exist
- Empty state: Large centered upload zone
- Grid state: Compact upload zone as first grid item, followed by photo thumbnails
- Upload zone matches aspect-square of photo thumbnails

## Panels to Update

### 1. Estimate Photos Panel
**File**: `src/lib/components/assessment/EstimatePhotosPanel.svelte`
- Current: Two-card structure (Upload Zone + Preview Gallery)
- Title: "Upload Incident Photos" / "Incident Photos (N)"
- Target: Single card with unified grid layout

### 2. Additional Photos Panel
**File**: `src/lib/components/assessment/AdditionalsPhotosPanel.svelte`
- Current: Two-card structure (Upload Zone + Preview Gallery)
- Title: "Upload Additional Photos" / "Additional Photos (N)"
- Target: Single card with unified grid layout

### 3. Pre-Incident Photos Panel
**File**: `src/lib/components/assessment/PreIncidentPhotosPanel.svelte`
- Current: Two-card structure (Upload Zone + Preview Gallery)
- Title: "Upload Pre-Incident Photos" / "Pre-Incident Photos (N)"
- Target: Single card with unified grid layout

## Implementation Plan

### Phase 1: Estimate Photos Panel
1. Read `EstimatePhotosPanel.svelte` to understand current structure
2. Merge two-card layout into single card
3. Implement conditional title logic
4. Add empty state with large upload zone
5. Add grid layout with compact upload zone as first item
6. Test upload, drag-drop, delete functionality
7. Verify responsive behavior

### Phase 2: Additional Photos Panel
1. Read `AdditionalsPhotosPanel.svelte` to understand current structure
2. Apply same pattern as Estimate panel
3. Test functionality
4. Verify responsive behavior

### Phase 3: Pre-Incident Photos Panel
1. Read `PreIncidentPhotosPanel.svelte` to understand current structure
2. Apply same pattern as Estimate panel
3. Test functionality
4. Verify responsive behavior

## Code Pattern Reference

See `src/lib/components/assessment/InteriorPhotosPanel.svelte` lines 215-352 for the complete implementation pattern.

**Key Elements**:
- Single `Card` wrapper
- Conditional title: `{photos.value.length === 0 ? 'Panel Name' : 'Panel Name (${photos.value.length})'}`
- Empty state: Large centered upload zone with full UI
- Grid state: Compact upload zone (aspect-square) + photo thumbnails
- Upload zone states: uploading, dragging, default
- Maintain all existing drag-drop handlers
- Keep file input outside grid

## Testing Plan

For each panel:
- [ ] Upload photos when grid is empty
- [ ] Upload photos when grid has existing photos
- [ ] Drag and drop in both states
- [ ] Delete photos and verify upload zone remains
- [ ] Responsive grid behavior (2/3/4 columns)
- [ ] Upload progress indication
- [ ] Photo viewer still opens correctly
- [ ] Label editing still works
- [ ] Optimistic updates still function

## Files to Modify

1. `src/lib/components/assessment/EstimatePhotosPanel.svelte`
2. `src/lib/components/assessment/AdditionalsPhotosPanel.svelte`
3. `src/lib/components/assessment/PreIncidentPhotosPanel.svelte`

## Notes

- All panels use similar structure and can follow the same pattern
- Each panel has its own service (estimatePhotosService, additionalsPhotosService, preIncidentPhotosService)
- Photo viewer integration should remain unchanged
- Optimistic update patterns should remain unchanged
- No database changes required - this is UI-only refactoring

## Completion Criteria

- All three panels use single-card unified layout
- Upload zone appears as first grid item when photos exist
- Empty state shows large centered upload zone
- Title shows count only when photos exist
- All existing functionality preserved
- Responsive design maintained
- Consistent UX across all photo panels

