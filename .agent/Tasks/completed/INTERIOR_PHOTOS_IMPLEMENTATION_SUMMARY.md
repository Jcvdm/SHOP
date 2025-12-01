# Interior Photos Expansion - Implementation Summary
**Date**: November 9, 2025  
**Status**: Context Complete - Ready for Implementation  
**Prepared by**: Claude-4 (Research & Documentation)

---

## What You're Asking For

**Current State**: Interior section has 3 required photos (dashboard, front interior, rear interior) stored as individual columns in `assessment_interior_mechanical` table.

**Desired State**: Keep the 3 required photos + add ability to upload unlimited additional interior photos (like EstimatePhotosPanel and AdditionalsPhotosPanel).

---

## Solution Overview

### Create New Table: `assessment_interior_photos`

**Pattern**: Same as `estimate_photos` and `assessment_additionals_photos`

```sql
CREATE TABLE assessment_interior_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_path TEXT NOT NULL,
  label TEXT,                    -- e.g., "Steering wheel", "Seats"
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Why This Approach**:
- ✅ Follows existing ClaimTech patterns (proven, tested)
- ✅ Unlimited photos (no column limit)
- ✅ Label support (engineers can describe photos)
- ✅ Display order (reorderable)
- ✅ Reuses existing components/services

---

## Implementation Checklist

### Phase 1: Database (1 file)
- [ ] Create migration: `XXX_create_assessment_interior_photos.sql`
  - Create table with indexes
  - Add RLS policies (same as estimate_photos)
  - Add comments

### Phase 2: Service Layer (1 file)
- [ ] Create `src/lib/services/interior-photos.service.ts`
  - Copy from `estimate-photos.service.ts`
  - Change table name to `assessment_interior_photos`
  - Change FK from `estimate_id` to `assessment_id`
  - Methods: getPhotosByAssessment, createPhoto, updatePhoto, deletePhoto, getNextDisplayOrder

### Phase 3: Types (1 file update)
- [ ] Update `src/lib/types/assessment.ts`
  - Add `InteriorPhoto` interface
  - Add `CreateInteriorPhotoInput` interface
  - Add `UpdateInteriorPhotoInput` interface

### Phase 4: UI Component (1 file)
- [ ] Create `src/lib/components/assessment/InteriorPhotosPanel.svelte`
  - Copy from `EstimatePhotosPanel.svelte`
  - Change service to `interior-photos.service.ts`
  - Change storage category to `interior/additional`
  - Change table name in queries

### Phase 5: Integration (1 file update)
- [ ] Update `src/lib/components/assessment/InteriorMechanicalTab.svelte`
  - Add `<InteriorPhotosPanel />` component
  - Pass `assessmentId` prop
  - Load photos in page load function

### Phase 6: Page Load (1 file update)
- [ ] Update `src/routes/(app)/assessments/[id]/+page.server.ts`
  - Fetch interior photos: `await interiorPhotosService.getPhotosByAssessment(assessmentId, locals.supabase)`
  - Pass to component

---

## Files to Create/Modify

### Create (3 files)
1. `supabase/migrations/XXX_create_assessment_interior_photos.sql` (50 lines)
2. `src/lib/services/interior-photos.service.ts` (150 lines - copy from estimate-photos)
3. `src/lib/components/assessment/InteriorPhotosPanel.svelte` (350 lines - copy from EstimatePhotosPanel)

### Modify (3 files)
1. `src/lib/types/assessment.ts` (add 3 interfaces)
2. `src/lib/components/assessment/InteriorMechanicalTab.svelte` (add component)
3. `src/routes/(app)/assessments/[id]/+page.server.ts` (add fetch)

---

## Key Design Decisions

### 1. Keep Required 3 Fields?
**YES** - `interior_front_photo_url`, `interior_rear_photo_url`, `dashboard_photo_url` remain in `assessment_interior_mechanical` as required fields.

### 2. New Table or JSONB?
**New Table** - Consistent with existing patterns (estimate_photos, additionals_photos, pre_incident_estimate_photos).

### 3. Label Support?
**YES** - Engineers can label photos (e.g., "Steering wheel", "Seats", "Headliner", "Trunk").

### 4. Display Order?
**YES** - Photos can be reordered via drag-drop in PhotoViewer.

### 5. Inline Label Editing?
**YES** - Use Pattern 1 (Fixed Bottom Bar) from photo-component-development skill.

---

## Component Reuse

### Copy From EstimatePhotosPanel:
- ✅ Drag-drop upload logic (no flicker)
- ✅ Multiple file handling
- ✅ PhotoViewer integration
- ✅ Label editing (inline)
- ✅ Display order management
- ✅ Delete functionality
- ✅ Styling and layout

### Changes:
- Table: `estimate_photos` → `assessment_interior_photos`
- Service: `estimate-photos.service.ts` → `interior-photos.service.ts`
- FK: `estimate_id` → `assessment_id`
- Storage: `estimate/incident` → `interior/additional`

---

## Skills & SOPs to Reference

### Skills
- **photo-component-development**: Pattern 1 (Fixed Bottom Bar) for PhotoViewer
- **supabase-development**: Service layer, RLS policies
- **claimtech-development**: SvelteKit integration

### SOPs
- **working_with_services.md**: Service layer implementation
- **photo_labeling_patterns.md**: Inline label editing
- **adding_migration.md**: Database migration creation
- **working_with_assessment_centric_architecture.md**: Assessment patterns

---

## Storage Path Structure

```
assessments/{assessment_id}/interior/
  dashboard_{timestamp}.jpg          (required - existing)
  front_{timestamp}.jpg              (required - existing)
  rear_{timestamp}.jpg               (required - existing)
  engine_bay_{timestamp}.jpg         (existing)
  battery_{timestamp}.jpg            (existing)
  ...
  additional_{timestamp}.jpg         (NEW - unlimited)
  additional_{timestamp}.jpg         (NEW - unlimited)
  additional_{timestamp}.jpg         (NEW - unlimited)
```

---

## Testing Checklist

- [ ] Upload single interior photo
- [ ] Upload multiple interior photos at once
- [ ] Drag-drop multiple files
- [ ] Edit photo label inline
- [ ] Delete photo
- [ ] Reorder photos (drag-drop)
- [ ] PhotoViewer displays correctly
- [ ] Keyboard shortcuts work (E, Escape)
- [ ] Photos persist after page reload
- [ ] Photos appear in photo zip export
- [ ] Photos appear in PDF report
- [ ] RLS policies work correctly

---

## Estimated Effort

- **Database**: 30 minutes (migration + RLS)
- **Service**: 20 minutes (copy + modify)
- **Types**: 15 minutes (add interfaces)
- **Component**: 45 minutes (copy + modify)
- **Integration**: 30 minutes (add to tab + load function)
- **Testing**: 30 minutes (manual testing)

**Total**: ~3 hours

---

## Next Steps

1. **Confirm approach** - Is this the right direction?
2. **Review reference docs** - Check EstimatePhotosPanel pattern
3. **Create migration** - Start with database
4. **Create service** - Copy from estimate-photos.service.ts
5. **Create component** - Copy from EstimatePhotosPanel.svelte
6. **Integrate** - Add to InteriorMechanicalTab
7. **Test** - Verify all functionality

---

## Reference Documents Created

1. **INTERIOR_PHOTOS_EXPANSION_CONTEXT_ANALYSIS.md** - High-level overview
2. **INTERIOR_PHOTOS_TECHNICAL_REFERENCE.md** - Implementation details
3. **INTERIOR_PHOTOS_IMPLEMENTATION_SUMMARY.md** - This document

---

**Status**: ✅ Context gathering complete  
**Ready for**: Implementation phase  
**Complexity**: Medium (copy existing patterns)  
**Risk**: Low (proven patterns)

---

**Prepared by**: Claude-4 (Research & Documentation)  
**Date**: November 9, 2025

