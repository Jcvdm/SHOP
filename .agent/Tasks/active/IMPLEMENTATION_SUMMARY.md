# Implementation Summary: Rose Theme Standardization

**Quick Reference for Implementation**

---

## WHAT NEEDS TO BE DONE

### 6 Components Need Updates:

1. **PhotoUpload.svelte** (355 lines)
   - Change 4 blue color references to rose
   - Already has FileUploadProgress ✅

2. **PreIncidentPhotosPanel.svelte** (361 lines)
   - Add Camera import + FileUploadProgress import
   - Add compression state variables
   - Update uploadFiles() with compression callbacks
   - Replace 2 custom blue progress bars with FileUploadProgress
   - Add Camera button + camera input element
   - Change drag colors blue → rose

3. **EstimatePhotosPanel.svelte** (~380 lines)
   - SAME as PreIncidentPhotosPanel

4. **AdditionalsPhotosPanel.svelte** (347 lines)
   - SAME as PreIncidentPhotosPanel

5. **Exterior360PhotosPanel.svelte** (380 lines)
   - SAME as PreIncidentPhotosPanel

6. **DocumentCard.svelte** (151 lines)
   - Change 8 blue color references to rose (lines 82-105)

---

## COLOR MAPPING

### Blue → Rose Conversion:
```
bg-blue-50    → bg-rose-50
bg-blue-200   → bg-rose-200
bg-blue-500   → bg-rose-500
bg-blue-600   → bg-rose-500 or bg-rose-600
text-blue-500 → text-rose-500
text-blue-600 → text-rose-600
text-blue-700 → text-rose-700
text-blue-900 → text-gray-900
border-blue-500 → border-rose-500
```

---

## PATTERN TO COPY

**From**: InteriorPhotosPanel.svelte (✅ Already done correctly)

### 1. Imports (lines 4, 10):
```svelte
import { Upload, Trash2, Camera } from 'lucide-svelte';
import { FileUploadProgress } from '$lib/components/ui/progress';
```

### 2. State Variables (~line 30):
```svelte
let compressing = $state(false);
let compressionProgress = $state(0);
let cameraInput: HTMLInputElement;
```

### 3. Upload Function with Callbacks (~line 60):
```svelte
const result = await storageService.uploadAssessmentPhoto(
    file,
    assessmentId,
    category,
    subcategory,
    {
        onCompressionProgress: (progress: number) => {
            compressing = true;
            uploading = false;
            compressionProgress = progress;
        },
        onUploadProgress: (progress: number) => {
            compressing = false;
            uploading = true;
            uploadProgress = progress;
        }
    }
);
```

### 4. FileUploadProgress Component (lines 267-276):
```svelte
<FileUploadProgress
    isCompressing={compressing}
    isUploading={uploading}
    compressionProgress={compressionProgress}
    uploadProgress={uploadProgress}
    fileName={file.name}
/>
```

### 5. Camera Button (lines 296-305):
```svelte
<Button
    variant="outline"
    size="sm"
    onclick={triggerCameraInput}
    disabled={uploading || compressing}
    class="flex items-center gap-2"
>
    <Camera class="h-4 w-4" />
    Camera
</Button>
```

### 6. Camera Input Element (lines 401-410):
```svelte
<input
    bind:this={cameraInput}
    type="file"
    accept="image/*"
    capture="environment"
    multiple
    onchange={handleFileSelect}
    class="hidden"
/>
```

---

## IMPLEMENTATION ORDER

### Recommended Sequence:
1. **PhotoUpload.svelte** (easiest - only color changes)
2. **DocumentCard.svelte** (easy - only color changes)
3. **PreIncidentPhotosPanel.svelte** (full pattern)
4. **EstimatePhotosPanel.svelte** (copy from PreIncident)
5. **AdditionalsPhotosPanel.svelte** (copy from PreIncident)
6. **Exterior360PhotosPanel.svelte** (copy from PreIncident)

### Time Estimates:
- PhotoUpload: 5 minutes
- DocumentCard: 5 minutes
- Each Photo Panel: 15-20 minutes
- **Total**: 1.5-2 hours

---

## VERIFICATION STEPS

After each component:
1. Save file
2. Run `npm run check`
3. Fix any TypeScript errors
4. Move to next component

After all components:
1. Run `npm run check` → 0 errors
2. Test in browser:
   - Upload photos in each tab
   - Generate documents
   - Verify rose theme everywhere
   - Verify compression progress shows
   - Test camera button on mobile

---

## FILES TO MODIFY

```
src/lib/components/forms/PhotoUpload.svelte
src/lib/components/assessment/PreIncidentPhotosPanel.svelte
src/lib/components/assessment/EstimatePhotosPanel.svelte
src/lib/components/assessment/AdditionalsPhotosPanel.svelte
src/lib/components/assessment/Exterior360PhotosPanel.svelte
src/lib/components/assessment/DocumentCard.svelte
```

---

## SUCCESS CRITERIA

✅ All photo uploads show rose theme  
✅ All photo uploads show compression progress  
✅ All photo uploads have camera button  
✅ All document generation shows rose theme  
✅ `npm run check` passes with 0 errors  
✅ No blue progress bars remain anywhere  

---

**Ready to implement!**

