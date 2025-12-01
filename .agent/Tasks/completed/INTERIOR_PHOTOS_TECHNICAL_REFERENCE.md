# Interior Photos - Technical Reference
**Date**: November 9, 2025  
**Purpose**: Implementation guide for expanding interior photos to support unlimited uploads

---

## Current Implementation Pattern

### EstimatePhotosPanel Pattern (REFERENCE)

**Component**: `src/lib/components/assessment/EstimatePhotosPanel.svelte` (342 lines)

**Key Features**:
```svelte
<!-- Upload Zone -->
<div ondragenter={handleDragEnter} ondragover={handleDragOver} ondragleave={handleDragLeave} ondrop={handleDrop}>
  <input type="file" accept="image/*" multiple />
</div>

<!-- Photos Grid -->
{#each photos.value as photo, index (photo.id)}
  <button onclick={() => openPhotoViewer(index)}>
    <img src={storageService.toPhotoProxyUrl(photo.photo_url)} />
  </button>
{/each}

<!-- PhotoViewer -->
<PhotoViewer photos={photos.value} startIndex={selectedIndex} onClose={closePhotoViewer} />
```

**Upload Flow**:
1. User drops/selects files
2. Validate file type (image/*)
3. Upload to storage: `assessments/{assessmentId}/estimate/incident/{timestamp}.jpg`
4. Create photo record in `estimate_photos` table
5. Get next display order
6. Add to photos array
7. PhotoViewer displays with label editing

---

## Service Layer Pattern

### EstimatePhotosService (REFERENCE)

```typescript
class EstimatePhotosService {
  async getPhotosByEstimate(estimateId: string): Promise<EstimatePhoto[]> {
    const { data, error } = await supabase
      .from('estimate_photos')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    return data || [];
  }

  async createPhoto(input: CreateEstimatePhotoInput): Promise<EstimatePhoto> {
    const { data, error } = await supabase
      .from('estimate_photos')
      .insert({
        estimate_id: input.estimate_id,
        photo_url: input.photo_url,
        photo_path: input.photo_path,
        label: input.label || null,
        display_order: input.display_order || 0
      })
      .select()
      .single();
    return data;
  }

  async updatePhoto(id: string, input: UpdateEstimatePhotoInput): Promise<EstimatePhoto> {
    const { data, error } = await supabase
      .from('estimate_photos')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    return data;
  }

  async deletePhoto(id: string): Promise<void> {
    const { error } = await supabase
      .from('estimate_photos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getNextDisplayOrder(estimateId: string): Promise<number> {
    const { data } = await supabase
      .from('estimate_photos')
      .select('display_order')
      .eq('estimate_id', estimateId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    return data ? data.display_order + 1 : 0;
  }
}
```

---

## Database Schema Pattern

### EstimatePhotos Table (REFERENCE)

```sql
CREATE TABLE estimate_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES assessment_estimates(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_path TEXT NOT NULL,
  label TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_estimate_photos_estimate_id ON estimate_photos(estimate_id);
CREATE INDEX idx_estimate_photos_display_order ON estimate_photos(estimate_id, display_order);

ALTER TABLE estimate_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON estimate_photos
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

---

## Type Definitions

### EstimatePhoto Type (REFERENCE)

```typescript
export interface EstimatePhoto {
  id: string;
  estimate_id: string;
  photo_url: string;
  photo_path: string;
  label?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEstimatePhotoInput {
  estimate_id: string;
  photo_url: string;
  photo_path: string;
  label?: string;
  display_order?: number;
}

export interface UpdateEstimatePhotoInput {
  label?: string;
  display_order?: number;
}
```

---

## Storage Upload Pattern

### StorageService.uploadAssessmentPhoto()

```typescript
async uploadAssessmentPhoto(
  file: File,
  assessmentId: string,
  category: 'identification' | '360' | 'interior' | 'tyres' | 'damage' | 'estimate' | 'pre-incident',
  subcategory?: string
): Promise<UploadPhotoResult> {
  const folder = subcategory
    ? `assessments/${assessmentId}/${category}/${subcategory}`
    : `assessments/${assessmentId}/${category}`;

  return this.uploadPhoto(file, { folder });
}
```

**For Interior Photos**:
```typescript
// Single required photo
const result = await storageService.uploadAssessmentPhoto(
  file,
  assessmentId,
  'interior',
  'dashboard'  // or 'front', 'rear'
);

// Additional interior photos
const result = await storageService.uploadAssessmentPhoto(
  file,
  assessmentId,
  'interior',
  'additional'  // NEW
);
```

---

## Photo Viewer Integration

### PhotoViewer Component (REFERENCE)

```svelte
<PhotoViewer
  photos={photos.value}
  startIndex={selectedPhotoIndex}
  onClose={closePhotoViewer}
  onDelete={async (photoId: string, photoPath: string) => {
    await deletePhoto(photoId, photoPath);
    photos.value = photos.value.filter(p => p.id !== photoId);
  }}
/>
```

**Features**:
- Fullscreen viewing (bigger-picture library)
- Keyboard shortcuts (E for edit, Escape to close)
- Inline label editing
- Delete functionality
- Navigation tracking (prevents "wrong photo" bugs)

---

## Label Editing Pattern

### Inline Label Editing (Pattern 1: Fixed Bottom Bar)

```svelte
<!-- In PhotoViewer bottom bar -->
<input
  type="text"
  value={currentLabel}
  onchange={async (e) => {
    const newLabel = e.target.value;
    await photoService.updatePhoto(currentPhoto.id, { label: newLabel });
    currentPhoto.label = newLabel;  // Optimistic update
  }}
  placeholder="Add label..."
/>
```

**Optimistic Update Pattern**:
1. User types label
2. Update UI immediately (optimistic)
3. Send update to server
4. If error, revert UI

---

## Integration Points

### 1. InteriorMechanicalTab.svelte

**Current**:
```svelte
<PhotoUpload
  value={dashboardPhotoUrl}
  label="Dashboard"
  category="interior"
  subcategory="dashboard"
  onUpload={(url) => { dashboardPhotoUrl = url; handleSave(); }}
/>
```

**Add**:
```svelte
<!-- Keep required 3 photos above -->

<!-- Add new section for additional interior photos -->
<InteriorPhotosPanel
  assessmentId={assessmentId}
  onPhotosUpdate={handlePhotosUpdate}
/>
```

### 2. Page Load Function

```typescript
export const load: PageServerLoad = async ({ params, locals }) => {
  const assessment = await assessmentService.getById(params.id, locals.supabase);
  const interiorMechanical = await interiorMechanicalService.getByAssessment(params.id, locals.supabase);
  const interiorPhotos = await interiorPhotosService.getPhotosByAssessment(params.id, locals.supabase);
  
  return {
    assessment,
    interiorMechanical,
    interiorPhotos
  };
};
```

---

## Testing Checklist

- [ ] Upload single interior photo
- [ ] Upload multiple interior photos
- [ ] Drag-drop multiple files
- [ ] Edit photo label inline
- [ ] Delete photo
- [ ] Reorder photos (drag-drop)
- [ ] PhotoViewer displays correctly
- [ ] Keyboard shortcuts work (E, Escape)
- [ ] Photos persist after page reload
- [ ] Photos appear in photo zip export
- [ ] Photos appear in PDF report

---

## Related Documentation

- **Photo Component Development Skill**: `.claude/skills/photo-component-development/SKILL.md`
- **SOP: Photo Labeling Patterns**: `.agent/SOP/photo_labeling_patterns.md`
- **SOP: Working with Services**: `.agent/SOP/working_with_services.md`
- **System: Database Schema**: `.agent/System/database_schema.md`

---

**Status**: Ready for implementation  
**Complexity**: Medium (copy existing patterns)  
**Estimated Time**: 2-3 hours

