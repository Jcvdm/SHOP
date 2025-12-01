# Interior Photos - Quick Reference Guide
**Date**: November 9, 2025  
**Purpose**: Fast lookup for implementation details

---

## File Locations

### Create (3 files)
```
supabase/migrations/XXX_create_assessment_interior_photos.sql
src/lib/services/interior-photos.service.ts
src/lib/components/assessment/InteriorPhotosPanel.svelte
```

### Modify (3 files)
```
src/lib/types/assessment.ts
src/lib/components/assessment/InteriorMechanicalTab.svelte
src/routes/(app)/assessments/[id]/+page.server.ts
```

---

## Reference Files (Copy From)

| File | Purpose | Lines |
|------|---------|-------|
| `supabase/migrations/019_create_estimate_photos.sql` | Migration template | 50 |
| `src/lib/services/estimate-photos.service.ts` | Service template | 150 |
| `src/lib/components/assessment/EstimatePhotosPanel.svelte` | Component template | 342 |
| `src/lib/types/assessment.ts` | Type definitions | 20 |

---

## Key Changes When Copying

### Migration
```
estimate_photos → assessment_interior_photos
estimate_id → assessment_id
```

### Service
```
estimatePhotosService → interiorPhotosService
estimate_photos → assessment_interior_photos
estimate_id → assessment_id
```

### Component
```
estimatePhotosService → interiorPhotosService
estimate/incident → interior/additional
estimateId → assessmentId
```

---

## Database Schema

```sql
CREATE TABLE assessment_interior_photos (
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
```

---

## Service Methods

```typescript
// Get all photos for assessment
getPhotosByAssessment(assessmentId: string, supabase: ServiceClient): Promise<InteriorPhoto[]>

// Create new photo
createPhoto(input: CreateInteriorPhotoInput, supabase: ServiceClient): Promise<InteriorPhoto>

// Update photo (label, display_order)
updatePhoto(id: string, input: UpdateInteriorPhotoInput, supabase: ServiceClient): Promise<InteriorPhoto>

// Delete photo
deletePhoto(id: string, supabase: ServiceClient): Promise<void>

// Get next display order
getNextDisplayOrder(assessmentId: string, supabase: ServiceClient): Promise<number>
```

---

## Type Definitions

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

## Component Props

```typescript
interface InteriorPhotosPanelProps {
  assessmentId: string;           // Required: assessment ID
  initialPhotos?: InteriorPhoto[]; // Optional: initial photos array
}
```

---

## Storage Path

```
assessments/{assessmentId}/interior/additional/{timestamp}.jpg
```

---

## Integration Code

### InteriorMechanicalTab.svelte
```svelte
<InteriorPhotosPanel
  assessmentId={data.assessment.id}
  initialPhotos={data.interiorPhotos}
/>
```

### +page.server.ts
```typescript
const interiorPhotos = await interiorPhotosService.getPhotosByAssessment(
  params.id,
  locals.supabase
);

return {
  // ... other data
  interiorPhotos
};
```

---

## RLS Policy

```sql
CREATE POLICY "Allow all operations for authenticated users" ON assessment_interior_photos
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

---

## Testing Checklist

- [ ] Upload single photo
- [ ] Upload multiple photos
- [ ] PhotoViewer opens
- [ ] Edit label
- [ ] Delete photo
- [ ] Page reload persistence
- [ ] RLS policies work
- [ ] No TypeScript errors

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Flicker on drag-drop | Single drag handler on parent (not buttons) |
| Photos not persisting | Check RLS policies, verify FK constraint |
| Label not updating | Use optimistic update pattern |
| Storage path wrong | Use `interior/additional` category |
| TypeScript errors | Check interface imports in service |

---

## Estimated Time

| Phase | Time |
|-------|------|
| Database | 30 min |
| Service | 20 min |
| Types | 15 min |
| Component | 45 min |
| Integration | 30 min |
| Testing | 30 min |
| **Total** | **~3 hours** |

---

## Skills & SOPs

- **photo-component-development**: Pattern 1 (Fixed Bottom Bar)
- **supabase-development**: Service layer, RLS policies
- **claimtech-development**: SvelteKit integration
- **SOP: working_with_services.md**
- **SOP: photo_labeling_patterns.md**
- **SOP: adding_migration.md**

---

## Success Indicators

✅ Table created with RLS  
✅ Service methods work  
✅ Component renders  
✅ Drag-drop uploads  
✅ PhotoViewer integrates  
✅ Labels editable  
✅ Delete works  
✅ Persistence verified  
✅ No TypeScript errors  
✅ Tests pass

---

**Status**: Ready to implement  
**Complexity**: Medium  
**Risk**: Low

