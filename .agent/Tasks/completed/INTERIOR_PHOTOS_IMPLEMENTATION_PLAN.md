# Interior Photos Expansion - Implementation Plan
**Date**: November 9, 2025  
**Status**: Ready to Execute  
**Estimated Time**: 3 hours  
**Complexity**: Medium (copy existing patterns)

---

## Overview

Implement unlimited interior photo uploads for assessments by creating a new `assessment_interior_photos` table (1:N relationship) and reusing the proven EstimatePhotosPanel pattern.

**Key Principle**: Copy existing patterns, don't reinvent. Follow EstimatePhotosPanel (342 lines) exactly.

---

## Implementation Phases

### Phase 1: Database Migration (30 minutes)

**Goal**: Create `assessment_interior_photos` table with RLS policies

**Tasks**:
1. ✅ Create migration file: `supabase/migrations/XXX_create_assessment_interior_photos.sql`
2. ✅ Define table schema (id, assessment_id FK, photo_url, photo_path, label, display_order, timestamps)
3. ✅ Add indexes (assessment_id, display_order)
4. ✅ Enable RLS with policy: "Allow all operations for authenticated users"
5. ✅ Add updated_at trigger
6. ✅ Apply migration via Supabase MCP

**Reference**: `supabase/migrations/019_create_estimate_photos.sql`

**SQL Template**:
```sql
CREATE TABLE IF NOT EXISTS assessment_interior_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_path TEXT NOT NULL,
  label TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interior_photos_assessment_id ON assessment_interior_photos(assessment_id);
CREATE INDEX idx_interior_photos_display_order ON assessment_interior_photos(assessment_id, display_order);

ALTER TABLE assessment_interior_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON assessment_interior_photos
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_assessment_interior_photos_updated_at
  BEFORE UPDATE ON assessment_interior_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### Phase 2: Service Layer (20 minutes)

**Goal**: Create `interior-photos.service.ts` with CRUD operations

**Tasks**:
1. ✅ Create `src/lib/services/interior-photos.service.ts`
2. ✅ Implement `getPhotosByAssessment(assessmentId, supabase)` - fetch all photos ordered by display_order
3. ✅ Implement `createPhoto(input, supabase)` - insert new photo record
4. ✅ Implement `updatePhoto(id, input, supabase)` - update label/display_order
5. ✅ Implement `deletePhoto(id, supabase)` - delete photo record
6. ✅ Implement `getNextDisplayOrder(assessmentId, supabase)` - get next display order value
7. ✅ Add ServiceClient parameter support (RLS authentication)

**Reference**: `src/lib/services/estimate-photos.service.ts`

**Key Changes**:
- Table: `estimate_photos` → `assessment_interior_photos`
- FK: `estimate_id` → `assessment_id`
- All methods accept `ServiceClient` parameter

---

### Phase 3: TypeScript Types (15 minutes)

**Goal**: Add type definitions to `assessment.ts`

**Tasks**:
1. ✅ Add `InteriorPhoto` interface
2. ✅ Add `CreateInteriorPhotoInput` interface
3. ✅ Add `UpdateInteriorPhotoInput` interface

**Reference**: `src/lib/types/assessment.ts` (EstimatePhoto interfaces)

**Type Definitions**:
```typescript
export interface InteriorPhoto {
  id: string;
  assessment_id: string;
  photo_url: string;
  photo_path: string;
  label?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInteriorPhotoInput {
  assessment_id: string;
  photo_url: string;
  photo_path: string;
  label?: string;
  display_order?: number;
}

export interface UpdateInteriorPhotoInput {
  label?: string;
  display_order?: number;
}
```

---

### Phase 4: UI Component (45 minutes)

**Goal**: Create `InteriorPhotosPanel.svelte` component

**Tasks**:
1. ✅ Create `src/lib/components/assessment/InteriorPhotosPanel.svelte`
2. ✅ Copy from `EstimatePhotosPanel.svelte` (342 lines)
3. ✅ Update imports: `estimatePhotosService` → `interiorPhotosService`
4. ✅ Implement drag-drop upload zone (single handler, no flicker)
5. ✅ Implement photo upload handler (storage: `interior/additional`)
6. ✅ Implement photo grid with thumbnails (2-4 columns responsive)
7. ✅ Integrate PhotoViewer component (fullscreen viewing)
8. ✅ Implement label update handler (optimistic updates)
9. ✅ Implement delete handler (storage + database)
10. ✅ Add props: `assessmentId` (required), `initialPhotos` (optional)
11. ✅ Add state: `photos`, `isDragging`, `uploadProgress`, `selectedPhotoIndex`

**Reference**: `src/lib/components/assessment/EstimatePhotosPanel.svelte`

**Key Changes**:
- Service: `estimatePhotosService` → `interiorPhotosService`
- Storage category: `estimate/incident` → `interior/additional`
- Props: `estimateId` → `assessmentId`

---

### Phase 5: Integration (30 minutes)

**Goal**: Add InteriorPhotosPanel to InteriorMechanicalTab

**Tasks**:
1. ✅ Update `InteriorMechanicalTab.svelte` - add InteriorPhotosPanel component
2. ✅ Update `+page.server.ts` - fetch interior photos in load function
3. ✅ Pass `data.interiorPhotos` to InteriorPhotosPanel
4. ✅ Add section header: "Additional Interior Photos"
5. ✅ Add spacing between required photos and additional photos sections

**Files to Modify**:
- `src/lib/components/assessment/InteriorMechanicalTab.svelte`
- `src/routes/(app)/assessments/[id]/+page.server.ts`

**Integration Code**:
```svelte
<!-- InteriorMechanicalTab.svelte -->

<!-- Keep existing 3 required photos -->
<Card class="p-6">
  <h3 class="mb-4 text-lg font-semibold text-gray-900">Interior Photos (Required)</h3>
  <div class="grid gap-4 md:grid-cols-3">
    <PhotoUpload value={interiorFrontPhotoUrl} label="Front Interior" ... />
    <PhotoUpload value={interiorRearPhotoUrl} label="Rear Interior" ... />
    <PhotoUpload value={dashboardPhotoUrl} label="Dashboard" ... />
  </div>
</Card>

<!-- Add new section for additional photos -->
<InteriorPhotosPanel
  assessmentId={data.assessment.id}
  initialPhotos={data.interiorPhotos}
/>
```

**Page Load Function**:
```typescript
// +page.server.ts
export const load: PageServerLoad = async ({ params, locals }) => {
  const assessment = await assessmentService.getById(params.id, locals.supabase);
  const interiorMechanical = await interiorMechanicalService.getByAssessment(params.id, locals.supabase);
  const interiorPhotos = await interiorPhotosService.getPhotosByAssessment(params.id, locals.supabase);
  
  return {
    assessment,
    interiorMechanical,
    interiorPhotos  // NEW
  };
};
```

---

### Phase 6: Testing & Verification (30 minutes)

**Goal**: Verify all functionality works correctly

**Test Checklist**:
- [ ] Upload single interior photo (drag-drop)
- [ ] Upload multiple photos at once (3-5 files)
- [ ] Click photo thumbnail → PhotoViewer opens fullscreen
- [ ] Keyboard navigation in PhotoViewer (arrows, Escape)
- [ ] Edit photo label (press E, type label, save)
- [ ] Delete photo (verify storage + database + UI update)
- [ ] RLS policies (test as admin/engineer, verify auth required)
- [ ] Page reload persistence (photos + labels persist)
- [ ] Photo ZIP export (interior photos included)
- [ ] PDF report generation (interior photos appear)
- [ ] No TypeScript errors (run `npm run check`)

---

## Files to Create (3 files)

1. **`supabase/migrations/XXX_create_assessment_interior_photos.sql`** (~50 lines)
   - Table definition
   - Indexes
   - RLS policies
   - Trigger

2. **`src/lib/services/interior-photos.service.ts`** (~150 lines)
   - Copy from `estimate-photos.service.ts`
   - Change table/FK names
   - Add ServiceClient parameters

3. **`src/lib/components/assessment/InteriorPhotosPanel.svelte`** (~350 lines)
   - Copy from `EstimatePhotosPanel.svelte`
   - Change service imports
   - Update storage category

---

## Files to Modify (3 files)

1. **`src/lib/types/assessment.ts`** (+20 lines)
   - Add 3 interfaces

2. **`src/lib/components/assessment/InteriorMechanicalTab.svelte`** (+10 lines)
   - Add InteriorPhotosPanel component

3. **`src/routes/(app)/assessments/[id]/+page.server.ts`** (+2 lines)
   - Fetch interior photos

---

## Success Criteria

✅ **Database**: Table created with RLS policies  
✅ **Service**: All CRUD operations work  
✅ **Types**: No TypeScript errors  
✅ **UI**: Drag-drop upload works (no flicker)  
✅ **PhotoViewer**: Fullscreen viewing with label editing  
✅ **Delete**: Removes from storage + database + UI  
✅ **Persistence**: Photos persist after page reload  
✅ **Export**: Photos appear in ZIP/PDF exports

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking existing code | No changes to existing columns/tables |
| RLS issues | Copy proven RLS from estimate_photos |
| Performance | Indexes on assessment_id, display_order |
| Flicker on drag-drop | Single drag handler on parent (proven pattern) |
| Label editing bugs | Use PhotoViewer (proven component) |

---

## Next Steps

1. **Start with Phase 1** (Database Migration)
2. **Verify migration applied** via Supabase MCP
3. **Proceed sequentially** through phases 2-6
4. **Test thoroughly** before marking complete

---

**Status**: ✅ Ready to execute  
**Estimated Time**: 3 hours  
**Complexity**: Medium  
**Risk**: Low (proven patterns)

