# Rose Theme Standardization

**Date**: November 23, 2025  
**Status**: ✅ COMPLETE - All 6 photo panels + document generation standardized  
**Build**: ✅ 0 errors

---

## Overview

Comprehensive standardization of the rose theme across all photo upload components and document generation progress indicators. Replaces inconsistent blue theme with unified rose color palette.

---

## Rose Theme Color Palette

### Tailwind Classes
- **Primary**: `rose-500`, `rose-600`, `rose-700`
- **Background**: `rose-50`, `rose-100`, `rose-200`
- **Text**: `text-rose-500`, `text-rose-600`, `text-rose-700`

### Color Mapping (Blue → Rose)
| Old (Blue) | New (Rose) |
|-----------|-----------|
| `border-blue-500` | `border-rose-500` |
| `bg-blue-50` | `bg-rose-50` |
| `bg-blue-200` | `bg-rose-200` |
| `text-blue-500` | `text-rose-500` |
| `text-blue-600` | `text-rose-600` |
| `text-blue-700` | `text-rose-700` |

---

## Components Updated

### 1. PhotoUpload.svelte
- **Type**: Single photo upload (Vehicle ID, Interior Mechanical)
- **Changes**: 4 color references updated
- **Features**: Compression, upload progress, camera input

### 2. DocumentCard.svelte
- **Type**: Individual document generation progress
- **Changes**: 8 color references updated
- **Features**: Rose theme progress indicator

### 3-6. Photo Panels (Full Pattern)
- **PreIncidentPhotosPanel.svelte**
- **EstimatePhotosPanel.svelte**
- **AdditionalsPhotosPanel.svelte**
- **Exterior360PhotosPanel.svelte**

**Changes per panel**:
- Camera import + FileUploadProgress import
- Compression state variables
- Upload callbacks (compression + upload progress)
- FileUploadProgress component (empty + grid states)
- Camera button + camera input element
- Rose theme colors throughout

---

## Key Features

### Two-Phase Progress Tracking
1. **Compression Phase**: "Compressing... X%"
2. **Upload Phase**: "Uploading... Y%"

### FileUploadProgress Component
Consistent progress UI with:
- Rose spinner (text-rose-500)
- Rose progress bar (bg-rose-100 fill)
- Dynamic status messages
- Percentage display

### Camera Input Support
- Mobile photo capture via `capture="environment"`
- Camera button on all photo panels
- Fallback to file browser

### Drag & Drop
- Rose theme colors for drag states
- `border-rose-500 bg-rose-50` when dragging
- Smooth transitions

---

## Implementation Pattern

All photo panels follow identical pattern:

```svelte
// 1. Imports
import { Camera } from 'lucide-svelte';
import { FileUploadProgress } from '$lib/components/ui/progress';

// 2. State
let compressing = $state(false);
let compressionProgress = $state(0);
let cameraInput: HTMLInputElement;

// 3. Upload function with callbacks
async function uploadFiles(files: File[]) {
  for (const file of files) {
    await storageService.uploadAssessmentPhoto(
      file, assessmentId, category, 'additional',
      {
        onCompressionProgress: (p) => { compressing = true; compressionProgress = p; },
        onUploadProgress: (p) => { uploading = true; uploadProgress = p; }
      }
    );
  }
}

// 4. UI with FileUploadProgress
{#if compressing || uploading}
  <FileUploadProgress
    isCompressing={compressing}
    isUploading={uploading}
    compressionProgress={compressionProgress}
    uploadProgress={uploadProgress}
    fileName=""
  />
{/if}
```

---

## Testing Checklist

- [ ] Interior Photos - Rose theme + compression progress
- [ ] Tyres Photos - Rose theme + compression progress
- [ ] Pre-Incident Photos - Rose theme + compression progress
- [ ] Estimate Photos - Rose theme + compression progress
- [ ] Additionals Photos - Rose theme + compression progress
- [ ] Exterior 360 Photos - Rose theme + compression progress
- [ ] Document Cards - Rose theme progress
- [ ] Camera button on mobile
- [ ] Drag & drop with rose colors

---

## Related Documentation

- [Photo Compression Implementation](./photo_compression_implementation.md)
- [Unified Photo Panel Pattern](./unified_photo_panel_pattern.md)
- [UI Loading Patterns](./ui_loading_patterns.md)

