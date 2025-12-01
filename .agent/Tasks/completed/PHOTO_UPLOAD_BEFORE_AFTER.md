# PhotoUpload Component - Before & After Comparison

## File Size Comparison

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Total Lines** | 494 | 362 | -132 (-27%) |
| **Script Lines** | ~230 | ~185 | -45 (-20%) |
| **Template Lines** | ~260 | ~175 | -85 (-33%) |
| **Imports** | 5 | 4 | -1 |
| **State Variables** | 10 | 7 | -3 |
| **Functions** | 15 | 12 | -3 |

---

## Code Structure Comparison

### Imports

**BEFORE**:
```typescript
import { Button } from '$lib/components/ui/button';
import * as Dialog from '$lib/components/ui/dialog';
import { Camera, Upload, X, Loader2, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from 'lucide-svelte';
import { storageService } from '$lib/services/storage.service';
```

**AFTER**:
```typescript
import { Button } from '$lib/components/ui/button';
import { Camera, Upload, X, Loader2 } from 'lucide-svelte';
import { storageService } from '$lib/services/storage.service';
import PhotoViewer from '$lib/components/photo-viewer/PhotoViewer.svelte';
```

---

### State Variables

**BEFORE**:
```typescript
let uploading = $state(false);
let uploadProgress = $state(0);
let error = $state<string | null>(null);
let isDragging = $state(false);
let fileInput: HTMLInputElement;
let cameraInput: HTMLInputElement;
let displayUrl = $state<string | null>(null);

// Modal state (removed)
let showModal = $state(false);
let photoZoom = $state<number>(1);
let modalSize = $state<'small' | 'medium' | 'large' | 'fullscreen'>('medium');
let modalSizeClass = $derived(...); // 10 lines
```

**AFTER**:
```typescript
let uploading = $state(false);
let uploadProgress = $state(0);
let error = $state<string | null>(null);
let isDragging = $state(false);
let fileInput: HTMLInputElement;
let cameraInput: HTMLInputElement;
let displayUrl = $state<string | null>(null);

// Photo viewer state (simplified)
let selectedPhotoIndex = $state<number | null>(null);
```

---

### Drag Handlers

**BEFORE** (Complex):
```typescript
function handleDragEnter(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  // Set dropEffect to 'copy' to show the correct cursor
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
  isDragging = true;
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  // Set dropEffect to 'copy' to show the correct cursor
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
  isDragging = true;
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();

  // Only set isDragging to false if we're actually leaving the drop zone
  // Check if the related target (where we're going) is NOT a child of the current target
  const target = event.currentTarget as HTMLElement;
  const relatedTarget = event.relatedTarget as HTMLElement | null;

  // If relatedTarget is null or not contained within the drop zone, we're leaving
  if (!relatedTarget || !target.contains(relatedTarget)) {
    isDragging = false;
  }
}
```

**AFTER** (Simple):
```typescript
function handleDragEnter(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  isDragging = true;
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  isDragging = false;
}
```

---

### Photo Viewer Functions

**BEFORE** (Custom Modal):
```typescript
// Modal functions
function openPhotoModal() {
  showModal = true;
  photoZoom = 1;
  modalSize = 'medium';
}

function closePhotoModal() {
  showModal = false;
  photoZoom = 1;
  modalSize = 'medium';
}

function zoomIn() {
  photoZoom = Math.min(3, photoZoom + 0.25);
}

function zoomOut() {
  photoZoom = Math.max(0.5, photoZoom - 0.25);
}

function resetZoom() {
  photoZoom = 1;
}
```

**AFTER** (PhotoViewer):
```typescript
// Photo viewer functions
function openPhotoViewer() {
  selectedPhotoIndex = 0;
}

function closePhotoViewer() {
  selectedPhotoIndex = null;
}
```

---

### Upload Area Template

**BEFORE** (Overlapping Handlers):
```svelte
<div
  class="flex gap-2"
  role="button"
  tabindex="0"
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <button
    type="button"
    class="..."
    onclick={triggerCameraInput}
    ondragenter={handleDragEnter}  <!-- DUPLICATE -->
    ondragover={handleDragOver}    <!-- DUPLICATE -->
    ondragleave={handleDragLeave}  <!-- DUPLICATE -->
    ondrop={handleDrop}            <!-- DUPLICATE -->
    disabled={disabled || uploading}
  >
    <!-- Content -->
  </button>

  <button
    type="button"
    class="..."
    onclick={triggerFileInput}
    ondragenter={handleDragEnter}  <!-- DUPLICATE -->
    ondragover={handleDragOver}    <!-- DUPLICATE -->
    ondragleave={handleDragLeave}  <!-- DUPLICATE -->
    ondrop={handleDrop}            <!-- DUPLICATE -->
    disabled={disabled || uploading}
  >
    <!-- Content -->
  </button>
</div>
```

**AFTER** (Clean Handlers):
```svelte
<div
  class="flex gap-2"
  role="region"
  aria-label="Photo upload area"
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <button
    type="button"
    class="..."
    onclick={triggerCameraInput}
    disabled={disabled || uploading}
  >
    <!-- Content -->
  </button>

  <button
    type="button"
    class="..."
    onclick={triggerFileInput}
    disabled={disabled || uploading}
  >
    <!-- Content -->
  </button>
</div>
```

---

### Photo Viewer Component

**BEFORE** (Custom Dialog Modal - 101 lines):
```svelte
{#if showModal && currentPhotoUrl}
  <Dialog.Root open={showModal} onOpenChange={closePhotoModal}>
    <Dialog.Content class={modalSizeClass}>
      <Dialog.Header>
        <div class="flex items-center justify-between">
          <Dialog.Title>{label || 'Photo Preview'}</Dialog.Title>
          
          <div class="flex items-center gap-2">
            <!-- Zoom Controls -->
            <div class="flex gap-1">
              <Button variant="ghost" size="sm" onclick={zoomOut}>
                <ZoomOut class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onclick={resetZoom}>
                <RotateCcw class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onclick={zoomIn}>
                <ZoomIn class="h-4 w-4" />
              </Button>
            </div>
            
            <!-- Size Controls (S/M/L/Fullscreen) -->
            <!-- ... 40+ more lines ... -->
          </div>
        </div>
      </Dialog.Header>
      
      <!-- Large Photo with Zoom -->
      <div class="bg-gray-100 rounded-lg flex items-center justify-center p-4 overflow-auto">
        <img
          src={currentPhotoUrl}
          alt={label || 'Full size photo'}
          class="w-full h-auto max-h-[60vh] object-contain transition-transform duration-200"
          style="transform: scale({photoZoom})"
        />
      </div>
      
      <!-- Action Buttons -->
      <!-- ... 20+ more lines ... -->
    </Dialog.Content>
  </Dialog.Root>
{/if}
```

**AFTER** (PhotoViewer Component - 24 lines):
```svelte
{#if selectedPhotoIndex !== null && currentPhotoUrl}
  <PhotoViewer
    photos={[
      {
        id: 'current-photo',
        photo_url: value || '',
        photo_path: value || '',
        label: label || 'Photo',
        display_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any
    ]}
    startIndex={0}
    onClose={closePhotoViewer}
    onDelete={onRemove
      ? async (photoId: string, photoPath: string) => {
          handleRemove();
          closePhotoViewer();
        }
      : async () => {}}
  />
{/if}
```

---

## Key Improvements

### 1. **Drag-and-Drop Flicker Fixed** ✅
- **Before**: 3 overlapping drag handlers (parent + 2 buttons) = flicker
- **After**: 1 drag handler (parent only) = smooth

### 2. **Code Simplification** ✅
- **Before**: 494 lines with custom modal logic
- **After**: 362 lines reusing PhotoViewer

### 3. **Consistent UX** ✅
- **Before**: Different photo viewer than EstimatePhotosPanel
- **After**: Same PhotoViewer across all components

### 4. **Better Accessibility** ✅
- **Before**: `role="button"` on drag-drop div
- **After**: `role="region"` with `aria-label`

### 5. **Maintainability** ✅
- **Before**: Custom modal code to maintain
- **After**: Reuses proven component

---

**Date**: November 9, 2025  
**Status**: ✅ Complete

