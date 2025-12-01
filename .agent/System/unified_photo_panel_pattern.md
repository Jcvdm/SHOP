# Unified Photo Panel Pattern

**Created**: January 2025
**Status**: Active Standard
**Related**: [photo_labeling_patterns.md](../SOP/photo_labeling_patterns.md), [photo_labeling_implementation_nov_6_2025.md](./photo_labeling_implementation_nov_6_2025.md), [database_schema.md](./database_schema.md)

---

## Overview

The unified photo panel pattern consolidates photo upload and gallery display into a single card component, replacing the previous two-panel approach (separate upload zone and photo gallery). This pattern provides a cleaner, more intuitive user experience and consistent UI across all photo sections.

**Implemented in:**
- `InteriorPhotosPanel.svelte` - Interior photos
- `EstimatePhotosPanel.svelte` - Incident/estimate photos
- `PreIncidentPhotosPanel.svelte` - Pre-incident estimate photos
- `AdditionalsPhotosPanel.svelte` - Additional photos
- `Exterior360PhotosPanel.svelte` - Exterior 360-degree photos
- `TyrePhotosPanel.svelte` - Tyre photos (per-tyre panels, unlimited photos)

---

## Pattern Structure

### Single Card Layout

All photo panels use a single `Card` component that contains both:
1. **Upload Zone** - Conditionally rendered based on photo count
2. **Photo Gallery** - Grid display of uploaded photos

### Conditional Rendering

#### Empty State (No Photos)
- **Large centered upload zone** - Full-width, prominent upload area
- **Title**: "Section Name" (e.g., "Interior Photos")
- **Upload UI**: Large drag-and-drop zone with icon and instructions

#### With Photos
- **Compact upload zone** - First grid item, same size as photo thumbnails
- **Title**: "Section Name (N)" - Shows photo count (e.g., "Interior Photos (6)")
- **Grid layout**: Upload zone + photo thumbnails in responsive grid

---

## Component Architecture

### Props Interface

```typescript
interface Props {
    assessmentId: string;  // Or estimateId/additionalsId depending on context
    photos: Photo[];       // Array of photo objects
    onUpdate: () => void;  // Callback to refresh photos from parent
}
```

### Photo Type Structure

All photo types follow the same structure:
```typescript
interface Photo {
    id: string;
    photo_url: string;
    photo_path: string;
    label?: string | null;
    display_order: number;
    created_at: string;
    updated_at: string;
}
```

### State Management

```typescript
// Optimistic array for immediate UI updates
const photos = useOptimisticArray(props.photos);

// Upload state
let uploading = $state(false);
let uploadProgress = $state(0);
let isDragging = $state(false);

// Photo viewer state
let selectedPhotoIndex = $state<number | null>(null);
```

---

## Implementation Pattern

### 1. Card Structure

```svelte
<Card class="p-6">
    <h3 class="mb-4 text-lg font-semibold text-gray-900">
        {photos.value.length === 0 
            ? 'Section Name' 
            : `Section Name (${photos.value.length})`}
    </h3>

    {#if photos.value.length === 0}
        <!-- Empty state: Large centered upload zone -->
        <div class="border-2 border-dashed rounded-lg p-8 text-center">
            <!-- Upload UI -->
        </div>
    {:else}
        <!-- Grid with upload zone as first item -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <!-- Compact upload zone -->
            <div class="aspect-square border-2 border-dashed rounded-lg">
                <!-- Upload UI -->
            </div>
            
            <!-- Photo thumbnails -->
            {#each photos.value as photo, index (photo.id)}
                <!-- Thumbnail -->
            {/each}
        </div>
    {/if}
</Card>
```

### 2. Upload Functionality

- **Drag & Drop**: Full drag-and-drop support with visual feedback
- **File Input**: Click to browse files
- **Multiple Files**: Supports batch uploads
- **Progress Tracking**: Shows upload progress during upload
- **Optimistic Updates**: Immediate UI feedback before server confirmation

### 3. Photo Operations

- **View**: Click thumbnail to open PhotoViewer
- **Delete**: Delete button on thumbnail with confirmation
- **Label Edit**: Edit labels inline in PhotoViewer
- **Reorder**: Automatic ordering via `display_order`

---

## Database Tables

All photo panels use dedicated tables following the same pattern:

| Panel | Table | Service |
|-------|-------|---------|
| Interior | `assessment_interior_photos` | `interior-photos.service.ts` |
| Estimate | `estimate_photos` | `estimate-photos.service.ts` |
| Pre-Incident | `pre_incident_estimate_photos` | `pre-incident-estimate-photos.service.ts` |
| Additionals | `assessment_additionals_photos` | `additionals-photos.service.ts` |
| Exterior 360 | `assessment_exterior_360_photos` | `exterior-360-photos.service.ts` |

**Common Schema:**
- `id` (UUID, PK)
- `assessment_id` / `estimate_id` / `additionals_id` (FK)
- `photo_url` (TEXT, NOT NULL)
- `photo_path` (TEXT, NOT NULL)
- `label` (TEXT, nullable)
- `display_order` (INTEGER, DEFAULT 0)
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

## Migration from Legacy Systems

### Exterior 360 Photos (Jan 2025)

**Before:**
- 8-position photo upload system (`front_photo_url`, `front_left_photo_url`, etc.)
- Separate "Additional Exterior Photos" panel
- Photo URLs stored directly in `assessment_360_exterior` table

**After:**
- Single unified `Exterior360PhotosPanel`
- All photos stored in `assessment_exterior_360_photos` table
- Legacy columns removed (Migration 081)

**Migration Path:**
- Migration 079: Created `assessment_exterior_360_photos` table
- Migration 080: Diagnostic queries to check for existing data
- Migration 081: Data migration + column removal

### Interior Photos (Previous)

**Before:**
- Photo URLs in `assessment_interior_mechanical` table
- Separate "Interior Photos (Required)" section

**After:**
- Single unified `InteriorPhotosPanel`
- All photos in `assessment_interior_photos` table
- Legacy columns removed (Migration 078)

---

## Validation Updates

### Exterior 360 Validation

**Before:**
```typescript
validateExterior360(data: any): TabValidation {
    // Check for front_photo_url, rear_photo_url, left_photo_url, right_photo_url
}
```

**After:**
```typescript
validateExterior360(data: any, exterior360Photos: any[] = []): TabValidation {
    // Require at least 4 exterior photos
    if (exterior360Photos.length < 4) {
        missingFields.push(`At least 4 exterior photos (currently ${exterior360Photos.length})`);
    }
}
```

### Interior Validation

Similar pattern - validation now accepts photos array as separate parameter:
```typescript
validateInteriorMechanical(data: any, interiorPhotos: any[] = []): TabValidation {
    if (interiorPhotos.length < 2) {
        missingFields.push('At least 2 interior photos');
    }
}
```

---

## Benefits

1. **Consistent UX**: All photo sections use the same pattern
2. **Cleaner UI**: Single card instead of two separate panels
3. **Better Mobile Experience**: Responsive grid adapts to screen size
4. **Easier Maintenance**: Single component pattern to maintain
5. **Flexible Upload**: Upload zone adapts to context (large when empty, compact when photos exist)
6. **Clear Feedback**: Dynamic title shows photo count

---

## Related Documentation

- **[Photo Labeling Patterns](../SOP/photo_labeling_patterns.md)** - Inline label editing patterns
- **[Photo Labeling Implementation](./photo_labeling_implementation_nov_6_2025.md)** - Full implementation details
- **[Database Schema](./database_schema.md)** - Photo table schemas
- **[Creating Components](../SOP/creating-components.md)** - Component development guide

---

*Last Updated: January 2025*

