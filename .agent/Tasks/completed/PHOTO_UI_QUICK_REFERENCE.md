# Photo UI Components - Quick Reference

**Date**: November 9, 2025  
**Purpose**: Quick lookup for photo component styling and structure

---

## Component Locations

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| **PhotoUpload** | `src/lib/components/forms/PhotoUpload.svelte` | 494 | Single photo upload + preview |
| **PreIncidentPhotosPanel** | `src/lib/components/assessment/PreIncidentPhotosPanel.svelte` | ~300 | Multi-photo upload |
| **PhotoViewer** | `src/lib/components/photo-viewer/PhotoViewer.svelte` | 346 | Fullscreen gallery (bigger-picture) |

---

## Current Styling Snippets

### Upload Button (PhotoUpload.svelte, lines 294-329)
```svelte
<button
  type="button"
  class="flex {height} flex-1 items-center justify-center rounded-lg border-2 border-dashed transition-all {isDragging
    ? 'border-blue-500 bg-blue-50'
    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'} disabled:cursor-not-allowed disabled:opacity-50"
  onclick={triggerCameraInput}
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  disabled={disabled || uploading}
>
  <div class="text-center pointer-events-none">
    {#if uploading}
      <!-- Uploading state -->
    {:else if isDragging}
      <Upload class="mx-auto h-8 w-8 text-blue-500" />
      <p class="mt-2 text-sm font-medium text-blue-600">Drop photo here</p>
    {:else}
      <Camera class="mx-auto h-8 w-8 text-gray-400" />
      <p class="mt-2 text-sm text-gray-600">Take Photo</p>
    {/if}
  </div>
</button>
```

### Preview Container (PhotoUpload.svelte, lines 244-282)
```svelte
{#if currentPhotoUrl}
  <div class="relative bg-gray-100 rounded-lg flex items-center justify-center group">
    <button
      type="button"
      onclick={openPhotoModal}
      class="w-full {height} rounded-lg overflow-hidden cursor-pointer"
    >
      <img
        src={currentPhotoUrl}
        alt={label || 'Photo'}
        class="w-full h-full object-contain hover:opacity-90 transition-opacity"
      />
    </button>
    {#if !disabled}
      <div class="absolute right-2 top-2 flex gap-2 z-10">
        <Button
          size="sm"
          variant="outline"
          class="bg-white"
          onclick={triggerFileInput}
          disabled={uploading}
        >
          Change
        </Button>
        {#if onRemove}
          <Button
            size="sm"
            variant="outline"
            class="bg-white"
            onclick={handleRemove}
            disabled={uploading}
          >
            <X class="h-4 w-4" />
          </Button>
        {/if}
      </div>
    {/if}
  </div>
{/if}
```

### Upload Progress (PhotoUpload.svelte, lines 307-318)
```svelte
{#if uploading}
  <div class="space-y-2">
    <Loader2 class="mx-auto h-8 w-8 animate-spin text-blue-500" />
    <p class="text-sm font-medium text-gray-700">Uploading...</p>
    <div class="mx-auto h-2 w-32 overflow-hidden rounded-full bg-gray-200">
      <div
        class="h-full bg-blue-500 transition-all duration-300"
        style="width: {uploadProgress}%"
      ></div>
    </div>
    <p class="text-xs text-gray-500">{uploadProgress}%</p>
  </div>
{/if}
```

---

## Tailwind Classes Used

### Colors
- **Grays**: `gray-50`, `gray-100`, `gray-300`, `gray-400`, `gray-600`, `gray-700`
- **Blues**: `blue-50`, `blue-500`, `blue-600`
- **White**: `bg-white`

### Sizing
- **Icons**: `h-8 w-8` (PhotoUpload), `h-12 w-12` (PreIncidentPhotosPanel)
- **Buttons**: `h-32` (upload area), `h-2` (progress bar)
- **Spacing**: `gap-2`, `gap-3`, `gap-4`

### Borders & Shapes
- **Borders**: `border-2 border-dashed`
- **Rounded**: `rounded-lg`, `rounded-xl`, `rounded-full`
- **Shadows**: `shadow-sm`

### Effects
- **Transitions**: `transition-all`, `transition-opacity`, `transition-transform`
- **Hover**: `hover:bg-gray-100`, `hover:opacity-90`
- **Animations**: `animate-spin`

---

## Design System Colors (from app.css)

```css
--primary: oklch(0.208 0.042 265.755);           /* Dark blue */
--primary-foreground: oklch(0.984 0.003 247.858); /* White */
--secondary: oklch(0.968 0.007 247.896);         /* Light gray */
--border: oklch(0.929 0.013 255.508);            /* Light gray */
--destructive: oklch(0.577 0.245 27.325);        /* Red */
```

---

## Icon Library (Lucide-svelte)

Used in photo components:
- `Camera` - Take photo
- `Upload` - Upload file
- `X` - Remove/close
- `Loader2` - Loading spinner
- `ZoomIn`, `ZoomOut` - Zoom controls
- `RotateCcw` - Reset zoom
- `Maximize2`, `Minimize2` - Fullscreen

---

## Component Props

### PhotoUpload Props
```typescript
interface Props {
  value?: string | null;
  label?: string;
  required?: boolean;
  assessmentId: string;
  category: 'identification' | '360' | 'interior' | 'tyres' | 'damage';
  subcategory?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  height?: string;  // Default: 'h-32'
}
```

---

## State Management

### PhotoUpload States
```typescript
let uploading = $state(false);
let uploadProgress = $state(0);
let error = $state<string | null>(null);
let isDragging = $state(false);
let displayUrl = $state<string | null>(null);  // Optimistic UI
let showModal = $state(false);
let photoZoom = $state<number>(1);
let modalSize = $state<'small' | 'medium' | 'large' | 'fullscreen'>('medium');
```

---

## Key Functions

### PhotoUpload
- `handleFileSelect()` - File input change
- `handleCameraCapture()` - Camera input change
- `handleDragEnter/Over/Leave/Drop()` - Drag & drop handlers
- `uploadFile()` - Upload to storage
- `openPhotoModal()` - Open preview modal
- `closePhotoModal()` - Close preview modal
- `triggerFileInput()` - Click file input
- `triggerCameraInput()` - Click camera input

---

## Related Patterns

### Photo Component Patterns
1. **Fixed Bottom Bar** - Fullscreen viewers (PhotoViewer)
2. **Modal Footer** - Dialog-based viewers (PhotoUpload)
3. **Thumbnail Overlay** - Inline galleries (PreIncidentPhotosPanel)

### Optimistic Updates
- Display URL immediately while uploading
- Update parent props after server response
- Revert on error

### Navigation Tracking
- Track current photo index
- Update label when navigating
- Prevent "wrong photo" bugs

---

## Testing Checklist

- [ ] Upload single photo
- [ ] Drag & drop photo
- [ ] View preview modal
- [ ] Change photo
- [ ] Remove photo
- [ ] Upload progress display
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Accessibility (ARIA labels)

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Photo not displaying | Wrong URL format | Use `storageService.toPhotoProxyUrl()` |
| Drag state not showing | Event not prevented | Add `event.preventDefault()` |
| Modal not closing | State not updated | Call `closePhotoModal()` |
| Upload stuck | Network error | Add error handling |
| Icon not visible | Wrong color | Check `text-gray-400` vs `text-blue-500` |

---

**Last Updated**: November 9, 2025  
**Status**: Ready for reference during implementation

