# Photo Upload Technical Reference

**Date**: November 23, 2025  
**Purpose**: Technical details for transferring PhotoUpload functionality to Interior & Tyres panels

---

## 🔧 Compression Implementation

### Current PhotoUpload Pattern
```typescript
// In uploadFile() function
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

### What Interior/Tyres Currently Do
```typescript
// In uploadFiles() function - NO compression callbacks
const result = await storageService.uploadAssessmentPhoto(
  file,
  assessmentId,
  'interior', // or 'tyres'
  'additional' // or tyrePosition
);
```

### Required Changes
1. Add `compressing` and `compressionProgress` state variables
2. Pass progress callbacks to uploadAssessmentPhoto()
3. Update UI to show two-phase progress

---

## 🎨 Progress Bar Replacement

### Current Interior/Tyres (REMOVE)
```svelte
<div class="space-y-3">
  <Loader2 class="mx-auto h-12 w-12 text-blue-600 animate-spin" />
  <p class="text-sm font-medium text-gray-700">Uploading photos...</p>
  <div class="w-full bg-gray-200 rounded-full h-2">
    <div
      class="h-full bg-blue-500 transition-all duration-300 rounded-full"
      style="width: {uploadProgress}%"
    ></div>
  </div>
  <p class="text-xs text-gray-500">{uploadProgress}%</p>
</div>
```

### New Pattern (REPLACE WITH)
```svelte
<FileUploadProgress
  isCompressing={compressing}
  isUploading={uploading}
  compressionProgress={compressionProgress}
  uploadProgress={uploadProgress}
  fileName={file.name}
/>
```

### Import Required
```typescript
import { FileUploadProgress } from '$lib/components/ui/progress';
```

---

## 📱 Camera Input Addition

### PhotoUpload Pattern
```typescript
let cameraInput: HTMLInputElement;

function triggerCameraInput() {
  cameraInput?.click();
}

// In template:
<input
  bind:this={cameraInput}
  type="file"
  accept="image/*"
  capture="environment"
  onchange={handleFileSelect}
  class="hidden"
/>
```

### For Interior/Tyres
Add to script:
```typescript
let cameraInput: HTMLInputElement;

function triggerCameraInput() {
  cameraInput?.click();
}
```

Add to template (alongside file input):
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

## 🎨 Rose Theme Updates

### Current (Blue)
- `border-blue-500` → `border-rose-500`
- `bg-blue-50` → `bg-rose-50`
- `text-blue-500` → `text-rose-500`
- `text-blue-600` → `text-rose-600`
- `bg-blue-500` → `bg-rose-500`
- `text-blue-600` → `text-rose-600`

### FileUploadProgress Already Uses Rose
- Automatically uses rose theme
- No additional changes needed

---

## ♿ ARIA Attributes

### Add to Upload Zone
```svelte
<div
  role="button"
  tabindex="0"
  aria-label="Upload photos - drag and drop or click to select"
  ondragenter={handleDragEnter}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onkeydown={handleUploadZoneKeydown}
>
```

### Add Keyboard Handler
```typescript
function handleUploadZoneKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    triggerFileInput();
  }
}
```

---

## 📊 State Variables to Add

### For InteriorPhotosPanel
```typescript
let compressing = $state(false);
let compressionProgress = $state(0);
let cameraInput: HTMLInputElement;
```

### For TyrePhotosPanel
```typescript
let compressing = $state(false);
let compressionProgress = $state(0);
let cameraInput: HTMLInputElement;
```

---

## 🧪 Testing Checklist

- [ ] Upload large file (5MB+) - verify compression
- [ ] Check progress bar shows compression phase
- [ ] Check progress bar shows upload phase
- [ ] Verify rose theme colors
- [ ] Test camera input on mobile
- [ ] Test drag & drop
- [ ] Test file picker
- [ ] Verify ARIA attributes with screen reader
- [ ] Check keyboard navigation (Tab, Enter, Space)
- [ ] Run npm run check (0 errors)


