# Interior Photos Expansion - Context Analysis
**Date**: November 9, 2025  
**Status**: Context Gathering Complete  
**Prepared for**: Claude-4 (Research & Documentation)

---

## Executive Summary

You want to **expand the Interior section to support unlimited interior photos** (not just the 3 required: dashboard, front interior, rear interior), similar to how **EstimatePhotosPanel** and **AdditionalsPhotosPanel** handle multiple photos.

**Current State**: 9 individual photo fields in `assessment_interior_mechanical` table  
**Desired State**: Keep required 3 fields + add flexible multi-photo gallery for additional interior shots

---

## Current Architecture

### Database: `assessment_interior_mechanical` (1:1 with assessments)

**Current Photo Fields** (9 total):
```sql
engine_bay_photo_url TEXT
battery_photo_url TEXT
oil_level_photo_url TEXT
coolant_photo_url TEXT
mileage_photo_url TEXT
interior_front_photo_url TEXT          -- REQUIRED
interior_rear_photo_url TEXT           -- REQUIRED
dashboard_photo_url TEXT               -- REQUIRED
gear_lever_photo_url TEXT
```

**Problem**: Each photo is a separate column. To add more interior photos, you'd need to add more columns (not scalable).

---

## Reference Implementations

### 1. **EstimatePhotosPanel** (Multiple photos per estimate)
- **Table**: `estimate_photos` (1:N with `assessment_estimates`)
- **Pattern**: Separate table with `display_order` and `label`
- **Features**: 
  - Unlimited photos
  - Drag-drop upload
  - Label editing (inline)
  - PhotoViewer integration
  - Display order management

### 2. **AdditionalsPhotosPanel** (Multiple photos per additional)
- **Table**: `assessment_additionals_photos` (1:N with `assessment_additionals`)
- **Pattern**: Same as EstimatePhotosPanel
- **Features**: Same as above

### 3. **PreIncidentPhotosPanel** (Multiple photos per pre-incident estimate)
- **Table**: `pre_incident_estimate_photos` (1:N with `pre_incident_estimates`)
- **Pattern**: Same as EstimatePhotosPanel
- **Features**: Same as above

---

## Proposed Solution

### Option A: Create `assessment_interior_photos` Table (RECOMMENDED)

**New Table Structure**:
```sql
CREATE TABLE assessment_interior_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_path TEXT NOT NULL,
  label TEXT,                    -- e.g., "Steering wheel", "Seats", "Headliner"
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interior_photos_assessment ON assessment_interior_photos(assessment_id);
CREATE INDEX idx_interior_photos_order ON assessment_interior_photos(assessment_id, display_order);
```

**Benefits**:
- ✅ Unlimited interior photos
- ✅ Follows existing pattern (EstimatePhotosPanel, AdditionalsPhotosPanel)
- ✅ Scalable (no column additions needed)
- ✅ Label support for photo descriptions
- ✅ Display order management
- ✅ Reuses existing services/components

**Keep Existing Fields**:
- `interior_front_photo_url` - Required field (main front view)
- `interior_rear_photo_url` - Required field (main rear view)
- `dashboard_photo_url` - Required field (dashboard view)

---

## Implementation Approach

### Phase 1: Database
1. Create `assessment_interior_photos` migration
2. Add RLS policies (same as estimate_photos)
3. Create indexes for performance

### Phase 2: Service Layer
1. Create `interior-photos.service.ts` (copy from `estimate-photos.service.ts`)
2. Methods:
   - `getPhotosByAssessment(assessmentId)`
   - `createPhoto(input)`
   - `updatePhoto(id, input)`
   - `deletePhoto(id)`
   - `getNextDisplayOrder(assessmentId)`

### Phase 3: UI Component
1. Create `InteriorPhotosPanel.svelte` (copy from `EstimatePhotosPanel.svelte`)
2. Features:
   - Drag-drop upload
   - Multiple file support
   - Label editing (inline)
   - PhotoViewer integration
   - Delete functionality
   - Display order management

### Phase 4: Integration
1. Add to `InteriorMechanicalTab.svelte`
2. Load photos in page load function
3. Update types in `assessment.ts`

---

## Skills & SOPs to Reference

### Skills
- **photo-component-development**: Pattern 1 (Fixed Bottom Bar) for PhotoViewer
- **supabase-development**: Service layer, RLS policies, storage patterns
- **claimtech-development**: SvelteKit integration, form patterns

### SOPs
- **working_with_services.md**: Service layer implementation
- **photo_labeling_patterns.md**: Inline label editing (Pattern 1: Fixed Bottom Bar)
- **adding_migration.md**: Database migration creation
- **working_with_assessment_centric_architecture.md**: Assessment-centric patterns

---

## Key Decisions

### 1. Keep Required 3 Fields?
**YES** - Keep `interior_front_photo_url`, `interior_rear_photo_url`, `dashboard_photo_url` as required fields in `assessment_interior_mechanical`. These are mandatory for the assessment.

### 2. New Table or JSONB Array?
**New Table** - Follows existing pattern (estimate_photos, additionals_photos). JSONB would be inconsistent.

### 3. Label Support?
**YES** - Allow engineers to label photos (e.g., "Steering wheel", "Seats", "Headliner", "Trunk")

### 4. Display Order?
**YES** - Allow reordering photos via drag-drop

### 5. Inline Label Editing?
**YES** - Use Pattern 1 (Fixed Bottom Bar) from photo-component-development skill

---

## Storage Path Structure

**Existing**:
```
assessments/{assessment_id}/interior/
  dashboard_{timestamp}.jpg
  front_{timestamp}.jpg
  rear_{timestamp}.jpg
  engine_bay_{timestamp}.jpg
  battery_{timestamp}.jpg
  ...
```

**New** (for additional interior photos):
```
assessments/{assessment_id}/interior/
  additional_{timestamp}.jpg
  additional_{timestamp}.jpg
  ...
```

---

## Component Reuse

### Can Reuse From EstimatePhotosPanel:
- ✅ Drag-drop upload logic
- ✅ Multiple file handling
- ✅ PhotoViewer integration
- ✅ Label editing (inline)
- ✅ Display order management
- ✅ Delete functionality
- ✅ Styling and layout

### Differences:
- Different table (`assessment_interior_photos` vs `estimate_photos`)
- Different service (`interior-photos.service.ts` vs `estimate-photos.service.ts`)
- Different category in storage (`interior` vs `estimate`)

---

## Related Files

### Existing References
- `src/lib/components/assessment/EstimatePhotosPanel.svelte` (342 lines)
- `src/lib/components/assessment/AdditionalsPhotosPanel.svelte` (similar)
- `src/lib/services/estimate-photos.service.ts` (service template)
- `supabase/migrations/019_create_estimate_photos.sql` (migration template)

### New Files to Create
- `supabase/migrations/XXX_create_assessment_interior_photos.sql`
- `src/lib/services/interior-photos.service.ts`
- `src/lib/components/assessment/InteriorPhotosPanel.svelte`
- Update `src/lib/types/assessment.ts`

---

## Next Steps

1. **Confirm approach** - Is Option A (new table) acceptable?
2. **Design review** - Confirm UI/UX approach
3. **Implementation** - Create migration, service, component
4. **Integration** - Add to InteriorMechanicalTab
5. **Testing** - Verify upload, label editing, display order

---

**Prepared by**: Claude-4 (Research & Documentation)  
**Ready for**: Implementation phase

