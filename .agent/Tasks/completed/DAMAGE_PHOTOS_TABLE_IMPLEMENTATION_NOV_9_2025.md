# Damage Photos Table Implementation - Nov 9, 2025

## ✅ Implementation Complete

Successfully created `assessment_damage_photos` table to replace the JSONB `photos` array in `assessment_damage` table.

---

## 📊 What Was Created

### 1. Database Migration
**File**: `supabase/migrations/078_create_assessment_damage_photos.sql`

**Table Structure**:
```sql
CREATE TABLE assessment_damage_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_path TEXT NOT NULL,
  label TEXT,                    -- Optional description (e.g., "Front impact damage")
  panel TEXT,                    -- Which panel (e.g., "Front Bumper", "Driver Door")
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Features**:
- ✅ Foreign key to assessments with CASCADE delete
- ✅ Indexes on `assessment_id` and `(assessment_id, display_order)`
- ✅ RLS enabled with authenticated user policy
- ✅ Auto-update trigger for `updated_at`
- ✅ Comprehensive column comments

**Applied to Production**: ✅ cfblmkzleqtvtfxujikf (main branch)

---

### 2. TypeScript Types
**File**: `src/lib/types/assessment.ts` (lines 865-890)

```typescript
export interface DamagePhoto {
  id: string;
  assessment_id: string;
  photo_url: string;
  photo_path: string;
  label?: string | null;
  panel?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDamagePhotoInput {
  assessment_id: string;
  photo_url: string;
  photo_path: string;
  label?: string | null;
  panel?: string | null;
  display_order?: number;
}

export interface UpdateDamagePhotoInput {
  label?: string | null;
  panel?: string | null;
  display_order?: number;
}
```

---

### 3. Service Layer
**File**: `src/lib/services/damage-photos.service.ts` (155 lines)

**Methods**:
- `getPhotosByAssessment(assessmentId)` - Fetch all photos for an assessment
- `createPhoto(input)` - Create a new photo
- `updatePhoto(photoId, input)` - Update label, panel, or display order
- `updatePhotoLabel(photoId, label)` - Update label only
- `updatePhotoPanel(photoId, panel)` - Update panel only
- `deletePhoto(photoId)` - Delete a photo
- `reorderPhotos(assessmentId, photoIds)` - Reorder photos
- `getNextDisplayOrder(assessmentId)` - Get next display order for new photo

**Pattern**: Follows same structure as `interior-photos.service.ts` and other photo services

---

## 🔄 Next Steps - UI Integration

### Phase 1: Create DamagePhotosPanel Component
**File to Create**: `src/lib/components/assessment/DamagePhotosPanel.svelte`

**Features Needed**:
- Drag-drop upload zone (reuse FileDropzone pattern)
- Photo grid with thumbnails
- PhotoViewer integration for fullscreen viewing
- Label editing with optimistic updates
- Panel field editing (dropdown or text input)
- Delete functionality with storage cleanup
- Reorder functionality (drag-drop)

**Reference Components**:
- `InteriorPhotosPanel.svelte` (342 lines) - Best reference
- `EstimatePhotosPanel.svelte` - Similar pattern
- `AdditionalsPhotosPanel.svelte` - Similar pattern

---

### Phase 2: Update DamageTab Component
**File to Modify**: `src/lib/components/assessment/DamageTab.svelte`

**Current State** (lines 283-324):
- Uses JSONB `photos` array: `Array<{ url: string; description: string; panel?: string }>`
- PhotoUpload component for uploading
- Stores photos in `damageRecord.photos` JSONB field

**Changes Needed**:
1. Add `damagePhotos` prop (from parent)
2. Add `onPhotosUpdate` callback prop
3. Replace PhotoUpload section with DamagePhotosPanel component
4. Remove JSONB photos handling
5. Pass `damagePhotos` and `onPhotosUpdate` to DamagePhotosPanel

**Example Integration**:
```svelte
<script lang="ts">
  import DamagePhotosPanel from './DamagePhotosPanel.svelte';
  import type { DamagePhoto } from '$lib/types/assessment';
  
  let { damagePhotos = [], onPhotosUpdate }: {
    damagePhotos?: DamagePhoto[];
    onPhotosUpdate?: () => Promise<void>;
  } = $props();
</script>

<!-- Replace existing PhotoUpload section -->
<DamagePhotosPanel 
  assessmentId={damageRecord.assessment_id}
  {damagePhotos}
  {onPhotosUpdate}
/>
```

---

### Phase 3: Update Page Server Load
**File to Modify**: `src/routes/(app)/work/assessments/[appointment_id]/+page.server.ts`

**Changes Needed**:
1. Import `damagePhotosService`
2. Fetch damage photos in load function
3. Add to return data

**Example**:
```typescript
import { damagePhotosService } from '$lib/services/damage-photos.service';

// In load function
const damagePhotos = await damagePhotosService.getPhotosByAssessment(
  assessment.id
);

return {
  // ... existing data
  damagePhotos
};
```

---

### Phase 4: Update Page Component
**File to Modify**: `src/routes/(app)/work/assessments/[appointment_id]/+page.svelte`

**Changes Needed**:
1. Add `damagePhotos` to data destructuring
2. Pass to DamageTab component
3. Add refresh handler for photo updates

**Example**:
```svelte
<script lang="ts">
  let { data } = $props();
  
  async function handleRefreshData() {
    // Reload damage photos after updates
    const response = await fetch(`/api/assessments/${data.assessment.id}/damage-photos`);
    data.damagePhotos = await response.json();
  }
</script>

<DamageTab
  damageRecord={data.damageRecord}
  damagePhotos={data.damagePhotos}
  onPhotosUpdate={handleRefreshData}
/>
```

---

### Phase 5: Update Export Functionality

**Files to Modify**:
1. `src/routes/api/generate-photos-pdf/+server.ts`
2. `src/routes/api/generate-photos-zip/+server.ts`

**Changes Needed**:
- Fetch from `assessment_damage_photos` table instead of JSONB
- Add "Damage Photos" section in PDF
- Add `04_Damage` folder in ZIP

**Example Query**:
```typescript
const { data: damagePhotos } = await supabase
  .from('assessment_damage_photos')
  .select('*')
  .eq('assessment_id', assessmentId)
  .order('display_order');
```

---

### Phase 6: Remove JSONB Column (After Testing)
**File to Create**: `supabase/migrations/079_remove_damage_photos_jsonb.sql`

**Only run after**:
1. ✅ UI fully integrated
2. ✅ All photos migrated (if any)
3. ✅ Exports updated
4. ✅ Thoroughly tested

```sql
-- Remove redundant JSONB column
ALTER TABLE assessment_damage DROP COLUMN IF EXISTS photos;
```

---

## 📋 Testing Checklist

### Database Tests
- [ ] Table created successfully
- [ ] Indexes created
- [ ] RLS policies working
- [ ] Triggers working (updated_at)
- [ ] Foreign key cascade delete works

### Service Layer Tests
- [ ] Create photo
- [ ] Fetch photos by assessment
- [ ] Update photo label
- [ ] Update photo panel
- [ ] Delete photo
- [ ] Reorder photos
- [ ] Get next display order

### UI Tests
- [ ] Upload damage photos
- [ ] View photos in fullscreen
- [ ] Edit photo labels
- [ ] Edit photo panels
- [ ] Delete photos
- [ ] Reorder photos (drag-drop)
- [ ] Photos persist after page reload

### Export Tests
- [ ] Damage photos appear in PDF
- [ ] Damage photos appear in ZIP
- [ ] Labels and panels display correctly

---

## 🎯 Benefits

### Before (JSONB)
- ❌ Unstructured data
- ❌ No RLS per photo
- ❌ Difficult to query
- ❌ No proper indexing
- ❌ Limited metadata

### After (Dedicated Table)
- ✅ Structured relational data
- ✅ RLS policies per photo
- ✅ Easy to query and filter
- ✅ Proper indexes for performance
- ✅ Rich metadata (label, panel, order)
- ✅ Consistent with other photo tables

---

## 📊 Implementation Stats

- **Migration**: 1 file (78 lines)
- **Types**: 3 interfaces (26 lines)
- **Service**: 1 file (155 lines)
- **Total**: 259 lines of code
- **Time to implement**: ~15 minutes
- **Risk level**: Low (no existing data to migrate)

---

## 🔗 Related Documentation

- `.agent/Tasks/completed/INTERIOR_PHOTOS_IMPLEMENTATION_COMPLETE_NOV_9_2025.md`
- `.agent/Tasks/completed/EXTERIOR_360_REDUNDANCY_DIAGNOSTIC_REPORT.md`
- `.agent/Tasks/active/DATABASE_REDUNDANCY_AUDIT_NOV_9_2025.md`

---

## ✅ Status: Database Layer Complete

**Next Action**: Create `DamagePhotosPanel.svelte` component (Phase 1)

