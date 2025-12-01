# Photo Upload Refactoring - Quick Reference

**Date**: November 23, 2025  
**Quick Lookup**: Copy-paste patterns for Interior & Tyres panels

---

## 📋 What to Transfer

### ✅ MUST TRANSFER (Critical)
1. **Compression** - Add progress callbacks to uploadAssessmentPhoto()
2. **FileUploadProgress** - Replace custom progress bars
3. **Rose Theme** - Update all blue colors to rose

### ✅ SHOULD TRANSFER (High Priority)
4. **Camera Input** - Add capture="environment" file input
5. **Two-Phase Progress** - Show compression + upload separately
6. **ARIA Attributes** - Add role, tabindex, aria-label

### ⚠️ OPTIONAL (Nice to Have)
7. **Error Handling** - Better error messages
8. **Keyboard Navigation** - Handle Enter/Space on upload zone

---

## 🎯 Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| InteriorPhotosPanel.svelte | 382 | Add compression, progress, camera, theme |
| TyrePhotosPanel.svelte | 255 | Add compression, progress, camera, theme |

---

## 🔄 State Variables to Add

```typescript
// Add to both panels
let compressing = $state(false);
let compressionProgress = $state(0);
let cameraInput: HTMLInputElement;
```

---

## 📦 Imports to Add

```typescript
import { FileUploadProgress } from '$lib/components/ui/progress';
```

---

## 🎨 Color Changes

**Find & Replace in both files:**
- `text-blue-600` → `text-rose-600`
- `text-blue-500` → `text-rose-500`
- `bg-blue-50` → `bg-rose-50`
- `bg-blue-500` → `bg-rose-500`
- `border-blue-500` → `border-rose-500`

---

## 💻 Code Patterns

### Pattern 1: Update uploadFiles() Function
```typescript
async function uploadFiles(files: File[]) {
  uploading = true;
  uploadProgress = 0;
  compressing = true;  // ADD THIS
  compressionProgress = 0;  // ADD THIS

  try {
    const totalFiles = files.length;
    let completedFiles = 0;

    for (const file of files) {
      const result = await storageService.uploadAssessmentPhoto(
        file,
        assessmentId,
        'interior', // or 'tyres'
        'additional', // or tyrePosition
        {  // ADD THIS BLOCK
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
      // ... rest of code
    }
  } finally {
    uploading = false;
    compressing = false;  // ADD THIS
    uploadProgress = 0;
    compressionProgress = 0;  // ADD THIS
  }
}
```

### Pattern 2: Replace Progress Bar
**REMOVE:**
```svelte
<div class="space-y-3">
  <Loader2 class="mx-auto h-12 w-12 text-blue-600 animate-spin" />
  <p class="text-sm font-medium text-gray-700">Uploading photos...</p>
  <div class="w-full bg-gray-200 rounded-full h-2">
    <div class="h-full bg-blue-500 transition-all duration-300 rounded-full"
      style="width: {uploadProgress}%"></div>
  </div>
  <p class="text-xs text-gray-500">{uploadProgress}%</p>
</div>
```

**REPLACE WITH:**
```svelte
<FileUploadProgress
  isCompressing={compressing}
  isUploading={uploading}
  compressionProgress={compressionProgress}
  uploadProgress={uploadProgress}
  fileName=""
/>
```

### Pattern 3: Add Camera Input
```svelte
<!-- Add to template alongside file input -->
<input
  bind:this={cameraInput}
  type="file"
  accept="image/*"
  capture="environment"
  multiple
  onchange={handleFileSelect}
  class="hidden"
/>

<!-- Add function to script -->
function triggerCameraInput() {
  cameraInput?.click();
}
```

---

## ✅ Verification Steps

1. **Build Check**: `npm run check` → 0 errors
2. **Visual Check**: Rose theme colors visible
3. **Compression**: Upload 5MB file, verify compression progress
4. **Progress**: See "Compressing..." then "Uploading..."
5. **Mobile**: Test camera input on mobile device
6. **Accessibility**: Tab through upload zone, press Enter/Space

---

## 📊 Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Photo Size | ~5MB | ~1.8MB |
| Progress Feedback | Basic | Two-phase |
| Theme | Blue | Rose |
| Mobile Support | File only | Camera + File |
| Accessibility | Basic | Full ARIA |


