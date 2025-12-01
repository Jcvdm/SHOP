# FileDropzone Component - November 9, 2025

## Overview

Created a reusable, accessible drag-and-drop file upload component based on shadcn-svelte patterns and best practices from the Svelte ecosystem.

**Status**: ✅ COMPLETE  
**Files Created**:
- `src/lib/components/ui/file-dropzone/FileDropzone.svelte` (300 lines)
- `src/lib/components/ui/file-dropzone/index.ts`
- `src/lib/components/forms/PhotoUploadV2.svelte` (example usage)

---

## Problem Statement

The original `PhotoUpload.svelte` component had several issues:
1. **Drag-drop flicker** - Overlapping event handlers on parent and child elements
2. **Not reusable** - Tightly coupled to assessment photo structure
3. **Complex implementation** - 494 lines with custom modal code
4. **Poor UX** - Small hitbox margin for error, inconsistent behavior

---

## Solution: FileDropzone Component

A reusable, generic file upload component that:
- ✅ Works with any file type (images, PDFs, documents)
- ✅ No flicker (single drag handler on parent only)
- ✅ Built-in validation (size, type, custom validators)
- ✅ Accessible (ARIA labels, keyboard support)
- ✅ Progress tracking
- ✅ Preview support (images, documents, generic)
- ✅ Multiple file support (optional)
- ✅ Form integration (works with Superforms)
- ✅ Customizable styling

---

## Component API

### Props

```typescript
interface Props {
  /** Accepted MIME types (e.g., ['image/jpeg', 'image/png']) */
  accept?: string[];
  
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number;
  
  /** Maximum number of files (default: 1) */
  maxFiles?: number;
  
  /** Current file(s) */
  value?: File | File[] | null;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Show camera button for mobile capture */
  showCamera?: boolean;
  
  /** Custom height class (default: h-32) */
  height?: string;
  
  /** Upload handler */
  onUpload: (files: File[]) => Promise<void>;
  
  /** Remove handler */
  onRemove?: (file: File) => void;
  
  /** Custom validator function */
  validator?: (file: File) => string | null;
  
  /** Upload progress (0-100) */
  progress?: number;
  
  /** Show preview */
  showPreview?: boolean;
  
  /** Preview URL (for existing files) */
  previewUrl?: string | null;
  
  /** Label for accessibility */
  label?: string;
}
```

### Features

#### 1. **Drag-and-Drop (No Flicker)**
- Single parent div with drag handlers
- No child elements with drag handlers
- Smooth, flicker-free experience

#### 2. **File Validation**
- File count validation (maxFiles)
- File size validation (maxSize)
- MIME type validation (accept)
- Custom validation function (validator)
- Clear error messages

#### 3. **Preview Support**
- Automatic image preview generation (FileReader API)
- Preview URL support for existing files
- Hover effect on preview (click to change)
- Remove button overlay

#### 4. **Progress Tracking**
- Visual progress bar during upload
- Percentage display
- Loading spinner

#### 5. **Accessibility**
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Proper role attributes

#### 6. **Mobile Support**
- Optional camera button for mobile capture
- Touch-friendly interface
- Responsive design

---

## Usage Examples

### Example 1: Photo Upload (Single Image)

```svelte
<script lang="ts">
  import { FileDropzone } from '$lib/components/ui/file-dropzone';
  
  let photoFile = $state<File | null>(null);
  let uploadProgress = $state(0);
  
  async function handleUpload(files: File[]) {
    const file = files[0];
    // Upload logic here
    uploadProgress = 50;
    await uploadToServer(file);
    uploadProgress = 100;
  }
  
  function handleRemove(file: File) {
    photoFile = null;
  }
</script>

<FileDropzone
  accept={['image/jpeg', 'image/png', 'image/webp']}
  maxSize={10 * 1024 * 1024}
  showCamera={true}
  label="Vehicle Photo"
  progress={uploadProgress}
  onUpload={handleUpload}
  onRemove={handleRemove}
/>
```

### Example 2: Document Upload (PDF)

```svelte
<script lang="ts">
  import { FileDropzone } from '$lib/components/ui/file-dropzone';
  
  async function handleUpload(files: File[]) {
    const file = files[0];
    await uploadDocument(file);
  }
</script>

<FileDropzone
  accept={['application/pdf']}
  maxSize={20 * 1024 * 1024}
  showCamera={false}
  label="Upload Document"
  showPreview={false}
  onUpload={handleUpload}
/>
```

### Example 3: Multiple Files

```svelte
<script lang="ts">
  import { FileDropzone } from '$lib/components/ui/file-dropzone';
  
  let files = $state<File[]>([]);
  
  async function handleUpload(newFiles: File[]) {
    files = [...files, ...newFiles];
    await uploadMultiple(newFiles);
  }
  
  function handleRemove(file: File) {
    files = files.filter(f => f !== file);
  }
</script>

<FileDropzone
  accept={['image/*']}
  maxFiles={10}
  maxSize={5 * 1024 * 1024}
  label="Upload Photos"
  onUpload={handleUpload}
  onRemove={handleRemove}
/>
```

### Example 4: Custom Validation

```svelte
<script lang="ts">
  import { FileDropzone } from '$lib/components/ui/file-dropzone';
  
  function validateImage(file: File): string | null {
    // Custom validation logic
    if (file.name.includes('test')) {
      return 'Test files not allowed';
    }
    
    // Check image dimensions (requires async, so do in onUpload)
    return null;
  }
  
  async function handleUpload(files: File[]) {
    const file = files[0];
    
    // Additional async validation
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(resolve => img.onload = resolve);
    
    if (img.width < 800 || img.height < 600) {
      throw new Error('Image must be at least 800x600 pixels');
    }
    
    await uploadPhoto(file);
  }
</script>

<FileDropzone
  accept={['image/*']}
  validator={validateImage}
  onUpload={handleUpload}
/>
```

---

## PhotoUploadV2 Example

Created a simplified PhotoUpload component using FileDropzone:

**Before** (PhotoUpload.svelte): 494 lines  
**After** (PhotoUploadV2.svelte): 165 lines (**-67% reduction**)

```svelte
<script lang="ts">
  import { FileDropzone } from '$lib/components/ui/file-dropzone';
  import PhotoViewer from '$lib/components/photo-viewer/PhotoViewer.svelte';
  import { storageService } from '$lib/services/storage.service';
  
  // Props...
  
  async function handleUpload(files: File[]): Promise<void> {
    const file = files[0];
    const result = await storageService.uploadPhoto(
      file,
      assessmentId,
      category,
      subcategory,
      (progress) => { uploadProgress = progress; }
    );
    onUpload(result.url);
  }
</script>

{#if currentPhotoUrl}
  <!-- Preview with PhotoViewer -->
  <button onclick={openPhotoViewer}>
    <img src={currentPhotoUrl} alt={label} />
  </button>
{:else}
  <!-- Upload dropzone -->
  <FileDropzone
    accept={['image/jpeg', 'image/png', 'image/webp']}
    maxSize={10 * 1024 * 1024}
    showCamera={true}
    progress={uploadProgress}
    onUpload={handleUpload}
  />
{/if}
```

---

## Benefits

### ✅ **Reusability**
- Use for photos, documents, any file type
- Consistent UX across entire app
- Single source of truth for upload logic

### ✅ **No Flicker**
- Drag handlers only on parent container
- No overlapping event handlers
- Smooth drag-and-drop experience

### ✅ **Type-Safe**
- Full TypeScript support
- Proper prop types
- Compile-time validation

### ✅ **Accessible**
- ARIA labels and roles
- Keyboard navigation
- Screen reader support

### ✅ **Maintainable**
- 300 lines of focused code
- Clear separation of concerns
- Easy to extend

### ✅ **Flexible**
- Customizable validation
- Optional camera support
- Progress tracking
- Preview support

---

## Pattern Established

This component establishes the pattern for all file uploads in ClaimTech:

1. **Use FileDropzone for all uploads** (photos, documents, etc.)
2. **Single drag handler on parent** (no child handlers)
3. **Built-in validation** (size, type, custom)
4. **Accessible by default** (ARIA labels, keyboard support)
5. **Consistent UX** (same look and feel everywhere)

---

## Next Steps

1. **Test FileDropzone** - Verify drag-drop, validation, preview, accessibility
2. **Migrate PhotoUpload** - Replace old PhotoUpload with PhotoUploadV2
3. **Create DocumentUpload** - Use FileDropzone for PDF uploads
4. **Update COMPONENTS.md** - Document new component

---

## Related Files

- `src/lib/components/ui/file-dropzone/FileDropzone.svelte` (new)
- `src/lib/components/ui/file-dropzone/index.ts` (new)
- `src/lib/components/forms/PhotoUploadV2.svelte` (new)
- `src/lib/components/forms/PhotoUpload.svelte` (old, to be replaced)

---

**Completed**: November 9, 2025  
**Developer**: Claude (Augment Agent)  
**Review Status**: Ready for testing

